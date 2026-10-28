const finite=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
function record(id,points,floor,roofY){
 if(!Array.isArray(points)||points.length!==4||!points.every(finite)||!Number.isFinite(floor)||!Number.isFinite(roofY)||roofY-floor<1.9)return null;
 return {id,points:points.map(p=>p.slice()),floor,roofY};
}

// Called once after successful construction. Roof heights and footprints come
// from their owning builders; post colliders prove the original support datum.
export function registeredZenShelters({features={},colliders=[],mitsurugi,okusha,yotsutsuji}={}){
 const shelters=[];
 if(mitsurugi?.built&&mitsurugi.sourceFeature==='way/1270763274'&&mitsurugi.builtIds?.includes(mitsurugi.sourceFeature)){
  const roof=features.buildings?.find(b=>b.id===mitsurugi.sourceFeature);
  const supports=mitsurugi.posts?.map(p=>colliders.find(c=>c.type==='cylinder'&&c.args?.[5]==='mitsurugi_canopy_post'&&
   Math.abs(c.args[0]-p[0])<1e-6&&Math.abs(c.args[1]-p[1])<1e-6&&Math.abs(c.args[4]-mitsurugi.roofY)<1e-6));
  if(roof?.tags?.building==='roof'&&roof.points?.length===5&&supports?.length===4&&supports.every(c=>Number.isFinite(c?.args[3]))){
   const value=record('mitsurugi-canopy',roof.points.slice(0,-1),Math.min(...supports.map(c=>c.args[3])),mitsurugi.roofY);if(value)shelters.push(value);
  }
 }
 if(okusha?.group?.userData?.okushaMappedSheltersR102&&okusha.builtIds?.includes('way/1267862163')&&okusha.postSeats?.length===4&&okusha.postSeats.every(Number.isFinite)){
  const value=record('okusha-temizuya',okusha.roofPoints,Math.min(...okusha.postSeats),okusha.eave);if(value)shelters.push(value);
 }
 if(yotsutsuji?.built)for(const s of yotsutsuji.rainShelters??[]){
  if(!yotsutsuji.facades?.some(f=>f.id===s.sourceFeature&&f.floor===s.floor))continue;
  const value=record(s.id,s.points,s.floor,s.roofY);if(value)shelters.push(value);
 }
 return shelters;
}

const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
function inRing(point,ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[j],b=ring[i];
  if(Math.abs(cross(a,b,point))<1e-7&&point[0]>=Math.min(a[0],b[0])-1e-7&&point[0]<=Math.max(a[0],b[0])+1e-7&&point[1]>=Math.min(a[1],b[1])-1e-7&&point[1]<=Math.max(a[1],b[1])+1e-7)return true;
  if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}

// The summit shop has a large concave footprint. Only its proved, inscribed
// front recess is a mask: exterior tea seating gains no fictional roof cover.
export function suehiroZenShelter(shop){
 const s=shop?.stats,f=s?.front;
 if(!s?.built||s.sourceFeature!=='way/626313732'||!shop.builtIds?.has(s.sourceFeature)||!finite(f?.a)||!finite(f?.b)||!f.outward?.every(Number.isFinite)||!Array.isArray(s.footprint)||s.footprint.some(p=>p.length!==2||!p.every(Number.isFinite)))return null;
 const dx=f.b[0]-f.a[0],dz=f.b[2]-f.a[2],length=Math.hypot(dx,dz),inset=f.inset;
 if(!Number.isFinite(inset)||inset<=0||length<=inset*2)return null;
 const at=(u,v)=>[f.a[0]+dx*u/length-f.outward[0]*v,f.a[2]+dz*u/length-f.outward[1]*v];
 const ring=[at(inset,0),at(length-inset,0),at(length-inset,inset),at(inset,inset)];
 if(!ring.every(p=>inRing(p,s.footprint)))return null;
 // Reject a strip crossing a concave notch even if all corners happen to fit.
 for(let i=0;i<4;i++)for(let j=0;j<s.footprint.length;j++){
  const a=ring[i],b=ring[(i+1)%4],c=s.footprint[j],d=s.footprint[(j+1)%s.footprint.length];
  if(cross(a,b,c)*cross(a,b,d)<-1e-10&&cross(c,d,a)*cross(c,d,b)<-1e-10)return null;
 }
 return record('suehiro-front-roof',ring.map(([x,z])=>[x,s.floor,z]),s.floor,s.roofMin);
}
