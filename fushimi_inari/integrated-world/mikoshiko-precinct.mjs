import * as THREE from 'three';
import {staticParts,stonePalette} from './mountain-landmarks-geometry.mjs';
import {clipMitsuTerrain,clipMitsuTerrainAsync} from './mitsu-frontage-aprons.mjs';
export const MIKOSHIKO_ID='way/1287564336';
export function mikoshikoLayout(features){
 const f=features.buildings?.find(b=>b.id===MIKOSHIKO_ID),p=f?.points;
 if(!p||p.length!==5||!p.every(q=>q.length>=3&&q.every(Number.isFinite)))return null;
 const width=Math.hypot(p[0][0]-p[1][0],p[0][2]-p[1][2]),depth=Math.hypot(p[1][0]-p[2][0],p[1][2]-p[2][2]);
 if(width<7||width>9||depth<15||depth>17)return null;
 return {id:MIKOSHIKO_ID,center:[(p[0][0]+p[2][0])/2,(p[0][2]+p[2][2])/2],width,depth,yaw:-Math.atan2(p[0][2]-p[1][2],p[0][0]-p[1][0]),orientationStatus:'West door facade inferred from well adjacency; not photographically surveyed',dimensionStatus:'Mapped footprint; heights, court extent and door count inferred from 2016 photograph',source:'https://plaza.rakuten.co.jp/asobikokoro2/diary/201610080000/'};
}
export function buildMikoshikoPrecinct(root,materials,features,surfaces,colliders,options={}){
 const name='Mikoshiko precinct R93',existing=root.getObjectByName(name);if(existing)return existing.userData;
 const plan=mikoshikoLayout(features);if(!plan)return {built:false,builtIds:[],reason:'unrecognized-footprint'};
 const {center:[x,z],width:w,depth:d,yaw}=plan,c=Math.cos(yaw),s=Math.sin(yaw);
 const world=(u,v)=>[x+c*u+s*v,z-s*u+c*v],at=world(-w/2-.5,0),floor=surfaces.height(...at);
 if(!Number.isFinite(floor))return {built:false,builtIds:[],reason:'invalid-floor'};
 let bottom=floor-.15;
 // Match the rendered triangle support contract, not only the coarse height sampler.
 const vertices=options.terrainPositions;
 if(vertices)for(let i=0;i<vertices.length;i+=9){const t=[];for(let j=0;j<3;j++){const dx=vertices[i+j*3]-x,dz=vertices[i+j*3+2]-z;t.push([c*dx-s*dz,s*dx+c*dz,vertices[i+j*3+1]]);}if(Math.max(...t.map(q=>q[0]))< -w/2-1.05||Math.min(...t.map(q=>q[0]))>w/2||Math.max(...t.map(q=>q[1]))< -d/2||Math.min(...t.map(q=>q[1]))>d/2)continue;bottom=Math.min(bottom,...t.map(q=>q[2]-.04));}
 const g=new THREE.Group();g.name=name;g.position.set(x,floor,z);g.rotation.y=yaw;
 const p=stonePalette(materials),parts=staticParts(g),roof=new THREE.MeshStandardMaterial({color:'#777a73',roughness:.95}),timber=new THREE.MeshStandardMaterial({color:'#827b62',roughness:.96});
 const base=bottom-floor,wallTop=4.65,ridge=6.35;
 parts.box(w,.3-base,d,0,(.3+base)/2,0,p.shaded);
 parts.box(w-.12,wallTop-.3,d-.12,0,(wallTop+.3)/2,0,p.paper);
 // Four inferred paired door bays along west facade; no invented shrine fittings.
 for(let i=0;i<4;i++){const zz=-d/2+1.05+(d-2.1)*(i+.5)/4,bay=(d-2.1)/4;
  for(const side of [-1,1]){const dz=zz+side*bay/4;parts.box(.10,3.45,bay/2-.045,-w/2-.045,2.025,dz,p.dark);parts.box(.045,.13,.21,-w/2-.11,1.9,zz+side*.15,p.metal);}
  parts.box(.18,3.65,.13,-w/2-.13,2.125,zz-bay/2,timber);
 }
 parts.box(.23,.18,d+.2,-w/2-.13,3.96,0,timber);
 // White plaster gables and plain cornice, with shallow tiled eaves.
 for(const zz of [-d/2,d/2]){parts.sheet([-w/2,wallTop,zz,w/2,wallTop,zz,0,ridge-.15,zz],p.paper);parts.box(w+.15,.15,.2,0,wallTop,zz,p.paper);}
 const half=w/2+.55,end=d/2+.55,eave=4.55;
 for(const side of [-1,1]){const face=[[0,ridge,-end],[side*half,eave,-end],[0,ridge,end],[0,ridge,end],[side*half,eave,-end],[side*half,eave,end]];if(side>0){[face[1],face[2]]=[face[2],face[1]];[face[4],face[5]]=[face[5],face[4]];}parts.sheet(face.flat(),roof);parts.box(.15,.15,2*end,side*half,eave,0,roof);for(let j=0;j<=Math.floor(2*end/.36);j++){const zz=-end+j*.36;parts.beam([0,ridge+.035,zz],[side*half,eave+.035,zz],.022,roof,.022,6);}}
 parts.box(.27,.18,2*end+.12,0,ridge+.07,0,roof);
 // Bounded gravel strip and close timber pickets. Southern/western route stays outside.
 parts.box(1.05,.09-base,d,-w/2-.525,(.09+base)/2,0,p.stone);
 const fenceX=-w/2-.86;
 for(let i=0;i<=Math.floor(d/.24);i++)parts.box(.065,1.12,.065,fenceX,.65,-d/2+i*.24,timber);
 for(const y of [.38,1.03])parts.box(.085,.08,d,fenceX,y,0,timber);
 for(const zz of [-d/2,d/2]){for(let i=0;i<=Math.floor(w/.24);i++)parts.box(.065,1.12,.065,-w/2+i*.24,.65,zz,timber);parts.box(w,.08,.085,0,1.03,zz,timber);}
 const stats=parts.flush();root.add(g);
 colliders.push({type:'box',args:[x,z,w/2,d/2,yaw,floor,floor+wallTop,'mikoshiko']});
 const fc=world(fenceX,0);colliders.push({type:'box',args:[fc[0],fc[1],.05,d/2,yaw,floor,floor+1.2,'mikoshiko-pickets']});
 const ring=features.buildings.find(b=>b.id===MIKOSHIKO_ID).points.slice(0,-1).map(q=>[q[0],q[2]]),faces=THREE.ShapeUtils.triangulateShape(ring.map(q=>new THREE.Vector2(...q)),[]);
 g.userData={clipTerrainAsync:async(positions,options)=>{if(positions.length%9||!positions.every(Number.isFinite))throw Error('Mikoshiko terrain requires finite triangle positions');return clipMitsuTerrainAsync(positions,faces.map(f=>f.map(i=>ring[i])),options);},clipTerrain:positions=>{if(positions.length%9||!positions.every(Number.isFinite))throw Error('Mikoshiko terrain requires finite triangle positions');return clipMitsuTerrain(positions,faces.map(f=>f.map(i=>ring[i])));},built:true,...plan,floor,foundationBottom:bottom,builtIds:[MIKOSHIKO_ID],courtBoundsLocal:[-w/2-1.05,-w/2,-d/2,d/2],...stats};return g.userData;
}
