import {pathOffset} from './path-frame.mjs';
import {subtractConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';

// Only the mapped short upper row approach receives inferred 1 m margins.
// Route interiors, widths and all other path materials retain their owners.
export function tamayamaShoulderPlan(network,obstacles=[]){
  const bounds=p=>[Math.min(...p.map(v=>v[0])),Math.max(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[1]))];
  const overlaps=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];
  const ribbon=(s,index,width)=>{
    const adjacent=(candidate,end)=>candidate?.id===s.id&&Math.hypot(candidate[end][0]-(end==='b'?s.a:s.b)[0],candidate[end][2]-(end==='b'?s.a:s.b)[2])<.001?candidate:null;
    const na=pathOffset(s.a,s.b,adjacent(network.segments[index-1],'b'));
    const nb=pathOffset(s.a,s.b,adjacent(network.segments[index+1],'a'),true);
    return side=>[[s.a[0]+na[0]*width*side,s.a[2]+na[1]*width*side],[s.b[0]+nb[0]*width*side,s.b[2]+nb[1]*width*side]];
  };
  const strips=[];
  for(const [i,s] of network.segments.entries())if(s.id==='way/649175020'&&!s.stair){
    const inner=ribbon(s,i,s.width/2+.13),outer=ribbon(s,i,s.width/2+1.13);
    for(const side of [-1,1])strips.push([...inner(side),...outer(side).reverse()]);
  }
  if(!strips.length)return [];
  const envelope=bounds(strips.flat()),cuts=obstacles.filter(p=>overlaps(envelope,bounds(p)));
  for(const [i,s] of network.segments.entries()){
    const edge=ribbon(s,i,s.width/2+(s.kind==='stone' ? .13 : 0)),cut=[...edge(1),...edge(-1).reverse()];
    if(overlaps(envelope,bounds(cut)))cuts.push(cut);
  }
  const result=[];
  for(const strip of strips){
    let pieces=[strip];const box=bounds(strip);
    for(const cut of cuts)if(overlaps(box,bounds(cut)))pieces=pieces.flatMap(p=>subtractConvex(p,cut));
    result.push(...pieces.filter(p=>Math.abs(polygonArea(p))>1e-8));
  }
  return result;
}
