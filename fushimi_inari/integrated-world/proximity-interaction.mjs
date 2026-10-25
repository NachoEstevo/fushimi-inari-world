import {Vector3,Box3} from 'three';

export function interactionInputBlocked({active,paused,flying,body,document,target}){
 return !active||paused||flying||body.classList.contains('photo-mode')||body.classList.contains('welcome-open')||
  !!document.querySelector('dialog[open]')||!!target?.closest?.('input,select,textarea,button,a,[contenteditable]:not([contenteditable="false"])');
}

export function createProximityInteractions({targets,camera,now=()=>performance.now()}){
 const point=new Vector3(),nearest=new Vector3(),bounds=new WeakMap(),lastRun=new WeakMap();
 function find(){
  let best=null,distance=Infinity;
  for(const object of targets){
   const data=object.userData.interactable;
   if(!data||!(data.directAction||data.actions?.length||data.onTrigger))continue;
   let visible=true;for(let parent=object;parent;parent=parent.parent)if(!parent.visible){visible=false;break;}
   if(!visible)continue;
   object.getWorldPosition(point);
   if(data.proximity){point.y+=1.1;}else{
    let box=bounds.get(object);if(!box){box=new Box3().setFromObject(object);bounds.set(object,box);}
    if(!box.isEmpty())box.clampPoint(camera.position,point);
   }
   const d=point.distanceTo(camera.position);
   if(d>=(data.reach??2.8)||d>=distance)continue;
   // Nearby things behind the player should not steal a visible prompt.
   camera.getWorldDirection(nearest);point.sub(camera.position).normalize();
   if(point.dot(nearest)<-.2)continue;
   best=object;distance=d;
  }
  return best;
 }
 return {find,inspect(){return targets.filter(object=>object.userData.interactable?.proximity).map(object=>{
  object.getWorldPosition(point);point.y+=1.1;let visible=true;for(let parent=object;parent;parent=parent.parent)if(!parent.visible)visible=false;
  const distance=point.distanceTo(camera.position);camera.getWorldDirection(nearest);point.sub(camera.position).normalize();
  return {name:object.name,distance,visible,facing:point.dot(nearest),position:object.position.toArray()};
 }).sort((a,b)=>a.distance-b.distance).slice(0,4);},run(){const object=find();if(!object)return null;const data=object.userData.interactable,time=now();
  if(time-(lastRun.get(data)??-Infinity)<(data.cooldownMs??1800))return null;
  lastRun.set(data,time);const action=data.directAction??data.actions?.[0]?.run??data.onTrigger;
  return {object,message:action.call(data)??data.prompt??data.actions?.[0]?.label??'Done'};
 }};
}
