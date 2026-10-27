import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export const STREET_DRINKS=Object.freeze([
 {name:'Green tea',color:'#81a85c'},{name:'Water',color:'#78b7d5'},
 {name:'Coffee',color:'#a87548'},{name:'Citrus soda',color:'#e5b94e'}
]);

// Small, explicit machine interaction: selection, release, collection. There
// is no payment, stock persistence or network service in this scene prop.
export function createDrinkMachineState(onChange=()=>{}){
 const state={selected:0,phase:'ready',collected:0};
 const report=()=>state.phase==='dispensed'?`${STREET_DRINKS[state.selected].name} is in the collection tray.`:`Selected: ${STREET_DRINKS[state.selected].name}.`;
 return {state,select(){if(state.phase==='dispensed')return 'Collect the drink before choosing another.';state.selected=(state.selected+1)%STREET_DRINKS.length;onChange(state);return report();},
  dispense(){if(state.phase==='dispensed')return 'Your drink is already in the tray.';state.phase='dispensed';onChange(state);return report();},
  collect(){if(state.phase!=='dispensed')return 'Choose a drink and press Dispense first.';const name=STREET_DRINKS[state.selected].name;state.phase='ready';state.collected++;onChange(state);return `${name} collected. Enjoy your walk!`;},report};
}

function atlasTexture(){
 if(typeof document==='undefined'){const t=new THREE.DataTexture(new Uint8Array([235,230,208,255]),1,1);t.needsUpdate=true;return t;}
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const c=canvas.getContext('2d');
 if(!c)return null;
 c.fillStyle='#e9e8de';c.fillRect(0,0,1024,1024);c.textAlign='center';c.textBaseline='middle';
 // Four atlas cells: machine display, vertical menu, awning fascia, food cards.
 c.fillStyle='#172b33';c.fillRect(0,0,512,512);c.fillStyle='#f6f2df';c.font='bold 48px sans-serif';c.fillText('DRINKS',256,55);
 c.font='22px sans-serif';c.fillStyle='#8ce2ff';c.fillText('つめたい  COLD',256,104);
 // The old full display printed another eighteen bottles behind the real
 // eighteen models. This cell now supplies cropped labels, not a second shelf.
 for(const [i,name]of ['TEA','H2O','COFFEE','SODA'].entries()){
  const x=i*128;c.fillStyle=['#d5e5af','#d7f0f3','#e8d0a9','#f2db86'][i];c.fillRect(x,128,128,128);
  c.fillStyle=['#40652f','#246e89','#603c29','#8c5b12'][i];c.fillRect(x+8,137,112,6);c.fillRect(x+8,237,112,6);
  c.font=`bold ${i===2?24:33}px sans-serif`;c.fillText(name,x+64,184);c.font='17px sans-serif';c.fillText(['緑茶','天然水','珈琲','炭酸'][i],x+64,220);
 }
 c.fillStyle='#172b33';c.fillRect(0,256,512,80);c.fillStyle='#d5edbd';c.font='bold 29px sans-serif';c.fillText('E · CHOOSE A DRINK',256,296);
 // Original fox mark inspired by the station context; no photograph pixels.
 c.clearRect(0,352,160,160);c.fillStyle='#f0f2e8';c.beginPath();c.arc(75,438,48,.1,Math.PI*1.93);c.fill();
 c.clearRect(63,397,42,37);c.beginPath();c.moveTo(67,419);c.lineTo(63,370);c.lineTo(84,384);c.lineTo(110,373);c.lineTo(106,418);c.closePath();c.fill();
 c.fillStyle='#183246';c.beginPath();c.arc(81,397,2.2,0,Math.PI*2);c.fill();c.beginPath();c.arc(98,397,2.2,0,Math.PI*2);c.fill();
 c.fillStyle='#edf4e2';c.fillRect(192,368,32,32);
 c.fillStyle='#253d34';c.fillRect(512,0,512,512);c.fillStyle='#efe3bb';c.font='bold 50px serif';c.fillText('お品書き',768,66);c.font='29px serif';
 for(const [i,label]of ['焼きだんご','お茶  •  TEA','串焼き  •  GRILL','できたて'].entries()){c.fillText(label,768,157+i*85);c.fillStyle='#b99d6c';c.fillRect(553,197+i*85,430,2);c.fillStyle='#efe3bb';}
 c.fillStyle='#d9c398';c.fillRect(0,512,512,256);c.fillStyle='#493b2d';c.font='bold 62px serif';c.fillText('いなりの小径',256,602);c.font='24px sans-serif';c.fillText('TEA · SWEETS · FRESHLY GRILLED',256,683);
 c.fillStyle='#a13d2c';c.fillRect(0,768,512,256);c.fillStyle='#f6eacf';c.font='bold 70px serif';c.fillText('できたて',256,850);c.font='27px sans-serif';c.fillText('FRESH FROM THE COUNTER',256,930);
 c.fillStyle='#faf0da';c.fillRect(512,512,512,512);c.fillStyle='#51432e';c.font='bold 42px serif';c.fillText('本日のおすすめ',768,565);
 for(let i=0;i<3;i++){c.strokeStyle='#a97d45';c.lineWidth=4;c.beginPath();c.moveTo(565,650+i*105);c.lineTo(970,650+i*105);c.stroke();for(let j=0;j<4;j++){c.fillStyle=['#c8954f','#d9b46a','#7c9961'][i];c.beginPath();c.arc(620+j*86,640+i*105,24,0,Math.PI*2);c.fill();}}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

function atlasRegion(geometry,x,y,width,height){
 const uv=geometry.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,(x+uv.getX(i)*width)/1024,1-(y+(1-uv.getY(i))*height)/1024);
 return geometry;
}

function geometryBatch(group,palette){
 const parts=new Map();
 function put(g,key,color){const geometry=g.index?g.toNonIndexed():g;if(geometry!==g)g.dispose();if(palette[key].vertexColors){const c=new THREE.Color(color??'#ffffff'),values=new Float32Array(geometry.attributes.position.count*3);for(let i=0;i<values.length;i+=3){values[i]=c.r;values[i+1]=c.g;values[i+2]=c.b;}geometry.setAttribute('color',new THREE.BufferAttribute(values,3));}if(!parts.has(key))parts.set(key,[]);parts.get(key).push(geometry);}
 return {put,box(w,h,d,x,y,z,key,color){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);put(g,key,color);},
  cylinder(r1,r2,h,x,y,z,key,color,segments=10){const g=new THREE.CylinderGeometry(r1,r2,h,segments);g.translate(x,y,z);put(g,key,color);},
  plane(w,h,x,y,z,cell=0){const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;const regions=[[0,.5,.5,1],[.5,1,.5,1],[0,.5,0,.5],[.5,1,0,.5]],r=regions[cell];for(let i=0;i<uv.count;i++){uv.setXY(i,r[0]+uv.getX(i)*(r[1]-r[0]),r[2]+uv.getY(i)*(r[3]-r[2]));}g.translate(x,y,z);put(g,'print');},
  finish(){for(const [key,geometries]of parts){const g=mergeGeometries(geometries,false);geometries.forEach(p=>p.dispose());const m=new THREE.Mesh(g,palette[key]);m.name=group.name+' · '+key;m.castShadow=key!=='print'&&key!=='glass';m.receiveShadow=key!=='glass';group.add(m);}parts.clear();}
 };
}

export function planKeihanCommerce(assembly){
 const stores=assembly?.keihanFrontages?.storefronts??[],machines=[],vendorStations=[];
 const platformFloor=assembly?.keihanStation?.spec?.platformFloor;
 if(Number.isFinite(platformFloor))for(const [i,z]of [-169,-170.25].entries())machines.push({id:`keihan-platform-machine-${i+1}`,position:[-299.65,platformFloor,z],yaw:-Math.PI/2,existingCollider:true,color:i?'#24394b':'#20374d'});
 for(const s of stores){
  if(!Number.isFinite(s.floor)||!Number.isFinite(s.width)||!s.points?.[s.edge]||!s.t?.every(Number.isFinite)||!s.n?.every(Number.isFinite))continue;
  const a=s.points[s.edge],at=(u,v)=>[a[0]+s.t[0]*u+s.n[0]*v,s.floor,a[2]+s.t[1]*u+s.n[1]*v];
  if(['senbei','soft-serve','grill'].includes(s.kind))vendorStations.push({id:s.id,kind:s.kind,position:at(s.width/2,-1.12),yaw:Math.atan2(s.n[0],s.n[1])});
  if(s.kind.endsWith('-row')&&s.machineRecess){const p=at(s.kind==='red-awning-row'?s.width-.70:.70,-.43);machines.push({id:`${s.id}-drink-machine`,position:p,yaw:Math.atan2(s.n[0],s.n[1]),existingCollider:false,color:s.kind==='red-awning-row'?'#bd3d31':'#e3ded0'});}
 }
 return {machines,vendorStations};
}

export function installKeihanStreetCommerce(assembly){
 const root=assembly?.root;if(!root||!assembly?.legacy?.interactables||!Array.isArray(assembly.colliders))return {built:false,reason:'Street owners unavailable'};
 const existing=root.getObjectByName('Keihan commerce r104');if(existing)return existing.userData.runtime;
 const plan=planKeihanCommerce(assembly);if(!plan.machines.length)return {built:false,reason:'No supported machine positions'};
 const group=new THREE.Group();group.name='Keihan commerce r104';
 const texture=atlasTexture(),palette={
  color:new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.64}),
  metal:new THREE.MeshStandardMaterial({color:'#aab2af',roughness:.32,metalness:.7}),
  dark:new THREE.MeshStandardMaterial({color:'#17252a',roughness:.65}),
  white:new THREE.MeshStandardMaterial({color:'#e9e5d8',roughness:.72}),
  print:new THREE.MeshStandardMaterial({map:texture,roughness:.65,emissive:'#b8d1c7',emissiveIntensity:.10}),
 };
 const machinePalette={...palette,
  color:new THREE.MeshPhysicalMaterial({color:'#ffffff',vertexColors:true,roughness:.42,metalness:.02,clearcoat:.18,clearcoatRoughness:.30}),
  print:new THREE.MeshStandardMaterial({map:texture,roughness:.45,alphaTest:.1,emissive:'#e3f3ed',emissiveIntensity:.20}),
  glass:new THREE.MeshPhysicalMaterial({color:'#b9d7d5',transparent:true,opacity:.085,depthWrite:false,roughness:.12,ior:1.5,envMapIntensity:.7})
 };
 const detailGroups=[],machines=[],colliders=[];
 for(const spec of plan.machines){
  const owner=new THREE.Group();owner.name=spec.id;owner.position.set(...spec.position);owner.rotation.y=spec.yaw;owner.scale.z=.8;owner.userData.detailRadius=34;group.add(owner);detailGroups.push(owner);
  const b=geometryBatch(owner,machinePalette);
  // Standard standing cabinet. Body, inset display, control recess, lower
  // service panel, perforated ventilation and collection shelf are geometry.
  b.put(new RoundedBoxGeometry(1.04,1.78,.70,2,.028).translate(0,.96,0),'color',spec.color);b.box(1.00,.11,.65,0,.07,0,'dark');
  for(const x of [-.43,.43])for(const z of [-.25,.25])b.cylinder(.035,.045,.08,x,.04,z,'metal');
  b.box(.80,1.13,.035,-.075,1.24,.365,'white');b.box(.73,.92,.035,-.075,1.29,.389,'dark');
  b.put(atlasRegion(new THREE.PlaneGeometry(.72,.13),0,0,512,125).translate(-.075,1.73,.410),'print');
  b.put(new THREE.PlaneGeometry(.73,.94).translate(-.075,1.29,.494),'glass');
  for(const x of [-.452,.302])b.box(.012,.99,.018,x,1.29,.490,'metal');
  for(const y of [.795,1.785])b.box(.766,.012,.018,-.075,y,.490,'metal');
  for(let row=0;row<3;row++){
   const y=.98+row*.28;b.box(.73,.025,.10,-.075,y-.09,.42,'metal');
   b.put(atlasRegion(new THREE.PlaneGeometry(.70,.012),192,368,32,32).translate(-.075,y-.067,.477),'print');
   for(let col=0;col<6;col++){
    const x=-.37+col*.118,kind=col%4,drink=STREET_DRINKS[kind],radius=kind===1?.027:.031;
    b.cylinder(radius,radius,kind===3?.13:.116,x,y,.445,'color',drink.color,8);
    if(kind<2){b.cylinder(.014,radius,.025,x,y+.07,.445,'color',drink.color,8);b.cylinder(.014,.016,.018,x,y+.091,.445,'white',undefined,8);}
    else for(const side of [-1,1])b.put(new THREE.CircleGeometry(radius,8).rotateX(-side*Math.PI/2).translate(x,y+side*(kind===3?.065:.058),.445),'metal');
    const label=new THREE.CylinderGeometry(radius+.0007,radius+.0007,.044,8,1,true,-.95,1.9);
    b.put(atlasRegion(label,kind*128,128,128,128).translate(x,y,.445),'print');
    b.box(.068,.025,.025,x,y-.12,.437,'color','#c5d7b6');
   }
  }
  b.put(new RoundedBoxGeometry(.14,.48,.055,1,.012).translate(.433,.99,.372),'dark');b.box(.065,.055,.016,.433,1.12,.411,'metal');
  b.box(.052,.008,.018,.433,1.122,.423,'dark');b.box(.074,.047,.02,.433,.98,.40,'color','#7db9ac');
  b.cylinder(.026,.026,.016,.433,.88,.40,'metal',undefined,12);
  b.box(.12,.028,.016,.433,.73,.393,'metal');b.box(.09,.009,.019,.433,.731,.405,'dark');
  // Repeat the atlas instruction in the unobstructed strip below the display.
  // The lower product row intentionally stays physical rather than being
  // removed to reveal text printed behind it.
  const instruction=atlasRegion(new THREE.PlaneGeometry(.82,.13),0,256,512,80);
  instruction.translate(-.075,.605,.375);b.put(instruction,'print');
  b.box(.63,.22,.035,-.075,.40,.372,'dark');b.box(.66,.025,.14,-.075,.285,.41,'metal');
  b.box(.64,.025,.035,-.075,.517,.402,'white');b.box(.68,.17,.025,-.075,.13,.367,'color',spec.color);
  for(let i=0;i<6;i++)b.put(new THREE.BoxGeometry(.57,.011,.023).rotateX(-.30).translate(-.075,.073+i*.022,.383),'dark');
  b.box(.017,1.72,.025,.50,.99,.365,'metal');b.box(.09,.016,.025,.43,1.66,.389,'metal');
  if(spec.existingCollider)for(const side of [-1,1])for(const y of [.42,.95,1.48])b.put(atlasRegion(new THREE.PlaneGeometry(.46,.46),0,352,160,160).rotateY(side*Math.PI/2).translate(side*.5206,y,0),'print');
  b.finish();
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(.065,.024,.02),new THREE.MeshBasicMaterial({color:'#c7f0a2'}));lamp.position.set(-.37,.86,.46);lamp.name='Selected product button';owner.add(lamp);
  const can=new THREE.Mesh(new THREE.CylinderGeometry(.038,.038,.15,12),new THREE.MeshStandardMaterial({color:STREET_DRINKS[0].color,roughness:.4,metalness:.22}));can.position.set(-.075,.37,.42);can.rotation.z=Math.PI/2;can.visible=false;can.name='Dispensed drink in collection tray';owner.add(can);
  const controller=createDrinkMachineState(state=>{can.visible=state.phase==='dispensed';can.material.color.set(STREET_DRINKS[state.selected].color);lamp.position.x=-.37+state.selected*.118;});
  owner.userData.interactable={language:'en',title:'Street drink machine',description:'Choose a drink, dispense it, then collect it from the lower tray.',note:'Interactive scene prop · no payment required.',actions:[{label:'Next drink',run:()=>controller.select()},{label:'Dispense',run:()=>controller.dispense()},{label:'Collect drink',run:()=>controller.collect()}]};
  Object.assign(owner.userData.interactable,{proximity:true,cooldownMs:650,
   directAction(){if(controller.state.phase==='dispensed'){const result=controller.collect();controller.select();return result;}return controller.dispense();}});
  Object.defineProperty(owner.userData.interactable,'prompt',{get:()=>controller.state.phase==='dispensed'?'Collect drink':'Get a drink',enumerable:true});
  if(!spec.existingCollider)colliders.push({type:'box',args:[spec.position[0],spec.position[2],.52,.35,spec.yaw,spec.position[1],spec.position[1]+1.85,'keihan-street-vending']});
  machines.push({group:owner,spec,controller,can,lamp});
 }
 // Details stay on existing counters and upper facades. In particular, the
 // attendant strip v=-1.12 is reserved and public centerlines remain clear.
 for(const s of assembly.keihanFrontages?.storefronts??[]){
  if(!['senbei','soft-serve','grill'].includes(s.kind))continue;
  const a=s.points[s.edge],owner=new THREE.Group();owner.name=`Counter details ${s.id}`;owner.position.set(a[0],s.floor,a[2]);owner.rotation.y=s.yaw;owner.userData.detailRadius=32;group.add(owner);detailGroups.push(owner);
  const b=geometryBatch(owner,palette),box=(w,h,d,u,y,v,key,color)=>b.box(w,h,d,u,y,-v,key,color);
  const onCounter=s.kind==='grill'?1.04:1.235;
  for(let j=0;j<2;j++){
   const u=s.width*(j?.72:.28),frontShelf=s.kind==='senbei';box(.61,.035,frontShelf?.22:.35,u,onCounter,frontShelf?-.16:-.44,'metal');
   for(let row=0;row<2;row++)for(let col=0;col<4;col++){
    const x=u-.22+col*.145,z=frontShelf?.11+row*.10:.35+row*.15;
    if(s.kind==='soft-serve'){b.cylinder(.045,.036,.07,x,onCounter+.055,z,'white',undefined,8);const g=new THREE.SphereGeometry(.045,8,5);g.translate(x,onCounter+.105,z);b.put(g,'color',row?'#85a269':'#f4e7c5');}
    else{const g=new THREE.SphereGeometry(.045,8,5);g.scale(1,.55,1);g.translate(x,onCounter+.048,z);b.put(g,'color',s.kind==='grill'?'#b0783f':'#dbb271');}
   }
   box(.56,.025,.015,u,onCounter+.08,frontShelf?-.25:-.58,'color','#b79a65');
   box(.12,.13,.025,u,onCounter+.1,-.19,'white');
  }
  // Trays, cup dispenser, condiment bottles, chopstick pot and serving tongs.
  const side=.27;
  b.cylinder(.066,.055,.15,side,onCounter+.075,.36,'color','#533d2b');
  for(let i=0;i<7;i++)box(.009,.24,.009,side-.04+i*.012,onCounter+.18,-.36,'color','#cfb98e');
  for(let i=0;i<3;i++){b.cylinder(.028,.031,.13,s.width-.27-i*.09,onCounter+.065,.36,'color',i?'#95542e':'#a53925',8);b.cylinder(.02,.02,.035,s.width-.27-i*.09,onCounter+.147,.36,'dark',undefined,8);}
  for(let i=0;i<4;i++)b.cylinder(.045,.036,.045,s.width-.30,onCounter+.025+i*.035,.58,'white',undefined,8);
  box(.014,.018,.13,.50,onCounter+.04,-.15,'metal');box(.014,.018,.13,.55,onCounter+.04,-.15,'metal');
  // Printed menu hangs above head clearance, facing the public street.
  const menu=new THREE.PlaneGeometry(.50,.66);const uv=menu.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.5+uv.getX(i)*.5,.5+uv.getY(i)*.5);menu.rotateY(Math.PI);menu.translate(.45,s.kind==='grill'?1.62:1.80,-.025);b.put(menu,'print');
  for(const u of [s.width*.25,s.width*.5,s.width*.75]){box(.035,.38,.035,u,2.55,.11,'color','#714b30');const g=new THREE.SphereGeometry(.12,10,6);g.scale(1,1.32,1);g.translate(u,2.36,-.11);b.put(g,'color','#b94730');for(const y of [2.18,2.53])b.cylinder(.08,.08,.03,u,y,-.11,'dark',undefined,8);}
  // Small visible shutter-box, drainpipe and service fittings add depth to
  // the upper store without replacing its registered architecture.
  box(.08,3.0,.08,s.width-.10,3.60,.09,'metal');box(.68,.38,.23,s.width-.55,3.33,.13,'white');
  for(let i=0;i<7;i++)box(.53,.018,.015,s.width-.55,3.20+i*.04,.253,'dark');
  b.finish();
 }
 root.add(group);assembly.colliders.push(...colliders);assembly.legacy.interactables.push(...machines.map(m=>m.group));group.updateMatrixWorld(true);
 const ownedGeometry=new Set(),ownedMaterials=new Set([...Object.values(palette),...Object.values(machinePalette)]);
 let triangles=0,batches=0;group.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;batches++;ownedGeometry.add(o.geometry);ownedMaterials.add(o.material);}});
 const stats={machines:machines.length,foodCounters:detailGroups.length-machines.length,drawBatches:batches,triangles,collidersAdded:colliders.length,textureAtlases:1,pointLights:0};
 let disposed=false;
 const runtime={built:true,group,detailGroups,machines,vendorStations:plan.vendorStations,stats,update(camera,time){if(disposed)return;for(const m of machines){if(!m.group.visible||Math.hypot(camera.position.x-m.spec.position[0],camera.position.z-m.spec.position[2])>22)continue;m.lamp.material.color.setHex(m.controller.state.phase==='dispensed'?0xffdb85:0xc7f0a2);if(m.controller.state.phase==='dispensed')m.can.rotation.x=Math.sin(time*2)*.025;}},dispose(){
  if(disposed)return;disposed=true;group.removeFromParent();
  for(const {group:owner}of machines){const i=assembly.legacy.interactables.indexOf(owner);if(i!==-1)assembly.legacy.interactables.splice(i,1);}
  for(const collider of colliders){const i=assembly.colliders.indexOf(collider);if(i!==-1)assembly.colliders.splice(i,1);}
  for(const geometry of ownedGeometry)geometry.dispose();for(const material of ownedMaterials)material.dispose();texture?.dispose();
 }};
 group.userData.runtime=runtime;return runtime;
}
