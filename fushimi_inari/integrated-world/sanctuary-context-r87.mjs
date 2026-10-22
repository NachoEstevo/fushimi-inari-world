import * as THREE from 'three';

const OWNER='Tamayama west stair rough stone retaining edges';
const NAME='Sanctuary retaining masonry R87';

// The video at 05:25 shows irregular stone masonry beneath the shrine-row
// enclosure. R77 already owns its position and structural mass. This replaces
// that rendered owner with a recessed bed and shallow faceted stone facing;
// it does not infer another wall, move a terrace, or add a walking surface.
export function buildSanctuaryContextR87(root,features,network,materials,colliders){
  const previous=root.getObjectByName(NAME);if(previous)return previous.userData;
  const source=root.getObjectByName(OWNER);
  if(!source?.isMesh||source.userData.sourcePath!=='way/105449693')return null;
  const stone=materials.stoneMat??materials.entryStoneMat;if(!stone)return null;
  const p=source.geometry.getAttribute('position');
  // Consume the actual clipped R77 wall triangles. Reconstructing the plan
  // independently would lose its building/water/junction clearance decisions.
  const faces=[];
  for(let i=0;i<p.count;i+=3){
    const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);
    const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    if(Math.abs(normal.y)>.01)continue;
    // R77 side quads have two consecutive triangles: [a low,a high,b high].
    if(Math.abs(a.x-b.x)>1e-6||Math.abs(a.z-b.z)>1e-6||b.y<=a.y)continue;
    const length=Math.hypot(c.x-a.x,c.z-a.z);
    if(length<.20||b.y-a.y<.10)continue;
    // Only longitudinal exposed faces need masonry. Short closure/cut faces
    // retain the stone bed and do not become thousands of tiny facing stones.
    if(!(network.segments??[]).some(s=>s.id==='way/105449693'&&s.stair&&Math.abs(normal.x*(s.b[0]-s.a[0])+normal.z*(s.b[2]-s.a[2]))<.05*Math.hypot(s.b[0]-s.a[0],s.b[2]-s.a[2])))continue;
    faces.push({a,b,c,length,normal});
  }
  if(!faces.length)return null;
  const positions=[],uv=[],colors=[];let stones=0;
  const push=(point,color)=>{positions.push(...point);uv.push((point[0]+point[2])/1.4,point[1]/1.4);colors.push(color,color,color);};
  for(const [index,{a,b,c,length,normal}]of faces.entries()){
    const ux=(c.x-a.x)/length,uz=(c.z-a.z)/length,height=b.y-a.y;
    const courses=Math.max(1,Math.ceil(height/.28)),ch=height/courses;
    for(let row=0;row<courses;row++){
      const unit=.39+((index+row)%3)*.035,offset=row%2?unit*.5:0;
      for(let start=-offset;start<length;start+=unit){
        const lo=Math.max(0,start)+.008,hi=Math.min(length,start+unit)-.008;
        if(hi-lo<.06)continue;
        const bottom=a.y+row*ch+.008,top=a.y+(row+1)*ch-.008;
        const bevel=Math.min(.045,(hi-lo)*.14,(top-bottom)*.16);
        const skew=((index+row+stones)%3-1)*bevel*.35;
        const outline=[[lo+bevel*.3,bottom+skew+bevel*.35],[hi-bevel*.3,bottom],
          [hi,top-bevel*.3],[lo+bevel*.2,top]];
        const relief=.008+((index+row+stones)%4)*.002;
        const at=(u,y,depth)=>[a.x+ux*u+normal.x*depth,y,a.z+uz*u+normal.z*depth];
        const center=at((lo+hi)/2,(bottom+top)/2,relief);
        const shade=.80+((index*3+row+stones)%7)*.03;
        for(let j=0;j<outline.length;j++){
          const q=outline[j],r=outline[(j+1)%outline.length];
          // Relief is capped at 14mm, within R77's 140mm stair clearance.
          // Facing is decorative and does not change collision ownership.
          // Four low-poly facets meet the retained structural bed. The bed
          // closes the wall; individual hidden backs/side skirts are omitted.
          for(const v of [center,at(...r,.004),at(...q,.004)])push(v,shade);
        }
        stones++;
      }
    }
  }
  if(!positions.length)return null;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const facing=stone.clone();facing.vertexColors=true;facing.roughness=.99;
  const mortar=stone.clone();mortar.color.multiplyScalar(.63);mortar.roughness=1;
  const bed=new THREE.Mesh(source.geometry,mortar);bed.name='Retained R77 clipped structural stone bed';
  const skin=new THREE.Mesh(geometry,facing);skin.name='Photo observed rough masonry faces';
  for(const mesh of [bed,skin])mesh.castShadow=mesh.receiveShadow=true;
  const group=new THREE.Group();group.name=NAME;group.position.copy(source.position);group.quaternion.copy(source.quaternion);group.scale.copy(source.scale);group.add(bed,skin);
  const record={revision:'R87',sourcePath:'way/105449693',replacedOwner:OWNER,stones,faces:faces.length,materialBatches:2,triangles:(p.count+positions.length/3)/3,facingTriangles:positions.length/9,
    maximumFacingRelief:.014,dimensions:'inferred stone course .28m maximum, .39-.46m nominal length, .008-.014m relief; retained R77 mass and clipped extents',
    observed:'irregular grey stone masonry beneath shrine-row boundary beside lower broad stair; supplied video 05:25',
    source:'https://www.youtube.com/watch?v=iqK2tg-TxbY&t=325s',limits:'Rough stone category is observed; individual joints, stone counts and relief are inferred. No new sanctuary, unseen enclosure, platform, ground, collider or walk sampler.'};
  group.userData=record;source.parent.add(group);source.removeFromParent();return record;
}
