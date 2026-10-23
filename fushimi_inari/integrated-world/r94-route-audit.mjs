// Explicit source-way sampling supplements the shortest-route sector itinerary.
// This certifies only sampled lanes, not full width or architectural fidelity.
export const r94RouteSpecs=Object.freeze([
 {id:'senbon-260121328',ways:['way/260121328']},
 {id:'senbon-377968455',ways:['way/377968455']},
 {id:'tamayama-okumiya',ways:['way/1133055117','way/297888105','way/1133055118','way/1133055119','way/626313768','way/1392716577'],walkingOffsets:[-.6,.6],laneReason:'626313768 mapped handrail:center=yes; video iqK2tg-TxbY 06:05 shows central twin dividing rail. Centreline is diagnostic, walking lanes pass either side.'},
]);

export function auditR94Routes(features,walkHeight,obstacles,{spacing=.25,laneOffsets=[0]}={}){
 if(!(spacing>0&&Number.isFinite(spacing))||!laneOffsets.length||!laneOffsets.every(Number.isFinite))throw Error('Invalid route sampling options');
 return r94RouteSpecs.map(spec=>{
  const paths=spec.ways.map(id=>features.paths.find(p=>p.id===id));
  const missing=spec.ways.filter((_,i)=>!paths[i]);
  if(missing.length)return {...spec,topology:'missing-source',missing,walking:'inspect',lanes:[]};
  const chain=[];let lastNode;
  for(const source of paths){
   let points=source.points,nodes=source.nodeIds;
   if(lastNode!==undefined&&nodes[0]!==lastNode){
    if(nodes.at(-1)!==lastNode)return {...spec,topology:'disconnected-source',walking:'inspect',lanes:[]};
    points=[...points].reverse();nodes=[...nodes].reverse();
   }
   chain.push(...points.slice(chain.length?1:0));lastNode=nodes.at(-1);
  }
  const lanes=[],required=spec.walkingOffsets??laneOffsets;
  const offsets=[...new Set([...laneOffsets,...required])];
  for(const offset of offsets){
   const samples=[];
   for(let i=1;i<chain.length;i++){
    const a=chain[i-1],b=chain[i],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);
    if(!length)continue;
    const n=Math.max(1,Math.ceil(length/spacing));
    for(let j=0;j<=n;j++)samples.push([a[0]+dx*j/n-dz/length*offset,a[2]+dz*j/n+dx/length*offset]);
   }
   for(const [direction,list]of [['forward',samples],['reverse',[...samples].reverse()]]){
    let previous,maxJump=0,blocked=0,invalid=0;const examples=[];
    for(const [x,z]of list){
     const y=walkHeight(x,z,previous);
     if(!Number.isFinite(y)){invalid++;previous=undefined;if(examples.length<5)examples.push({x,z,invalid:true});continue;}
     const jump=previous===undefined?0:Math.abs(y-previous);previous=y;maxJump=Math.max(maxJump,jump);
     const resolved=obstacles.resolvePlayer(x,y+1.7,z),correction=Math.hypot(resolved.x-x,resolved.z-z);
     if(!Number.isFinite(correction))invalid++;else if(correction>.35)blocked++;
     if((jump>.4||correction>.35||!Number.isFinite(correction))&&examples.length<5)examples.push({x,z,y,jump,correction});
    }
    lanes.push({offset,role:required.includes(offset)?'walking':'diagnostic',direction,samples:list.length,maxJump,blocked,invalid,examples});
   }
  }
  return {...spec,topology:'connected-source',walking:lanes.some(l=>l.role==='walking'&&(l.maxJump>.4||l.blocked||l.invalid))?'inspect':'sampled-lanes-clear',lanes};
 });
}
