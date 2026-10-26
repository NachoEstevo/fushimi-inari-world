import * as THREE from 'three/webgpu';
import {Fn,If,float,vec4,uniform,texture,positionWorld,normalWorldGeometry,materialColor,dot,smoothstep} from 'three/tsl';

const MODES={day:[-45/65,35/65],gold:[-65/8,35/8],night:[-45/65,35/65]};
const validBounds=box=>box?.isBox3&&!box.isEmpty()&&[...box.min,...box.max].every(Number.isFinite);
const boxOf=value=>value?.bounds??value;

// Snapshot only the caller's already-known foliage/roof meshes. Instances are
// kept separate: a forest batch's aggregate box would shade the empty court.
// No scene traversal, render-target allocation, lights or shadow pass is used.
export function collectPrecinctLeafBounds(objects,{region,maxInstances=8192,maxHorizontalSpan=Infinity}={}){
  const result=[],matrix=new THREE.Matrix4(),instance=new THREE.Matrix4();
  let inspected=0,truncated=false,skippedDegenerate=0,skippedOversized=0;
  for(const object of objects){
    if(!object?.isMesh||!object.geometry?.attributes?.position)continue;
    const geometry=object.geometry;
    if(!geometry.boundingBox)geometry.computeBoundingBox();
    if(!validBounds(geometry.boundingBox))continue;
    object.updateWorldMatrix(true,false);
    const count=object.isInstancedMesh?object.count:1;
    for(let i=0;i<count;i++){
      if(inspected++>=maxInstances){truncated=true;break;}
      matrix.copy(object.matrixWorld);
      if(object.isInstancedMesh){
        object.getMatrixAt(i,instance);
        // Cleared trees use zero-scale matrices and partitionInstances omits
        // them. Keep the atlas aligned with the actual rendered near chunks.
        if(Math.abs(instance.determinant())<1e-12){skippedDegenerate++;continue;}
        matrix.multiply(instance);
      }
      const bounds=geometry.boundingBox.clone().applyMatrix4(matrix);
      if(bounds.max.x-bounds.min.x>maxHorizontalSpan||bounds.max.z-bounds.min.z>maxHorizontalSpan){skippedOversized++;continue;}
      if(!region||bounds.intersectsBox(region))result.push(bounds);
    }
    if(truncated)break;
  }
  return {bounds:result,inspected:Math.min(inspected,maxInstances),truncated,skippedDegenerate,skippedOversized};
}

// Static material batches can contain unrelated roofs on opposite sides of a
// court. Their enclosing box has no roof ownership in the gap, so omit it rather
// than claiming shelter there. This intentionally leaves those roof exclusions
// incomplete until individual source bounds are available. A large standalone
// geometry may also be a merged shell; reject its broad approximation. Ordinary
// instanced roof elements still contribute one bounded exclusion per instance.
export function collectPrecinctRoofBounds(objects,{region,maxInstances=2048,maxHorizontalSpan=30}={}){
  const accepted=[];let skippedAggregate=0;
  for(const object of objects){
    if(object?.userData?.staticSector&&!object.isInstancedMesh){skippedAggregate++;continue;}
    accepted.push(object);
  }
  return {...collectPrecinctLeafBounds(accepted,{region,maxInstances,maxHorizontalSpan}),skippedAggregate};
}

function leafPattern(size){
  let seed=64197;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const leaves=[];
  // Paired leaves follow short sprays, leaving irregular patches of sun.
  for(let spray=0;spray<9;spray++){
    const cx=random(),cy=random(),heading=random()*Math.PI*2;
    for(let pair=0;pair<4;pair++)for(const side of [-1,1]){
      const along=(pair-1.5)*.065,across=side*(.026+pair*.002),angle=heading+side*.68;
      leaves.push({x:cx+Math.cos(heading)*along-Math.sin(heading)*across,
        y:cy+Math.sin(heading)*along+Math.cos(heading)*across,c:Math.cos(angle),s:Math.sin(angle),rx:.035+random()*.013,ry:.013+random()*.008});
    }
  }
  const alpha=new Uint8Array(size*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    let coverage=0;
    for(const leaf of leaves){
      const dx=((x+.5)/size-leaf.x+2.5)%1-.5,dy=((y+.5)/size-leaf.y+2.5)%1-.5;
      const u=(dx*leaf.c+dy*leaf.s)/leaf.rx,v=(-dx*leaf.s+dy*leaf.c)/leaf.ry;
      const edge=Math.max(0,Math.min(1,(1-u*u-v*v)*2));
      coverage=Math.max(coverage,edge*edge*(3-2*edge));
    }
    alpha[y*size+x]=Math.round(coverage*255);
  }
  return alpha;
}

// A fixed, sun-aligned canopy atlas plus a small repeating leaf silhouette.
// Crown bounds restrict coverage to real rendered trees; leaves/penumbra and
// box-shaped roof exclusions remain artistic approximations, not ray shadows.
export function installPrecinctLeafLight({canopies=[],roofs=[],materials=[]}={},
  {size=128,strength=.36,enabled=true,mode='day',leafScale=.26}={}){
  if(!Number.isInteger(size)||size<32||size>128)throw new RangeError('Atlas size must be 32 to 128');
  if(!Number.isFinite(strength)||strength<0||strength>.5)throw new RangeError('Leaf shade strength must be 0 to 0.5');
  if(!Number.isFinite(leafScale)||leafScale<=0)throw new RangeError('Leaf scale must be positive');
  if(!Object.hasOwn(MODES,mode))throw new RangeError('Unknown leaf light mode');
  const crowns=canopies.map(boxOf).filter(validBounds).map(b=>b.clone());
  const covers=roofs.map(boxOf).filter(validBounds).map(b=>b.clone());
  const pixels=new Uint8Array(size*size*4),alpha=leafPattern(size);
  for(let i=0;i<alpha.length;i++)pixels[i*4+3]=alpha[i];
  const atlas=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);
  atlas.name='Bounded precinct canopy and artistic leaf silhouette';
  atlas.colorSpace=THREE.NoColorSpace;atlas.wrapS=atlas.wrapT=THREE.RepeatWrapping;
  atlas.magFilter=THREE.LinearFilter;atlas.minFilter=THREE.LinearFilter;
  // Height and roof IDs must not bleed through downsampled mip levels.
  atlas.generateMipmaps=false;
  const amount=uniform(0),slope=uniform(new THREE.Vector2()),sun=uniform(new THREE.Vector3());
  const extent=uniform(new THREE.Vector4()),height=uniform(new THREE.Vector2());
  const attached=new Map();let disposed=false,buildMs=0,rebuilds=0,bounds=null;
  const projected=box=>{
    const sx=slope.value.x,sz=slope.value.y;
    return {xmin:box.min.x-Math.max(sx*box.min.y,sx*box.max.y),xmax:box.max.x-Math.min(sx*box.min.y,sx*box.max.y),
      zmin:box.min.z-Math.max(sz*box.min.y,sz*box.max.y),zmax:box.max.z-Math.min(sz*box.min.y,sz*box.max.y),y:box.max.y};
  };
  function rebuild(){
    const start=performance.now(),[sx,sz]=MODES[mode];slope.value.set(sx,sz);sun.value.set(sx,1,sz).normalize();
    for(let i=0;i<pixels.length;i+=4)pixels[i]=pixels[i+1]=pixels[i+2]=0;
    const patches=crowns.map(projected),roofPatches=covers.map(projected);
    const all=[...crowns,...covers];
    const low=all.length?Math.min(...all.map(b=>b.min.y))-1:0,high=all.length?Math.max(...all.map(b=>b.max.y))+1:1;
    height.value.set(low,1/Math.max(1,high-low));
    if(patches.length){
      bounds={xmin:Math.min(...patches.map(p=>p.xmin))-1,xmax:Math.max(...patches.map(p=>p.xmax))+1,
        zmin:Math.min(...patches.map(p=>p.zmin))-1,zmax:Math.max(...patches.map(p=>p.zmax))+1};
      const dx=bounds.xmax-bounds.xmin,dz=bounds.zmax-bounds.zmin;
      extent.value.set(bounds.xmin,bounds.zmin,1/dx,1/dz);
      const raster=(patch,roof)=>{
        const x0=Math.max(0,Math.floor((patch.xmin-bounds.xmin)/dx*size)),x1=Math.min(size-1,Math.ceil((patch.xmax-bounds.xmin)/dx*size));
        const z0=Math.max(0,Math.floor((patch.zmin-bounds.zmin)/dz*size)),z1=Math.min(size-1,Math.ceil((patch.zmax-bounds.zmin)/dz*size));
        const cx=(patch.xmin+patch.xmax)/2,cz=(patch.zmin+patch.zmax)/2,rx=Math.max(.1,(patch.xmax-patch.xmin)/2),rz=Math.max(.1,(patch.zmax-patch.zmin)/2);
        const encoded=Math.max(1,Math.min(255,Math.round((patch.y-low)*height.value.y*255)));
        for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){
          const wx=bounds.xmin+(x+.5)/size*dx,wz=bounds.zmin+(z+.5)/size*dz,i=(z*size+x)*4;
          if(roof){if(wx>=patch.xmin&&wx<=patch.xmax&&wz>=patch.zmin&&wz<=patch.zmax)pixels[i+2]=Math.max(pixels[i+2],encoded);continue;}
          const radial=Math.hypot((wx-cx)/rx,(wz-cz)/rz),t=Math.max(0,Math.min(1,(1-radial)/.28));
          const coverage=Math.round(t*t*(3-2*t)*255);
          pixels[i]=Math.max(pixels[i],coverage);if(coverage)pixels[i+1]=Math.max(pixels[i+1],encoded);
        }
      };
      patches.forEach(p=>raster(p,false));roofPatches.forEach(p=>raster(p,true));
    }else{bounds=null;extent.value.set(0,0,1,1);}
    atlas.needsUpdate=true;amount.value=enabled&&mode!=='night'&&bounds?strength*(mode==='gold'?.8:1):0;
    rebuilds++;buildMs=performance.now()-start;
  }
  const attenuation=Fn(()=>{
    const shade=float(0).toVar(),q=positionWorld.xz.sub(slope.mul(positionWorld.y)),uv=q.sub(extent.xy).mul(extent.zw);
    const inside=uv.x.greaterThan(0).and(uv.x.lessThan(1)).and(uv.y.greaterThan(0)).and(uv.y.lessThan(1)).and(amount.greaterThan(0));
    If(inside,()=>{
      const field=texture(atlas,uv),encodedY=positionWorld.y.sub(height.x).mul(height.y);
      const belowCrown=float(1).sub(smoothstep(field.g.sub(.012),field.g,encodedY));
      const sheltered=field.b.greaterThan(0).and(encodedY.lessThan(field.b.sub(.006)));
      If(sheltered.not(),()=>{
        const facing=smoothstep(-.05,.55,dot(normalWorldGeometry,sun));
        shade.assign(field.r.mul(texture(atlas,q.mul(leafScale)).a).mul(belowCrown).mul(facing).mul(amount));
      });
    });
    return float(1).sub(shade);
  })();
  function attach(material){
    if(disposed)throw new Error('Leaf light is disposed');
    if(!material?.isNodeMaterial)throw new TypeError('Leaf light requires a node material');
    if(attached.has(material))return;
    const original=material.colorNode,base=vec4(original??materialColor),node=vec4(base.rgb.mul(attenuation),base.a);
    attached.set(material,{original,node});material.colorNode=node;material.needsUpdate=true;
  }
  rebuild();materials.forEach(attach);
  return {texture:atlas,attach,
    get stats(){return {enabled,mode,strength:amount.value,canopies:crowns.length,roofs:covers.length,materials:attached.size,
      sourceBytes:pixels.byteLength,textureSamples:2,extraDraws:0,extraLights:0,buildMs,rebuilds,bounds:bounds?{...bounds}:null,disposed,
      provenance:'Artistic leaf silhouettes restricted by rendered crown bounds; conservative projected roof boxes; not actual canopy shadows'};},
    update(){},
    setMode(next){if(disposed)return;if(!Object.hasOwn(MODES,next))throw new RangeError('Unknown leaf light mode');if(mode===next)return;mode=next;rebuild();},
    setEnabled(value){if(disposed)return;enabled=Boolean(value);amount.value=enabled&&mode!=='night'&&bounds?strength*(mode==='gold'?.8:1):0;},
    dispose(){if(disposed)return;disposed=true;for(const [material,{original,node}]of attached)if(material.colorNode===node){material.colorNode=original;material.needsUpdate=true;}attached.clear();atlas.dispose();}
  };
}
