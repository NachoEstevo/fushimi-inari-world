import * as THREE from 'three';
import {roofHeight} from './roof-profile.mjs';

// Rec Lab walking tour zFKeYi0AK0M, around 10:00: three dark front bays,
// suspended brass lanterns, layered eaves. Dimensions remain photo-inferred.
export function refineOkumiya(object,materials){
  if(object.userData.zone!=='okumiya'||!object.isGroup)return;
  // Front faces the mapped western stair, as in the approach video. Adapter
  // anchor yaw is -PI/2 + .06; cancel the old compressed-layout quarter turn.
  object.rotation.y=-.06;
  const wood=new THREE.MeshStandardMaterial({color:'#302824',roughness:.91});
  const trim=new THREE.MeshStandardMaterial({color:'#635249',roughness:.84});
  const box=(w,h,d,x,y,z,mat)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;object.add(mesh);return mesh;
  };
  const roof=object.children.find(c=>c.geometry?.parameters?.width===7.8);
  if(roof){
    const geo=new THREE.BoxGeometry(7.8,.20,6.2,12,1,32),p=geo.attributes.position;
    for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+roofHeight(p.getZ(i)/3.1,1.22)+.12*Math.pow(Math.abs(p.getX(i)/3.9),6));
    geo.computeVertexNormals();roof.geometry=geo;roof.position.y=3.20;
    const ridge=object.children.find(c=>c.geometry?.parameters?.width===8);
    if(ridge){ridge.position.y=4.55;ridge.material=trim;}
    for(const x of [-2.8,2.8]){
      const vertices=[];
      for(let i=0;i<16;i++){
        const a=-1.9+i*3.8/16,b=-1.9+(i+1)*3.8/16;
        const ya=3.20+roofHeight(a/3.1,1.22),yb=3.20+roofHeight(b/3.1,1.22);
        vertices.push(x,3.42,a,x,ya,a,x,yb,b,x,3.42,a,x,yb,b,x,3.42,b);
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.computeVertexNormals();
      const mat=new THREE.MeshStandardMaterial({color:'#d7d3bf',roughness:1,side:THREE.DoubleSide});
      object.add(new THREE.Mesh(g,mat));
    }
  }
  // Cover only the front plaster above the retained lower lattice; preserve
  // the authored walls, collision, veranda and interactable behind this skin.
  for(const x of [-1.8,0,1.8]){
    box(1.56,1.48,.045,x,2.35,1.925,wood);
    for(let j=-3;j<=3;j++)box(.035,1.48,.05,x+j*.20,2.35,1.963,trim);
    for(const y of [1.64,2.22,3.07])box(1.60,.055,.065,x,y,1.98,trim);
  }
  for(const y of [3.16,3.38])box(6.05,.14,.22,0,y,2.02,materials.vermilionMat);
  for(let i=0;i<33;i++){
    const x=-3.55+i*7.1/32;
    box(.065,.11,1.18,x,3.45,2.60,materials.vermilionMat);
    box(.075,.115,.07,x,3.45,3.20,materials.goldMat);
  }
  for(const x of [-2.7,-.9,.9,2.7]){
    box(.42,.14,.45,x,3.06,2.03,materials.vermilionMat);
    box(.58,.13,.36,x,3.22,2.03,materials.vermilionMat);
  }
  // Replace the three unsupported spheres with complete suspended fittings.
  for(const c of [...object.children])if(c.geometry?.type==='SphereGeometry'&&c.geometry.parameters.radius===.18)c.removeFromParent();
  for(const x of [-1.8,0,1.8]){
    box(.022,.50,.022,x,2.97,2.23,materials.goldMat);
    box(.28,.06,.28,x,2.72,2.23,materials.goldMat);
    box(.20,.22,.20,x,2.58,2.23,wood);
    box(.29,.065,.29,x,2.44,2.23,materials.goldMat);
    for(const dx of [-.105,.105])for(const dz of [-.105,.105])box(.028,.24,.028,x+dx,2.58,2.23+dz,materials.goldMat);
  }
}
