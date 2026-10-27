import * as THREE from 'three';

// Appearance estimates on the existing warning strips, not surveyed dimensions.
// A fixed 24 m window around the selected doorway avoids full-platform geometry.
export function createStationTactileDetail(station){
 const spec=station?.spec,door=spec?.train?.doorPosition,east=spec?.track?.east;
 if(!station?.group?.isObject3D||!Number.isFinite(spec?.platformFloor)||
  !Array.isArray(door)||door.length!==3||!door.every(Number.isFinite)||
  !Array.isArray(east)||east.length!==2||!east.every(Number.isFinite))return null;
 const runs=[];
 for(const [platform,side]of [[spec.platform2,1],[spec.platform1,-1]]){
  const a=platform?.points?.[side===1?0:1],b=platform?.points?.[side===1?1:2];
  if(!Array.isArray(a)||!Array.isArray(b)||a.length!==2||b.length!==2||![...a,...b].every(Number.isFinite))return null;
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<.06)return null;
  const dx=(b[0]-a[0])/length,dz=(b[1]-a[1])/length,span=Math.min(24,length);
  const center=THREE.MathUtils.clamp((door[0]-a[0])*dx+(door[2]-a[1])*dz,span/2,length-span/2);
  runs.push({a,side,dx,dz,start:center-span/2,columns:Math.floor(span/.06)});
 }
 const count=runs.reduce((n,run)=>n+run.columns*5,0);
 if(!count||count>5000)return null;
 const group=new THREE.Group();group.name='Keihan central tactile relief · High';group.visible=false;
 const geometry=new THREE.CylinderGeometry(.010,.012,.004,6,1);
 const material=new THREE.MeshStandardMaterial({name:'Keihan tactile cap',color:'#d7ae35',roughness:.72,metalness:0,envMapIntensity:.35});
 const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.name='Keihan central warning studs';
 mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=true;
 mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
 const matrix=new THREE.Matrix4();let index=0;
 for(const run of runs)for(let column=0;column<run.columns;column++)for(let row=0;row<5;row++){
  const along=run.start+(column+.5)*.06,across=(row-2)*.06;
  // Match keihan-station's strip centre: edge + track.east * .46 * side.
  // Its base is floor+.002 and height .016; the cap bottom starts at .018.
  matrix.makeTranslation(run.a[0]+run.dx*along+east[0]*.46*run.side+run.dz*across,
   spec.platformFloor+.020,run.a[1]+run.dz*along+east[1]*.46*run.side-run.dx*across);
  mesh.setMatrixAt(index++,matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();
 mesh.matrixAutoUpdate=false;group.add(mesh);station.group.add(group);
 const stats={instances:count,triangles:count*24,draws:0,extraLights:0,spanMetres:24,rows:5,estimated:true};
 let disposed=false;
 return {group,mesh,stats,setEnabled(value){if(disposed)return;group.visible=Boolean(value);stats.draws=Number(group.visible);},
  dispose(){if(disposed)return;disposed=true;group.visible=false;stats.draws=0;group.removeFromParent();geometry.dispose();material.dispose();mesh.dispose();}};
}
