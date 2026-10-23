import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

// Live primary OSM API checked 2026-10-23. Both POIs/canopy already occur in
// features.json; the red 1m wood paling fence is absent from that filtered file.
export const omokaruRearFenceR96={id:'way/1267860089',nodes:[11775032011,11775032010],points:[[276.500528,66.246229],[277.394525,73.604447]],height:1,
  source:'https://api.openstreetmap.org/api/0.6/way/1267860089/full.json'};
export const omokaruStoneIdsR96=['node/2697500339','node/9664306045'];
export const omokaruCanopyIdR96='way/1051656818';
// Source close photograph: broad shallow stone shoulder, slightly swept lip.
// Keep crown contact at1.559m so the retained orb's baseline remains seated.
export const omokaruLanternCapR96={half:[.222,.195,.135,.065],height:[1.42,1.405,1.46,1.55]};
export function omokaruCobbleLayoutR96(length){
  const stones=[];let seed=9617;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let row=0;row<7;row++){
    let x=-.20*(row%2);
    while(x<length){
      const width=.29+random()*.18,height=.205+random()*.045;
      const left=Math.max(0,x),right=Math.min(length,x+width);
      if(right-left>.06)stones.push({s:(left+right)/2,y:.125+row*.231+(random()-.5)*.025,width:right-left,height,depth:.105+random()*.04,tilt:(random()-.5)*.30});
      x+=width+.012;
    }
  }
  return stones;
}
export function omokaruEaveBracesR96(footprint,base){
  return [[0,3],[3,0],[1,2],[2,1]].map(([from,to])=>{
    const a=footprint[from],b=footprint[to],len=Math.hypot(b[0]-a[0],b[2]-a[2]),reach=Math.min(.46,len*.24);
    return Array.from({length:7},(_,k)=>{const t=k/6;return [a[0]+(b[0]-a[0])*reach/len*t,base+1.99+.44*Math.sqrt(t),a[2]+(b[2]-a[2])*reach/len*t];});
  });
}

export function buildRestBoundaryR96(root,features,materials,colliders,ground){
  if(root.children.some(g=>g.userData.restBoundaryR96))return null;
  const owner=root.children.find(g=>g.userData.zone==='okusha');
  const nodes=omokaruStoneIdsR96.map(id=>features.pois?.find(p=>p.id===id));
  const roof=features.buildings?.find(b=>b.id===omokaruCanopyIdR96);
  if(!owner||nodes.some(n=>!n?.point?.every(Number.isFinite))||roof?.points?.length!==5||typeof ground!=='function')return null;
  const box=(w,h,d,x,z)=>owner.children.find(c=>{const p=c.geometry?.parameters;return p?.width===w&&p.height===h&&p.depth===d&&Math.abs(c.position.x-x)<.001&&Math.abs(c.position.z-z)<.001;});
  const wall=box(1.1,1.85,11.5,-14.5,-.5),backdrop=box(2.6,1.45,.35,6.6,4.45),stele=box(.75,2.1,.32,6.6,4.85);
  const assemblies=[5.75,7.45].map(x=>owner.children.filter(c=>Math.abs(c.position.x-x)<.001&&Math.abs(c.position.z-5.6)<.001&&
    (c.geometry?.parameters?.height===1.45||c.geometry?.parameters?.height===.14||c.geometry?.parameters?.radius===.24)));
  if(!wall||!backdrop||!stele||assemblies.some(a=>a.length!==3||!a.some(c=>c.userData.interactable)))return null;
  owner.updateWorldMatrix(true,true);
  const oldCenters=assemblies.map(a=>a.find(c=>c.userData.interactable).getWorldPosition(new THREE.Vector3()));
  const oldColliders=oldCenters.map(p=>colliders.find(c=>c.type==='cylinder'&&c.args.at(-1)==='omokaru'&&Math.hypot(c.args[0]-p.x,c.args[1]-p.z)<.05));
  const seats=nodes.map(n=>ground(n.point[0],n.point[2]));
  const fp=roof.points.slice(0,-1);const rear=omokaruRearFenceR96.points;
  const rearSeats=rear.map(p=>ground(...p));
  if(oldColliders.some(c=>!c)||[...seats,...rearSeats,...fp.map(p=>ground(p[0],p[2]))].some(y=>!Number.isFinite(y)))return null;
  const group=new THREE.Group();group.name='Mapped Omokaru stones canopy and rear cobble paling boundary R96';
  group.userData={restBoundaryR96:true,sourceIds:[...omokaruStoneIdsR96,omokaruCanopyIdR96,omokaruRearFenceR96.id],
    provenance:'Exact primary OSM POIs, roof outline and fence segment; official Omokaru photograph informs cobble base/canopy. Wall height, roof heights, joinery and cobble sizes estimated.'};
  const p=staticParts(group),stone=materials.entryStoneMat,red=materials.vermilionMat;
  const dark=new THREE.MeshStandardMaterial({color:'#43382b',roughness:.96,side:THREE.DoubleSide}),mortar=new THREE.MeshStandardMaterial({color:'#787a70',roughness:1});
  const cobbleMats=['#858d82','#a1a69a','#727e71'].map(color=>new THREE.MeshStandardMaterial({color,roughness:1}));
  const [a,b]=rear,dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
  // Source fence is east of both mapped stones and the rear public footway.
  // Centered .22m base never uses the old misplaced wall's x/z footprint.
  for(let i=0;i<Math.ceil(len/.30);i++){
    const t=(i+.5)/Math.ceil(len/.30),x=a[0]+dx*t,z=a[1]+dz*t,y=rearSeats[0]+(rearSeats[1]-rearSeats[0])*t;
    const core=new THREE.BoxGeometry(.22,1.65,len/Math.ceil(len/.30)+.005);core.rotateY(Math.atan2(dx,dz));core.translate(x,y+.825,z);p.put(core,mortar);
    const board=new THREE.BoxGeometry(.06,1,.095);board.rotateY(Math.atan2(dx,dz));board.translate(x,y+2.15,z);p.put(board,red);
  }
  const cobbles=omokaruCobbleLayoutR96(len),tangentYaw=Math.atan2(dx,dz);
  for(let i=0;i<cobbles.length;i++){
    const c=cobbles[i],t=c.s/len,y=rearSeats[0]+(rearSeats[1]-rearSeats[0])*t;
    // Local X is the shallow wall normal, Z is its horizontal tangent. The
    // previous implementation accidentally made narrow vertical egg columns.
    const g=new THREE.SphereGeometry(1,8,6);g.scale(c.depth,c.height/2,c.width/2);g.rotateX(c.tilt);g.rotateY(tangentYaw);
    g.translate(a[0]+dx*t+nx*.105,y+c.y,a[1]+dz*t+nz*.105);p.put(g,cobbleMats[i%3]);
    if(i%3===0&&c.y<1.45){const fill=new THREE.SphereGeometry(1,7,5);fill.scale(.07,.035,.065);fill.rotateY(tangentYaw);fill.translate(a[0]+dx*t+nx*.13,y+c.y+c.height/2+.022,a[1]+dz*t+nz*.13);p.put(fill,cobbleMats[(i+1)%3]);}
  }
  for(const h of [1.73,2.45])p.beam([a[0],rearSeats[0]+h,a[1]],[b[0],rearSeats[1]+h,b[1]],.045,red,.045,4);
  // Roof outline is the source polygon, not an invented new footprint.
  const base=Math.max(...seats),cx=fp.reduce((s,q)=>s+q[0],0)/4,cz=fp.reduce((s,q)=>s+q[2],0)/4;
  const ridgeA=[(fp[0][0]+fp[1][0])/2,base+2.85,(fp[0][2]+fp[1][2])/2],ridgeB=[(fp[2][0]+fp[3][0])/2,base+2.85,(fp[2][2]+fp[3][2])/2];
  const v=q=>[q[0],base+2.45,q[2]];
  for(const [u,vv,ra,rb]of [[fp[0],fp[3],ridgeA,ridgeB],[fp[1],fp[2],ridgeA,ridgeB]]){
    // Curved roof courses and broad fascia remain on the mapped polygon.
    for(let k=0;k<8;k++){
      const edge=t=>[u[0]*(1-t)+ra[0]*t,base+2.45+.40*t-.07*Math.sin(Math.PI*t),u[2]*(1-t)+ra[2]*t];
      const back=t=>[vv[0]*(1-t)+rb[0]*t,base+2.45+.40*t-.07*Math.sin(Math.PI*t),vv[2]*(1-t)+rb[2]*t];
      const aa=edge(k/8),bb=edge((k+1)/8),cc=back(k/8),dd=back((k+1)/8);
      p.sheet([...aa,...cc,...bb,...bb,...cc,...dd],dark);
      if(k%2===0)p.beam(aa,cc,.025,dark,.025,4);
    }
    p.beam(v(u),v(vv),.085,dark,.085,4);
  }
  for(const q of fp){
    p.box(.11,2.45,.11,q[0],base+1.225,q[2],dark);
  }
  // Swept knees live in the long-eave planes and finish inside the real eave
  // members (.085 radius at y2.45), rather than below an unsupported roof point.
  for(const path of omokaruEaveBracesR96(fp,base))for(let k=1;k<path.length;k++)p.beam(path[k-1],path[k],.048,dark,.048,6);
  p.beam(ridgeA,ridgeB,.065,dark,.065,4);
  const mid=[(nodes[0].point[0]+nodes[1].point[0])/2,(nodes[0].point[2]+nodes[1].point[2])/2];
  const local=(u,y,v)=>[mid[0]+dx/len*u+nx*v,base+y,mid[1]+dz/len*u+nz*v];
  const localBox=(w,h,d,u,y,v,mat)=>{const g=new THREE.BoxGeometry(w,h,d);g.rotateY(-Math.atan2(dz,dx));g.translate(...local(u,y,v));p.put(g,mat);};
  // Actual central hanging label, no invented instruction board or donor text.
  localBox(.34,.57,.035,0,2.03,.01,dark);localBox(.035,.73,.035,0,1.41,.01,dark);
  const signCanvas=globalThis.document?.createElement?.('canvas'),ctx=signCanvas?.getContext?.('2d');
  if(ctx){
    signCanvas.width=128;signCanvas.height=256;ctx.fillStyle='#bca37e';ctx.fillRect(0,0,128,256);ctx.fillStyle='#29231b';ctx.font='bold 35px serif';ctx.textAlign='center';ctx.textBaseline='middle';
    [...'おもかる石'].forEach((s,i)=>ctx.fillText(s,64,26+i*49));
    const map=new THREE.CanvasTexture(signCanvas);map.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.MeshStandardMaterial({map,roughness:1,side:THREE.DoubleSide});
    const sign=new THREE.PlaneGeometry(.31,.54);sign.rotateY(Math.atan2(nx,nz));sign.translate(...local(0,2.03,.031));p.put(sign,mat,false);
  }
  const offering=new THREE.MeshStandardMaterial({color:'#bb4529',roughness:.89});
  localBox(.48,.46,.31,0,.28,.08,offering);localBox(.52,.045,.35,0,.525,.08,dark);
  localBox(.35,.009,.12,0,.552,.08,materials.goldMat??stone);
  for(let j=0;j<6;j++)localBox(.012,.012,.10,-.14+j*.056,.564,.08,dark);
  localBox(.055,.08,.018,0,.28,.245,dark);
  const lanternStats=[];
  for(let i=0;i<2;i++){
    const g=new THREE.Group();g.position.set(nodes[i].point[0],seats[i],nodes[i].point[2]);group.add(g);const q=staticParts(g);
    q.box(.33,.055,.33,0,.04,0,stone);q.box(.30,.045,.30,0,.085,0,stone);
    q.box(.37,.08,.37,0,.79,0,stone);q.box(.32,.04,.32,0,.855,0,stone);
    // Compact square stone chamber, not four skeletal columns. Four real
    // .13m through-openings sit inside .30m walls with solid stone surrounds.
    q.box(.30,.02,.30,0,.92,0,stone);
    for(const side of [-1,1]){
      const face=side*.1225;
      for(const [height,y]of [[.16,1.01],[.1375,1.28875]]){
        q.box(.30,height,.055,0,y,face,stone);
        // Front/back own the full-width corner blocks. Side walls fit exactly
        // between them, eliminating overlapping coplanar exterior corner faces.
        q.box(.055,height,.19,face,y,0,stone);
      }
      for(const edge of [-1,1]){
        q.box(.085,.13,.055,edge*.1075,1.155,face,stone);
        q.box(.055,.13,.03,face,1.155,edge*.08,stone);
      }
    }
    q.box(.30,.055,.30,0,1.385,0,stone);
    const {half,height}=omokaruLanternCapR96;
    for(let ring=0;ring<3;ring++)for(let side=0;side<4;side++){
      const corner=(h,j)=>{const points=[[-h,-h],[h,-h],[h,h],[-h,h]];return points[j%4];},a=corner(half[ring],side),b=corner(half[ring],side+1),c=corner(half[ring+1],side),d=corner(half[ring+1],side+1);
      q.sheet([a[0],height[ring],a[1],c[0],height[ring+1],c[1],b[0],height[ring],b[1],c[0],height[ring+1],c[1],d[0],height[ring+1],d[1],b[0],height[ring],b[1]],stone);
    }
    q.box(.13,.018,.13,0,1.55,0,stone);lanternStats.push(q.flush());
  }
  const stats=p.flush();
  // All preconditions pass before moving/removing any existing recognized object.
  for(let i=0;i<2;i++){
    const seat=new THREE.Group();seat.name=`Mapped Omokaru ${nodes[i].id}`;seat.position.set(nodes[i].point[0],seats[i],nodes[i].point[2]);group.add(seat);
    for(const c of assemblies[i]){
      c.removeFromParent();c.position.x=0;c.position.z=0;
      if(c.userData.interactable){c.geometry=new THREE.SphereGeometry(.11,16,12).scale(1,.85,1).translate(0,-.12,0);}
      else if(c.geometry.parameters.height===1.45)c.geometry=new THREE.BoxGeometry(.25,.65,.25).translate(0,-.295,0);
      else c.geometry=new THREE.BoxGeometry(.30,.04,.30).translate(0,-.59,0);
      seat.add(c);
    }
    const c=oldColliders[i];c.args=[nodes[i].point[0],nodes[i].point[2],.32,seats[i],seats[i]+2,'omokaru'];
  }
  for(const c of [wall,backdrop,stele])c.removeFromParent();
  // Base/canopy columns receive explicit physical bounds. The mapped path is
  // west of this segment; no collider is created at the obsolete wall location.
  colliders.push({type:'box',args:[(a[0]+b[0])/2,(a[1]+b[1])/2,.11,len/2,Math.atan2(dx,dz),Math.min(...rearSeats),Math.max(...rearSeats)+2.65,'omokaru_rear_boundary']});
  for(const q of fp)colliders.push({type:'cylinder',args:[q[0],q[2],.08,base,base+2.45,'omokaru_canopy_post']});
  const ob=local(0,.28,.08);colliders.push({type:'box',args:[ob[0],ob[2],.24,.155,-Math.atan2(dz,dx),base,base+.55,'omokaru_offering_box']});
  root.add(group);group.userData.stats={...stats,lanternStats,cobbles:cobbles.length,label:'おもかる石',movedStones:2,removedLegacy:3,builtIds:[omokaruCanopyIdR96],center:[cx,cz]};
  return {group,...group.userData.stats};
}
