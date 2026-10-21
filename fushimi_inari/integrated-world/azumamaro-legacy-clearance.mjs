// The photograph shows a small trained pine beside this entrance. Exclude only
// legacy sugi planted in that immediate garden; mapped woodland remains intact.
// Invoke after legacy instances and colliders have been transformed to world space,
// before partitionInstances builds their rendered chunks and crown LODs.
export function clearAzumamaroLegacySugi(legacy,features,colliders){
  const path=features.paths.find(p=>p.id==='way/105449706');
  const trunks=legacy.foliage?.[0],crowns=legacy.foliage?.[1];
  if(!path||path.points.length<2||!trunks||!crowns)return 0;
  const a=path.points[1],b=path.points[0],length=Math.hypot(b[0]-a[0],b[2]-a[2]);
  if(length<1)return 0;
  const fx=(b[0]-a[0])/length,fz=(b[2]-a[2])/length;
  const gx=a[0]+fx*5.1,gz=a[2]+fz*5.1,removed=[];
  // The source builder stores all sugi first, with two crown instances per tree;
  // maple trunks follow them in the shared trunk mesh and are deliberately kept.
  const sugiCount=Math.min(trunks.count,Math.floor(crowns.count/2));
  const data=trunks.instanceMatrix.array;
  const suppress=(mesh,index)=>{
    const start=index*16;
    mesh.instanceMatrix.array.fill(0,start,start+16);
    mesh.instanceMatrix.array[start+15]=1;
  };
  for(let i=0;i<sugiCount;i++){
    const start=i*16,x=data[start+12],z=data[start+14];
    if(data[start]===0&&data[start+5]===0&&data[start+10]===0)continue;
    const dx=x-gx,dz=z-gz,across=dx*fz-dz*fx,along=dx*fx+dz*fz;
    if(Math.abs(across)>=15.5||along< -5||along>14)continue;
    removed.push([x,z]);suppress(trunks,i);suppress(crowns,i*2);suppress(crowns,i*2+1);
  }
  if(!removed.length)return 0;
  trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;
  // Preserve the array identity held by the collision world. Only matching tree
  // trunks lose their blocker; authored pine and all other scene tags survive.
  for(let i=colliders.length-1;i>=0;i--){
    const c=colliders[i];
    if(c.type==='cylinder'&&c.args.at(-1)==='tree'&&
      removed.some(([x,z])=>Math.hypot(c.args[0]-x,c.args[1]-z)<.08))colliders.splice(i,1);
  }
  trunks.computeBoundingBox?.();trunks.computeBoundingSphere?.();
  crowns.computeBoundingBox?.();crowns.computeBoundingSphere?.();
  return removed.length;
}
