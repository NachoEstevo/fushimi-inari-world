import * as THREE from 'three';
import {canopyPalette,woodlandPatch} from './season-palette.mjs?v=24';
import {outlookOpening} from './panorama-policy.mjs?v=33';

// Satellite-guided coverage envelope, NOT surveyed individual trees or estate limits.
// Existing detailed forest remains authoritative beside the walking routes.
export function distantCanopy(features,ground,pathDistance,terrain){
  const group=new THREE.Group();group.name='Distant Inariyama canopy';
  const blocked=new Map(),size=192;
  for(const f of [...features.buildings,...features.water.filter(w=>w.tags.natural==='water')]){
    const b=[Math.min(...f.points.map(p=>p[0]))-5,Math.max(...f.points.map(p=>p[0]))+5,
      Math.min(...f.points.map(p=>p[2]))-5,Math.max(...f.points.map(p=>p[2]))+5];
    for(let x=Math.floor(b[0]/size);x<=Math.floor(b[1]/size);x++)for(let z=Math.floor(b[2]/size);z<=Math.floor(b[3]/size);z++){
      const key=`${x},${z}`;if(!blocked.has(key))blocked.set(key,[]);blocked.get(key).push(b);
    }
  }
  let seed=230041,count=0;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const buckets=new Map();
  const xmax=terrain.xmin+(terrain.cols-1)*terrain.step,zmax=terrain.zmin+(terrain.rows-1)*terrain.step;
  for(let x=110;x<xmax;x+=11)for(let z=terrain.zmin;z<zmax;z+=11){
    const px=x+(random()-.5)*18,pz=z+(random()-.5)*18,y=ground(px,pz);
    // Satellite interpretation: woodland follows the eastern hills, with an
    // irregular western urban edge. This is approximate land cover, not cadastral data.
    const edge=135+Math.max(0,Math.abs(pz)-350)*.25+Math.sin(pz*.012)*35;
    if(px<edge||y<64+random()*9)continue;
    if((pz< -720||pz>440)&&random()<.35)continue;
    const key=`${Math.floor(px/size)},${Math.floor(pz/size)}`;
    if((blocked.get(key)??[]).some(b=>px>b[0]&&px<b[1]&&pz>b[2]&&pz<b[3]))continue;
    if((pathDistance(px,pz)?.distance??100)<8)continue;
    // Broad patches break up the uniform confetti pattern, with per-tree variation.
    const patch=woodlandPatch(px,pz);
    const tree=[px,y,pz,patch,random(),random()];
    if(outlookOpening(px,pz))continue;
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push(tree);count++;
  }
  const geo=new THREE.IcosahedronGeometry(1,0);
  // Smooth crown lighting without increasing the twenty-triangle silhouette.
  const points=geo.attributes.position,normals=geo.attributes.normal,n=new THREE.Vector3();
  for(let i=0;i<points.count;i++){n.fromBufferAttribute(points,i).normalize();normals.setXYZ(i,n.x,n.y,n.z);}
  const mat=new THREE.MeshLambertMaterial({color:0xffffff});
  const dummy=new THREE.Object3D(),color=new THREE.Color();
  for(const trees of buckets.values()){
    const mesh=new THREE.InstancedMesh(geo,mat,trees.length);
    trees.forEach(([x,y,z,a,b,c],i)=>{
      dummy.position.set(x,y+6+b*8,z);dummy.rotation.set((b-.5)*.45,c*Math.PI*2,(c-.5)*.35);
      dummy.scale.set(4+b*6,2.8+a*5,4+c*6);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
      color.setHSL(...canopyPalette('spring',a,b,c,y<90&&c>.985));mesh.setColorAt(i,color);
    });
    mesh.userData.trees=trees;mesh.computeBoundingSphere();group.add(mesh);
  }
  group.userData.count=count;
  // These cells and their bounds are static after construction. Cache only the
  // distance decision; visibility remains owned by update even if an external
  // caller changes a child while the camera stands still.
  const cells=group.children.map(mesh=>({mesh,cutoffSquared:(mesh.boundingSphere.radius+200)**2,visible:mesh.visible}));
  let lastX,lastY,lastZ;
  return {group,setSeason(season){
    for(const mesh of group.children){
      mesh.userData.trees.forEach(([x,y,z,a,b,c],i)=>{
        color.setHSL(...canopyPalette(season,a,b,c,y<90&&c>.985));mesh.setColorAt(i,color);
      });mesh.instanceColor.needsUpdate=true;
    }
  },update(camera){
    const {x,y,z}=camera.position,moved=x!==lastX||y!==lastY||z!==lastZ;
    for(const cell of cells){
      // Keep coarse crowns out of the walking foreground; no shadows or colliders.
      if(moved){
        const center=cell.mesh.boundingSphere.center,dx=x-center.x,dy=y-center.y,dz=z-center.z;
        cell.visible=dx*dx+dy*dy+dz*dz>cell.cutoffSquared;
      }
      if(cell.mesh.visible!==cell.visible)cell.mesh.visible=cell.visible;
    }
    lastX=x;lastY=y;lastZ=z;
  }};
}
