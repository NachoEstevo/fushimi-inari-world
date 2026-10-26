import * as THREE from 'three';
import {panoramaVisible,panoramaBuildingCandidates,outlooks} from './panorama-policy.mjs';

export const CITY_PANORAMA_MAX_TRIANGLES=24000;

// OSM outlines stay authoritative. Window rhythm and facade colour are inferred.
// Build once on first arrival; retain GPU buffers, but submit no draws outside
// the outlook zones. One texture/material and spatial chunks, no extra shadows.
export function installCityPanorama(scene,features,ground,excludes,{yieldWork=()=>globalThis.scheduler?.yield?.()??new Promise(resolve=>setTimeout(resolve,0)),now=()=>performance.now()}={}){
  const root=new THREE.Group();root.name='Lookout city facades';root.visible=false;scene.add(root);
  let built=false,count=0,triangles=0,pending=null,automaticAttempted=false,wanted=false;
  const stats={status:'idle',built:false,buildings:0,triangles:0,cpuMs:0,maxSliceMs:0,yields:0,error:null,stage:'idle',cpuByStage:{},maxSliceByStage:{}};
  const report=()=>{document.body.dataset.panoramaDetail=JSON.stringify({active:root.visible,...stats});};
  async function build(){
    let sliceStart=now(),lastReport=-Infinity,texture,material,staged;
    const checkpoint=async()=>{
      stats.yields++;
      if(now()-lastReport>=100){report();lastReport=now();}
      const elapsed=now()-sliceStart;stats.cpuMs+=elapsed;stats.maxSliceMs=Math.max(stats.maxSliceMs,elapsed);stats.cpuByStage[stats.stage]=(stats.cpuByStage[stats.stage]??0)+elapsed;stats.maxSliceByStage[stats.stage]=Math.max(stats.maxSliceByStage[stats.stage]??0,elapsed);
      await yieldWork();sliceStart=now();
    };
    try{
    // Start outside the menu/input event that requested preparation.
    await checkpoint();
    const runs=[];
    for(let i=0;i<features.buildings.length;i+=128){
      runs.push(panoramaBuildingCandidates(features.buildings.slice(i,i+128)).map(b=>{
        const ring=b.points.slice(0,-1),x=ring.reduce((sum,p)=>sum+p[0],0)/ring.length,z=ring.reduce((sum,p)=>sum+p[2],0)/ring.length;
        return {b,distance:Math.min(...outlooks.map(([ox,,oz])=>(x-ox)**2+(z-oz)**2))};
      }));
      await checkpoint();
    }
    // Stable bottom-up merge keeps source tie ordering without one large sort.
    while(runs.length>1){
      const next=[];
      for(let r=0;r<runs.length;r+=2){
        if(!runs[r+1]){next.push(runs[r]);continue;}
        const a=runs[r],b=runs[r+1],merged=[];let i=0,j=0;
        while(i<a.length||j<b.length){
          merged.push(j>=b.length||(i<a.length&&a[i].distance<=b[j].distance)?a[i++]:b[j++]);
          if(merged.length%512===0)await checkpoint();
        }
        next.push(merged);
      }
      runs.splice(0,runs.length,...next);await checkpoint();
    }
    const candidates=runs[0]??[];await checkpoint();stats.stage='buildings';
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#d0cec5';ctx.fillRect(0,0,128,128);
    ctx.fillStyle='#777f7f';ctx.fillRect(27,35,70,49);
    ctx.fillStyle='#a7b3b2';ctx.fillRect(30,38,29,43);
    ctx.fillStyle='#d6d3c9';ctx.fillRect(61,35,3,49);
    ctx.fillStyle='#a9a89f';ctx.fillRect(22,86,80,4);
    texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    let vertices=[];const uv=[],colors=[];let budgetTriangles=0,stagedCount=0,processed=0;
    for(const {b}of candidates){
      if(processed++%24===0||now()-sliceStart>=4)await checkpoint();
      if(stagedCount>=1800)break;
      const tags=b.tags??{};
      if(excludes(b)||tags.religion==='shinto'||tags.building==='shrine'||tags.amenity==='place_of_worship')continue;
      const ring=b.points.slice(0,-1);if(ring.length<3)continue;
      const cx=ring.reduce((s,p)=>s+p[0],0)/ring.length;
      if(cx>450)continue;
      const heights=ring.map(p=>ground(p[0],p[2])),base=Math.min(...heights);
      if(!heights.every(Number.isFinite)||base>100)continue;
      const h=parseFloat(tags.height),levels=parseFloat(tags['building:levels']);
      const roof=Math.max(...heights)+(Number.isFinite(h)&&h>0?h:Number.isFinite(levels)&&levels>0?levels*3:6);
      const roofFaces=THREE.ShapeUtils.triangulateShape(ring.map(p=>new THREE.Vector2(p[0],p[2])),[]);
      const wallEdges=ring.filter((a,i)=>{const c=ring[(i+1)%ring.length];return Math.hypot(c[0]-a[0],c[2]-a[2])>=.5;}).length;
      const buildingTriangles=wallEdges*2+roofFaces.length;
      if(!roofFaces.length||budgetTriangles+buildingTriangles>CITY_PANORAMA_MAX_TRIANGLES)continue;
      budgetTriangles+=buildingTriangles;
      const shade=.78+((stagedCount*37)%23)/100;
      for(let i=0;i<ring.length;i++){
        const a=ring[i],c=ring[(i+1)%ring.length],len=Math.hypot(c[0]-a[0],c[2]-a[2]);
        if(len<.5)continue;
        const q=[[a[0],base,a[2]],[c[0],base,c[2]],[c[0],roof,c[2]],[a[0],roof,a[2]]];
        const st=[[0,0],[len/3,0],[len/3,(roof-base)/3],[0,(roof-base)/3]];
        for(const j of [0,1,2,0,2,3]){vertices.push(...q[j]);uv.push(...st[j]);colors.push(shade,shade*.98,shade*.94);}
      }
      // Close the exact source footprint at the already-authored roof datum.
      // A constant facade-background texel avoids painting windows on roofs.
      for(const face of roofFaces)for(const index of face){
        const p=ring[index];vertices.push(p[0],roof,p[2]);uv.push(1/128,1/128);
        colors.push(shade*.70,shade*.69,shade*.66);
      }
      stagedCount++;
    }
    await checkpoint();
    stats.stage='partition';
    material=new THREE.MeshLambertMaterial({map:texture,vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
    // Partition complete triangles incrementally, retaining the same 256m cells
    // and attribute values. Flat normals match computeVertexNormals on this
    // nonindexed wall/roof mesh without a single full-world normal pass.
    vertices=new Float32Array(vertices);
    const buckets=new Map();
    for(let i=0;i<vertices.length;i+=9){
      const x=(vertices[i]+vertices[i+3]+vertices[i+6])/3,z=(vertices[i+2]+vertices[i+5]+vertices[i+8])/3,key=`${Math.floor(x/256)},${Math.floor(z/256)}`;
      if(!buckets.has(key))buckets.set(key,{position:[],uv:[],color:[],normal:[],min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]});
      const bucket=buckets.get(key),ax=vertices[i+6]-vertices[i+3],ay=vertices[i+7]-vertices[i+4],az=vertices[i+8]-vertices[i+5],bx=vertices[i]-vertices[i+3],by=vertices[i+1]-vertices[i+4],bz=vertices[i+2]-vertices[i+5];
      let nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;const length=Math.hypot(nx,ny,nz)||1;nx/=length;ny/=length;nz/=length;
      for(let j=0;j<3;j++){
        const offset=i+j*3;bucket.position.push(vertices[offset],vertices[offset+1],vertices[offset+2]);bucket.color.push(colors[offset],colors[offset+1],colors[offset+2]);
        const u=offset/3*2;bucket.uv.push(uv[u],uv[u+1]);bucket.normal.push(nx,ny,nz);
        for(let axis=0;axis<3;axis++){bucket.min[axis]=Math.min(bucket.min[axis],vertices[offset+axis]);bucket.max[axis]=Math.max(bucket.max[axis],vertices[offset+axis]);}
      }
      if(i%(9*256)===0||now()-sliceStart>=4)await checkpoint();
    }
    await checkpoint();stats.stage='buffers';
    staged=new THREE.Group();
    for(const bucket of buckets.values()){
      const geometry=new THREE.BufferGeometry();
      for(const [attribute,size]of [['position',3],['uv',2],['color',3],['normal',3]])geometry.setAttribute(attribute,new THREE.Float32BufferAttribute(bucket[attribute],size));
      const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=false;staged.add(mesh);
      const center=new THREE.Vector3(...bucket.min.map((value,i)=>(value+bucket.max[i])/2));let radius2=0;
      for(let i=0;i<bucket.position.length;i+=3){radius2=Math.max(radius2,(bucket.position[i]-center.x)**2+(bucket.position[i+1]-center.y)**2+(bucket.position[i+2]-center.z)**2);if(i%(3*512)===0)await checkpoint();}
      geometry.boundingSphere=new THREE.Sphere(center,Math.sqrt(radius2));
      await checkpoint();
    }
    // The only scene mutation is the complete, budgeted result. No partial city
    // or incomplete shells become visible while preparation yields.
    root.add(staged);root.userData.panoramaGeometryVersion=(root.userData.panoramaGeometryVersion??0)+1;
    count=stagedCount;triangles=vertices.length/9;built=true;root.visible=wanted;
    Object.assign(stats,{status:'ready',built:true,buildings:count,triangles,error:null});
    const elapsed=now()-sliceStart;stats.cpuMs+=elapsed;stats.maxSliceMs=Math.max(stats.maxSliceMs,elapsed);stats.cpuByStage[stats.stage]=(stats.cpuByStage[stats.stage]??0)+elapsed;stats.maxSliceByStage[stats.stage]=Math.max(stats.maxSliceByStage[stats.stage]??0,elapsed);stats.stage='ready';report();
    return root;
    }catch(error){
      if(staged?.parent===root)root.remove(staged);
      staged?.traverse(object=>object.geometry?.dispose());material?.dispose();texture?.dispose();
      built=false;count=0;triangles=0;
      Object.assign(stats,{status:'failed',built:false,buildings:0,triangles:0,error:String(error.message??error)});root.visible=false;report();throw error;
    }
  }
  function prepare(){
    if(built)return Promise.resolve(root);
    if(pending)return pending;
    Object.assign(stats,{status:'preparing',cpuMs:0,maxSliceMs:0,yields:0,error:null,stage:'candidates',cpuByStage:{},maxSliceByStage:{}});
    pending=build().finally(()=>{pending=null;});return pending;
  }

  let horizonPass=null;
  return {prepare,stats,group:root,createHorizonPass({renderer,camera}){
    return horizonPass??=import('./city-horizon-pass.mjs').then(({createCityHorizonPass})=>createCityHorizonPass({renderer,worldScene:scene,root,camera}));
  },update(camera,enabled){
    wanted=panoramaVisible(camera.position,wanted,enabled);
    if(wanted&&!built&&!automaticAttempted){automaticAttempted=true;prepare().catch(()=>{});}
    const active=wanted&&built;
    if(root.visible!==active||!document.body.dataset.panoramaDetail){root.visible=active;report();}
    else root.visible=active;
  }};
}
