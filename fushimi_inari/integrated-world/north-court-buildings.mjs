import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {northCourtLowFrontEdges,northCourtTimberTexture} from './north-court-low-front.mjs';

export const northCourtBuildingIds=['way/305214375','way/305214356','way/305214355'];
// June 2012 north-close/north-buildings: timber row, pale upper glazing,
// slatted sill, shuttered ground floor, pale awning and a lower western roof.
// OSM owns every wall/roof footprint. Storeys, bay widths and roof rise are
// inferred from those images; no functional name or readable sign is asserted.
export function buildNorthCourtBuildings(root,features,surfaces,materials,colliders){
  const wood=new THREE.MeshStandardMaterial({color:'#77624b',roughness:.94});
  wood.map=northCourtTimberTexture();
  const dark=new THREE.MeshStandardMaterial({color:'#403d33',roughness:.96});
  const pale=new THREE.MeshStandardMaterial({color:'#c8cec1',roughness:.42,metalness:.06});
  const cream=new THREE.MeshStandardMaterial({color:'#d5cfb9',roughness:.95,side:THREE.DoubleSide});
  const awningGreen=new THREE.MeshStandardMaterial({color:'#28634c',roughness:.95});
  const glazing=new THREE.MeshStandardMaterial({color:'#93a39d',roughness:.38,metalness:.10});
  // The observed roof is grey ceramic tile. Do not inherit the shrine's
  // brown bark/shingle map. A shared small tile map supplies round courses.
  const roof=new THREE.MeshStandardMaterial({color:'#c5cdcf',roughness:.80,side:THREE.DoubleSide});
  if(typeof document!=='undefined'){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const ctx=canvas.getContext('2d');
    if(ctx){
      const pixels=ctx.createImageData(256,256);
      for(let y=0;y<256;y++)for(let x=0;x<256;x++){
        const course=Math.floor(y/(256/6)),v=(y/(256/6))%1,u=((x+(course%2)*2)/32)%1;
        const round=Math.cos((u-.5)*Math.PI),seam=v<.045||v>.97;
        const micro=((x*13+y*17)%11)-5;
        const grey=seam?105:149+43*round+micro;
        const i=(y*256+x)*4;pixels.data[i]=grey-3;pixels.data[i+1]=grey;pixels.data[i+2]=grey+2;pixels.data[i+3]=255;
      }
      ctx.putImageData(pixels,0,0);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=4;
      roof.map=map;roof.bumpMap=map;roof.bumpScale=.025;
    }
  }
  const stone=materials.entryStoneMat,groups=[];
  const frontA=[-1.697,-29.722],frontB=[13.009,-30.891],dx=frontB[0]-frontA[0],dz=frontB[1]-frontA[1],len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len;
  // v points from the court front toward the mapped rear, approximately north.
  const local=p=>[(p[0]-frontA[0])*ux+(p[2]-frontA[1])*uz,(p[0]-frontA[0])*uz-(p[2]-frontA[1])*ux];
  const world=(u,v)=>[frontA[0]+u*ux+v*uz,frontA[1]+u*uz-v*ux];
  const frontSamples=[0,.25,.5,.75,1].map(t=>{const p=world(t*len,0);return surfaces.height(...p);}).sort((a,b)=>a-b);
  const rowFloor=frontSamples[2]+.035;
  for(const id of northCourtBuildingIds){
    const f=features.buildings.find(b=>b.id===id);if(!f)continue;
    const points=f.points.filter((p,i,a)=>i===0||p[0]!==a[0][0]||p[2]!==a[0][2]);
    const lower=id===northCourtBuildingIds[2],height=lower?2.95:5.20;
    const near=points.filter(p=>local(p)[1]<1.9).map(p=>surfaces.height(p[0],p[2])).sort((a,b)=>a-b);
    const floor=lower&&near.length?near[Math.floor((near.length-1)/2)]+.035:rowFloor;
    const group=new THREE.Group();group.name='North court mapped timber building '+id;group.position.y=floor;
    group.userData={sourceFeature:id,provenance:'June 2012 supplied north-court images; exact mapped footprint; inferred storey heights, windows and roof profile'};
    const batches=new Map(),part=(geo,mat)=>{if(geo.index){const original=geo;geo=geo.toNonIndexed();original.dispose();}if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(geo);};
    const box=(w,h,d,x,y,z,mat,yaw=0)=>part(new THREE.BoxGeometry(w,h,d).rotateY(yaw).translate(x,y,z),mat);
    const facadeBox=(w,h,d,u,y,v,mat)=>{const p=world(u,v);box(w,h,d,p[0],y,p[1],mat,Math.atan2(-uz,ux));};
    const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(p[0],-p[2]):shape.moveTo(p[0],-p[2]));shape.closePath();
    const body=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});body.rotateX(-Math.PI/2);part(body,wood);
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],ex=b[0]-a[0],ez=b[2]-a[2],length=Math.hypot(ex,ez);if(length<.01)continue;
      const cx=(a[0]+b[0])/2,cz=(a[2]+b[2])/2,yaw=Math.atan2(-ez,ex),base=Math.min(surfaces.height(a[0],a[2]),surfaces.height(b[0],b[2]),surfaces.height(cx,cz))-.08;
      box(length,Math.max(.10,floor+.08-base),.20,cx,(base-floor+.08)/2,cz,stone,yaw);
      // Explicit polygon-edge blockers leave nearby public routes intact.
      colliders.push({type:'box',args:[cx,cz,length/2,.14,yaw,base,floor+height,'north_court_'+id.split('/')[1]]});
    }
    const front=points.map(p=>({p,uv:local(p)})).filter(q=>q.uv[1]<1.9);
    const u0=Math.min(...front.map(q=>q.uv[0])),u1=Math.max(...front.map(q=>q.uv[0]));
    if(lower){
      // Treat the two stepped facade edges separately: the 2012 photo shows a
      // low boarded frontage and green awning, not a wall across the setback.
      const edges=northCourtLowFrontEdges(points,local);
      group.userData.lowFrontEdges=edges;
      for(const {u0,u1,v} of edges){
        const span=u1-u0;
        for(let u=u0+.12;u<u1-.08;u+=.24)facadeBox(.008,2.06,.035,u,1.16,v-.025,wood);
        for(const y of [.16,2.18])facadeBox(span,.06,.05,(u0+u1)/2,y,v-.03,wood);
        const p=world((u0+u1)/2,v-.275),awning=new THREE.BoxGeometry(span,.055,.55);
        awning.rotateX(-.12);awning.rotateY(Math.atan2(-uz,ux));awning.translate(p[0],2.39,p[1]);part(awning,awningGreen);
        facadeBox(span,.14,.045,(u0+u1)/2,2.30,v-.55,awningGreen);
      }
    }else{
      const bays=Math.max(2,Math.round((u1-u0)/1.65)),bw=(u1-u0)/bays;
      for(let i=0;i<bays;i++){
        const u=u0+(i+.5)*bw;
        const closed=(i+(id===northCourtBuildingIds[1]?1:0))%3===0;
        facadeBox(bw-.12,1.36,.045,u,4.10,-.07,closed?wood:i%2?glazing:pale);
        if(closed)for(let shutter=0;shutter<7;shutter++)facadeBox(.025,1.30,.025,u-bw*.40+shutter*bw*.133,4.10,-.105,dark);
        for(const offset of [-.5,0,.5])facadeBox(.055,1.45,.07,u+offset*bw,4.10,-.12,dark);
        // Dense balcony/sill slats are seen on the upper facade, not a new deck.
        for(let k=0;k<7;k++)facadeBox(.06,.64,.07,u-bw*.42+k*bw*.14,3.12,-.14,dark);
        if(id===northCourtBuildingIds[1]&&i===bays-1){
          facadeBox(bw-.14,1.7,.045,u,1.37,-.08,dark);
          for(const y of [.65,1.25,1.85])facadeBox(bw-.16,.07,.15,u,y,-.14,wood);
        }else for(let k=0;k<9;k++)facadeBox(.045,2.35,.055,u-bw*.44+k*bw*.11,1.28,-.08,wood);
      }
      for(const y of [2.80,3.45,4.86,5.13])facadeBox(u1-u0,.12,.12,(u0+u1)/2,y,-.10,dark);
      // Thin retractable fabric awning, shallow enough to retain court clearance.
      const p=world((u0+u1)/2,-.38),awning=new THREE.BoxGeometry(u1-u0,.035,.72);awning.rotateX(.09);awning.rotateY(Math.atan2(-uz,ux));awning.translate(p[0],2.73,p[1]);part(awning,cream);
      facadeBox(u1-u0,.10,.055,(u0+u1)/2,2.66,-.74,cream);
    }
    // Clip a common pitched roof height-field to each exact concave OSM ring.
    // Subdivision supplies ridge vertices without a bounding-box roof filling voids.
    const depth=lower?8.5:13.1,rise=lower?.85:1.40;
    const roofY=(x,z)=>height+.08+rise*Math.max(0,1-Math.abs(local([x,0,z])[1]-depth/2)/(depth/2));
    const planar=new THREE.ShapeGeometry(shape),raw=planar.index?planar.toNonIndexed():planar,pa=raw.attributes.position,vertices=[],uv=[];
    const addTriangle=(a,b,c,level=0)=>{
      const longest=Math.max(Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(a[0]-c[0],a[1]-c[1]),Math.hypot(b[0]-c[0],b[1]-c[1]));
      if(longest>1.1&&level<6){const ab=[(a[0]+b[0])/2,(a[1]+b[1])/2],ac=[(a[0]+c[0])/2,(a[1]+c[1])/2],bc=[(b[0]+c[0])/2,(b[1]+c[1])/2];addTriangle(a,ab,ac,level+1);addTriangle(ab,b,bc,level+1);addTriangle(ac,bc,c,level+1);addTriangle(ab,bc,ac,level+1);return;}
      for(const [x,z]of [a,b,c]){vertices.push(x,roofY(x,z),z);const [u,v]=local([x,0,z]);uv.push(u/2,v/2);}
    };
    for(let i=0;i<pa.count;i+=3)addTriangle(...[0,1,2].map(k=>[pa.getX(i+k),-pa.getY(i+k)]));
    const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));rg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));rg.computeVertexNormals();part(rg,roof);raw.dispose();if(raw!==planar)planar.dispose();
    // Close only the visible roof boundary; no unseen rear facade detail.
    const ends=[];for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],steps=Math.ceil(Math.hypot(a[0]-b[0],a[2]-b[2]));
      for(let j=0;j<steps;j++){
        const t0=j/steps,t1=(j+1)/steps,x0=a[0]+(b[0]-a[0])*t0,z0=a[2]+(b[2]-a[2])*t0,x1=a[0]+(b[0]-a[0])*t1,z1=a[2]+(b[2]-a[2])*t1;
        ends.push(x0,height,z0,x0,roofY(x0,z0),z0,x1,height,z1,x1,height,z1,x0,roofY(x0,z0),z0,x1,roofY(x1,z1),z1);
      }
    }
    const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.Float32BufferAttribute(ends,3));eg.setAttribute('uv',new THREE.Float32BufferAttribute(ends.flatMap((_,i)=>i%3===0?[ends[i]/2,ends[i+2]/2]:[]),2));eg.computeVertexNormals();part(eg,dark);
    for(const [mat,parts]of batches){const geo=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
    root.add(group);groups.push(group);
  }
  return groups;
}
