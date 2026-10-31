import {Fn, float, vec3, uniform, varying, instancedBufferAttribute, positionWorld,
 cameraPosition, cameraProjectionMatrixInverse, screenUV, getViewPosition, isBackgroundDepth,
 smoothstep, sin, sqrt, max, min, abs, dot} from 'three/tsl';
import * as THREE from 'three/webgpu';

export const SHAFT_RAY_EPSILON=.000001;
export const SHAFT_MAX_INTEGRATED_LENGTH=8;

// The caller supplies stable, per-instance world-space center/radius and half-length/phase
// attributes alongside the proxy's instance matrices. All shafts share the unit sun axis.
// `depthTexture` must be a plain texture node bound to the already-rendered scene depth,
// not a PassTextureNode: that would schedule the scene pass from inside the volume pass.
export function createShaftVolumeNodes({depthTexture, centerRadius, lengthPhase}){
 const data=varying(instancedBufferAttribute(centerRadius));
 const meta=varying(instancedBufferAttribute(lengthPhase));
 const axis=uniform(new THREE.Vector3(0,1,0));
 const tint=uniform(new THREE.Color('#fff1cf')),strength=uniform(.025),time=uniform(0);
 const opacity=Fn(()=>{
  const delta=positionWorld.sub(cameraPosition);
  const ray=delta.div(delta.length().max(SHAFT_RAY_EPSILON));
  const rel=cameraPosition.sub(data.xyz), y=dot(rel,axis), dy=dot(ray,axis);
  const radial=rel.sub(axis.mul(y)), radialRay=ray.sub(axis.mul(dy));
  const a=dot(radialRay,radialRay), b=dot(radial,radialRay);
  const radius=max(data.w,.001), half=max(meta.x,.001);
  const c=dot(radial,radial).sub(radius.mul(radius));
  const disc=b.mul(b).sub(a.mul(c));
  // Avoid divisions by zero even on invalid paths: WGSL can evaluate both
  // sides of a select. Axial rays inside the cylinder have unbounded radial t.
  const root=sqrt(max(disc,0)), safeA=max(a,SHAFT_RAY_EPSILON);
  const radialNear=b.negate().sub(root).div(safeA),radialFar=b.negate().add(root).div(safeA);
  const parallel=a.lessThan(SHAFT_RAY_EPSILON);
  const radialValid=parallel.select(c.lessThanEqual(0),disc.greaterThanEqual(0));
  const rn=parallel.select(float(-100000),radialNear),rf=parallel.select(float(100000),radialFar);
  const safeDy=dy.greaterThanEqual(0).select(max(dy,SHAFT_RAY_EPSILON),min(dy,-SHAFT_RAY_EPSILON));
  const t0=half.negate().sub(y).div(safeDy),t1=half.sub(y).div(safeDy);
  const axialParallel=abs(dy).lessThan(SHAFT_RAY_EPSILON);
  const axialValid=axialParallel.select(abs(y).lessThanEqual(half),float(1).equal(1));
  const an=axialParallel.select(float(-100000),min(t0,t1)),af=axialParallel.select(float(100000),max(t0,t1));
  const start=max(max(rn,an),0), end=min(rf,af);
  const depth=depthTexture.sample(screenUV).r;
  const viewPos=getViewPosition(screenUV,depth,cameraProjectionMatrixInverse);
  // Perspective camera: reconstructed view-space distance is a ray distance.
  const opaqueDistance=isBackgroundDepth(depth).select(float(100000),viewPos.length());
  const span=max(min(end,opaqueDistance).sub(start),0);
  // Cross-section coordinates use a fixed world basis, common to all views.
  const fallback=axis.y.abs().greaterThan(.95).select(vec3(0,0,1),vec3(0,1,0));
  const right=axis.cross(fallback).normalize(),forward=axis.cross(right).normalize();
  const sample=(fraction)=>{
   const p=rel.add(ray.mul(start.add(span.mul(fraction))));
   const h=dot(p,axis), q=p.sub(axis.mul(h));
   const r=q.length().div(radius), edge=float(1).sub(smoothstep(.35,1,r));
   const ends=smoothstep(0,.22,h.div(half).add(1)).mul(float(1).sub(smoothstep(.55,1,h.div(half))));
   const u=dot(q,right).div(radius),v=dot(q,forward).div(radius);
   const openings=sin(u.mul(4.1).add(v.mul(2.7)).add(meta.y).add(sin(time.mul(.65).add(meta.y)).mul(.22)))
    .mul(sin(v.mul(4.7).sub(u.mul(2.3)).add(meta.y.mul(1.61)).sub(sin(time.mul(.43).add(meta.y.mul(1.31))).mul(.18))));
   const leaf=smoothstep(-.5,.6,openings).mul(.8).add(.2);
   return edge.mul(ends).mul(leaf);
  };
  const density=sample(1/6).add(sample(.5)).add(sample(5/6)).div(3);
  const valid=radialValid.and(axialValid);
  const distance=start.add(span.mul(.5));
  const fade=smoothstep(.05,.6,distance).mul(float(1).sub(smoothstep(28,48,distance)));
  return valid.select(density.mul(min(span,SHAFT_MAX_INTEGRATED_LENGTH)).mul(strength).mul(fade),0);
 })();
 return {opacity,tint,strength,time,axis};
}
