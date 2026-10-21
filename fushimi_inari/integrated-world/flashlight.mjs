import * as THREE from 'three';

export function installFlashlight(scene,camera){
  const light=new THREE.SpotLight(0xffefd2,0,38,Math.PI/7,.65,1.4);
  light.name='Visitor flashlight';light.castShadow=false;scene.add(light,light.target);
  const button=document.createElement('button');button.id='flashlight-toggle';
  button.setAttribute('aria-pressed','false');
  const label=document.createElement('label');label.textContent='Personal light';label.htmlFor=button.id;
  document.getElementById('pane-3').append(label,button);
  let enabled=false;const offset=new THREE.Vector3(.18,-.13,-.1),aim=new THREE.Vector3(0,-.03,-1);
  function toggle(){enabled=!enabled;button.textContent=`Flashlight: ${enabled?'on':'off'} · L`;button.setAttribute('aria-pressed',String(enabled));light.intensity=enabled?45:0;}
  button.textContent='Flashlight: off · L';button.onclick=toggle;
  addEventListener('keydown',event=>{if(event.code!=='KeyL'||event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.target?.matches('input,select,textarea,[contenteditable]'))return;event.preventDefault();toggle();});
  return {update(){if(!enabled)return;light.position.copy(offset).applyQuaternion(camera.quaternion).add(camera.position);light.target.position.copy(aim).applyQuaternion(camera.quaternion).multiplyScalar(12).add(camera.position);}};
}
