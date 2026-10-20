// Conservative clearance for the eye and near clipping plane. Uses the same
// graded terrain as rendering; no scene-wide raycast on every frame.
export function orbitFloor(x,z,height,radius=.6,clearance=1.2){
  let floor=-Infinity;
  for(const [dx,dz] of [[0,0],[-radius,0],[radius,0],[0,-radius],[0,radius],[-radius,-radius],[-radius,radius],[radius,-radius],[radius,radius]]){
    const y=height(x+dx,z+dz);
    if(Number.isFinite(y))floor=Math.max(floor,y+clearance);
  }
  return floor;
}

export function protectOrbit(camera,controls,height){
  const floor=orbitFloor(camera.position.x,camera.position.z,height);
  const correction=Math.max(0,floor-camera.position.y);
  if(correction){camera.position.y=floor;camera.lookAt(controls.target);}
  return {floor,correction,clearance:camera.position.y-floor};
}
