// Snapshot supplied owners during setup, never during frame updates. Keep each
// batch separate. Admission snapshots do not authorize static render culling.
export function collectInstancePrewarmEntries(roots){
 const entries=[],seen=new Set();
 for(const root of roots)root.traverse(object=>{
  if(seen.has(object)||!object.isInstancedMesh||object.userData.shadowOnly)return;
  seen.add(object);if(!object.boundingSphere)object.computeBoundingSphere();
  const bounds=object.boundingSphere?.clone().applyMatrix4(object.matrixWorld);
  if(bounds&&Number.isFinite(bounds.radius)&&bounds.radius>=0&&bounds.center.toArray().every(Number.isFinite))entries.push({object,bounds});
 });
 return entries;
}
