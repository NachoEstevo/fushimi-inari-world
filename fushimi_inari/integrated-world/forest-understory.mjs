import * as THREE from 'three';
import {pathWidth} from '../geography/geo-core.mjs';

// Authored fern/sedge-like silhouettes, not a botanical/site survey. Real
// opaque leaf outlines avoid alpha overdraw, texture fetches and custom shaders.
export const understoryBudget=Object.freeze({nearTriangles:128,farTriangles:12,radius:.9,nearDistance:32});

export function understoryGeometry(detail='near'){
  const positions=[],colors=[];
  const vertex=(p,color)=>{positions.push(...p);colors.push(...color);};
  const triangle=(a,b,c,color)=>{for(const p of [a,b,c])vertex(p,color);};
  const leaf=(base,tip,width,color)=>{
    const dx=tip[0]-base[0],dz=tip[2]-base[2],length=Math.hypot(dx,dz)||1;
    const mid=base.map((v,i)=>v+(tip[i]-v)*.46);mid[1]+=width*.12;
    const left=[mid[0]-dz/length*width,mid[1],mid[2]+dx/length*width];
    const right=[mid[0]+dz/length*width,mid[1]-width*.16,mid[2]-dx/length*width];
    triangle(base,left,tip,color);triangle(base,tip,right,color.map(v=>v*.86));
  };
  for(let frond=0;frond<3;frond++){
    const angle=frond*2.399963+.24,dx=Math.cos(angle),dz=Math.sin(angle);
    const length=.58+frond*.09,height=.32+frond*.13;
    const point=t=>[dx*length*t,.045+height*Math.sin(t*Math.PI*.72),dz*length*t];
    if(detail==='far'){leaf([0,0,0],point(1),.14,[.16,.25,.085]);continue;}
    for(let segment=0;segment<3;segment++)leaf(point(segment/3),point((segment+1)/3),.009,[.19,.24,.08]);
    for(let pair=0;pair<7;pair++){
      const t=.13+pair*.105,reach=.22*Math.pow(1-t,.7)+.025;
      for(const side of [-1,1]){
        const base=point(t+side*.012);
        const tip=[base[0]+dx*.035-dz*reach*side,base[1]+.018-pair*.005,base[2]+dz*.035+dx*reach*side];
        leaf(base,tip,reach*.10,[.17+pair*.007,.28+frond*.015,.085+pair*.004]);
      }
    }
    leaf(point(.80),point(1),.04,[.22,.34,.11]);
  }
  for(let i=0;i<2;i++)leaf([.025*i,0,0],[.13-i*.29,.44+i*.12,.12],.018,[.22,.29,.10]);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
  return geometry;
}

// A path's full width matters, including other nearby branches and endpoints.
// Indexing expanded segments keeps candidate checks local during construction.
export function createUnderstoryPlacement(paths,anchors=[]){
  const cells=new Map(),plants=new Map(),cellSize=24,spacingCell=3;
  for(const path of paths)for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i],halfWidth=pathWidth(path.tags??{})/2;
    const margin=halfWidth+understoryBudget.radius*1.25+.35;
    const segment={a,b,halfWidth};
    for(let x=Math.floor((Math.min(a[0],b[0])-margin)/cellSize);x<=Math.floor((Math.max(a[0],b[0])+margin)/cellSize);x++)
      for(let z=Math.floor((Math.min(a[2],b[2])-margin)/cellSize);z<=Math.floor((Math.max(a[2],b[2])+margin)/cellSize);z++){
        const key=`${x},${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(segment);
      }
  }
  return (x,z,radius)=>{
    if(![x,z,radius].every(Number.isFinite)||radius<=0||radius>understoryBudget.radius*1.25)return false;
    if(anchors.some(a=>a.radius&&Math.hypot(x-a.target[0],z-a.target[2])<a.radius+radius+.35))return false;
    for(const {a,b,halfWidth} of cells.get(`${Math.floor(x/cellSize)},${Math.floor(z/cellSize)}`)??[]){
      const dx=b[0]-a[0],dz=b[2]-a[2];
      const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));
      if(Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz)<halfWidth+radius+.35)return false;
    }
    const cx=Math.floor(x/spacingCell),cz=Math.floor(z/spacingCell);
    for(let ix=cx-1;ix<=cx+1;ix++)for(let iz=cz-1;iz<=cz+1;iz++)
      for(const p of plants.get(`${ix},${iz}`)??[])
        if(Math.hypot(x-p.x,z-p.z)<Math.max(.65,(radius+p.radius)*.7))return false;
    const key=`${cx},${cz}`;if(!plants.has(key))plants.set(key,[]);plants.get(key).push({x,z,radius});
    return true;
  };
}

export function understoryGround(ground,x,z,radius){
  const y=ground(x,z);if(!Number.isFinite(y))return null;
  for(const [dx,dz] of [[radius,0],[-radius,0],[0,radius],[0,-radius]]){
    const h=ground(x+dx,z+dz);if(!Number.isFinite(h)||Math.abs(h-y)>.40)return null;
  }
  return y;
}

// No extra draws per cell: only one level is rendered, through the existing
// nearForest spatial owner. Bounds padding prevents early foreground changes.
export function understoryLOD(near,farGeometry){
  const far=new THREE.InstancedMesh(farGeometry,near.material,near.count);
  far.instanceMatrix.copy(near.instanceMatrix);
  if(near.instanceColor)far.instanceColor=near.instanceColor.clone();
  near.computeBoundingSphere();far.computeBoundingSphere();
  const center=near.boundingSphere.center.clone(),lod=new THREE.LOD();
  lod.name='Forest understory · static fern/sedge LOD';lod.position.copy(center);
  near.position.copy(center).negate();far.position.copy(near.position);far.receiveShadow=true;
  const hysteresis=.12;
  lod.addLevel(near,0);lod.addLevel(far,(understoryBudget.nearDistance+near.boundingSphere.radius)/(1-hysteresis),hysteresis);
  lod.userData.nearForest=true;return lod;
}
