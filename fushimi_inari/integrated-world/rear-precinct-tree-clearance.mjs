const IDS=['way/305214596','way/1287564336'];
function intersects(x,z,r,ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[j],b=ring[i],dx=b[0]-a[0],dz=b[2]-a[2],len=dx*dx+dz*dz;
  if(len){const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/len));if(Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz)<=r)return true;}
  if((a[2]>z)!==(b[2]>z)&&x<(b[0]-a[0])*(z-a[2])/(b[2]-a[2])+a[0])inside=!inside;
 }
 return inside;
}

// Invoke after world transformation and collider conversion, before instance
// partition/LOD. Only confirmed built building IDs may acquire this ownership.
export function clearRearPrecinctLegacyTrees(legacy,features,colliders,builtIds=[]){
 const rings=(features.buildings??[]).filter(b=>IDS.includes(b.id)&&builtIds.includes(b.id)).map(b=>({id:b.id,ring:b.points}));
 const [trunks,sugi,momiji]=legacy.foliage??[];
 if(!rings.length||!trunks||!sugi)return {removed:[],count:0};
 const data=trunks.instanceMatrix.array,sugiCount=Math.floor(sugi.count/2),removed=[];
 const suppress=(mesh,index)=>{mesh.instanceMatrix.array.fill(0,index*16,index*16+16);mesh.instanceMatrix.array[index*16+15]=1;mesh.instanceMatrix.needsUpdate=true;};
 for(let i=0;i<trunks.count;i++){
  const k=i*16;if(data[k]===0&&data[k+5]===0&&data[k+10]===0)continue;
  const x=data[k+12],z=data[k+14],matches=colliders.filter(c=>c.type==='cylinder'&&c.args.at(-1)==='tree'&&Math.hypot(c.args[0]-x,c.args[1]-z)<.001);
  // A missing/ambiguous physical match is not permission to remove scenery.
  if(matches.length!==1)continue;
  const collider=matches[0],radius=collider.args[2],building=rings.find(b=>intersects(x,z,radius,b.ring));if(!building)continue;
  if(i>=sugiCount&&(!momiji||i-sugiCount>=momiji.count))continue;
  suppress(trunks,i);if(i<sugiCount){suppress(sugi,i*2);suppress(sugi,i*2+1);}else suppress(momiji,i-sugiCount);
  colliders.splice(colliders.indexOf(collider),1);removed.push({index:i,x,z,radius,buildingId:building.id});
 }
 if(removed.length)for(const mesh of [trunks,sugi,momiji].filter(Boolean)){mesh.computeBoundingBox?.();mesh.computeBoundingSphere?.();}
 return {count:removed.length,removed};
}
