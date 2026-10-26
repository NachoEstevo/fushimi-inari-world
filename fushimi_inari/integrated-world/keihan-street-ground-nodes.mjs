import {Fn,If,vec2,vec3,float,mix,smoothstep,max,dot,floor,materialColor,materialNormal,normalView} from 'three/tsl';
import {makeKeihanStreetGroundMask} from './keihan-street-ground.mjs';
import {terrainXZ,groundHash} from './courtyard-ground-nodes.mjs';
export {makeKeihanStreetGroundMask} from './keihan-street-ground.mjs';

// A real shader branch matches the legacy mask's early bounds return. A select
// or a zero multiplier would still evaluate all 43 distances outside the street.
export function keihanStreetWeight(layout,coordinates=terrainXZ){
 return Fn(()=>{
  const weight=float(0).toVar();
  const [xmin,xmax,zmin,zmax]=layout.bounds;
  const inside=coordinates.x.greaterThanEqual(xmin).and(coordinates.x.lessThanEqual(xmax))
   .and(coordinates.y.greaterThanEqual(zmin)).and(coordinates.y.lessThanEqual(zmax));
  If(inside,()=>{
   for(const segment of layout.segments){
    const a=vec2(...segment.a),direction=vec2(segment.b[0]-segment.a[0],segment.b[1]-segment.a[1]);
    const offset=coordinates.sub(a),along=dot(offset,direction).div(dot(direction,direction)).clamp(0,1);
    const distance=offset.sub(direction.mul(along)).length();
    weight.assign(max(weight,float(1).sub(smoothstep(segment.radius-.5,segment.radius+.5,distance))));
   }
  });
  return weight;
 })();
}

export function blendKeihanStreetGround(geometry,material,features){
 const layout=makeKeihanStreetGroundMask(features);
 if(!layout||!geometry.attributes?.position)return {built:false,reason:'Keihan street trace unavailable or changed'};
 // Static graph expansion retains all mapped corners and the original
 // per-fragment distance mask, including the half-metre smooth transition.
 const weight=keihanStreetWeight(layout);
 const base=(material.colorNode??materialColor).rgb;
 const grain=groundHash(floor(terrainXZ.mul(30)));
 const luma=dot(base,vec3(.299,.587,.114));
 const mineral=vec3(.26,.275,.26).add(vec3(grain.sub(.5).mul(.026).add(luma.sub(.5).mul(.015))));
 material.colorNode=mix(base,mineral,weight);
 material.normalNode=mix(material.normalNode??materialNormal,normalView,weight).normalize();
 material.needsUpdate=true;
 return {built:true,segments:layout.segments.length,bounds:layout.bounds,sourceIds:layout.sourceIds,inferredShoulder:layout.shoulder,fade:layout.fade,geometryUnchanged:true};
}
