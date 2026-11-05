import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// The original atlas contains both food and machine graphics. These cells are
// authored locally, with no photographed label or manufacturer asset pixels.
export function drawVendingAtlas(c){
 c.fillStyle='#183349';c.fillRect(0,0,512,125);c.textAlign='center';c.textBaseline='middle';
 c.fillStyle='#f5f4e9';c.font='bold 47px sans-serif';c.fillText('お飲みもの',256,50);
 c.fillStyle='#b9dce5';c.font='22px sans-serif';c.fillText('冷たい飲みもの  ・  HOT & COLD',256,100);
 const prices=['¥160','¥130','¥140','¥150'];
 for(let i=0;i<4;i++){
  const x=i*128;c.fillStyle='#f6f5ed';c.fillRect(x,128,128,96);
  c.fillStyle=i===2?'#bd3b32':'#2478b0';c.fillRect(x+3,131,122,27);
  c.fillStyle='#ffffff';c.font='bold 16px sans-serif';c.fillText(i===2?'あたたか〜い':'つめた〜い',x+64,145);
  c.fillStyle='#17262a';c.font='bold 38px sans-serif';c.fillText(prices[i],x+64,186);
  c.fillStyle='#536166';c.font='13px sans-serif';c.fillText('税込',x+64,213);
 }
 c.fillStyle='#ebeee7';c.fillRect(0,224,512,30);c.fillStyle='#283c41';c.font='bold 15px sans-serif';
 for(const [i,label] of ['千円札','おつり','IC','取出口'].entries())c.fillText(label,i*128+64,239);
 c.fillStyle='#172b33';c.fillRect(0,256,512,80);c.fillStyle='#d5edbd';c.font='bold 25px sans-serif';c.fillText('お好きな飲みものをどうぞ',256,296);
 // Original fox mark used on the sides of the interpreted station cabinets.
 c.clearRect(0,352,160,160);c.fillStyle='#f0f2e8';c.beginPath();c.arc(75,438,48,.1,Math.PI*1.93);c.fill();
 c.clearRect(63,397,42,37);c.beginPath();c.moveTo(67,419);c.lineTo(63,370);c.lineTo(84,384);c.lineTo(110,373);c.lineTo(106,418);c.closePath();c.fill();
 c.fillStyle='#183246';c.beginPath();c.arc(81,397,2.2,0,Math.PI*2);c.fill();c.beginPath();c.arc(98,397,2.2,0,Math.PI*2);c.fill();
 // One uniform texel region is reused for the luminous display backing.
 c.fillStyle='#f3f5e9';c.fillRect(192,368,32,32);
}

export function atlasRegion(geometry,x,y,width,height){
 const uv=geometry.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,(x+uv.getX(i)*width)/1024,1-(y+(1-uv.getY(i))*height)/1024);
 return geometry;
}

const buttonX=col=>-.37+col*.118;
const buttonY=row=>.851+row*.28;

// Both geometry and hit rectangles come from the same shelf coordinates.
// The caller owns the returned objects and all geometry added to its batch.
export function appendVendingFace(b,spec,drinkResources,products){
 b.put(new RoundedBoxGeometry(1.04,1.78,.70,2,.028).translate(0,.96,0),'color',spec.color);
 b.box(1.00,.11,.65,0,.07,0,'dark');
 for(const x of [-.43,.43])for(const z of [-.25,.25])b.cylinder(.035,.045,.08,x,.04,z,'metal');
 b.box(.80,1.13,.035,-.075,1.24,.365,'white');
 b.put(atlasRegion(new THREE.PlaneGeometry(.73,.92),192,368,32,32).translate(-.075,1.29,.408),'print');
 b.put(atlasRegion(new THREE.PlaneGeometry(.72,.13),0,0,512,125).translate(-.075,1.73,.410),'print');
 b.put(new THREE.PlaneGeometry(.73,.94).translate(-.075,1.29,.494),'glass');
 for(const x of [-.452,.302])b.box(.012,.99,.018,x,1.29,.490,'metal');
 for(const y of [.795,1.785])b.box(.766,.012,.018,-.075,y,.490,'metal');
 const productButtons=[];
 for(let row=0;row<3;row++){
  const y=.98+row*.28;b.box(.73,.025,.10,-.075,y-.09,.42,'metal');
  for(let col=0;col<6;col++){
   const x=buttonX(col),index=col%products.length,drink=products[index];
   drinkResources.append(b,drink.id,{position:[x,y-.0775,.445]});
   b.put(atlasRegion(new THREE.PlaneGeometry(.089,.039),index*128,128,128,96).translate(x,y-.085,.502),'print');
   b.put(new THREE.CircleGeometry(1,12).scale(.037,.012,1).translate(x,buttonY(row),.511),'white');
   productButtons.push({productId:drink.id,position:[x,buttonY(row),.512],width:.074,height:.024});
  }
 }
 // Narrow service strip: status, coin slot, note acceptor, IC reader, return
 // lever and change tray; all details reuse existing material batches.
 b.put(new RoundedBoxGeometry(.14,.67,.055,1,.012).translate(.433,1.04,.372),'dark');
 b.box(.093,.044,.012,.433,1.31,.407,'color','#264b4a');
 b.box(.065,.055,.016,.433,1.12,.411,'metal');b.box(.052,.008,.018,.433,1.122,.423,'dark');
 b.box(.095,.051,.018,.433,1.01,.409,'white');b.box(.074,.008,.014,.433,1.014,.424,'dark');
 b.put(atlasRegion(new THREE.PlaneGeometry(.075,.015),0,224,128,30).translate(.433,.992,.423),'print');
 b.box(.091,.066,.015,.433,.90,.410,'color','#397f87');
 b.put(atlasRegion(new THREE.PlaneGeometry(.046,.018),256,224,128,30).translate(.433,.90,.420),'print');
 b.put(new THREE.CylinderGeometry(.025,.025,.014,12).rotateX(Math.PI/2).translate(.433,.80,.416),'metal');
 b.box(.10,.035,.018,.433,.70,.409,'metal');b.box(.078,.014,.018,.433,.70,.422,'dark');
 b.put(atlasRegion(new THREE.PlaneGeometry(.075,.015),128,224,128,30).translate(.433,.674,.420),'print');
 b.put(atlasRegion(new THREE.PlaneGeometry(.82,.09),0,256,512,80).translate(-.075,.605,.375),'print');
 // Recessed delivery opening and hinged upper lip, with the drink drawn just
 // in front when present so it can still be picked up by the visitor.
 b.box(.63,.22,.035,-.075,.40,.372,'dark');b.box(.66,.025,.14,-.075,.285,.41,'metal');
 b.box(.64,.018,.035,-.075,.512,.402,'white');b.box(.45,.012,.014,-.075,.485,.405,'metal');
 b.put(atlasRegion(new THREE.PlaneGeometry(.10,.018),384,224,128,30).translate(-.075,.465,.404),'print');
 b.box(.68,.17,.025,-.075,.13,.367,'color',spec.color);
 if(spec.color==='#bd3d31'){
  b.box(.10,.98,.018,-.485,1.29,.376,'white');
  const panel=new THREE.Shape();panel.moveTo(-.48,.27);panel.lineTo(-.32,.27);panel.lineTo(-.39,.52);panel.lineTo(-.48,.52);panel.closePath();
  b.put(new THREE.ShapeGeometry(panel).translate(0,0,.395),'white');
 }
 for(let i=0;i<6;i++)b.put(new THREE.BoxGeometry(.57,.011,.023).rotateX(-.30).translate(-.075,.073+i*.022,.383),'dark');
 b.box(.017,1.72,.025,.50,.99,.365,'metal');b.box(.09,.016,.025,.43,1.66,.389,'metal');
 if(spec.existingCollider)for(const side of [-1,1])for(const y of [.42,.95,1.48])
  b.put(atlasRegion(new THREE.PlaneGeometry(.46,.46),0,352,160,160).rotateY(side*Math.PI/2).translate(side*.5206,y,0),'print');
 return {productButtons,collectionTarget:{position:[-.075,.40,.409],width:.63,height:.22}};
}

// One draw highlights every instance of the selected product. The first two
// products recur twice per shelf; drawRange controls the second column set.
export function createVendingSelectionLamp(){
 const parts=[];
 for(const col of [0,4])for(let row=0;row<3;row++){
  const indexed=new THREE.CircleGeometry(1,12).scale(.033,.0085,1).translate(col*.118,row*.28,0);
  const geometry=indexed.toNonIndexed();indexed.dispose();parts.push(geometry);
 }
 const geometry=mergeGeometries(parts,false);parts.forEach(part=>part.dispose());
 const lamp=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:'#d8f3d7'}));
 lamp.position.set(buttonX(0),buttonY(0),.514);lamp.name='Selected product button';
 return lamp;
}

export function setVendingSelectionLamp(lamp,index){
 lamp.position.x=buttonX(index);lamp.geometry.setDrawRange(0,(index<2?6:3)*12*3);
}
