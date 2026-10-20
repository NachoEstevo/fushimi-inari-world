import * as THREE from 'three';

export function buildPathMeshes(network,legacy){
  const group=new THREE.Group(),buckets={stone:[],earth:[],street:[],restricted:[],edge:[],rail:[],senbon:[]},senbonUV=[];
  const quad=(out,a,b,c,d)=>out.push(...a,...c,...b,...a,...d,...c);
  for(const s of network.segments){
    const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
    const point=(p,y,offset)=>[p[0]+nx*offset,y,p[2]+nz*offset];
    const senbon=['way/260121328','way/377968455'].includes(s.id);
    if(senbon){
      const w=.66;
      quad(buckets.senbon,point(s.a,s.ya,-w),point(s.b,s.yb,-w),point(s.b,s.yb,w),point(s.a,s.ya,w));
      const va=s.distance/.65,vb=(s.distance+len)/.65;
      senbonUV.push(0,va,1,vb,0,vb,0,va,1,va,1,vb);
      for(const side of [-1,1])quad(buckets.earth,point(s.a,s.ya,side*w),point(s.b,s.yb,side*w),point(s.b,s.yb,side*s.width/2),point(s.a,s.ya,side*s.width/2));
    }else quad(buckets[s.kind],point(s.a,s.ya,-s.width/2),point(s.b,s.yb,-s.width/2),point(s.b,s.yb,s.width/2),point(s.a,s.ya,s.width/2));
    if(s.stair){
      const p=s.riserAt==='b'?s.b:s.a,y=s.riserAt==='b'?s.yb:s.ya;
      quad(buckets.edge,point(p,y-s.rise,-s.width/2),point(p,y,-s.width/2),point(p,y,s.width/2),point(p,y-s.rise,s.width/2));
    }
    if(s.kind==='stone'){
      for(const side of [-1,1]){
        const inner=side*s.width/2,outer=inner+side*.13;
        quad(buckets.edge,point(s.a,s.ya+.025,inner),point(s.b,s.yb+.025,inner),point(s.b,s.yb+.025,outer),point(s.a,s.ya+.025,outer));
        quad(buckets.edge,point(s.a,s.ya-.30,outer),point(s.b,s.yb-.30,outer),point(s.b,s.yb+.025,outer),point(s.a,s.ya+.025,outer));
        if(s.handrail){
          const offset=outer+side*.06;
          quad(buckets.rail,point(s.a,s.ya+.82,offset),point(s.b,s.yb+.82,offset),point(s.b,s.yb+.86,offset),point(s.a,s.ya+.86,offset));
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
  const materials={stone:legacy.materials.flagstoneMat,edge:legacy.materials.stoneMat,earth,
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
    const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;group.add(mesh);
  }
  return group;
}
