import {Box3,Matrix4,Quaternion,Ray,Vector3} from 'three';

// Cache only nearby physical colliders. A click never traverses the world meshes
// or compiles a hit-test material. Only the matching cabinet collider is skipped.
export function createVendingOcclusion(colliders=[],machines=[]){
 const cache=new Map(),axis=new Vector3(0,1,0),scale=new Vector3(1,1,1);
 for(const machine of machines){
  const [mx,,mz]=machine.spec.position,near=[];
  for(const collider of colliders){
   const a=collider.args;if(!Array.isArray(a))continue;
   if(collider.type==='box'){
    const [x,z,w,d,yaw=0,lo=-100,hi=500,tag]=a;
    if((tag==='keihan-platform-vending'||tag==='keihan-street-vending')&&Math.hypot(x-mx,z-mz)<.03)continue;
    if(Math.hypot(x-mx,z-mz)>Math.hypot(w,d)+4)continue;
    near.push({inverse:new Matrix4().compose(new Vector3(x,0,z),new Quaternion().setFromAxisAngle(axis,yaw),scale).invert(),box:new Box3(new Vector3(-w,lo,-d),new Vector3(w,hi,d))});
   }else if(collider.type==='cylinder'){
    const [x,z,r,lo=-100,hi=500]=a;
    if(Math.hypot(x-mx,z-mz)<=r+4)near.push({x,z,r,lo,hi});
   }
  }cache.set(machine,near);
 }
 const ray=new Ray(),local=new Ray(),direction=new Vector3(),hit=new Vector3();
 return (origin,target,machine)=>{
  const length=origin.distanceTo(target);if(length<.08)return false;
  direction.subVectors(target,origin).normalize();ray.set(origin,direction);
  for(const c of cache.get(machine)??[]){
   if(c.box){local.copy(ray).applyMatrix4(c.inverse);if(c.box.containsPoint(local.origin)||(local.intersectBox(c.box,hit)&&hit.distanceTo(local.origin)<length-.08))return true;}
   else{
    const dx=origin.x-c.x,dz=origin.z-c.z,a=direction.x**2+direction.z**2,b=dx*direction.x+dz*direction.z;
    if(a<1e-10)continue;const discriminant=b*b-a*(dx*dx+dz*dz-c.r*c.r);if(discriminant<0)continue;
    let enter=Math.max(0,(-b-Math.sqrt(discriminant))/a),exit=Math.min(length-.08,(-b+Math.sqrt(discriminant))/a);
    if(Math.abs(direction.y)<1e-10){if(origin.y<c.lo||origin.y>c.hi)continue;}
    else{const t0=(c.lo-origin.y)/direction.y,t1=(c.hi-origin.y)/direction.y;enter=Math.max(enter,Math.min(t0,t1));exit=Math.min(exit,Math.max(t0,t1));}
    if(enter<=exit)return true;
   }
  }return false;
 };
}
