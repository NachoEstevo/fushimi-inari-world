import {sculptEntranceFoxes} from './precinct-life.mjs?v=31';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {refineTemizuyaCanopy} from './temizuya-canopy.mjs';

// Refinements use the authored metre coordinates and preserve interaction roots.
export function refineEntranceObjects(object,materials){
  if(object.isGroup&&object.children.some(o=>o.geometry?.parameters?.width===4.8&&o.geometry.parameters.depth===8.8)){
    // Retain the earlier interactive counter while finishing its plain shell.
    const timber=materialsWood(),dark=new THREE.MeshStandardMaterial({color:'#343a32',roughness:.94});
    for(const z of [-4.44,4.44]){
      for(const x of [-2.28,0,2.28])box(.13,3.35,.10,x,1.72,z,timber,object);
      for(const y of [.95,2.9,3.3])box(4.65,.13,.10,0,y,z,timber,object);
      for(const x of [-1.13,1.13]){
        box(1.86,1.45,.04,x,1.95,z,dark,object);
        for(let i=0;i<12;i++)box(.045,1.45,.05,x-.82+i*.149,1.95,z+Math.sign(z)*.035,timber,object);
      }
    }
    for(const x of [-2.44,2.44]){
      for(let z=-4.25;z<=4.25;z+=2.125)box(.10,3.3,.13,x,1.72,z,timber,object);
      box(.10,.13,8.7,x,3.27,0,timber,object);
    }
  }
  if(object.userData.zone==='temizuya'&&object.isGroup){refineBasin(object,materials);refineTemizuyaCanopy(object,materials);}
  if(object.userData.zone==='entrance'){
    if(object.isGroup)sculptEntranceFoxes(object);
    const shops=[];object.traverse(g=>{
      if(g.isGroup&&g.children.some(m=>m.geometry?.parameters?.width===6.2&&m.geometry.parameters.height===3.2))shops.push(g);
    });
    for(const shop of shops)refineShop(shop,materials);
  }
}
function box(w,h,d,x,y,z,material,parent){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;
}
function basinStone(){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  let seed=1701;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const p=ctx.createImageData(512,512);
  for(let i=0;i<p.data.length;i+=4){const n=90+rand()*90;p.data[i]=n+16;p.data[i+1]=n+7;p.data[i+2]=n;p.data[i+3]=255;}
  ctx.putImageData(p,0,0);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
  return new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:.013,roughness:.88});
}
function refineBasin(g,m){
  const basin=g.children.find(o=>o.geometry?.parameters?.width===2.2&&o.geometry.parameters.height===.86);
  if(!basin)return;
  const stone=basinStone(),pieces=[];
  for(const [w,h,d,x,y,z] of [[2.2,.18,1.25,0,-.34,0],[2.2,.68,.16,0,.09,.545],[2.2,.68,.16,0,.09,-.545],[.16,.68,.93,-1.02,.09,0],[.16,.68,.93,1.02,.09,0]])pieces.push(new THREE.BoxGeometry(w,h,d).translate(x,y,z));
  basin.geometry=mergeGeometries(pieces);pieces.forEach(p=>p.dispose());basin.material=stone;
  const water=g.children.find(o=>o.geometry?.type==='PlaneGeometry');
  if(water){
    water.geometry=new THREE.PlaneGeometry(1.87,.9,36,18);water.position.y=.96;
    const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;
    const envCtx=envCanvas.getContext('2d'),gradient=envCtx.createLinearGradient(0,0,0,256);
    gradient.addColorStop(0,'#d6e3e9');gradient.addColorStop(.45,'#8b9d96');gradient.addColorStop(.55,'#354331');gradient.addColorStop(1,'#10180e');envCtx.fillStyle=gradient;envCtx.fillRect(0,0,512,256);
    envCtx.fillStyle='#edf3ef';envCtx.fillRect(80,35,100,25);envCtx.fillRect(310,55,65,18);
    const environment=new THREE.CanvasTexture(envCanvas);environment.colorSpace=THREE.SRGBColorSpace;environment.mapping=THREE.EquirectangularReflectionMapping;
    water.material=new THREE.MeshStandardMaterial({color:'#27372e',metalness:.15,roughness:.12,envMap:environment,envMapIntensity:1.25});
    water.material.onBeforeCompile=shader=>{
      shader.uniforms.waterTime={value:0};water.userData.shader=shader;
      shader.vertexShader='varying vec2 basinUv;\nuniform float waterTime;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal.x+=.08*cos(position.x*31.0+waterTime*2.0);objectNormal.y+=.07*sin(position.y*24.0-waterTime*1.6);');
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nbasinUv=position.xy;transformed.z+=.003*sin(position.x*31.0+waterTime*2.0)*cos(position.y*24.0-waterTime*1.6);');
      shader.fragmentShader='varying vec2 basinUv;\nuniform float waterTime;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
        vec2 delta=basinUv-vec2(.68,.17);
        float dist=length(delta);
        vec2 ripple=normalize(delta+vec2(.0001))*cos(dist*95.0-waterTime*4.0)*exp(-dist*2.2)*.16;
        ripple+=vec2(cos(basinUv.x*43.0+waterTime*1.5),sin(basinUv.y*37.0-waterTime))*.045;
        normal=normalize(normal+vec3(ripple,0.0));`);
    };
    water.onBeforeRender=()=>{if(water.userData.shader)water.userData.shader.uniforms.waterTime.value=performance.now()/1000;};
    water.castShadow=false;
  }
  const wet=stone.clone();wet.color.set('#626b48');wet.roughness=.55;
  const moss=new THREE.MeshStandardMaterial({color:'#536437',roughness:1});
  box(2.18,.055,.045,0,.86,.63,moss,g);
  for(const z of [-.57,.57])box(2.13,.11,.025,0,.92,z,wet,g);
  for(const x of [-1.17,1.17])box(.10,.035,1.43,x,.30,0,wet,g);
  box(2.45,.035,.10,0,.30,.72,wet,g);
  const bamboo=new THREE.MeshStandardMaterial({color:'#b6a477',roughness:.76});
  const spout=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.62,10),bamboo);spout.rotation.x=Math.PI/2;spout.position.set(.68,1.22,-.48);g.add(spout);
  const stream=new THREE.Mesh(new THREE.CylinderGeometry(.009,.014,.25,6),new THREE.MeshStandardMaterial({color:'#a9c4b5',transparent:true,opacity:.45,roughness:.2}));stream.position.set(.68,1.09,-.17);g.add(stream);
  const metal=new THREE.MeshStandardMaterial({color:'#b7bbaf',metalness:.65,roughness:.3,side:THREE.DoubleSide});
  for(const [i,x] of [-.58,.50].entries()){
    const ladle=new THREE.Group();ladle.userData.ladle=true;ladle.position.set(x,1.095,.06);ladle.rotation.y=i?-.22:.25;
    box(.035,.025,.85,0,0,.34,i?bamboo:materialsWood(),ladle);
    const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.11,.10,.075,20,1,true),metal);bowl.position.set(0,.015,-.12);ladle.add(bowl);
    const bottom=new THREE.Mesh(new THREE.CircleGeometry(.10,20),metal);bottom.rotation.x=-Math.PI/2;bottom.position.set(0,-.022,-.12);ladle.add(bottom);g.add(ladle);
  }
}
function materialsWood(){return new THREE.MeshStandardMaterial({color:'#615f50',roughness:.85});}
function sign(text,w,h){
  const c=document.createElement('canvas');c.width=1024;c.height=Math.max(64,Math.round(1024*h/w));const ctx=c.getContext('2d');ctx.fillStyle='#ded6bd';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#2d2c26';ctx.font=`${Math.round(c.height*.52)}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,c.width/2,c.height/2,c.width*.92);
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map,roughness:1}));
}
function refineShop(g,m){
  const wood=materialsWood(),dark=new THREE.MeshStandardMaterial({color:'#292b27',roughness:.95});
  box(5.4,1.12,.035,0,1.5,2.12,dark,g);
  box(5.65,.09,.48,0,1.03,2.30,wood,g);
  for(let i=0;i<17;i++)box(.035,1.10,.045,-2.6+i*.325,1.62,2.17,wood,g);
  for(const x of [-1.8,0,1.8]){
    box(.70,.055,.35,x,1.12,2.30,m.vermilionMat,g);
    for(let i=0;i<4;i++)box(.12,.15,.08,x-.24+i*.16,1.22,2.30,m.plasterMat,g);
  }
  const label=sign('Welcome · ようこそ',2.4,.40);label.position.set(0,2.88,2.20);g.add(label);
}

// Replace solid shrub shells with small bent leaves at their existing surfaces.
export function refineRomonShrubs(mesh){
  const geo=mesh.geometry,p=geo.attributes.position,index=geo.index,n=geo.attributes.normal,vertices=[],colors=[];
  const core=geo.clone(),cp=core.attributes.position;
  for(let i=0;i<cp.count;i++)cp.setXYZ(i,cp.getX(i)-n.getX(i)*.045,cp.getY(i)-n.getY(i)*.045,cp.getZ(i)-n.getZ(i)*.045);
  const inner=new THREE.Mesh(core,new THREE.MeshStandardMaterial({color:'#253b21',roughness:1}));inner.receiveShadow=true;mesh.add(inner);
  const count=index?.count??p.count;
  for(let i=0,stride=Math.max(3,Math.ceil(count/18000)*3);i<count;i+=stride){
    const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);if(ids.some(k=>k>=p.count))break;
    const center=new THREE.Vector3();ids.forEach(k=>center.add(new THREE.Vector3().fromBufferAttribute(p,k)));center.multiplyScalar(1/3);
    const normal=new THREE.Vector3().fromBufferAttribute(n,ids[0]);if(normal.y<-.25)continue;
    const tangent=new THREE.Vector3(0,1,0).cross(normal).normalize();if(tangent.lengthSq()<.01)tangent.set(1,0,0);
    const across=new THREE.Vector3().crossVectors(normal,tangent).normalize(),r=.14+(i%17)*.004;
    const a=center.clone().addScaledVector(tangent,r),b=center.clone().addScaledVector(across,r*.55),c=center.clone().addScaledVector(tangent,-r),d=center.clone().addScaledVector(across,-r*.55);
    center.addScaledVector(normal,.035);
    for(const v of [a,b,center,b,c,center,c,d,center,d,a,center]){vertices.push(v.x,v.y,v.z);const shade=.8+(i%11)*.035;colors.push(.045*shade,.105*shade,.025*shade);}
  }
  const leaves=new THREE.BufferGeometry();leaves.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));leaves.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));leaves.computeVertexNormals();
  mesh.geometry=leaves;mesh.material=new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.9});mesh.castShadow=false;
}

// Mapped Juyosho footprint: OSM way/105449708. Counter details inferred from
// reception photographs; the specific goshuin window is not independently mapped.
export function buildReception(root,features,ground,m,colliders){
  const footprint=features.buildings.find(b=>b.id==='way/105449708');if(!footprint)return null;
  const p=footprint.points,a=p[1],b=p[2],yaw=-Math.atan2(b[2]-a[2],b[0]-a[0]);
  const g=new THREE.Group();g.name='Mapped shrine reception';g.position.set(a[0],ground(a[0],a[2]),a[2]);g.rotation.y=yaw;
  const wood=materialsWood(),dark=new THREE.MeshStandardMaterial({color:'#20221e',roughness:1});
  const vermilion=new THREE.MeshStandardMaterial({color:'#ad3826',roughness:.78});
  const wings=[{x:14.66,z:3.9,w:29.32,d:7.8},{x:5.8,z:9.73,w:11.6,d:3.86}];
  for(const wing of wings){
    const {x,z,w,d}=wing;
    box(w,3.0,d,x,1.5,z,m.plasterMat,g);box(w+.18,.34,d+.18,x,.17,z,m.entryStoneMat,g);
    // Expand both axes: the former end faces were coplanar with the plaster.
    box(w+.04,.65,d+.04,x,.65,z,vermilion,g);
    for(const side of [-1,1]){
      const ex=x+side*(w/2+.035);
      for(const dz of [-d/2+.10,0,d/2-.10])box(.10,2.95,.12,ex,1.7,z+dz,wood,g);
      for(const y of [1.02,2.65,3.05])box(.10,.12,d+.12,ex,y,z,wood,g);
      // Closed gable infill; avoids the exposed black underside at the ends.
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([ex,3,z-d/2,ex,4.12,z,ex,3,z+d/2],3));geo.computeVertexNormals();
      const infill=new THREE.Mesh(geo,m.plasterMat);infill.material=m.plasterMat.clone();infill.material.side=THREE.DoubleSide;g.add(infill);
    }
    for(const side of [-1,1]){
      const ez=z+side*(d/2+.035);
      box(w+.12,.14,.10,x,2.95,ez,wood,g);
      for(let px=x-w/2+.1;px<x+w/2;px+=2.4)box(.10,2.9,.10,px,1.6,ez,wood,g);
      box(w+1.05,.16,.12,x,3.12,z+side*(d/2+.6),wood,g);
    }
    const roof=new THREE.BufferGeometry(),v=[],uv=[];
    const corner=[[-w/2-.5,3.15,-d/2-.6],[w/2+.5,3.15,-d/2-.6],[-w/2-.5,4.15,0],[w/2+.5,4.15,0],[-w/2-.5,3.15,d/2+.6],[w/2+.5,3.15,d/2+.6]];
    for(const i of [0,2,1,1,2,3,2,4,3,3,4,5]){const q=corner[i];v.push(q[0]+x,q[1],q[2]+z);uv.push(q[0]/2,q[2]/2);}
    roof.setAttribute('position',new THREE.Float32BufferAttribute(v,3));roof.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));roof.computeVertexNormals();
    const rm=m.roofMat.clone();rm.color.set('#66716a');rm.side=THREE.DoubleSide;g.add(new THREE.Mesh(roof,rm));
    const cx=a[0]+Math.cos(yaw)*x+Math.sin(yaw)*z,cz=a[2]-Math.sin(yaw)*x+Math.cos(yaw)*z;
    colliders.push({type:'box',args:[cx,cz,w/2,d/2,yaw,g.position.y,g.position.y+4.2,'shrine_reception']});
  }
  for(const [start,end,z] of [[.65,10.9,11.69],[12.3,28.6,7.84]]){
    const w=end-start;box(w,1.25,.045,(start+end)/2,1.82,z,dark,g);
    box(w+.2,.12,.47,(start+end)/2,1.15,z+.20,wood,g);
    for(let x=start;x<end;x+=.24)box(.018,.28,.04,x,2.28,z+.06,wood,g);
    box(w,.035,.045,(start+end)/2,2.12,z+.07,wood,g);
    box(w,.14,.20,(start+end)/2,2.50,z+.05,vermilion,g);
    for(let x=start;x<=end;x+=1.25)box(.075,2.4,.12,x,1.65,z+.03,vermilion,g);
    for(let x=start+.35;x<end;x+=1.7){
      box(.65,.035,.34,x,1.24,z+.17,m.plasterMat,g);
      box(.18,.08,.18,x+.16,1.30,z+.17,vermilion,g);
    }
  }
  const title=sign('授与所 · Shrine reception',6,.48);title.position.set(5.8,2.78,11.85);g.add(title);
  const counter=sign('御朱印 · Goshuin',2,.30);counter.position.set(2.2,2.25,11.85);g.add(counter);
  root.add(g);return {id:footprint.id,detail:'inferred counter layout on mapped footprint'};
}
