import * as THREE from 'three';
import {spatialMeshes} from './spatial-mesh.mjs';
import {pathOffset} from './path-frame.mjs?v=10';
import {fineGranite} from './surface-materials.mjs';
import {outsideArrival} from './okusha-arrival.mjs';

export function buildPathMeshes(network,legacy){
  const group=new THREE.Group(),buckets={stone:[],earth:[],street:[],restricted:[],edge:[],rail:[],senbon:[],precinct:[]},senbonUV=[];
  const quad=(out,a,b,c,d)=>{
    for(const polygon of outsideArrival([a,b,c,d]))for(let i=1;i<polygon.length-1;i++)for(const p of [polygon[0],polygon[i+1],polygon[i]]){
      out.push(...p.slice(0,3));if(out===buckets.senbon)senbonUV.push(p[3],p[4]);
    }
  };
  for(const [index,s] of network.segments.entries()){
    const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],len=Math.hypot(dx,dz);
    const adjacent=(candidate,end)=>candidate?.id===s.id&&Math.hypot(candidate[end][0]-(end==='b'?s.a:s.b)[0],candidate[end][2]-(end==='b'?s.a:s.b)[2])<.001?candidate:null;
    const startNormal=pathOffset(s.a,s.b,adjacent(network.segments[index-1],'b'));
    const endNormal=pathOffset(s.a,s.b,adjacent(network.segments[index+1],'a'),true);
    const point=(p,y,offset)=>{const n=p===s.a?startNormal:endNormal;return [p[0]+n[0]*offset,y,p[2]+n[1]*offset];};
    const senbon=['way/260121328','way/377968455'].includes(s.id);
    if(senbon){
      const w=.66;
      const va=s.distance/.65,vb=(s.distance+len)/.65;
      quad(buckets.senbon,[...point(s.a,s.ya,-w),0,va],[...point(s.b,s.yb,-w),0,vb],[...point(s.b,s.yb,w),1,vb],[...point(s.a,s.ya,w),1,va]);
      for(const side of [-1,1])quad(buckets.earth,point(s.a,s.ya,side*w),point(s.b,s.yb,side*w),point(s.b,s.yb,side*s.width/2),point(s.a,s.ya,side*s.width/2));
    }else quad(buckets[s.stair&&s.kind==='stone'?'edge':s.kind==='stone'&&s.ya<55&&s.a[0]>-140&&s.a[0]<120&&Math.abs(s.a[2])<85?'precinct':s.kind],point(s.a,s.ya,-s.width/2),point(s.b,s.yb,-s.width/2),point(s.b,s.yb,s.width/2),point(s.a,s.ya,s.width/2));
    if(s.stair){
      const p=s.riserAt==='b'?s.b:s.a,y=s.riserAt==='b'?s.yb:s.ya;
      quad(buckets.edge,point(p,y-s.rise,-s.width/2),point(p,y,-s.width/2),point(p,y,s.width/2),point(p,y-s.rise,s.width/2));
    }
    if(s.kind==='stone'){
      for(const side of [-1,1]){
        const inner=side*s.width/2,outer=inner+side*.13;
        // Open only mapped, connected junction mouths; never infer a junction
        // from a projected crossing or a neighbouring parallel trail.
        const cuts=Math.max(1,Math.ceil(len/.45));
        const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
        for(let part=0;part<cuts;part++){
          const a=lerp(point(s.a,s.ya,inner),point(s.b,s.yb,inner),part/cuts);
          const b=lerp(point(s.a,s.ya,inner),point(s.b,s.yb,inner),(part+1)/cuts);
          const oa=lerp(point(s.a,s.ya,outer),point(s.b,s.yb,outer),part/cuts);
          const ob=lerp(point(s.a,s.ya,outer),point(s.b,s.yb,outer),(part+1)/cuts);
          const m=lerp(a,b,.5);
          if(network.edgeCovered(m[0],m[2],m[1],s.id))continue;
          const up=(p,h)=>[p[0],p[1]+h,p[2]];
          quad(buckets.edge,up(a,.025),up(b,.025),up(ob,.025),up(oa,.025));
          quad(buckets.edge,up(oa,-.30),up(ob,-.30),up(ob,.025),up(oa,.025));
          if(s.handrail)quad(buckets.rail,up(oa,.82),up(ob,.82),up(ob,.86),up(oa,.86));
          // Narrow, uneven earth shoulder on mountain paths, below the curb.
          if(s.ya>55&&!senbon){
            const spread=.28+.10*Math.sin(s.distance*1.73+side);
            const ea=[oa[0]+side*startNormal[0]*spread,oa[1]-.12,oa[2]+side*startNormal[1]*spread];
            const eb=[ob[0]+side*endNormal[0]*spread,ob[1]-.12,ob[2]+side*endNormal[1]*spread];
            if(!network.sample(ea[0],ea[2])&&!network.sample(eb[0],eb[2]))quad(buckets.earth,up(oa,-.08),up(ob,-.08),eb,ea);
          }
        }
      }
    }
  }
  const earth=legacy.materials.gravelMat.clone();earth.color.set('#71644d');
  const tile=document.createElement('canvas');tile.width=512;tile.height=256;
  const ctx=tile.getContext('2d'),pixels=ctx.createImageData(512,256);
  let seed=91;
  for(let i=0;i<pixels.data.length;i+=4){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const n=148+(seed/4294967296-.5)*22;
    pixels.data[i]=n;pixels.data[i+1]=n+1;pixels.data[i+2]=n-4;pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);ctx.fillStyle='#66685f';
  ctx.fillRect(0,0,512,2);ctx.fillRect(0,254,512,2);ctx.fillRect(254,0,3,256);
  const paving=new THREE.CanvasTexture(tile);paving.wrapS=paving.wrapT=THREE.RepeatWrapping;paving.colorSpace=THREE.SRGBColorSpace;paving.anisotropy=8;
  // Fine granite without paving joints continuing vertically across risers.
  const stairFace=fineGranite();
  const materials={precinct:legacy.materials.precinctPaving,stone:legacy.materials.flagstoneMat,edge:stairFace,earth,
    senbon:new THREE.MeshStandardMaterial({map:paving,roughness:.91}),
    street:new THREE.MeshStandardMaterial({color:0x636862,roughness:1}),
    restricted:new THREE.MeshStandardMaterial({color:0x766e5e,roughness:1}),
    rail:new THREE.MeshStandardMaterial({color:0x5b6667,metalness:.7,roughness:.4})};
  for(const [key,vertices] of Object.entries(buckets)){
    if(!vertices.length)continue;
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geo.computeVertexNormals();
    const uv=key==='senbon'?senbonUV:[];
    if(key!=='senbon')for(let i=0;i<vertices.length;i+=3){
      const n=i/3,normal=geo.attributes.normal;
      if(Math.abs(normal.getY(n))>.5)uv.push(vertices[i]/2,vertices[i+2]/2);
      else uv.push((Math.abs(normal.getX(n))>.5?vertices[i+2]:vertices[i])/2,vertices[i+1]/2);
    }
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    const material=materials[key].clone();material.side=THREE.DoubleSide;
    group.add(spatialMeshes(geo,material));geo.dispose();
  }
  return group;
}
