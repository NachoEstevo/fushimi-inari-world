import * as THREE from 'three';

// Appearance: supplied June 2012 street view. The marker/path fix the frame;
// gate/wall dimensions and extent are inferred, not additional OSM buildings.
export function buildAzumamaroArchitecture(parent, surfaces, colliders, stone, features = null) {
  const timber=new THREE.MeshStandardMaterial({color:'#544b40',roughness:.95});
  const boards=new THREE.MeshStandardMaterial({color:'#655747',roughness:.96});
  const plaster=new THREE.MeshStandardMaterial({color:'#d9d7c9',roughness:.98});
  const tile=new THREE.MeshStandardMaterial({color:'#535b5d',roughness:.81});
  const iron=new THREE.MeshStandardMaterial({color:'#242729',roughness:.7,metalness:.35});
  // Low-contrast grain breaks up the flat wooden doors without extra geometry.
  if(typeof document!=='undefined'){
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;
    const ctx=canvas.getContext('2d');
    if(ctx){
      ctx.fillStyle='#e5dfd2';ctx.fillRect(0,0,128,256);
      for(let i=0;i<150;i++){
        const x=(i*73)%128;
        ctx.strokeStyle=i%3?'rgba(65,53,38,.10)':'rgba(235,229,213,.18)';
        ctx.lineWidth=i%4===0?1.5:.5;ctx.beginPath();ctx.moveTo(x,0);
        ctx.bezierCurveTo(x+2,72,x-3,180,x+1,256);ctx.stroke();
      }
      const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
      for(const mat of [timber,boards]){mat.map=map;mat.bumpMap=map;mat.bumpScale=.004;}
    }
  }
  const architecture=new THREE.Group();architecture.name='Azumamaro roofed timber gate and plaster boundary';parent.add(architecture);
  parent.updateWorldMatrix(true,false);
  const world=(x,z)=>parent.localToWorld(new THREE.Vector3(x,0,z));
  const floor=(x,z)=>{const p=world(x,z);return surfaces.height(p.x,p.z)-parent.position.y;};
  const box=(w,h,d,x,y,z,mat)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;architecture.add(mesh);return mesh;};
  const block=(x,z,w,d,base,top,name)=>{const p=world(x,z);colliders.push({type:'box',args:[p.x,p.z,w/2,d/2,parent.rotation.y,parent.position.y+base,parent.position.y+top,name]});};
  // Shared roof construction uses segmented curved planes and batched round
  // tile ribs. Ridges run across x; the entrance-facing pitch descends to -z.
  const roof=(cx,cz,width,depth,eave,rise,ornate=true)=>{
    const sections=7,ribs=Math.ceil(width/.20), matrices=[];
    const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
    for(const side of [-1,1])for(let s=0;s<sections;s++){
      const t0=s/sections,t1=(s+1)/sections;
      const z0=cz+side*t0*depth/2,z1=cz+side*t1*depth/2;
      const y0=eave+rise*(1-t0)**1.45,y1=eave+rise*(1-t1)**1.45;
      const dz=z1-z0,dy=y1-y0,len=Math.hypot(dz,dy);
      const panel=box(width,.09,len,cx,(y0+y1)/2,(z0+z1)/2,tile);panel.rotation.x=-Math.atan2(dy,dz);
      for(let r=0;r<=ribs;r++){
        dummy.position.set(cx-width/2+r*width/ribs,(y0+y1)/2+.065,(z0+z1)/2);
        dummy.quaternion.setFromUnitVectors(up,new THREE.Vector3(0,dy,dz).normalize());dummy.scale.set(1,len+.035,1);dummy.updateMatrix();matrices.push(dummy.matrix.clone());
      }
    }
    const ribsMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.055,.055,1,7),tile,matrices.length);
    matrices.forEach((matrix,i)=>ribsMesh.setMatrixAt(i,matrix));ribsMesh.castShadow=true;ribsMesh.receiveShadow=true;ribsMesh.name='Batched curved ceramic roof tile ribs';architecture.add(ribsMesh);
    box(width+.10,.16,.24,cx,eave+rise+.10,cz,tile);
    if(ornate)for(let i=0;i<4;i++)box(width-.10-i*.08,.075,.36-i*.035,cx,eave+rise+.19+i*.075,cz,tile);
    for(const side of [-1,1]){
      box(width+.13,.14,.14,cx,eave-.035,cz+side*depth/2,timber);
      for(let r=0;r<=ribs;r++){
        const cap=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.09,9),tile);cap.rotation.x=Math.PI/2;cap.position.set(cx-width/2+r*width/ribs,eave+.035,cz+side*(depth/2+.025));architecture.add(cap);
      }
    }
  };
  const gx=-4.65,gz=-.75,base=floor(gx,gz);
  box(3.28,.14,1.36,gx,base+.035,gz,stone);
  box(3.22,.12,.38,gx,base-.045,gz-1.02,stone);
  for(const x of [gx-1.34,gx+1.34]){
    const bottom=Math.min(base,floor(x,gz)-.08);
    box(.42,.19,.48,x,bottom+.065,gz,stone);
    box(.29,2.62+base-bottom,.32,x,(bottom+base+2.62)/2,gz,timber);
    block(x,gz,.42,.48,bottom,base+2.75,'azumamaro_roofed_gate_post');
  }
  box(3.22,.21,.36,gx,base+2.51,gz,timber);
  box(3.10,.17,.36,gx,base+.22,gz,timber);
  // Closed double doors match the reference; circulation stays on the torii path.
  for(let i=0;i<18;i++)box(.143,2.08,.10,gx-1.28+i*.151,base+1.29,gz-.08,i%4===0?timber:boards);
  for(const x of [gx-.67,gx+.67])for(const y of [.42,1.15,2.22])box(1.23,.10,.13,x,base+y,gz-.17,timber);
  box(.085,2.23,.14,gx,base+1.30,gz-.19,timber);
  for(const x of [gx-.14,gx+.14])box(.055,.17,.06,x,base+1.18,gz-.29,iron);
  block(gx,gz,2.72,.28,base,base+2.42,'azumamaro_closed_timber_gate');
  for(let x=gx-1.5;x<gx+1.6;x+=.29)box(.065,.12,2.25,x,base+2.60,gz,timber);
  for(const side of [-1,1]){
    const x=gx+side*1.48;
    const vertices=[];
    for(const direction of [-1,1])for(let i=0;i<7;i++){
      const t0=i/7*1.15/1.325,t1=(i+1)/7*1.15/1.325;
      for(const p of [[x,base+2.64,gz],[x,base+2.68+.88*(1-t0)**1.45-.07,gz+direction*t0*1.325],[x,base+2.68+.88*(1-t1)**1.45-.07,gz+direction*t1*1.325]])vertices.push(...p);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
    const gableMaterial=timber.clone();gableMaterial.side=THREE.DoubleSide;
    const gable=new THREE.Mesh(geometry,gableMaterial);gable.castShadow=true;architecture.add(gable);
    box(.13,.11,2.40,x,base+2.67,gz,timber);
  }
  roof(gx,gz,3.80,2.65,base+2.68,.88);
  // June 2012 front reference: a small tan notice beside the closed door,
  // a low woven screen resting against the long wall and a flush drain.
  // Lettering is unresolved in the image, so the notice carries no invented text.
  const notice=new THREE.MeshStandardMaterial({color:'#c3a16b',roughness:1});
  const reed=new THREE.MeshStandardMaterial({color:'#b3976d',roughness:1,side:THREE.DoubleSide});
  const drain=new THREE.MeshStandardMaterial({color:'#8a8c7d',roughness:.98});
  if(typeof document!=='undefined'){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
    const ctx=canvas.getContext('2d');
    if(ctx){
      ctx.fillStyle='#c2a777';ctx.fillRect(0,0,256,128);
      for(let i=0;i<128;i+=3){ctx.fillStyle=i%2?'#a68a60':'#d0b98d';ctx.fillRect(0,i,256,1);}
      for(let x=0;x<256;x+=5){ctx.fillStyle='rgba(82,61,34,.23)';ctx.fillRect(x,0,1,128);}
      const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=THREE.RepeatWrapping;map.repeat.set(5,1);reed.map=map;reed.bumpMap=map;reed.bumpScale=.002;
    }
    const grateCanvas=document.createElement('canvas');grateCanvas.width=128;grateCanvas.height=128;
    const gc=grateCanvas.getContext('2d');
    if(gc){
      gc.fillStyle='#a4a595';gc.fillRect(0,0,128,128);
      for(let x=12;x<120;x+=15)for(let y=12;y<120;y+=15){gc.fillStyle='#454a43';gc.fillRect(x,y,5,7);gc.fillStyle='#72776a';gc.fillRect(x+1,y+6,4,1);}
      const map=new THREE.CanvasTexture(grateCanvas);map.colorSpace=THREE.SRGBColorSpace;drain.map=map;drain.bumpMap=map;drain.bumpScale=.004;
    }
  }
  const plaque=box(.24,.60,.035,gx+1.13,base+1.67,gz-.19,notice);plaque.name='Observed tan gate notice; lettering unresolved';
  // Three adjacent reed panels follow the ground individually, avoiding a
  // floating prop when the inferred courtyard grade changes toward the wall.
  const screenWidth=4.9,screenStart=gx-8.0;
  for(let i=0;i<3;i++){
    const width=screenWidth/3-.025,x=screenStart+(i+.5)*screenWidth/3,z=gz-.43,b=floor(x,z);
    const screen=new THREE.Mesh(new THREE.PlaneGeometry(width,.60),reed);screen.position.set(x,b+.31,z);screen.rotation.x=.25;screen.castShadow=true;screen.receiveShadow=true;screen.name='Observed low woven reed screen leaning against boundary';architecture.add(screen);
    box(width,.035,.045,x,b+.025,z-.075,notice);
    block(x,z,width,.20,b,b+.60,'azumamaro_wall_reed_screen');
  }
  const drainX=gx-1.98,drainZ=gz-.65,drainBase=floor(drainX,drainZ);
  const grate=box(.78,.018,.58,drainX,drainBase+.012,drainZ,drain);grate.name='Observed flush perforated gate drain';
  // Narrow connector and long wall stop before existing mapped shrine buildings.
  const wall=(start,end,followGround=false)=>{
    const count=Math.ceil((end-start)/1.65),width=(end-start)/count;
    for(let i=0;i<count;i++){
      const x=start+(i+.5)*width,z=gz+.13,b=floor(x,z),top=(followGround?b:base)+2.07;
      box(width+.025,top-b,.30,x,(top+b)/2,z,plaster);
      box(width+.035,.81,.065,x,b+.405,z-.183,boards);
      box(width+.07,.12,.14,x,b+.83,z-.20,timber);
      box(width+.07,.12,.40,x,b+.04,z,timber);
      for(let j=0;j<6;j++)box(.035,.73,.075,x-width/2+(j+.5)*width/6,b+.40,z-.22,timber);
      box(.105,top-b+.06,.40,x-width/2,(top+b)/2,z,timber);
      roof(x,z,width+.08,.75,top+.02,.22,false);
      block(x,z,width,.40,b,top,'azumamaro_plaster_boundary');
    }
  };
  // The photograph shows this same tiled boundary continuing west. Its
  // endpoint follows the nearest edge of the mapped former-residence storehouse;
  // no rear enclosure or additional building is inferred from an empty map.
  const westernResidence=features?.buildings?.find(b=>b.id==='way/305214609');
  let wallStart=-19;
  if(westernResidence?.points?.length){
    const edge=Math.max(...westernResidence.points.map(p=>parent.worldToLocal(new THREE.Vector3(...p)).x));
    // Keep coping and posts outside the authoritative building footprint.
    wallStart=Math.min(-19,edge+.25);
    if(wallStart< -19)wall(wallStart,-19,true);
  }
  wall(-19,gx-1.65);wall(gx+1.65,-2.35);
  architecture.userData.boundaryEndpointFeature=westernResidence?.id??null;
  architecture.userData.boundaryExtentInferred=true;
  architecture.userData.provenance='Gate and plaster/timber boundary inferred from supplied June 2012 Street View; frame anchored to OSM marker/path; dimensions unmeasured';
  return {gateLocal:[gx,base,gz],wallLocalExtent:[wallStart,-2.35],boundaryEndpointFeature:westernResidence?.id??null,inferred:true};
}
