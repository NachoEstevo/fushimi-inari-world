import * as THREE from 'three';

// Supplied June 2012 Street View supplies the banner wording and stone-foot
// appearance. Sizes are visual estimates. The torii inscription is inferred
// from the shrine identity because the small reference plaque is not legible.
export function buildAzumamaroSignage(root, features, surfaces, materials, colliders = []) {
  const marker = features.pois.find(p => p.id === 'node/10964871774');
  if (!marker) return null;
  const [mx, , mz] = marker.point;
  const group = new THREE.Group();
  group.name = 'Azumamaro prayer reception banner and marker footing';
  root.add(group);
  const frame = new THREE.MeshStandardMaterial({color:'#85877d', metalness:.65, roughness:.61});
  const white = new THREE.MeshStandardMaterial({color:'#eeeee5', roughness:.94});
  const stone = materials.entryStoneMat || new THREE.MeshStandardMaterial({color:'#777b6c',roughness:1});
  const box = (w,h,d,x,y,z,mat,parent=group) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;
    parent.add(mesh);return mesh;
  };
  // Banner stands on the gravel shoulder beside the pillar, outside the
  // central approach. Individual legs reach terrain rather than slab height.
  const x=mx+.63,z=mz-.12,base=surfaces.terrainHeight(x,z),width=.49;
  box(width,1.85,.035,x,base+1.20,z,white);
  for (const side of [-1,1]) {
    const lx=x+side*(width/2+.015),ground=surfaces.terrainHeight(lx,z);
    box(.019,base+2.16-ground,.027,lx,(ground+base+2.16)/2,z,frame);
    box(.035,.035,.40,lx,ground+.025,z+.04,frame);
    // Short rear brace gives a believable freestanding A-frame support.
    const brace = box(.016,.95,.016,lx,ground+.48,z+.19,frame);
    brace.rotation.x=-.29;
  }
  box(width+.045,.019,.027,x,base+2.14,z,frame);
  box(width+.045,.019,.027,x,base+.265,z,frame);
  const texture = (w,h,draw) => {
    if (typeof document === 'undefined') return null;
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d');if(!ctx)return null;
    draw(ctx,w,h);
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    map.anisotropy=4;return map;
  };
  const vertical = (ctx,text,cx,top,size,step=size) => {
    ctx.font=`${size}px "Yu Mincho", "Noto Serif CJK JP", serif`;
    [...text].forEach((character,i)=>ctx.fillText(character,cx,top+i*step));
  };
  const banner=texture(384,1408,(ctx,w,h)=>{
    ctx.fillStyle='#f4f3ec';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#262b29';ctx.textAlign='center';
    vertical(ctx,'勉学向上',284,108,63,69);
    vertical(ctx,'受験合格',173,108,63,69);
    vertical(ctx,'祈願受付',260,455,112,157);
    vertical(ctx,'東丸神社社務所',72,620,42,66);
  });
  if(banner){
    const face=new THREE.Mesh(new THREE.PlaneGeometry(width-.025,1.81),new THREE.MeshStandardMaterial({map:banner,roughness:.94}));
    face.position.set(x,base+1.20,z-.019);face.rotation.y=Math.PI;
    face.name='Reference wording: prayer reception banner';group.add(face);
  }
  // Rough low stones visible around the marker pedestal; do not raise or
  // replace any walking surface. Shapes and arrangement are inferred.
  for(const [ox,oz,sx,sy,sz,angle] of [[-.21,-.12,.22,.13,.18,.4],[.18,-.20,.20,.11,.17,1.2],[-.10,.20,.21,.10,.16,2.1]]){
    const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),stone);
    rock.position.set(mx+ox,surfaces.terrainHeight(mx+ox,mz+oz)+sy*.50,mz+oz);
    rock.scale.set(sx,sy,sz);rock.rotation.set(.16,angle,.20);
    rock.castShadow=rock.receiveShadow=true;rock.name='Low irregular marker foundation stone';group.add(rock);
  }
  let gate=null;
  root.traverse(object=>{if(object.name==='Azumamaro entrance torii (visually inferred station)')gate=object;});
  const plaque=texture(256,512,(ctx,w,h)=>{
    ctx.fillStyle='#252923';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#bba363';ctx.lineWidth=9;ctx.strokeRect(10,10,w-20,h-20);
    ctx.lineWidth=2;ctx.strokeRect(22,22,w-44,h-44);
    ctx.fillStyle='#bca46b';ctx.textAlign='center';
    vertical(ctx,'東丸神社',w/2,118,75,101);
  });
  if(gate&&plaque){
    const face=new THREE.Mesh(new THREE.PlaneGeometry(.44,.59),new THREE.MeshStandardMaterial({map:plaque,roughness:.77}));
    face.position.set(0,3.27,-.263);face.rotation.y=Math.PI;
    face.name='Azumamaro torii inscription (inferred shrine identity)';gate.add(face);
    face.userData.provenance='東丸神社 inferred from shrine identity; reference plaque lettering unreadable';
  }
  colliders.push({type:'box',args:[x,z,.27,.24,0,base,base+2.16,'azumamaro_prayer_banner']});
  const metadata={bannerCenter:[x,base,z],bannerText:'勉学向上 受験合格 祈願受付 東丸神社社務所',
    provenance:'Supplied June 2012 Street View banner and low marker stones; unmeasured geometry',
    plaqueInscription:'東丸神社',plaqueInscriptionInferred:true,plaqueApplied:Boolean(gate&&plaque)};
  group.userData.provenance=metadata;
  return metadata;
}
