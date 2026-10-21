import * as THREE from 'three';
import { leafClusterMaterial } from './leaf-cluster.mjs';

// Needle fans retain the fine, porous edge of a pruned Japanese black pine.
// Cutouts write depth, so overlapping sprays do not require transparency sorting.
function pineSprayMaterial(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d');
  for(let fan=0;fan<13;fan++){
    const x=38+(fan%5)*43+Math.sin(fan*7)*10,y=155-Math.floor(fan/5)*45;
    ctx.strokeStyle='#65704a';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(128,238);ctx.lineTo(x,y);ctx.stroke();
    for(let needle=0;needle<27;needle++){
      const angle=-Math.PI+(needle/26)*Math.PI,reach=25+(Math.sin(needle*17+fan*9)+1)*14;
      ctx.strokeStyle=needle%3===0?'#9aa875':needle%3===1?'#596b43':'#7e8c5d';
      ctx.lineWidth=1.35;ctx.beginPath();ctx.moveTo(x,y);
      ctx.quadraticCurveTo(x+Math.cos(angle)*reach*.6,y+Math.sin(angle)*reach*.7,x+Math.cos(angle)*reach,y+Math.sin(angle)*reach);ctx.stroke();
    }
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
  return new THREE.MeshStandardMaterial({map,alphaTest:.3,alphaToCoverage:true,side:THREE.DoubleSide,roughness:1});
}

// June 2012 entrance photograph: one trained pine, a low clipped island,
// three timber props and a short vermilion fence. Dimensions are visual estimates.
export function buildAzumamaroPlanting(root,features,surfaces,materials,colliders){
  const path=features.paths.find(p=>p.id==='way/105449706');
  if(!path||path.points.length<2)return null;
  const a=path.points[1],b=path.points[0],length=Math.hypot(b[0]-a[0],b[2]-a[2]);
  if(length<1)return null;
  const gate=[a[0]+(b[0]-a[0])*5.1/length,a[2]+(b[2]-a[2])*5.1/length];
  // Facing into the entrance (+z), the pine occupies the left shoulder (+x).
  const cx=gate[0]+3.55,cz=gate[1]-.15;
  const group=new THREE.Group();group.name='Azumamaro trained pine and entrance garden';root.add(group);
  const bark=new THREE.MeshStandardMaterial({color:'#595344',roughness:1});
  const timber=new THREE.MeshStandardMaterial({color:'#6b6150',roughness:1});
  const red=new THREE.MeshStandardMaterial({color:'#a83724',roughness:.85});
  const foliage=pineSprayMaterial();
  const base=surfaces.terrainHeight(cx,cz);
  const local=(x,y,z)=>new THREE.Vector3(cx+x,base+y*.91,cz+z);
  const beam=(start,end,radius,mat,name)=>{
    const delta=end.clone().sub(start);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius*.78,radius,delta.length(),7),mat);
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
    mesh.castShadow=mesh.receiveShadow=true;mesh.name=name;group.add(mesh);return mesh;
  };
  const trunk=[[0,0,0],[.13,1.3,.02],[.43,2.65,.04],[.68,3.8,.08],[.90,4.85,.14],[.80,5.75,.13]];
  trunk.slice(1).forEach((p,i)=>beam(local(...trunk[i]),local(...p),.15-i*.019,bark,'Leaning pine trunk'));
  // Deliberately offset horizontal tiers retain the open, asymmetric trained silhouette.
  const tiers=[[-.65,2.5,.05,1.15,.57],[1.25,3.15,.12,1.3,.65],[-.42,3.95,.12,1.65,.71],
    [1.15,4.70,.16,1.42,.66],[.72,5.63,.13,1.13,.61]];
  const clusters=[];
  for(const [x,y,z,rx,rz] of tiers){
    const junction=local(.12+y*.13,y-.4,.06);
    beam(junction,local(x,y-.08,z),.058,bark,'Exposed horizontal pine limb');
    // Several visible twigs support an irregular fan rather than a solid crown disc.
    for(let twig=0;twig<7;twig++){
      const angle=twig*2.3999632297;
      beam(local(x,y-.12,z),local(x+Math.cos(angle)*rx*.78,y+.04,z+Math.sin(angle)*rz*.72),.017,bark,'Fine pine branch');
    }
    for(let i=0;i<53;i++){
      const angle=i*2.3999632297,r=Math.sqrt((i+.4)/53);
      clusters.push([x+Math.cos(angle)*rx*r,y+Math.sin(i*2.1)*.10,z+Math.sin(angle)*rz*r,.24+(i%4)*.035,.27+(i%3)*.035]);
    }
  }
  const sprayGeometry=new THREE.PlaneGeometry(1,1);
  const crown=new THREE.InstancedMesh(sprayGeometry,foliage,clusters.length*3);
  const dummy=new THREE.Object3D(),color=new THREE.Color();
  clusters.forEach(([x,y,z,width,height],i)=>{
    for(let side=0;side<3;side++){
      dummy.position.copy(local(x,y,z));dummy.scale.set(width,height,1);
      dummy.rotation.set(-.18+(i%5)*.10,i*2.39996+side*Math.PI/3,.1*Math.sin(i));dummy.updateMatrix();
      const index=i*3+side;crown.setMatrixAt(index,dummy.matrix);
      color.setHSL(.24+(i%4)*.008,.22,.48+(i%5)*.025);crown.setColorAt(index,color);
    }
  });
  crown.name='Fine needle sprays on five open pine tiers';crown.castShadow=false;crown.receiveShadow=true;group.add(crown);
  // Dense individual evergreen sprigs form the clipped island with a fine leaf edge.
  // Distribute through the volume as well as the top to avoid gaps from oblique views.
  // This plane has no per-vertex colors. Instance colors remain enabled by
  // InstancedMesh; enabling vertexColors here would multiply them by black.
  const hedgeMaterial=leafClusterMaterial().clone();hedgeMaterial.vertexColors=false;
  const hedge=new THREE.InstancedMesh(sprayGeometry,hedgeMaterial,600);
  for(let i=0;i<600;i++){
    const angle=i*2.3999632297,r=Math.sqrt(((i*73)%600+.5)/600);
    const x=cx+Math.cos(angle)*1.05*r,z=cz+Math.sin(angle)*.69*r;
    const h=.11+((i*137)%991)/991*.34;
    dummy.position.set(x,surfaces.terrainHeight(x,z)+h,z);
    dummy.rotation.set((i%3===0?Math.PI*.5:.2)+Math.sin(i)*.3,i*1.71,Math.cos(i)*.2);
    dummy.scale.set(.24+(i%4)*.025,.19+(i%5)*.02,1);dummy.updateMatrix();
    hedge.setMatrixAt(i,dummy.matrix);hedge.setColorAt(i,color.setHSL(.25,.06,.64+(i%5)*.035));
  }
  hedge.name='Low clipped hedge with individual evergreen leaves';hedge.castShadow=false;hedge.receiveShadow=true;group.add(hedge);
  for(const [x,z,top] of [[-1.28,-.35,2.42],[1.35,-.18,2.55],[.13,.65,2.2]]){
    const ground=surfaces.terrainHeight(cx+x,cz+z);
    beam(new THREE.Vector3(cx+x,ground,cz+z),local(x*.93,top,z),.047,timber,'Timber pine support');
    beam(local(x*.93-.12,top-.06,z),local(x*.93+.12,top-.06,z),.035,timber,'Timber support crosspiece');
  }
  // The short fence is visible behind the island, never across the mapped approach.
  for(let i=0;i<9;i++){
    const x=cx-1.25+i*.30,z=cz+1.03,y=surfaces.terrainHeight(x,z);
    beam(new THREE.Vector3(x,y,z),new THREE.Vector3(x,y+1.1,z),i===0||i===8?.065:.029,red,'Vermilion fence upright');
  }
  for(const h of [.35,.94])beam(new THREE.Vector3(cx-1.32,base+h,cz+1.03),new THREE.Vector3(cx+1.22,base+h,cz+1.03),.045,red,'Vermilion fence rail');
  colliders.push({type:'cylinder',args:[cx,cz,.28,base,base+2.2,'azumamaro_pine_trunk']});
  const metadata={path:path.id,center:[cx,base,cz],crownTiers:5,timberSupports:3,
    provenance:'June 2012 entrance photograph; planting placement and dimensions visually inferred'};
  group.userData.provenance=metadata;
  return metadata;
}
