import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildToriiInscriptions,toriiInkTile,toriiInkTiles,toriiInkAtlas,toriiInkUvBounds,toriiInkTileLayout,toriiInkPlacement,initialToriiInscriptionProfile} from './torii-inscriptions.mjs';
import {toriiInscriptionRecords} from './torii-inscription-records.mjs';

const painted=[];
let canvasCount=0;
globalThis.document={createElement:()=>{canvasCount++;return {width:0,height:0,getContext:()=>({
 save(){},restore(){},translate(){},scale(){},rotate(){},fillText(text){painted.push({text,font:this.font,color:this.fillStyle,alpha:this.globalAlpha});},
})};}};
const options={halfSpan:1.24,bottomRadius:.135,topRadius:.122,bottomY:.65,topY:3.27};
const pairedIndex=toriiInscriptionRecords.findIndex(record=>record.donorLines.length&&record.date);
const make=(extra={},entry={})=>{const root=new THREE.Group();buildToriiInscriptions(root,[{m:new THREE.Matrix4(),recordIndex:pairedIndex,...entry}],{...options,...extra});root.updateMatrixWorld(true);return root;};
const meshes=root=>{const result=[];root.traverse(o=>{if(o.isMesh)result.push(o);});return result;};
const triangles=root=>meshes(root).reduce((n,m)=>n+m.geometry.attributes.position.count/3,0);

test('front preserves 奉 / 納 with eight stable treatments; reverse uses one complete source record',()=>{
 assert.ok(toriiInscriptionRecords.length>8&&toriiInscriptionRecords.length<=24);
 assert.equal(toriiInkTiles.length,toriiInscriptionRecords.length*2+16);
 for(let recordIndex=0;recordIndex<toriiInscriptionRecords.length;recordIndex++){
  const record=toriiInscriptionRecords[recordIndex],entry={recordIndex,dateInscription:(recordIndex+3)%toriiInscriptionRecords.length};
  assert.equal(toriiInkTiles[toriiInkTile(entry,-1,true)],'奉');assert.equal(toriiInkTiles[toriiInkTile(entry,1,true)],'納');
  const donor=toriiInkTile(entry,-1,false),date=toriiInkTile(entry,1,false);
  assert.equal(donor<0?'':toriiInkTiles[donor],record.donorLines.join('\n'));
  assert.equal(date<0?null:toriiInkTiles[date],record.date);
  if(donor>=0&&date>=0)assert.equal(record.pairing,'same-gate-visible');
  assert.equal(toriiInkTile({inscription:recordIndex,dateInscription:0},1,false),date,'legacy date index cannot mix source records');
 }
 assert.equal(new Set(Array.from({length:8},(_,inkStyle)=>toriiInkTile({inkStyle},-1,true))).size,8);
 assert.equal(toriiInkTile({recordIndex:pairedIndex,inscription:0},1,false),pairedIndex*2+1);
});

test('tategaki uses ordered source glyphs, square physical aspect and fitted long columns',()=>{
 const treatments=new Set();
 for(let tile=0;tile<toriiInkTiles.length;tile++){
  const layout=toriiInkTileLayout(tile),text=toriiInkTiles[tile];
  assert.equal(layout.glyphs.map(glyph=>glyph.char).join(''),text.replaceAll('\n','').replaceAll('（有）','㈲').replaceAll('（株）','㈱'));
  treatments.add(JSON.stringify(layout.style));
  for(const glyph of layout.glyphs){
   assert.ok(glyph.x-glyph.size/2>=2&&glyph.x+glyph.size/2<=126,'glyph fits tile width');
   assert.ok(glyph.y-glyph.size*layout.scaleY/2>=2&&glyph.y+glyph.size*layout.scaleY/2<=254,'glyph fits tile height');
  }
  for(let i=1;i<layout.glyphs.length;i++)if(layout.glyphs[i].x===layout.glyphs[i-1].x)assert.ok(layout.glyphs[i].y>layout.glyphs[i-1].y);
  const aspect=(layout.front?.585:.108)*(252/124)/layout.scaleY;
  assert.ok(aspect>.95&&aspect<1.06,'glyph aspect compensates the nominal post patch');
  if(!layout.front&&text)assert.equal(layout.role,tile%2?'date':'donor');
 }
 assert.equal(treatments.size,8);
});

test('observed company abbreviations paint as one upright square within their UV cell',()=>{
 for(const [literal,compact] of [['（有）','㈲'],['（株）','㈱']]){
  const tile=toriiInkTiles.findIndex(text=>text.includes(literal));assert.ok(tile>=0);
  const source=toriiInkTiles[tile],layout=toriiInkTileLayout(tile),bounds=toriiInkUvBounds(tile);
  const glyph=layout.glyphs.find(glyph=>glyph.char===compact);assert.ok(glyph);
  assert.equal(glyph.rotate,false);assert.ok(!layout.glyphs.some(glyph=>'（）'.includes(glyph.char)));
  assert.equal(layout.glyphs.length,[...source].length-2,'three source characters become one painted abbreviation');
  const left=tile%toriiInkAtlas.columns*toriiInkAtlas.tileWidth,top=Math.floor(tile/toriiInkAtlas.columns)*toriiInkAtlas.tileHeight;
  const uMin=(left+glyph.x-glyph.size/2)/toriiInkAtlas.width,uMax=(left+glyph.x+glyph.size/2)/toriiInkAtlas.width;
  const vMin=1-(top+glyph.y+glyph.size*layout.scaleY/2)/toriiInkAtlas.height,vMax=1-(top+glyph.y-glyph.size*layout.scaleY/2)/toriiInkAtlas.height;
  assert.ok(uMin>=bounds.uMin&&uMax<=bounds.uMax&&vMin>=bounds.vMin&&vMax<=bounds.vMax,'complete square glyph stays inside sampled tile');
  const nominalWidth=.108*(uMax-uMin)/(bounds.uMax-bounds.uMin),nominalHeight=(vMax-vMin)/(bounds.vMax-bounds.vMin);
  assert.ok(nominalWidth/nominalHeight>.95&&nominalWidth/nominalHeight<1.06,'abbreviation retains square physical aspect');
  assert.equal(toriiInkTiles[tile],source);assert.ok(toriiInkTiles[tile].includes(literal),'source transcription remains literal');
 }
});

test('every atlas UV rectangle remains inside its own row and column',()=>{
 for(let tile=0;tile<toriiInkTiles.length;tile++){
  const bounds=toriiInkUvBounds(tile),column=tile%toriiInkAtlas.columns,row=Math.floor(tile/toriiInkAtlas.columns);
  assert.ok(bounds.uMin>column/16&&bounds.uMax<(column+1)/16);
  assert.ok(bounds.vMin>1-(row+1)/4&&bounds.vMax<1-row/4);
 }
 assert.throws(()=>toriiInkUvBounds(-1),RangeError);
 assert.throws(()=>toriiInkUvBounds(toriiInkTiles.length),RangeError);
});

test('repeated source records retain text while placements vary deterministically along a tunnel',()=>{
 const layouts=[];
 for(let i=0;i<32;i++){
  const entry={m:new THREE.Matrix4().makeTranslation(i*.57,0,0),recordIndex:pairedIndex,inkStyle:i%8};
  const reverse=toriiInkPlacement(entry,-1,false,true),front=toriiInkPlacement(entry,1,true,true);
  assert.deepEqual(reverse,toriiInkPlacement(entry,-1,false,true));
  assert.ok(reverse.low>.55&&reverse.high<1.65);assert.ok(front.low>1.35&&front.high<1.8);
  assert.ok(reverse.size>=.94&&reverse.size<=1.06);
  assert.equal(toriiInkTiles[toriiInkTile(entry,-1,false)],toriiInscriptionRecords[pairedIndex].donorLines.join('\n'));
  layouts.push(`${reverse.size}:${reverse.low.toFixed(3)}`);
 }
 assert.ok(new Set(layouts).size>20,'identical records do not produce identical painted placement');
});

test('raycasts from uphill and downhill encounter the correct ink face and atlas cell',()=>{
 const root=make();
 for(const front of [true,false])for(const side of [-1,1]){
  const z=front?-1:1,y=front?2.17:1.4,ray=new THREE.Raycaster(new THREE.Vector3(side*1.24,y,z),new THREE.Vector3(0,0,-z),0,2);
  const hit=ray.intersectObject(root,true)[0],bounds=toriiInkUvBounds(toriiInkTile({recordIndex:pairedIndex},side,front));
  assert.ok(hit);assert.ok(hit.uv.x>=bounds.uMin&&hit.uv.x<=bounds.uMax);assert.ok(hit.uv.y>=bounds.vMin&&hit.uv.y<=bounds.vMax);
  assert.equal(Math.sign(hit.point.z),Math.sign(z));assert.ok(hit.face.normal.z*z>0);
 }
});

test('thick-post ink facet interiors cannot sink into the tapered post or widen its lettering',()=>{
 let nominalWidth;
 for(const thickness of [1,1.22,1.45])for(const small of [false,true]){
  const root=make({small},{thickness});let maxFrontX=0;
  for(const mesh of meshes(root)){
   const p=mesh.geometry.attributes.position;
   for(let i=0;i<p.count;i+=3){
    const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3;
    const postX=Math.sign(x)*options.halfSpan,r=(options.bottomRadius+(options.topRadius-options.bottomRadius)*(y-options.bottomY)/(options.topY-options.bottomY))*thickness;
    const gap=Math.hypot(x-postX,z)-r;assert.ok(gap>.0005&&gap<.006,'conforming ink clearance '+gap);
   }
   if(!small)for(let i=0;i<p.count;i++)if(p.getZ(i)<0)maxFrontX=Math.max(maxFrontX,Math.abs(Math.abs(p.getX(i))-options.halfSpan));
  }
  if(!small){if(thickness===1)nominalWidth=maxFrontX;else assert.ok(maxFrontX/nominalWidth<1.1,'thick posts retain similar physical lettering width');}
 }
});

test('missing donor or date is omitted; complete pairs retain the fixed maximum geometry budget',()=>{
 const donorOnly=toriiInscriptionRecords.findIndex(record=>record.donorLines.length&&!record.date);
 const dateOnly=toriiInscriptionRecords.findIndex(record=>!record.donorLines.length&&record.date);
 assert.ok(donorOnly>=0&&dateOnly>=0);
 assert.equal(triangles(make()),48);assert.equal(triangles(make({frontOnly:true})),24);
 assert.equal(triangles(make({}, {recordIndex:donorOnly})),36);assert.equal(triangles(make({}, {recordIndex:dateOnly})),36);
 for(const [recordIndex,side] of [[donorOnly,1],[dateOnly,-1]]){
  const ray=new THREE.Raycaster(new THREE.Vector3(side*1.24,1.4,1),new THREE.Vector3(0,0,-1),0,1);
  assert.equal(ray.intersectObject(make({}, {recordIndex}),true).length,0,'unknown inscription leaves no painted patch');
 }
});

test('all gate records share one cached 8 MiB atlas and one material',()=>{
 const roots=toriiInscriptionRecords.map((_,recordIndex)=>make({}, {recordIndex}));
 const allMeshes=roots.flatMap(meshes);
 assert.equal(new Set(allMeshes.map(mesh=>mesh.material)).size,1);assert.equal(canvasCount,1);
 const atlas=allMeshes[0].material.map.image;
 assert.equal(atlas.width,2048);assert.equal(atlas.height,1024);assert.equal(atlas.width*atlas.height*4,8*1024*1024);
 assert.ok(meshes(make()).length<=4);assert.ok(meshes(make({frontOnly:true})).length<=2);
 assert.ok(painted.filter(p=>p.text==='奉').length>=8);assert.ok(painted.filter(p=>p.text==='納').length>=8);
 assert.ok(new Set(painted.map(p=>p.font)).size>8);assert.ok(new Set(painted.map(p=>p.alpha)).size>4);
});


test('initial tunnel selects complete varied generic inscriptions without claiming donor identities',()=>{
 const entries=Array.from({length:10},(_,i)=>({...initialToriiInscriptionProfile(i),m:new THREE.Matrix4().makeTranslation(i*.6,0,0)}));
 assert.equal(new Set(entries.map(e=>e.recordIndex)).size,10);
 const donors=new Set(),dates=new Set();
 for(const entry of entries){
  const source=toriiInscriptionRecords[entry.recordIndex],donor=toriiInkTiles[toriiInkTile(entry,-1,false)],date=toriiInkTiles[toriiInkTile(entry,1,false)];
  assert.equal(source.donorLines.length,0);assert.equal(date,source.date);
  assert.ok([...donor].length>=4);assert.ok([...date].length>=8);donors.add(donor);dates.add(date);
  assert.equal(toriiInkTile({...entry,initial:false},-1,false),-1,'source date-only records remain unpaired outside initial tunnel');
  assert.deepEqual(initialToriiInscriptionProfile(entries.indexOf(entry)),{recordIndex:entry.recordIndex,inkStyle:entry.inkStyle,initial:true});
 }
 assert.ok(donors.size>=4);assert.equal(dates.size,10);
 const root=new THREE.Group();buildToriiInscriptions(root,entries,{...options,small:true});root.updateMatrixWorld(true);
 assert.equal(triangles(root),entries.length*48);assert.equal(new Set(meshes(root).map(m=>m.material)).size,1);
 for(const [i,entry] of entries.entries())for(const [side,front] of [[-1,false],[1,false],[-1,true],[1,true]]){
  const z=front?-1:1,y=1.05;
  const ray=new THREE.Raycaster(new THREE.Vector3(i*.6+side*options.halfSpan,y,z),new THREE.Vector3(0,0,-z),0,2);
  // Entries are spaced below the gate width, so use a standalone transformed
  // gate for unambiguous ray-to-tile and front/back orientation verification.
  const single=make({small:true},entry),hit=ray.intersectObject(single,true)[0];
  const bounds=toriiInkUvBounds(toriiInkTile(entry,side,front));
  assert.ok(hit);assert.ok(hit.uv.x>=bounds.uMin&&hit.uv.x<=bounds.uMax&&hit.uv.y>=bounds.vMin&&hit.uv.y<=bounds.vMax);
  assert.ok(hit.face.normal.z*z>0);
 }
});


test('initial gates have full upright columns on both faces of both posts',()=>{
 const texts=[new Set(),new Set()];
 for(let i=0;i<10;i++){
  const entry={...initialToriiInscriptionProfile(i),m:new THREE.Matrix4()},root=make({small:true},entry);
  for(const side of [-1,1]){
   const front=toriiInkTile(entry,side,true),back=toriiInkTile(entry,side,false);
   assert.equal(front,back,'same fictional collective/date pairing from each face');
   const layout=toriiInkTileLayout(front);assert.ok(layout.glyphs.length>=4);
   texts[side===1?1:0].add(toriiInkTiles[front]);
   for(const isFront of [true,false]){
    const z=isFront?-1:1,bounds=toriiInkUvBounds(front),placement=toriiInkPlacement(entry,side,isFront,true);
    const hit=y=>new THREE.Raycaster(new THREE.Vector3(side*options.halfSpan,y,z),new THREE.Vector3(0,0,-z),0,2).intersectObject(root,true)[0];
    const low=hit(placement.low+(placement.high-placement.low)*.2),high=hit(placement.low+(placement.high-placement.low)*.8);
    assert.ok(low&&high);assert.ok(high.uv.y>low.uv.y,'vertical characters proceed downwards when viewed');
    assert.ok(high.uv.y<bounds.vMax&&low.uv.y>bounds.vMin);
    assert.equal(Math.sign(high.face.normal.z),Math.sign(z));
    // A screen-right step maps toward higher atlas U from either viewpoint.
    const screenRightX=side*options.halfSpan+(isFront?-.02:.02);
    const right=new THREE.Raycaster(new THREE.Vector3(screenRightX,(placement.low+placement.high)/2,z),new THREE.Vector3(0,0,-z),0,2).intersectObject(root,true)[0];
    const middle=hit((placement.low+placement.high)/2);
    assert.ok(right&&middle&&right.uv.x>middle.uv.x,'glyphs must not mirror on either face');
   }
  }
 }
 assert.ok(texts[0].size>=4&&texts[1].size>=8,'initial donor labels and dates vary by gate');
});
