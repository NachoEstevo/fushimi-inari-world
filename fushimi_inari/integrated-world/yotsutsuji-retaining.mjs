import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

export const retainingBuilding='way/626313775';
export const retainingEdgeIndex=5;
/** Registered north/downhill annex edge, adjoining the west descending stair. */
export function yotsutsujiRetainingPlan(features,ground,floor=163.45){
  const points=features.buildings?.find(b=>b.id===retainingBuilding)?.points;
  if(points?.length!==9)return null;
  const a=points[5],b=points[6];if(![...a,...b,floor].every(Number.isFinite))return null;
  // Guard this specific edge registration against a changed polygon order.
  if(Math.abs(a[0]-787.155)>.05||Math.abs(a[2]+208.09)>.05||Math.abs(b[0]-795.156)>.05||Math.abs(b[2]+208.078)>.05)return null;
  const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),along=[dx/length,dz/length],inward=[-along[1],along[0]];
  const world=(u,inset)=>[a[0]+along[0]*u+inward[0]*inset,a[2]+along[1]*u+inward[1]*inset];
  const sections=[],count=Math.ceil(length/.65);
  for(let i=0;i<=count;i++){
    const u=length*i/count,p=world(u,.10),q=world(u,.75),h=Math.min(ground(...p),ground(...q),floor-.20);
    if(!Number.isFinite(h))return null;
    sections.push({u,bottom:h-.18,terrain:h});
  }
  return {building:retainingBuilding,edge:retainingEdgeIndex,a:[...a],b:[...b],along,inward,length,floor,sections,world,
    bottom:Math.min(...sections.map(s=>s.bottom)),
    reference:'https://cdn.japan-travel-note.com/images/00523/26.jpg',
    provenance:'Mapped annex north edge beside west stair; rough retaining masonry corroborated by 2013 and article published 2025 photos. Toe from existing terrain; batter, thickness and individual stone shapes estimated.'};
}

/** Replaces one thin foundation only; all geometry stays on its building side. */
export function buildYotsutsujiRetaining(group,plan,material){
  if(!plan||group.children.some(c=>c.userData?.retainingBuilding===plan.building))return null;
  const wall=new THREE.Group();wall.name='Nishimura-tei annex · ground-seated north retaining embankment';
  wall.userData={retainingBuilding:plan.building,edge:plan.edge,reference:plan.reference,provenance:plan.provenance};
  const parts=staticParts(wall),mortar=material.clone();mortar.color.set('#555a4e');
  const stones=['#8b8c7c','#777f70','#a09b87'].map(color=>{const m=material.clone();m.color.set(color);m.roughness=.98;return m;});
  const point=(u,y,inset)=>{const p=plan.world(u,inset);return [p[0],y,p[1]];};
  const quad=(a,b,c,d,m)=>parts.sheet([...a,...c,...b,...a,...d,...c],m);
  // Continuous closed structural body follows sampled terrain at both ends;
  // unlike the former midpoint-bottom box, its west toe cannot hang in space.
  for(let i=0;i<plan.sections.length-1;i++){
    const a=plan.sections[i],b=plan.sections[i+1];
    const p=[point(a.u,a.bottom,.075),point(b.u,b.bottom,.075),point(b.u,plan.floor,.10),point(a.u,plan.floor,.10)];
    const q=[point(a.u,a.bottom,.75),point(b.u,b.bottom,.75),point(b.u,plan.floor,.75),point(a.u,plan.floor,.75)];
    quad(p[0],p[1],p[2],p[3],mortar);quad(q[1],q[0],q[3],q[2],mortar);
    quad(p[3],p[2],q[2],q[3],mortar);quad(q[0],q[1],p[1],p[0],mortar);
    if(i===0)quad(q[0],p[0],p[3],q[3],mortar);
    if(i===plan.sections.length-2)quad(p[1],q[1],q[2],p[2],mortar);
  }
  const bottomAt=u=>{
    const t=Math.min(plan.sections.length-1.000001,u/plan.length*(plan.sections.length-1)),i=Math.floor(t),f=t-i;
    return plan.sections[i].bottom+(plan.sections[i+1].bottom-plan.sections[i].bottom)*f;
  };
  // Irregular fitted fieldstone faces, not a copied photographic texture or a
  // claim that these individual stones were surveyed. Crop against the sloped toe.
  const clip=(poly,value,above)=>{
    const out=[];for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length],da=(a[1]-value(a[0]))*(above?1:-1),db=(b[1]-value(b[0]))*(above?1:-1);
      if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
    }return out;
  };
  let stoneCount=0;
  for(let row=0,y=plan.bottom; y<plan.floor;row++,y+=.51){
    for(let col=0,u=0;u<plan.length;col++){
      const width=.68+.30*(.5+.5*Math.sin(row*2.31+col*3.7)),end=Math.min(plan.length,u+width),h=.44+.06*Math.sin(col*2.8+row);
      const offset=.11*Math.sin(col*1.73+row*2.37),base=y+offset;
      let polygon=[[u+.018,base+.10],[Math.min(end,u+.12),base+.025],[end-.02,base+.06],[end-.015,base+h-.08],[Math.max(u+.03,end-.13),base+h],[u+.025,base+h-.06]];
      if(end-u<.18){u=end;continue;}
      polygon=clip(clip(polygon,x=>bottomAt(x)+.025,true),()=>plan.floor-.018,false);
      if(polygon.length>=3){
        const cx=polygon.reduce((n,p)=>n+p[0],0)/polygon.length,cy=polygon.reduce((n,p)=>n+p[1],0)/polygon.length;
        const front=(x,y,push)=>point(x,y,.075+.025*(y-bottomAt(x))/(plan.floor-bottomAt(x))-push);
        const centre=front(cx,cy,.045),m=stones[(row+col)%stones.length];
        for(let i=0;i<polygon.length;i++)parts.sheet([...centre,...front(...polygon[(i+1)%polygon.length],.008),...front(...polygon[i],.008)],m);
        stoneCount++;
      }
      u=end;
    }
  }
  const stats={...parts.flush(),stones:stoneCount,length:plan.length,minToe:plan.bottom,top:plan.floor,building:plan.building,edge:plan.edge};
  wall.userData.stats=stats;group.add(wall);return stats;
}
