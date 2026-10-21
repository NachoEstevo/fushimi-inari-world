import * as THREE from 'three';

// June 2012 east-facing street view: a donor name board on open timber
// framing, behind the lane shoulder. Dimensions and exact offset are inferred.
export function buildAzumamaroCourtDetails(root,features,surfaces,materials,colliders){
  const house=features.buildings.find(b=>b.id==='way/305214616');
  const lane=features.paths.find(p=>p.id==='way/223276650');
  const edgeBuilding=features.buildings.find(b=>b.id==='way/305214610');
  if(!house||!lane||lane.points.length<2||!edgeBuilding)return null;
  const laneHead=lane.points[0],east=Math.max(...house.points.map(p=>p[0]));
  const start=Math.max(east+3,laneHead[0]+2.15);
  const end=Math.min(...edgeBuilding.points.map(p=>p[0]))-.5;
  const z=laneHead[2]-.12,width=end-start;
  if(width<2)return null;
  const distance=(x,z,a,b)=>{
    const dx=b[0]-a[0],dz=b[2]-a[2],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz||1)));
    return Math.hypot(x-a[0]-t*dx,z-a[2]-t*dz);
  };
  const clear=(x,z)=>!features.paths.some(p=>p.points.slice(1).some((b,i)=>distance(x,z,p.points[i],b)<1.8));
  // This narrow strip sits between the mapped service lane and the small east
  // building. Do not stretch the detail across a path if source geometry changes.
  if(!clear(start,z)||!clear(end,z))return null;
  const group=new THREE.Group();group.name='Azumamaro lateral donor plaque board and planted shoulder';root.add(group);
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#c9b992';ctx.fillRect(0,0,128,256);
  // Tiny broken ink marks evoke inscriptions without inventing donor names.
  ctx.strokeStyle='#635d50';ctx.lineWidth=3;
  for(let row=0;row<12;row++){
    const y=18+row*18;
    ctx.beginPath();ctx.moveTo(56+(row%3)*3,y);ctx.lineTo(69,y+5);ctx.moveTo(65,y-2);ctx.lineTo(61,y+11);
    if(row%2===0){ctx.moveTo(52,y+8);ctx.lineTo(74,y+8);}ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const plaque=new THREE.MeshStandardMaterial({map:texture,roughness:1});
  const timber=new THREE.MeshStandardMaterial({color:'#777b71',roughness:1});
  const iron=new THREE.MeshStandardMaterial({color:'#54584f',roughness:.92,metalness:.22});
  const dummy=new THREE.Object3D(),matrices=[],center=(start+end)/2;
  const put=(x,y,z,sx,sy,sz)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,0,0);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();matrices.push(dummy.matrix.clone());};
  const box=(w,h,d,x,y,z,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;group.add(m);return m;};
  // Three rows of separate donor plaques sit above the open support legs.
  const slats=Math.floor(width/.10),tierHeight=.42;
  for(let tier=0;tier<3;tier++)for(let i=0;i<slats;i++){
    const x=start+(i+.5)*width/slats,y=surfaces.terrainHeight(x,z);
    put(x,y+.66+tier*tierHeight+tierHeight/2,z,width/slats-.009,tierHeight-.025,.035);
  }
  const plaques=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),plaque,matrices.length);
  matrices.forEach((m,i)=>plaques.setMatrixAt(i,m));plaques.receiveShadow=true;plaques.name='Three tiers of tan donor plaques with indistinct ink marks';group.add(plaques);
  const bays=Math.ceil(width/2.1);
  for(let i=0;i<=bays;i++){
    const x=start+i*width/bays,y=surfaces.terrainHeight(x,z);
    box(.095,1.95,.10,x,y+.975,z,timber);
  }
  for(let i=0;i<bays;i++){
    const x=start+(i+.5)*width/bays,y=surfaces.terrainHeight(x,z);
    for(const h of [.24,.65,1.07,1.49,1.92])box(width/bays+.035,.045,.065,x,y+h,z-.025,timber);
    colliders.push({type:'box',args:[x,z,width/bays/2,.09,0,y,y+1.95,'azumamaro_lateral_donor_board']});
  }
  box(width+.22,.07,.30,center,surfaces.terrainHeight(center,z)+2.04,z,iron).name='Shallow protective cap above donor board';
  const blade=new THREE.BufferGeometry();blade.setAttribute('position',new THREE.Float32BufferAttribute([-.022,0,0,.022,0,0,.035,.27,0],3));blade.computeVertexNormals();
  const grassMat=new THREE.MeshStandardMaterial({color:'#72854c',roughness:1,side:THREE.DoubleSide});
  const planting=new THREE.InstancedMesh(blade,grassMat,240);
  for(let i=0;i<240;i++){
    const x=start+((i*73)%239)/239*width,pz=z+.30+((i*47)%239)/239*.30;
    dummy.position.set(x,surfaces.terrainHeight(x,pz)+.015,pz);
    dummy.rotation.set(.15*Math.sin(i),i*2.39996,.15*Math.cos(i));dummy.scale.set(1,.65+(i%5)*.14,1);dummy.updateMatrix();
    planting.setMatrixAt(i,dummy.matrix);
  }
  planting.receiveShadow=true;planting.name='Grass behind open donor-board support legs';group.add(planting);
  // A flat lane drain adds the observed service-court texture without a step.
  const gx=laneHead[0]+.20,gz=laneHead[2]+.85,gy=surfaces.height(gx,gz)+.012;
  box(.53,.014,.37,gx,gy,gz,iron).name='Flush rectangular side-lane drain';
  for(let i=0;i<8;i++)box(.018,.008,.32,gx-.22+i*.063,gy+.011,gz,timber);
  const lx=lane.points[1][0]-laneHead[0],lz=lane.points[1][2]-laneHead[2],laneLength=Math.hypot(lx,lz)||1;
  const coverDistance=Math.min(4.1,laneLength*.8);
  const coverZ=laneHead[2]+lz/laneLength*coverDistance,coverX=laneHead[0]+lx/laneLength*coverDistance;
  const coverY=surfaces.height(coverX,coverZ)+.008;
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,.012,32),materials.entryStoneMat);
  rim.position.set(coverX,coverY,coverZ);rim.receiveShadow=true;rim.name='Flush circular utility-cover rim';group.add(rim);
  const cover=new THREE.Mesh(new THREE.CylinderGeometry(.30,.30,.015,32),iron);
  cover.position.set(coverX,coverY+.004,coverZ);cover.receiveShadow=true;cover.name='Circular side-passage utility cover';group.add(cover);
  const metadata={sourceFeatures:[house.id,lane.id,edgeBuilding.id],extent:[start,end,z],donorPlaques:slats*3,
    provenance:'June 2012 east-facing street screenshot; donor plaque tiers, cap and open support framing observed, placement and dimensions inferred from mapped lane and adjacent buildings'};
  group.userData.provenance=metadata;return metadata;
}
