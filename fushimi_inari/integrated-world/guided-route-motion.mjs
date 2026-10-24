const length=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);

// Stop BEFORE committing a segment that a live crossing has closed. Progress
// remains at the last safe point, so reopening resumes without a camera jump.
export function advanceGuidedRoute(points,index,travelled,distance,canMove=()=>true){
 if(points.length<2)return {index:0,travelled:0,position:points[0]??null,arrived:true,blocked:false};
 index=Math.min(index,points.length-1);
 let position=index===points.length-1?[...points.at(-1)]:mix(points[index],points[index+1],travelled/Math.max(length(points[index],points[index+1]),1e-8));
 let blocked=false,remaining=Math.max(0,distance);
 while(remaining>0&&index<points.length-1){
  const span=length(points[index],points[index+1]);
  if(span<1e-8){index++;travelled=0;continue;}
  const step=Math.min(remaining,span-travelled),next=mix(points[index],points[index+1],(travelled+step)/span);
  if(!canMove(position,next)){blocked=true;break;}
  position=next;travelled+=step;remaining-=step;
  if(travelled>=span-1e-8){index++;travelled=0;}
 }
 return {index,travelled,position,arrived:index>=points.length-1,blocked};
}
