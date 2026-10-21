import * as THREE from 'three';

// Permanent nearby context: OSM rings own the walls and footprint. Heights,
// roof-volume decomposition and facade vocabulary are visual estimates only.
export const azumamaroContextIds=['way/305214608','way/305214609','way/952815193'];
const contextSpecs=[
  {id:azumamaroContextIds[0],name:'Mapped former residence study',height:2.75,roofs:[[-9.65,4.80,25.45,34.05,'z',1.25],[-11.85,.80,31.45,34.15,'x',.65],[1.35,4.95,34.05,36.55,'z',.65]]},
  {id:azumamaroContextIds[1],name:'Mapped former residence ritual storehouse',height:2.65,roofs:[[-16.60,-12.48,17.70,22.02,'z',1.05]]},
  {id:azumamaroContextIds[2],name:'Mapped eastern Kaguraden context',height:3.05,roofs:[[40.20,48.65,17.85,33.10,'z',1.65],[38.75,40.15,17.90,29.90,'z',.45],[48.75,60.90,24.35,33.00,'x',1.25],[40.25,47.90,33.15,35.20,'x',.60],[54.70,59.70,21.70,24.40,'z',.65]]},
];

export function buildAzumamaroContext(root,features,surfaces,materials,colliders){
  const plaster=new THREE.MeshStandardMaterial({color:'#c8c2ad',roughness:.96});
  const timber=new THREE.MeshStandardMaterial({color:'#655747',roughness:.94});
  const tile=materials.roofMat.clone();tile.color.set('#626965');tile.side=THREE.DoubleSide;
  const stone=materials.entryStoneMat,groups=[];
  const ground=(x,z)=>surfaces.height(x,z);
  for(const spec of contextSpecs){
    const f=features.buildings.find(b=>b.id===spec.id);if(!f)continue;
    const points=f.points.filter((p,i,ps)=>i===0||p[0]!==ps[0][0]||p[2]!==ps[0][2]);
    // Median of the public/front edge resists one downhill corner lifting the
    // entire building onto a tall podium. Footings reach terrain independently.
    const zFront=Math.min(...points.map(p=>p[2]));
    const front=points.filter(p=>p[2]<zFront+.65).map(p=>ground(p[0],p[2])).sort((a,b)=>a-b);
    const floor=(front.length?front[Math.floor((front.length-1)/2)]:ground(points[0][0],points[0][2]))+.04;
    const group=new THREE.Group();group.name=spec.name;group.position.y=floor;
    group.userData={sourceFeature:spec.id,permanentNearbyContext:true,provenance:'OSM footprint; inferred heights, roof volumes and muted materials; not a surveyed reconstruction'};
    const box=(w,h,d,x,y,z,mat)=>{if(h<=0)return;const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;};
    const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],-p[2]):shape.moveTo(p[0],-p[2]));shape.closePath();
    const walls=new THREE.ExtrudeGeometry(shape,{depth:spec.height,bevelEnabled:false});walls.rotateX(-Math.PI/2);
    const wallMesh=new THREE.Mesh(walls,plaster);wallMesh.castShadow=true;wallMesh.receiveShadow=true;group.add(wallMesh);
    // Thin polygon cap retains every concave notch between the roofed main
    // volumes; no rectangular body replaces or fills the mapped footprint.
    const cap=new THREE.ShapeGeometry(shape);cap.rotateX(-Math.PI/2);const capMesh=new THREE.Mesh(cap,tile);capMesh.position.y=spec.height+.04;capMesh.receiveShadow=true;group.add(capMesh);
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<.01)continue;
      const cx=(a[0]+b[0])/2,cz=(a[2]+b[2])/2,yaw=Math.atan2(-dz,dx);
      for(const [y,h,depth] of [[.41,.78,.10],[.85,.10,.14],[spec.height-.12,.12,.15]]){const band=box(length,h,depth,cx,y,cz,timber);band.rotation.y=yaw;}
      const base=Math.min(ground(a[0],a[2]),ground(b[0],b[2]),ground(cx,cz))-.10;
      const footing=box(length,Math.max(.12,floor+.08-base),.22,cx,(base-floor+.08)/2,cz,stone);footing.rotation.y=yaw;
      for(let s=.12;s<length;s+=1.65){const t=s/length;const post=box(.11,spec.height,.13,a[0]+dx*t,spec.height/2,a[2]+dz*t,timber);post.rotation.y=yaw;}
      colliders.push({type:'box',args:[cx,cz,length/2,.16,yaw,base,floor+spec.height,'azumamaro_context_'+spec.id.split('/')[1]]});
    }
    for(const [x0,x1,z0,z1,axis,rise] of spec.roofs){
      const cx=(x0+x1)/2,cz=(z0+z1)/2,eave=spec.height+.08,verts=[];
      const faces=axis==='z'?[[[x0,eave,z0],[cx,eave+rise,z0],[x0,eave,z1]],[[cx,eave+rise,z0],[cx,eave+rise,z1],[x0,eave,z1]],[[cx,eave+rise,z0],[x1,eave,z0],[cx,eave+rise,z1]],[[x1,eave,z0],[x1,eave,z1],[cx,eave+rise,z1]]]:[[[x0,eave,z0],[x0,eave+rise,cz],[x1,eave,z0]],[[x0,eave+rise,cz],[x1,eave+rise,cz],[x1,eave,z0]],[[x0,eave+rise,cz],[x0,eave,z1],[x1,eave+rise,cz]],[[x0,eave,z1],[x1,eave,z1],[x1,eave+rise,cz]]];
      faces.forEach(face=>face.forEach(v=>verts.push(...v)));
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(verts.flatMap((v,i)=>i%3===0?[verts[i]/2,verts[i+2]/2]:[]),2));geo.computeVertexNormals();
      const mesh=new THREE.Mesh(geo,tile);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
      const ends=axis==='z'?[[[x0,eave,z0],[cx,eave+rise,z0],[x1,eave,z0]],[[x1,eave,z1],[cx,eave+rise,z1],[x0,eave,z1]]]:[[[x0,eave,z1],[x0,eave+rise,cz],[x0,eave,z0]],[[x1,eave,z0],[x1,eave+rise,cz],[x1,eave,z1]]];
      const endGeometry=new THREE.BufferGeometry();endGeometry.setAttribute('position',new THREE.Float32BufferAttribute(ends.flat(2),3));endGeometry.computeVertexNormals();
      const gableMaterial=timber.clone();gableMaterial.side=THREE.DoubleSide;const gable=new THREE.Mesh(endGeometry,gableMaterial);gable.castShadow=true;group.add(gable);
      const ridge=axis==='z'?box(.17,.17,z1-z0,cx,eave+rise+.04,cz,tile):box(x1-x0,.17,.17,cx,eave+rise+.04,cz,tile);
      ridge.name='Inferred tiled main-volume ridge';
    }
    root.add(group);groups.push(group);
  }
  return groups;
}
