export function walkingSpeed(selected,boost=false){
  const value=Number(selected);
  return Math.max(1.6,Math.min(10,Number.isFinite(value)?value:3))*(boost?1.5:1);
}
// Each collision query advances less than the player radius even at fast speed.
export function movementSteps(dt,speed){
  const distance=Math.max(0,Math.min(dt,.1))*speed;
  const count=Math.max(1,Math.ceil(distance/.12));
  return {count,distance:distance/count};
}
