// Keep the entire existing pedestal on the public side of a mapped wall.
// This is a clearance repair, not a claim of surveyed statue coordinates.
export function statueWallShift(center,corners,walls,publicPoint,margin=.22){
 let result=[0,0],closest=Infinity;
 for(const wall of walls)for(let i=1;i<wall.points.length;i++){
  const a=wall.points[i-1],b=wall.points[i],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz;if(!l2)continue;
  const t=((center[0]-a[0])*dx+(center[1]-a[1])*dz)/l2;if(t<0||t>1)continue;
  const q=[a[0]+t*dx,a[1]+t*dz],distance=Math.hypot(center[0]-q[0],center[1]-q[1]);if(distance>2||distance>=closest)continue;
  const len=Math.sqrt(l2);let nx=-dz/len,nz=dx/len;
  if((publicPoint[0]-q[0])*nx+(publicPoint[1]-q[1])*nz<0){nx=-nx;nz=-nz;}
  const min=Math.min(...corners.map(p=>(p[0]-q[0])*nx+(p[1]-q[1])*nz));
  const move=Math.max(0,(wall.tags?.barrier==='hedge'?.38:.17)+margin-min);closest=distance;result=[nx*move||0,nz*move||0];
 }
 return result;
}
