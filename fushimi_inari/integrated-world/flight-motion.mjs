// Unconstrained camera displacement. Walking collisions and terrain are not involved.
export function flightDisplacement(direction,forward,side,vertical,dt,speed,boost=false){
  const [dx,dy,dz]=direction,rightLength=Math.hypot(dx,dz)||1;
  const x=dx*forward-dz/rightLength*side,y=dy*forward+vertical,z=dz*forward+dx/rightLength*side;
  const magnitude=Math.hypot(x,y,z);
  if(!magnitude)return [0,0,0];
  const seconds=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;
  const rate=Number.isFinite(Number(speed))?Math.max(1,Math.min(40,Number(speed))):15;
  const distance=seconds*rate*(boost?3:1)/magnitude;
  return [x*distance,y*distance,z*distance];
}
