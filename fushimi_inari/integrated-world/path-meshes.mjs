import * as THREE from 'three';
import {spatialMeshes} from './spatial-mesh.mjs';
import {pathOffset} from './path-frame.mjs?v=10';
import {fineGranite} from './surface-materials.mjs';
import {omotesandoPaving} from './omotesando-paving.mjs';
import {outsideArrival} from './okusha-arrival.mjs';
import {isMountainPathSegment,mountainShoulder,mountainPathUV,mountainTreadUV} from './mountain-path-layout.mjs';
import {mountainPathMaterials} from './mountain-path-materials.mjs';

export function buildPathMeshes(network,legacy,ground){
  const group=new THREE.Group(),buckets={stone:[],earth:[],street:[],restricted:[],edge:[],rail:[],senbon:[],precinct:[],omotesando:[],mountainPaving:[],mountainTread:[],mountainRiser:[],mountainRetaining:[]};
  const uvBuckets={senbon:[],omotesando:[],mountainPaving:[],mountainTread:[],mountainRetaining:[]};
  const uvByVertices=new Map(Object.entries(uvBuckets).map(([key,uv])=>[buckets[key],uv]));
  const detail={segments:0,treads:0,groundedShoulders:0,retainingFaces:0,scope:'Mountain stone paths east of x=255 m; entrance and Senbon unchanged'};
  const quad=(out,a,b,c,d)=>{
    for(const polygon of outsideArrival([a,b,c,d]))for(let i=1;i<polygon.length-1;i++)for(const p of [polygon[0],polygon[i+1],polygon[i]]){
      out.push(...p.slice(0,3));const uv=uvByVertices.get(out);if(uv)uv.push(p[3],p[4]);
    }
  };
  for(const [index,s] of network.segments.entries()){
    const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],len=Math.hypot(dx,dz);
    const adjacent=(candidate,end)=>candidate?.id===s.id&&Math.hypot(candidate[end][0]-(end==='b'?s.a:s.b)[0],candidate[end][2]-(end==='b'?s.a:s.b)[2])<.001?candidate:null;
    const startNormal=pathOffset(s.a,s.b,adjacent(network.segments[index-1],'b'));
    const endNormal=pathOffset(s.a,s.b,adjacent(network.segments[index+1],'a'),true);
    const point=(p,y,offset)=>{const n=p===s.a?startNormal:endNormal;return [p[0]+n[0]*offset,y,p[2]+n[1]*offset];};
    const senbon=['way/260121328','way/377968455'].includes(s.id);
    const mountain=isMountainPathSegment(s);
    if(mountain){detail.segments++;if(s.stair)detail.treads++;}
    if(s.accessJunctionTriangles){
      // The two near-precinct junction patches remove overlapping ribbons.
      // Walking reads these same triangles; keep the existing material/cell
      // batches instead of layering a second decal or an extra draw object.
      const bucket=s.kind==='stone'&&s.ya<55&&s.a[0]>-140&&s.a[0]<120&&Math.abs(s.a[2])<85?'precinct':s.kind;
      buckets[bucket].push(...s.accessJunctionTriangles);
    }else if(senbon){
      const w=.66;
      const va=s.distance/.65,vb=(s.distance+len)/.65;
      quad(buckets.senbon,[...point(s.a,s.ya,-w),0,va],[...point(s.b,s.yb,-w),0,vb],[...point(s.b,s.yb,w),1,vb],[...point(s.a,s.ya,w),1,va]);
      for(const side of [-1,1])quad(buckets.earth,point(s.a,s.ya,side*w),point(s.b,s.yb,side*w),point(s.b,s.yb,side*s.width/2),point(s.a,s.ya,side*s.width/2));
    }else if(s.id==='way/105449722'&&!s.stair){
      const u=s.width/1.6,va=s.distance/3.2,vb=(s.distance+len)/3.2;
      quad(buckets.omotesando,[...point(s.a,s.ya,-s.width/2),0,va],[...point(s.b,s.yb,-s.width/2),0,vb],[...point(s.b,s.yb,s.width/2),u,vb],[...point(s.a,s.ya,s.width/2),u,va]);
    }else if(mountain){
      const uv=s.stair?mountainTreadUV(s):mountainPathUV(s,len);
      const corners=[point(s.a,s.ya,-s.width/2),point(s.b,s.yb,-s.width/2),point(s.b,s.yb,s.width/2),point(s.a,s.ya,s.width/2)];
      quad(buckets[s.stair?'mountainTread':'mountainPaving'],...corners.map((p,i)=>[...p,...uv[i]]));
    }else quad(buckets[s.stair&&s.kind==='stone'?'edge':s.kind==='stone'&&s.ya<55&&s.a[0]>-140&&s.a[0]<120&&Math.abs(s.a[2])<85?'precinct':s.kind],point(s.a,s.ya,-s.width/2),point(s.b,s.yb,-s.width/2),point(s.b,s.yb,s.width/2),point(s.a,s.ya,s.width/2));
    if(s.stair){
      const p=s.riserAt==='b'?s.b:s.a,y=s.riserAt==='b'?s.yb:s.ya;
      quad(buckets[mountain?'mountainRiser':'edge'],point(p,y-s.rise,-s.width/2),point(p,y,-s.width/2),point(p,y,s.width/2),point(p,y-s.rise,s.width/2));
    }
    if(s.kind==='stone'){
      for(const side of [-1,1]){
        const inner=side*s.width/2,outer=inner+side*.13;
        // Open only mapped, connected junction mouths; never infer a junction
        // from a projected crossing or a neighbouring parallel trail.
        const cuts=Math.max(1,Math.ceil(len/(mountain ? .9 : .45)));
        const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
        for(let part=0;part<cuts;part++){
          const a=lerp(point(s.a,s.ya,inner),point(s.b,s.yb,inner),part/cuts);
          const b=lerp(point(s.a,s.ya,inner),point(s.b,s.yb,inner),(part+1)/cuts);
          const oa=lerp(point(s.a,s.ya,outer),point(s.b,s.yb,outer),part/cuts);
          const ob=lerp(point(s.a,s.ya,outer),point(s.b,s.yb,outer),(part+1)/cuts);
          if(s.accessJunction){
            a[1]=network.accessJunctionEdgeHeight(s,a[0],a[2],a[1]);
            b[1]=network.accessJunctionEdgeHeight(s,b[0],b[2],b[1]);
            oa[1]=a[1];ob[1]=b[1];
          }
          const m=lerp(a,b,.5);
          if(network.edgeCovered(m[0],m[2],m[1],s.id))continue;
          // The longer mountain strips must never span a junction mouth when
          // only their centre falls outside the connected branch. Trim the
          // whole strip conservatively if either end meets that branch.
          if((mountain||s.accessJunction)&&[a,b].some(p=>network.edgeCovered(p[0],p[2],p[1],s.id)))continue;
          const up=(p,h)=>[p[0],p[1]+h,p[2]];
          const lip=s.curbLip??.025;
          const cap=[up(a,lip),up(b,lip),up(ob,lip),up(oa,lip)];
          if(mountain&&side<0)cap.reverse();
          quad(buckets.edge,...cap);
          const foot=p=>[p[0],Math.min(p[1]-.30,ground(p[0],p[2])-.20),p[2]];
          if(mountain){
            const ua=(s.distance+len*part/cuts)/1.4,ub=(s.distance+len*(part+1)/cuts)/1.4;
            const wall=[foot(oa),foot(ob),up(ob,lip),up(oa,lip)].map((p,i)=>[...p,i===0||i===3?ua:ub,p[1]/1.4]);
            if(side>0)wall.reverse();
            quad(buckets.mountainRetaining,...wall);detail.retainingFaces++;
          }else quad(buckets.edge,foot(oa),foot(ob),up(ob,lip),up(oa,lip));
          // Narrow, uneven earth shoulder on mountain paths, below the curb.
          if(s.ya>55&&!senbon){
            const spread=.28+.10*Math.sin(s.distance*1.73+side);
            if(mountain){
              const na=lerp(startNormal,endNormal,part/cuts),nb=lerp(startNormal,endNormal,(part+1)/cuts);
              const shoulder=mountainShoulder(oa,ob,na,nb,side,ground,(x,z)=>Boolean(network.sample(x,z)),spread);
              if(shoulder){quad(buckets.earth,...shoulder);detail.groundedShoulders++;}
            }else{
              const ea=[oa[0]+side*startNormal[0]*spread,oa[1]-.12,oa[2]+side*startNormal[1]*spread];
              const eb=[ob[0]+side*endNormal[0]*spread,ob[1]-.12,ob[2]+side*endNormal[1]*spread];
              if(!network.sample(ea[0],ea[2])&&!network.sample(eb[0],eb[2]))quad(buckets.earth,up(oa,-.08),up(ob,-.08),eb,ea);
            }
          }
        }
        if(s.handrail){
          // Average neighbouring tread elevations at each joint so the rail
          // is continuous rather than a row of disconnected horizontal strips.
          const prev=adjacent(network.segments[index-1],'b');
          const next=adjacent(network.segments[index+1],'a');
          const a=point(s.a,(s.ya+(prev?.yb??s.ya))/2+.84,outer);
          const b=point(s.b,(s.yb+(next?.ya??s.yb))/2+.84,outer);
          const tube=(p,q)=>{
            const nx=startNormal[0]*.025,nz=startNormal[1]*.025;
            const ring=v=>[[v[0]-nx,v[1]-.025,v[2]-nz],[v[0]+nx,v[1]-.025,v[2]+nz],[v[0]+nx,v[1]+.025,v[2]+nz],[v[0]-nx,v[1]+.025,v[2]-nz]];
            const r=ring(p),t=ring(q);
            for(let j=0;j<4;j++)quad(buckets.rail,r[j],t[j],t[(j+1)%4],r[(j+1)%4]);
            quad(buckets.rail,...r);quad(buckets.rail,...t);
          };
          tube(a,b);
          for(const t of [0,1]){
            if(t===0&&prev||t===1&&next&&Math.floor(s.distance/1.8)===Math.floor((s.distance+len)/1.8))continue;
            const p=t?b:a;
            // Two perpendicular faces form a visible support from all views.
            const y=(t?s.yb:s.ya)-.05;
            for(const axis of [0,2]){
              const l=[...p],r=[...p];l[axis]-=.035;r[axis]+=.035;
              quad(buckets.rail,[l[0],y,l[2]],[r[0],y,r[2]],r,l);
            }
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
  const materials={omotesando:omotesandoPaving(),precinct:legacy.materials.precinctPaving,stone:legacy.materials.flagstoneMat,edge:stairFace,earth,
    senbon:new THREE.MeshStandardMaterial({map:paving,roughness:.91}),
    street:new THREE.MeshStandardMaterial({color:0x636862,roughness:1}),
    restricted:new THREE.MeshStandardMaterial({color:0x766e5e,roughness:1}),
    rail:new THREE.MeshStandardMaterial({color:0x5b6667,metalness:.7,roughness:.4}),...mountainPathMaterials(legacy)};
  const riserTint=new THREE.Color('#b9b8af').toArray();
  for(const [key,bucket] of Object.entries(buckets)){
    if(key==='mountainPaving'||key==='mountainRiser')continue;
    // Share the existing material/cell batches. UVs retain the mountain
    // alignment, and a vertex tint darkens only the new mountain risers.
    // White colors leave all original entrance/precinct granite unchanged.
    const sourceKeys=key==='stone'?['stone','mountainPaving']:key==='edge'?['edge','mountainRiser']:[key];
    const vertices=sourceKeys.length===1?bucket:sourceKeys.flatMap(source=>buckets[source]);
    if(!vertices.length)continue;
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geo.computeVertexNormals();
    const uv=[],colors=key==='edge'?[]:null;
    let offset=0;
    for(const source of sourceKeys){
      const end=offset+buckets[source].length;
      if(uvBuckets[source])for(const value of uvBuckets[source])uv.push(value);
      else for(let i=offset;i<end;i+=3){
        const n=i/3,normal=geo.attributes.normal;
        if(Math.abs(normal.getY(n))>.5)uv.push(vertices[i]/2,vertices[i+2]/2);
        else uv.push((Math.abs(normal.getX(n))>.5?vertices[i+2]:vertices[i])/2,vertices[i+1]/2);
      }
      if(colors){const tint=source==='mountainRiser'?riserTint:[1,1,1];for(let i=offset;i<end;i+=3)colors.push(...tint);}
      offset=end;
    }
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    const material=materials[key].clone();material.side=THREE.DoubleSide;
    if(colors){geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));material.vertexColors=true;}
    group.add(spatialMeshes(geo,material));geo.dispose();
  }
  group.userData.mountainPaths=detail;
  if(network.accessJunctions)group.userData.accessJunctions=network.accessJunctions;
  document.body.dataset.mountainPaths=JSON.stringify(detail);
  return group;
}
