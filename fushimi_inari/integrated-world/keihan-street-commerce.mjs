import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {appendStreetFood,STREET_FOOD_ITEMS} from './keihan-street-food.mjs';
import {DRINK_PRODUCTS,createDrinkVesselResources} from './drink-vessels.mjs';
import {appendVendingFace,createVendingSelectionLamp,drawVendingAtlas,setVendingSelectionLamp} from './vending-face.mjs';

export const STREET_DRINKS=DRINK_PRODUCTS;

// Small, explicit machine interaction: selection, release, collection. There
// is no payment, stock persistence or network service in this scene prop.
export function createDrinkMachineState(onChange=()=>{}){
 const state={selected:0,phase:'ready',collected:0};
 const report=()=>state.phase==='dispensed'?`${STREET_DRINKS[state.selected].name} is in the collection tray.`:`Selected: ${STREET_DRINKS[state.selected].name}.`;
 return {state,select(){if(state.phase==='dispensed')return 'Collect the drink before choosing another.';state.selected=(state.selected+1)%STREET_DRINKS.length;onChange(state);return report();},
  selectIndex(index){if(state.phase==='dispensed')return 'Collect the drink before choosing another.';if(!Number.isInteger(index)||index<0||index>=STREET_DRINKS.length)return 'Choose an available drink.';state.selected=index;onChange(state);return report();},
  dispense(){if(state.phase==='dispensed')return 'Your drink is already in the tray.';state.phase='dispensed';onChange(state);return report();},
  collect(){if(state.phase!=='dispensed')return 'Choose a drink and press Dispense first.';const name=STREET_DRINKS[state.selected].name;state.phase='ready';state.collected++;onChange(state);return `${name} collected. Enjoy your walk!`;},report};
}

// A typed completion follows collection, never dispensing or a proximity visit.
export function createDrinkCollectionAction(controller,machineId){
 return ()=>{
  if(controller.state.phase!=='dispensed')return controller.dispense();
  const drink=STREET_DRINKS[controller.state.selected],message=controller.collect();controller.select();
  return {message,event:{type:'drink.collected',drink:drink.name,color:drink.color,productId:drink.id,machineId}};
 };
}

function atlasTexture(){
 if(typeof document==='undefined'){const t=new THREE.DataTexture(new Uint8Array([235,230,208,255]),1,1);t.needsUpdate=true;return t;}
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const c=canvas.getContext('2d');
 if(!c)return null;
 c.fillStyle='#e9e8de';c.fillRect(0,0,1024,1024);c.textAlign='center';c.textBaseline='middle';
 // Four atlas cells: machine signs, vertical menu, awning fascia, food cards.
 drawVendingAtlas(c);
 c.fillStyle='#253d34';c.fillRect(512,0,512,512);c.fillStyle='#efe3bb';c.font='bold 50px serif';c.fillText('お品書き',768,66);c.font='29px serif';
 for(const [i,label]of ['焼きだんご','お茶  •  TEA','串焼き  •  GRILL','できたて'].entries()){c.fillText(label,768,157+i*85);c.fillStyle='#b99d6c';c.fillRect(553,197+i*85,430,2);c.fillStyle='#efe3bb';}
 c.fillStyle='#d9c398';c.fillRect(0,512,512,256);c.fillStyle='#493b2d';c.font='bold 62px serif';c.fillText('いなりの小径',256,602);c.font='24px sans-serif';c.fillText('TEA · SWEETS · FRESHLY GRILLED',256,683);
 c.fillStyle='#a13d2c';c.fillRect(0,768,512,256);c.fillStyle='#f6eacf';c.font='bold 70px serif';c.fillText('できたて',256,850);c.font='27px sans-serif';c.fillText('FRESH FROM THE COUNTER',256,930);
 c.fillStyle='#faf0da';c.fillRect(512,512,512,512);c.fillStyle='#51432e';c.font='bold 42px serif';c.fillText('本日のおすすめ',768,565);
 for(let i=0;i<3;i++){c.strokeStyle='#a97d45';c.lineWidth=4;c.beginPath();c.moveTo(565,650+i*105);c.lineTo(970,650+i*105);c.stroke();for(let j=0;j<4;j++){c.fillStyle=['#c8954f','#d9b46a','#7c9961'][i];c.beginPath();c.arc(620+j*86,640+i*105,24,0,Math.PI*2);c.fill();}}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}

function geometryBatch(group,palette){
 const parts=new Map();
 function put(g,key,color){const geometry=g.index?g.toNonIndexed():g;if(geometry!==g)g.dispose();if(palette[key].vertexColors&&!geometry.hasAttribute('color')){const c=new THREE.Color(color??'#ffffff'),values=new Float32Array(geometry.attributes.position.count*3);for(let i=0;i<values.length;i+=3){values[i]=c.r;values[i+1]=c.g;values[i+2]=c.b;}geometry.setAttribute('color',new THREE.BufferAttribute(values,3));}if(!parts.has(key))parts.set(key,[]);parts.get(key).push(geometry);}
 return {put,box(w,h,d,x,y,z,key,color){const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);put(g,key,color);},
  cylinder(r1,r2,h,x,y,z,key,color,segments=10){const g=new THREE.CylinderGeometry(r1,r2,h,segments);g.translate(x,y,z);put(g,key,color);},
  plane(w,h,x,y,z,cell=0){const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;const regions=[[0,.5,.5,1],[.5,1,.5,1],[0,.5,0,.5],[.5,1,0,.5]],r=regions[cell];for(let i=0;i<uv.count;i++){uv.setXY(i,r[0]+uv.getX(i)*(r[1]-r[0]),r[2]+uv.getY(i)*(r[3]-r[2]));}g.translate(x,y,z);put(g,'print');},
  finish(){for(const [key,geometries]of parts){const g=mergeGeometries(geometries,false);geometries.forEach(p=>p.dispose());const m=new THREE.Mesh(g,palette[key]);m.name=group.name+' · '+key;m.castShadow=key!=='print'&&key!=='glass'&&key!=='drinkLabel';m.receiveShadow=key!=='glass';group.add(m);}parts.clear();}
 };
}

export function planKeihanCommerce(assembly){
 const stores=assembly?.keihanFrontages?.storefronts??[],machines=[],vendorStations=[],sites=[];
 const platformFloor=assembly?.keihanStation?.spec?.platformFloor;
 if(Number.isFinite(platformFloor))for(const [i,z]of [-169,-170.25].entries())machines.push({id:`keihan-platform-machine-${i+1}`,position:[-299.65,platformFloor,z],yaw:-Math.PI/2,existingCollider:true,color:i?'#24394b':'#20374d'});
 for(const s of stores){
  if(!Number.isFinite(s.floor)||!Number.isFinite(s.width)||!s.points?.[s.edge]||!s.t?.every(Number.isFinite)||!s.n?.every(Number.isFinite))continue;
  const a=s.points[s.edge],at=(u,v)=>[a[0]+s.t[0]*u+s.n[0]*v,s.floor,a[2]+s.t[1]*u+s.n[1]*v];
  if(['senbei','soft-serve','grill'].includes(s.kind)){
   const vendorPosition=at(s.width/2,-1.12),u=s.kind==='senbei'?.90:s.kind==='soft-serve'?.94:s.width/2;
   const counterPosition=at(s.kind==='senbei'?.45:u,-.12);counterPosition[1]+=s.kind==='grill'?1.02:1.23;
   vendorStations.push({id:s.id,kind:s.kind,position:vendorPosition,yaw:Math.atan2(s.n[0],s.n[1])});
   sites.push({id:s.id,kind:s.kind,name:s.name,position:at(u,.65),counterPosition,vendorPosition});
  }
  if(s.kind.endsWith('-row')&&s.machineRecess){const p=at(s.kind==='red-awning-row'?s.width-.70:.70,-.43);machines.push({id:`${s.id}-drink-machine`,position:p,yaw:Math.atan2(s.n[0],s.n[1]),existingCollider:false,color:s.kind==='red-awning-row'?'#bd3d31':'#e3ded0'});}
 }
 return {machines,vendorStations,sites};
}

export function installKeihanStreetCommerce(assembly){
 const root=assembly?.root;if(!root||!assembly?.legacy?.interactables||!Array.isArray(assembly.colliders))return {built:false,reason:'Street owners unavailable'};
 const existing=root.getObjectByName('Keihan commerce r104');if(existing)return existing.userData.runtime;
 const plan=planKeihanCommerce(assembly);if(!plan.machines.length&&!plan.sites.length)return {built:false,reason:'No supported commerce positions'};
 const group=new THREE.Group();group.name='Keihan commerce r104';
 const texture=atlasTexture(),drinkResources=createDrinkVesselResources(),borrowedDrinkGeometry=new Set(),palette={
  color:new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.64}),
  metal:new THREE.MeshStandardMaterial({color:'#aab2af',roughness:.32,metalness:.7}),
  dark:new THREE.MeshStandardMaterial({color:'#17252a',roughness:.65}),
  white:new THREE.MeshStandardMaterial({color:'#e9e5d8',roughness:.72}),
  glaze:new THREE.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:.28}),
  print:new THREE.MeshStandardMaterial({map:texture,roughness:.65,emissive:'#b8d1c7',emissiveIntensity:.10}),
  drinkLabel:drinkResources.materials.drinkLabel,
 };
 const machinePalette={...palette,
  color:new THREE.MeshPhysicalMaterial({color:'#ffffff',vertexColors:true,roughness:.42,metalness:.02,clearcoat:.18,clearcoatRoughness:.30}),
  print:new THREE.MeshStandardMaterial({map:texture,roughness:.45,alphaTest:.1,emissive:'#e3f3ed',emissiveIntensity:.38}),
  glass:new THREE.MeshPhysicalMaterial({color:'#b9d7d5',transparent:true,opacity:.085,depthWrite:false,roughness:.12,ior:1.5,envMapIntensity:.7})
 };
 const detailGroups=[],machines=[],colliders=[];
 for(const spec of plan.machines){
  const owner=new THREE.Group();owner.name=spec.id;owner.position.set(...spec.position);owner.rotation.y=spec.yaw;owner.scale.z=.8;owner.userData.detailRadius=34;group.add(owner);detailGroups.push(owner);
  const b=geometryBatch(owner,machinePalette);
  const {productButtons,collectionTarget}=appendVendingFace(b,spec,drinkResources,STREET_DRINKS);b.finish();
  const lamp=createVendingSelectionLamp();owner.add(lamp);
  const can=new THREE.Group();can.position.set(.025,.333,.42);can.rotation.z=Math.PI/2;can.visible=false;can.name='Dispensed drink in collection tray';owner.add(can);
  for(const [i,drink] of STREET_DRINKS.entries()){const model=drinkResources.create(drink.id);model.visible=i===0;model.traverse(o=>{if(o.isMesh)borrowedDrinkGeometry.add(o.geometry);});can.add(model);}
  const controller=createDrinkMachineState(state=>{can.visible=state.phase==='dispensed';can.children.forEach((model,i)=>{model.visible=i===state.selected;});setVendingSelectionLamp(lamp,state.selected);});
  owner.userData.interactable={language:'en',title:'Street drink machine',description:'Choose a drink, dispense it, then collect it from the lower tray.',note:'Interactive scene prop · no payment required.',actions:[{label:'Next drink',run:()=>controller.select()},{label:'Dispense',run:()=>controller.dispense()},{label:'Collect drink',run:()=>controller.collect()}]};
  Object.assign(owner.userData.interactable,{proximity:true,cooldownMs:650,
   directAction:createDrinkCollectionAction(controller,spec.id??owner.name)});
  Object.defineProperty(owner.userData.interactable,'prompt',{get:()=>controller.state.phase==='dispensed'?'Collect drink':'Get a drink',enumerable:true});
  if(!spec.existingCollider)colliders.push({type:'box',args:[spec.position[0],spec.position[2],.52,.35,spec.yaw,spec.position[1],spec.position[1]+1.85,'keihan-street-vending']});
  machines.push({group:owner,spec,controller,can,lamp,productButtons,collectionTarget,trayAt:null,lastPhase:null});
 }
 // Details stay on existing counters and upper facades. In particular, the
 // attendant strip v=-1.12 is reserved and public centerlines remain clear.
 for(const s of assembly.keihanFrontages?.storefronts??[]){
  if(!['senbei','soft-serve','grill'].includes(s.kind))continue;
  const a=s.points[s.edge],owner=new THREE.Group();owner.name=`Counter details ${s.id}`;owner.position.set(a[0],s.floor,a[2]);owner.rotation.y=s.yaw;owner.userData.detailRadius=32;group.add(owner);detailGroups.push(owner);
  const b=geometryBatch(owner,palette),box=(w,h,d,u,y,v,key,color)=>b.box(w,h,d,u,y,-v,key,color);
  const onCounter=s.kind==='grill'?1.04:1.235;
  if(s.kind==='grill'){
   // On the two existing grills: three actual bamboo skewers each, with
   // individually rounded and lightly toasted dango resting on the bars.
   for(const u of [s.width*.32,s.width*.67])for(let row=0;row<3;row++)
    appendStreetFood(b,'grill','dango',{position:[u-.115,1.141,.28+row*.12],pose:'horizontal'});
  }else for(let j=0;j<2;j++){
   const u=s.width*(j?.72:.28),frontShelf=s.kind==='senbei',trayY=onCounter+.0175;
   box(.61,.035,frontShelf?.22:.35,u,onCounter,frontShelf?-.16:-.44,'metal');
   for(let col=0;col<4;col++){
    const x=u-.21+col*.14;
    if(frontShelf)appendStreetFood(b,'senbei','fox-senbei',{position:[x,trayY,.23],pose:'flat'});
    else appendStreetFood(b,'soft-serve',col%2?'matcha':'tofu',{position:[x,trayY,.44]});
   }
   box(.56,.025,.015,u,onCounter+.08,frontShelf?-.25:-.58,'color','#b79a65');
   box(.12,.13,.025,u,onCounter+.1,-.19,'white');
  }
  // Cooking equipment and the grill menu belong only to the food counter,
  // not the named senbei or tofu/soft-serve merchants.
  if(s.kind==='grill'){
  const side=.27;
  b.cylinder(.066,.055,.15,side,onCounter+.075,.36,'color','#533d2b');
  for(let i=0;i<7;i++)box(.009,.24,.009,side-.04+i*.012,onCounter+.18,-.36,'color','#cfb98e');
  for(let i=0;i<3;i++){b.cylinder(.028,.031,.13,s.width-.27-i*.09,onCounter+.065,.36,'color',i?'#95542e':'#a53925',8);b.cylinder(.02,.02,.035,s.width-.27-i*.09,onCounter+.147,.36,'dark',undefined,8);}
  for(let i=0;i<4;i++)b.cylinder(.045,.036,.045,s.width-.30,onCounter+.025+i*.035,.58,'white',undefined,8);
  box(.014,.018,.13,.50,onCounter+.04,-.15,'metal');box(.014,.018,.13,.55,onCounter+.04,-.15,'metal');
  // Printed menu hangs above head clearance, facing the public street.
  const menu=new THREE.PlaneGeometry(.50,.66);const uv=menu.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,.5+uv.getX(i)*.5,.5+uv.getY(i)*.5);menu.rotateY(Math.PI);menu.translate(.45,s.kind==='grill'?1.62:1.80,-.025);b.put(menu,'print');
  for(const u of [s.width*.25,s.width*.5,s.width*.75]){box(.035,.38,.035,u,2.55,.11,'color','#714b30');const g=new THREE.SphereGeometry(.12,10,6);g.scale(1,1.32,1);g.translate(u,2.36,-.11);b.put(g,'color','#b94730');for(const y of [2.18,2.53])b.cylinder(.08,.08,.03,u,y,-.11,'dark',undefined,8);}
  }else if(s.kind==='senbei'){
   // Merchant-association photo: slim ceiling strips, no red lantern row.
   for(const u of [s.width*.26,s.width*.5,s.width*.74])box(.025,.025,.75,u,2.53,-.70,'white');
  }
  // Small visible shutter-box, drainpipe and service fittings add depth to
  // the upper store without replacing its registered architecture.
  box(.08,3.0,.08,s.width-.10,3.60,.09,'metal');box(.68,.38,.23,s.width-.55,3.33,.13,'white');
  for(let i=0;i<7;i++)box(.53,.018,.015,s.width-.55,3.20+i*.04,.253,'dark');
  b.finish();
 }
 root.add(group);assembly.colliders.push(...colliders);assembly.legacy.interactables.push(...machines.map(m=>m.group));group.updateMatrixWorld(true);
 const drinkMaterials=new Set(Object.values(drinkResources.materials));
 const ownedGeometry=new Set(),ownedMaterials=new Set([...Object.values(palette),...Object.values(machinePalette)].filter(m=>!drinkMaterials.has(m)));
 let triangles=0,batches=0;
 group.traverse(o=>{if(o.isMesh){if(!borrowedDrinkGeometry.has(o.geometry))ownedGeometry.add(o.geometry);if(!drinkMaterials.has(o.material))ownedMaterials.add(o.material);}});
 group.traverseVisible(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;batches++;}});
 // Templates are prepared once; served/held clones borrow their geometries
 // and materials. The commerce owner alone releases those resources.
 const servingTemplates=new Map();let servingTriangles=0;
 for(const [kind,items] of Object.entries(STREET_FOOD_ITEMS))for(const item of items){
  const template=new THREE.Group();template.name=`Street serving ${item}`;
  const bites=kind==='senbei'?2:3,batchesByStage=[];
  for(let stage=0;stage<=bites;stage++){const part=new THREE.Group();part.name=`Food portion ${stage}`;part.userData.stage=stage;template.add(part);batchesByStage.push(geometryBatch(part,palette));}
  appendStreetFood({put(geometry,key,color,stage){batchesByStage[stage].put(geometry,key,color);}},kind,item,{packaged:true});
  for(const batch of batchesByStage)batch.finish();
  template.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;ownedGeometry.add(o.geometry);servingTriangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
  servingTemplates.set(`${kind}:${item}`,{template,bites});
 }
 const stats={machines:machines.length,foodCounters:detailGroups.length-machines.length,drawBatches:batches,triangles,servingTriangles,collidersAdded:colliders.length,textureAtlases:2,pointLights:0};
 let disposed=false;
 const runtime={built:true,group,detailGroups,machines,vendorStations:plan.vendorStations,sites:plan.sites,stats,
  createServing(kind,item){
   const entry=disposed?null:servingTemplates.get(`${kind}:${item}`);if(!entry)return null;
   const model=entry.template.clone(true),parts=model.children;model.userData.bites=entry.bites;
   model.userData.preparationRoots=parts.slice();
   model.userData.setBitesRemaining=value=>{const remaining=Math.max(0,Math.min(entry.bites,Math.floor(Number(value)||0)));for(const part of parts)part.visible=part.userData.stage===0||(kind==='senbei'?part.userData.stage===remaining:part.userData.stage<=remaining);};
   model.userData.setBitesRemaining(entry.bites);
   return model;
  },
  createDrink(productId){return disposed?null:drinkResources.create(productId);},
  update(camera,time){if(disposed)return;for(const m of machines){if(!m.group.visible||Math.hypot(camera.position.x-m.spec.position[0],camera.position.z-m.spec.position[2])>22)continue;const phase=m.controller.state.phase;if(phase!==m.lastPhase){m.lastPhase=phase;m.trayAt=phase==='dispensed'?time:null;m.lamp.material.color.setHex(phase==='dispensed'?0xffdb85:0xc7f0a2);}
   const age=m.trayAt===null?1:Math.max(0,time-m.trayAt),settling=age<.65?Math.exp(-age*13):0;m.can.position.y=.333+.055*settling*Math.abs(Math.cos(age*10));m.can.rotation.x=settling?.08*settling*Math.sin(age*12):0;}},dispose(){
  if(disposed)return;disposed=true;group.removeFromParent();
  for(const {group:owner}of machines){const i=assembly.legacy.interactables.indexOf(owner);if(i!==-1)assembly.legacy.interactables.splice(i,1);}
  for(const collider of colliders){const i=assembly.colliders.indexOf(collider);if(i!==-1)assembly.colliders.splice(i,1);}
  for(const geometry of ownedGeometry)geometry.dispose();for(const material of ownedMaterials)material.dispose();texture?.dispose();drinkResources.dispose();servingTemplates.clear();
 }};
 group.userData.runtime=runtime;return runtime;
}
