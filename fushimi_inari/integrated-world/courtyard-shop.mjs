import * as THREE from 'three';

export const courtyardShopId='way/305214616';
// OSM supplies the footprint. The shuttered shop vocabulary comes from the
// 01:59 video view; height and the exact facade assignment remain inferred.
export function buildCourtyardShop(root,features,ground,m,colliders){
  const f=features.buildings.find(b=>b.id===courtyardShopId);if(!f)return;
  const [a,b,c]=f.points,w=Math.hypot(b[0]-a[0],b[2]-a[2]),d=Math.hypot(c[0]-b[0],c[2]-b[2]);
  const yaw=-Math.atan2(b[2]-a[2],b[0]-a[0]),g=new THREE.Group();
  g.name='Mapped courtyard religious-goods shop';g.position.set(a[0],ground(a[0],a[2]),a[2]);g.rotation.y=yaw;
  const wood=new THREE.MeshStandardMaterial({color:'#40362c',roughness:.88});
  const shutter=new THREE.MeshStandardMaterial({color:'#99816a',roughness:.9});
  const roofMat=m.roofMat.clone();roofMat.color.set('#646d70');roofMat.side=THREE.DoubleSide;
  const box=(sx,sy,sz,x,y,z,mat)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);o.position.set(x,y,z);o.receiveShadow=true;g.add(o);};
  const foundationDepth=Math.max(.2,g.position.y-Math.min(...f.points.map(p=>ground(p[0],p[2])))+.2);
  box(w,foundationDepth,d,w/2,.2-foundationDepth/2,d/2,m.entryStoneMat);
  box(w,2.7,d,w/2,1.55,d/2,wood);
  // Shutters and timber posts on the courtyard-facing long wall.
  for(let i=0;i<3;i++){
    const z=(i+.5)*d/3;
    box(.045,1.6,d/3-.24,w+.025,1.77,z,shutter);
    for(let row=0;row<18;row++)box(.055,.018,d/3-.24,w+.055,1.02+row*.085,z,wood);
  }
  for(let i=0;i<=3;i++)box(.14,2.8,.14,w+.08,1.6,i*d/3,wood);
  const vertices=[],uv=[];
  const corners=[[-.55,3,-.55],[w+.55,3,-.55],[w/2,4,-.55],[-.55,3,d+.55],[w+.55,3,d+.55],[w/2,4,d+.55]];
  for(const i of [0,3,2,2,3,5,2,5,1,1,5,4]){const p=corners[i];vertices.push(...p);uv.push(p[0]/2,p[2]/2);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.computeVertexNormals();g.add(new THREE.Mesh(geo,roofMat));
  for(const x of [-.55,w+.55])box(.12,.16,d+1.2,x,2.99,d/2,wood);
  box(.16,.18,d+1.2,w/2,4,d/2,roofMat);
  for(const z of [0,d]){
    const end=new THREE.BufferGeometry();end.setAttribute('position',new THREE.Float32BufferAttribute([0,2.9,z,w/2,4,z,w,2.9,z],3));end.computeVertexNormals();
    const mat=wood.clone();mat.side=THREE.DoubleSide;g.add(new THREE.Mesh(end,mat));
  }
  root.add(g);
  const center=new THREE.Vector3(w/2,0,d/2).applyAxisAngle(new THREE.Vector3(0,1,0),yaw).add(g.position);
  colliders.push({type:'box',args:[center.x,center.z,w/2,d/2,yaw,g.position.y,g.position.y+4,'mapped_courtyard_shop']});
}
