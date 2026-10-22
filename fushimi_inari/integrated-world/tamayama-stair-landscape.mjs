import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {pathWidth} from '../geography/geo-core.mjs';
import {leafClusterMaterial} from './leaf-cluster.mjs';

export const tamayamaBankRoots=Object.freeze([[83.7,-27.8],[88.8,-26.7],[92.6,-25.7]]);
export const tamayamaBankLantern=Object.freeze([94.1,-28.9]);
const flightIds=['way/105449693','way/1133055112','way/1133055111','way/649175020'];
const NAME='Tamayama south stair bank landscape R90';

export function buildTamayamaStairLandscape(root,features,surfaces,materials,colliders){
  const old=root.getObjectByName(NAME);if(old)return old.userData;
  if(!features.paths.some(p=>p.id==='way/105449693'))return {trees:[],fence:[],reason:'Main stair source unavailable'};
  const group=new THREE.Group();group.name=NAME;
  const batches=new Map(),pending=[],fence=[],trees=[],skipped=[];
  const timber=new THREE.MeshStandardMaterial({color:'#8a8062',roughness:1});
  const rail=new THREE.MeshStandardMaterial({color:'#7c5038',roughness:.95});
  const bark=new THREE.MeshStandardMaterial({color:'#6d6957',roughness:1,normalMap:materials.vermilionMat?.normalMap??null,normalScale:new THREE.Vector2(.22,.22)});
  const stone=(materials.entryStoneMat??materials.stoneMat).clone();stone.color.set('#91968c');stone.roughness=1;
  const leaves=typeof document!=='undefined'?leafClusterMaterial().clone():new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1,side:THREE.DoubleSide});
  leaves.vertexColors=true;leaves.side=THREE.DoubleSide;
  const add=(geometry,material)=>{if(geometry.index){const old=geometry;geometry=geometry.toNonIndexed();old.dispose();}if(!batches.has(material))batches.set(material,[]);batches.get(material).push(geometry);};
  const box=(w,h,d,x,y,z,mat,yaw=0)=>add(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),mat);
  const tube=(a,b,r,mat,sides=7)=>{
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    add(new THREE.CylinderGeometry(r*.82,r,delta.length(),sides).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())).translate(...start.add(end).multiplyScalar(.5).toArray()),mat);
  };
  const nearPath=(x,z,padding)=>features.paths.some(path=>path.points.slice(1).some((b,i)=>{
    const a=path.points[i],dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));
    const half=flightIds.includes(path.id)?2.4:pathWidth(path.tags??{})/2;
    return Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t)<half+padding;
  }));
  const inBuilding=(x,z,padding)=>features.buildings.some(b=>{
    let inside=false;for(let i=0,j=b.points.length-1;i<b.points.length;j=i++){
      const a=b.points[i],q=b.points[j];if((a[2]>z)!==(q[2]>z)&&x<(q[0]-a[0])*(z-a[2])/(q[2]-a[2])+a[0])inside=!inside;
      const dx=q[0]-a[0],dz=q[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));if(Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t)<padding)return true;
    }return inside;
  });
  // Follow the SOUTH bank of the existing broadened west stair, then finish
  // before the public south-turn mouth. The stone retaining edge stays owned
  // by tamayama-stair-borders; no second wall or speculative rock scatter.
  const stakePoints=new Set();
  for(const path of features.paths.filter(p=>flightIds.includes(p.id)))for(let j=1;j<path.points.length;j++){
    const a=path.points[j-1],b=path.points[j],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<.02)continue;
    const nx=-dz/length,nz=dx/length,offset=3.28;
    const n=Math.ceil(length/.28),yaw=-Math.atan2(dz,dx),accepted=[];
    for(let i=0;i<=n;i++){
      const t=i/n,x=a[0]+dx*t+nx*offset,z=a[2]+dz*t+nz*offset;
      if(x<78||x>93.5||nearPath(x,z,.12)||inBuilding(x,z,.12))continue;
      const ground=surfaces.terrainHeight(x,z);if(!Number.isFinite(ground))throw Error('Nonfinite Tamayama bank fence');
      const height=.72+.045*Math.sin(i*2.3+j),base=ground-.06;
      // Uneven narrow stakes and a single brown horizontal rail are directly
      // visible in both June2012 angles; dimensions/endpoints are estimates.
      const key=x.toFixed(3)+','+z.toFixed(3);
      if(!stakePoints.has(key)){tube([x,base-.04,z],[x+.018*Math.sin(i),base+height,z],.032,timber,6);stakePoints.add(key);}
      accepted.push({x,z,base,top:base+height,index:i});
    }
    for(let i=1;i<accepted.length;i++){
      const p=accepted[i-1],q=accepted[i];if(q.index!==p.index+1)continue;
      tube([p.x,p.base+.43,p.z],[q.x,q.base+.43,q.z],.026,rail,6);
      const x=(p.x+q.x)/2,z=(p.z+q.z)/2,len=Math.hypot(q.x-p.x,q.z-p.z);
      pending.push({type:'box',args:[x,z,len/2,.055,yaw,Math.min(p.base,q.base),Math.max(p.top,q.top),'tamayama_bank_low_stakes']});
      fence.push({sourcePath:path.id,a:[p.x,p.base,p.z],b:[q.x,q.base,q.z],height:.72});
    }
  }
  // A small, deterministic set of mature broadleaf silhouettes belongs to
  // the photographed bank. Roots are explicitly inferred, never OSM trees.
  let seed=9017;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(const [index,[x,z]]of tamayamaBankRoots.entries()){
    if(nearPath(x,z,.45)||inBuilding(x,z,.5)){skipped.push({kind:'tree',point:[x,z],reason:'mapped public/building clearance'});continue;}
    if(colliders.some(c=>c.type==='cylinder'&&/tree/.test(String(c.args.at(-1)))&&Math.hypot(c.args[0]-x,c.args[1]-z)<2)){skipped.push({kind:'tree',point:[x,z],reason:'existing tree owner'});continue;}
    const y=surfaces.terrainHeight(x,z)-.06,height=7.1+index*.55;
    if(!Number.isFinite(y))throw Error('Nonfinite Tamayama bank tree');
    tube([x,y-.03,z],[x+.15,y+height*.71,z+.1],.22+index*.035,bark,9);
    for(let arm=0;arm<7;arm++){
      const angle=arm*2.39996+index*.7,r=arm===0?0:1.1+(arm%3)*.28,cx=x+Math.cos(angle)*r,cz=z+Math.sin(angle)*r,cy=y+height*(.67+(arm%3)*.07);
      tube([x+.1,y+height*.48,z+.1],[cx,cy,cz],.065,bark);
      const positions=[],colors=[],uv=[];
      for(let leaf=0;leaf<110;leaf++){
        const az=rand()*Math.PI*2,v=rand()*2-1,rr=Math.cbrt(rand()),rrad=Math.sqrt(1-v*v)*rr;
        const px=cx+Math.cos(az)*rrad*1.9,py=cy+v*rr*1.35,pz=cz+Math.sin(az)*rrad*1.65,a=rand()*Math.PI*2,w=.25+rand()*.13;
        const tilt=new THREE.Quaternion().setFromEuler(new THREE.Euler((rand()-.5)*1.8,0,(rand()-.5)*1.8));
        const u=new THREE.Vector3(Math.cos(a)*w,.03,Math.sin(a)*w).applyQuaternion(tilt),v3=new THREE.Vector3(-Math.sin(a)*w*.48,.045,Math.cos(a)*w*.48).applyQuaternion(tilt),center=new THREE.Vector3(px,py,pz),color=new THREE.Color().setHSL(.23+rand()*.055,.23+rand()*.12,.15+rand()*.12);
        for(const p of [center.clone().sub(u),center.clone().add(v3),center.clone().add(u),center.clone().sub(u),center.clone().add(u),center.clone().sub(v3)]){positions.push(...p.toArray());colors.push(color.r,color.g,color.b);}
        uv.push(0,0,0,1,1,1,0,0,1,1,1,0);
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();add(g,leaves);
    }
    pending.push({type:'cylinder',args:[x,z,.26+index*.035,y,y+height*.7,'tamayama_bank_tree']});trees.push({point:[x,y,z],height,rootSource:'photo-inferred bank root; not mapped tree node'});
  }
  let lantern=null;
  const [lx,lz]=tamayamaBankLantern;
  if(!nearPath(lx,lz,.66)&&!inBuilding(lx,lz,.7)&&!colliders.some(c=>/lantern/.test(String(c.args.at(-1)))&&Math.hypot(c.args[0]-lx,c.args[1]-lz)<1.8)){
    const y=surfaces.terrainHeight(lx,lz)-.06;if(!Number.isFinite(y))throw Error('Nonfinite Tamayama bank lantern');
    const levels=[[1.2,.18,0],[.98,.18,.18],[.72,.25,.36],[.40,1.25,.61],[.75,.18,1.86],[.66,.62,2.04],[1.10,.12,2.66]];
    for(const [width,height,bottom]of levels){box(width,height,width,lx,y+bottom+height/2,lz,stone);pending.push({type:'box',args:[lx,lz,width/2,width/2,0,y+bottom,y+bottom+height,'tamayama_bank_lantern']});}
    // Four dark firebox panes are recesses, no emitted or runtime light.
    const dark=new THREE.MeshStandardMaterial({color:'#414a40',roughness:1});
    for(const side of [-1,1]){box(.41,.36,.018,lx,y+2.35,lz+side*.337,dark);box(.018,.36,.41,lx+side*.337,y+2.35,lz,dark);}
    const roof=new THREE.LatheGeometry([new THREE.Vector2(.56,0),new THREE.Vector2(.40,.15),new THREE.Vector2(.30,.34),new THREE.Vector2(.16,.40)],4);roof.rotateY(Math.PI/4).translate(lx,y+2.78,lz);add(roof,stone);
    add(new THREE.SphereGeometry(.125,8,5).translate(lx,y+3.27,lz),stone);
    lantern={point:[lx,y,lz],height:3.395,source:'June2012 south180/west270 landmark right of south continuation gate; placement and dimensions estimated'};
  }
  let triangles=0;
  for(const [material,parts]of batches){const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(!Array.from(geometry.attributes.position.array).every(Number.isFinite))throw Error('Nonfinite Tamayama bank geometry');geometry.computeBoundingSphere();triangles+=geometry.attributes.position.count/3;const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=material!==leaves;mesh.receiveShadow=true;mesh.name='Batched Tamayama bank landscape';group.add(mesh);}
  colliders.push(...pending);group.userData={trees,fence,lantern,skipped,triangles,drawBatches:group.children.length,newColliders:pending.length,
    provenance:'June2012 GoogleStreetView MvihcVb0f466FBJebqyECg actual south180/west270 screenshots and video05:25. South/left-descending bank tied to OSM105449693/1133055112/1133055111/649175020, not the north shrine row. Fence extent, roots, botanical type, stone lantern station and all dimensions are photographic estimates.',
    constraints:'Existing rough stone retaining borders, lower gate, big south continuation gate, shrine row and public step profiles retain their owners. No grass, hedges, temporary stalls, random boulder fill or new gate.'};
  root.add(group);return group.userData;
}
