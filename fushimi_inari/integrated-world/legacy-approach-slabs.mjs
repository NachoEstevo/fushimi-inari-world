const near=(a,b)=>Math.abs(a-b)<1e-6;
export function isLegacyApproachSlab(mesh){
 const p=mesh.geometry?.parameters,q=mesh.position;if(!mesh.isMesh||!p||!q)return false;
 const match=(w,h,d,z)=>near(p.width,w)&&near(p.height,h)&&near(p.depth,d)&&near(q.z,z);
 return match(36,.36,30,37.5)||match(9.2,.06,28.5,36.8)||match(44,.05,5.2,49.5)||match(.42,.06,3.6,49.5);
}
// Only the existing entrance parent containing all three exact obsolete floor
// signatures is eligible. Paths/terrain now own those outdoor surfaces.
export function clearLegacyApproachSlabs(root){
 const parents=[];root.traverse(o=>{if(!o.isGroup)return;const slabs=o.children.filter(isLegacyApproachSlab);if(slabs.some(m=>m.geometry.parameters.width===36)&&slabs.some(m=>m.geometry.parameters.width===9.2)&&slabs.some(m=>m.geometry.parameters.width===44))parents.push(o);});
 if(parents.length!==1)return {removed:0,reason:'unique original entrance floor group not found'};
 const matches=parents[0].children.filter(isLegacyApproachSlab);
 const stripes=matches.filter(m=>m.geometry.parameters.width===.42);
 if(stripes.length!==9||matches.length!==12)return {removed:0,reason:'original entrance floor component count changed'};
 for(const mesh of matches){mesh.removeFromParent();mesh.geometry.dispose();}
 return {removed:matches.length,slabs:3,stripes:9};
}
