import {Vector3} from 'three';

const point=new Vector3();
// The four activity owners share walking's elevated origin and strict boundary.
export function withinZenInteractionReach(camera,object){
 object.getWorldPosition(point);point.y+=1.1;
 const reach=object.userData.interactable?.reach??2.5;
 return camera.position.distanceTo(point)<reach;
}
