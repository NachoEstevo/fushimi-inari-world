import {SpatialCollisionWorld} from './collision.mjs';
export const visitorRadius=.48;
export function visitorClearance(assembly){
 const world=new SpatialCollisionWorld(4);
 for(const c of assembly.colliders){const a=c.args;if(a[0]<-160||a[0]>120||a[1]<-100||a[1]>100)continue;world[c.type==='box'?'addBox':'addCylinder'](...a);}
 return (x,z)=>{const y=assembly.walkHeight(x,z);if(!Number.isFinite(y))return false;
  const p=world.resolvePlayer(x,y+1.55,z,visitorRadius);
  // resolvePlayer intentionally has no normal at a cylinder's exact centre.
  const center=(world.grid.get(world._key(Math.floor(x/4),Math.floor(z/4)))??[]).some(c=>Math.hypot(x-c.x,z-c.z)<1e-4&&y+1.7>=c.yMin&&y<=c.yMax);
  return !center&&Math.hypot(p.x-x,p.z-z)<.001;
 };
}
export function planVisitorRoutes(assembly){
 const clear=visitorClearance(assembly),groups=new Map(),routes=[];
 for(const s of assembly.surfaces.segments){if(s.stair||s.kind==='restricted'||s.width<2.2)continue;if(!groups.has(s.id))groups.set(s.id,[]);groups.get(s.id).push(s);}
 for(const zone of ['reception','entrance','temizuya','romon','gehaiden','naihaiden']){
  const anchor=assembly.spatial.byId[zone];if(!anchor)continue;
  const candidates=[];
  for(const [id,segments]of groups){const ordered=[...segments].sort((a,b)=>a.distance-b.distance);
   for(let start=0;start<ordered.length;start++){
    const points=[];let length=0,previous=null;
    for(let j=start;j<ordered.length&&length<6;j++){
     const s=ordered[j],l=Math.hypot(s.b[0]-s.a[0],s.b[2]-s.a[2]);if(previous&&Math.hypot(previous[0]-s.a[0],previous[1]-s.a[2])>.05)break;
     if(Math.hypot(s.a[0]-anchor.target[0],s.a[2]-anchor.target[2])>20)break;
     const count=Math.ceil(l/.2);
     for(let k=0;k<=count;k++){const t=k/count,x=s.a[0]+(s.b[0]-s.a[0])*t,z=s.a[2]+(s.b[2]-s.a[2])*t,y=assembly.walkHeight(x,z);if(!points.length||Math.hypot(points.at(-1)[0]-x,points.at(-1)[2]-z)>.01)points.push([x,y,z]);}
     length+=l;previous=[s.b[0],s.b[2]];
    }
    if(length<4||points.some(p=>!clear(p[0],p[2]))||points.some((p,i)=>i&&Math.abs(p[1]-points[i-1][1])>.09))continue;
    if(routes.some(r=>r.points.some(a=>points.some(b=>Math.hypot(a[0]-b[0],a[2]-b[2])<1.6))))continue;
    const mid=points[Math.floor(points.length/2)],score=Math.hypot(mid[0]-anchor.target[0],mid[2]-anchor.target[2]);candidates.push({zone,id,points,score});
   }
  }
  candidates.sort((a,b)=>a.score-b.score);if(candidates[0])routes.push(candidates[0]);
 }
 return routes;
}
export function createVisitorState(route,index=0){const p=route.points[0];return {route,x:p[0],y:p[1],z:p[2],target:1,direction:1,pause:1+index*.7,speed:.65+(index%3)*.08,yaw:0,phase:index,state:'pause',travel:0};}
export function stepVisitor(p,dt,blockers=[]){
 dt=Math.max(0,Math.min(.05,dt));p.travel=0;
 if(p.pause>0){p.pause-=dt;p.state='pause';return;}
 const target=p.route.points[p.target],dx=target[0]-p.x,dz=target[2]-p.z,d=Math.hypot(dx,dz),step=Math.min(d,p.speed*dt);
 const x=d?p.x+dx/d*step:p.x,z=d?p.z+dz/d*step:p.z;
 if(blockers.some(b=>Math.abs(b.y-p.y)<2&&Math.hypot(b.x-x,b.z-z)<1.05)){p.state='yield';return;}
 if(d){p.x=x;p.z=z;p.y+=(target[1]-p.y)*step/d;p.travel=step;const wanted=Math.atan2(dx,dz);p.yaw+=Math.atan2(Math.sin(wanted-p.yaw),Math.cos(wanted-p.yaw))*Math.min(1,dt*7);}
 p.state='walk';p.phase+=step*7;
 if(d<=step+.001){if(p.target===0||p.target===p.route.points.length-1){p.direction*=-1;p.pause=2.5+(p.phase%2);p.state='pause';}p.target+=p.direction;}
}
