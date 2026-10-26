// Immutable broad phase for authored vegetation clearance. Builders collect new
// colliders separately and append them after placement, so their query snapshot
// deliberately excludes their own pending additions.
export function createPlanarOccupancy(colliders,{clearance=.18,cellSize=16}={}) {
 const cells=new Map();
 for(const collider of colliders){
  if(!['cylinder','box'].includes(collider.type))continue;
  const a=collider.args,box=collider.type==='box',cos=Math.cos(a[4]??0),sin=Math.sin(a[4]??0);
  const entry={box,x:a[0],z:a[1],rx:a[2],rz:box?a[3]:a[2],cos,sin};
  const ex=box?Math.abs(cos)*entry.rx+Math.abs(sin)*entry.rz:entry.rx;
  const ez=box?Math.abs(sin)*entry.rx+Math.abs(cos)*entry.rz:entry.rz;
  for(let x=Math.floor((entry.x-ex)/cellSize);x<=Math.floor((entry.x+ex)/cellSize);x++)
   for(let z=Math.floor((entry.z-ez)/cellSize);z<=Math.floor((entry.z+ez)/cellSize);z++){
    const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(entry);
   }
 }
 return (x,z,r)=>{
  const padding=r+clearance;
  // A rotated box's local-axis padding projects onto both world axes. sqrt(2)
  // is a conservative bound for every yaw, retaining exact original tests below.
  const reach=padding*Math.SQRT2;
  for(let ix=Math.floor((x-reach)/cellSize);ix<=Math.floor((x+reach)/cellSize);ix++)
   for(let iz=Math.floor((z-reach)/cellSize);iz<=Math.floor((z+reach)/cellSize);iz++)
    for(const c of cells.get(ix+','+iz)??[]){
     const dx=x-c.x,dz=z-c.z;
     if(c.box?Math.abs(dx*c.cos-dz*c.sin)<c.rx+r+clearance&&Math.abs(dx*c.sin+dz*c.cos)<c.rz+r+clearance:Math.hypot(dx,dz)<c.rx+r+clearance)return true;
    }
  return false;
 };
}
