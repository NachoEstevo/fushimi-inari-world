import * as THREE from 'three';

export function installPhotoMode({renderer,scene,camera,walker,controls,overlays,allowDebugCamera=false,onCaptured,includeImage=false,isCameraOwned=()=>false,getCaptureContext=()=>({}),render=()=>renderer.render(scene,camera)}){
  const button=document.createElement('button');button.id='photo-open';button.setAttribute('aria-label','Photo mode');button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 7h5l2-3h4l2 3h5v13H3z"/><circle cx="12" cy="13" r="4"/></svg><span>Photo mode</span>';document.body.append(button);
  const panel=document.createElement('section');panel.id='photo-panel';panel.hidden=true;panel.setAttribute('aria-label','Photo settings');
  panel.innerHTML=`<div class="menu-heading"><h2>Photo mode</h2><button id="photo-close" aria-label="Close photo mode">×</button></div>
    <label for="photo-yaw">Pan</label><input id="photo-yaw" type="range" min="-180" max="180" value="0">
    <label for="photo-pitch">Tilt</label><input id="photo-pitch" type="range" min="-70" max="70" value="0">
    <label for="photo-fov">Field of view <output id="photo-fov-value"></output></label><input id="photo-fov" type="range" min="20" max="85" value="45">
    <label for="photo-exposure">Exposure <output id="photo-exposure-value"></output></label><input id="photo-exposure" type="range" min="-2" max="2" step=".1" value="0">
    <label for="photo-size">Resolution</label><select id="photo-size"><option value="1920">1920 px</option><option value="3840" selected>4K · 3840 px</option></select>
    <label class="photo-grid-label"><input id="photo-grid-toggle" type="checkbox"> Rule of thirds</label>
    <div class="row"><button id="photo-reset">Reset</button>${includeImage?'<button id="photo-keep" class="primary">Keep in journal</button>':''}<button id="photo-save">Save PNG</button></div>
    <p id="photo-status" role="status"></p><a id="photo-result" hidden target="_blank" rel="noopener">Open last photo</a>`;
  document.body.append(panel);
  const grid=document.createElement('div');grid.id='photo-grid';grid.hidden=true;document.body.append(grid);
  const $=id=>document.getElementById(id);
  let saved=null,busy=false,lastURL=null;
  function apply(){
    if(!saved)return;
    const e=new THREE.Euler().setFromQuaternion(saved.rotation,'YXZ');
    e.y+=THREE.MathUtils.degToRad(Number($('photo-yaw').value));
    e.x=THREE.MathUtils.clamp(e.x+THREE.MathUtils.degToRad(Number($('photo-pitch').value)),-Math.PI*.49,Math.PI*.49);
    camera.quaternion.setFromEuler(e);camera.fov=Number($('photo-fov').value);camera.updateProjectionMatrix();
    renderer.toneMappingExposure=saved.exposure*2**Number($('photo-exposure').value);
    $('photo-fov-value').textContent=`${camera.fov}°`;$('photo-exposure-value').textContent=`${$('photo-exposure').value} EV`;
  }
  function reset(){for(const id of ['photo-yaw','photo-pitch','photo-exposure'])$(id).value=0;$('photo-fov').value=saved.fov;apply();}
  function open(){
    if(saved)return;
    if(!$('stop').disabled)$('stop').click();
    saved={rotation:camera.quaternion.clone(),fov:camera.fov,exposure:renderer.toneMappingExposure,controls:controls.enabled,mode:walker.mode,objects:overlays().filter(Boolean).map(o=>[o,o.visible])};
    walker.pause(true);controls.enabled=false;saved.objects.forEach(([o])=>o.visible=false);
    document.body.classList.add('photo-mode');panel.hidden=false;reset();$('photo-close').focus();
  }
  function close(){
    if(!saved||busy)return;
    camera.quaternion.copy(saved.rotation);camera.fov=saved.fov;camera.updateProjectionMatrix();renderer.toneMappingExposure=saved.exposure;
    saved.objects.forEach(([o,v])=>o.visible=v);
    const owned=isCameraOwned(),restoreMode=owned||allowDebugCamera?saved.mode:'walk';
    if(walker.mode!==restoreMode){if(restoreMode==='fly')walker.fly();else if(restoreMode==='walk')walker.start();else walker.stop();}
    controls.enabled=allowDebugCamera&&saved.controls&&!owned;walker.pause(owned);saved=null;
    panel.hidden=true;grid.hidden=true;$('photo-grid-toggle').checked=false;document.body.classList.remove('photo-mode');button.focus();
  }
  async function capture(download=true){
    if(busy||!saved)return;busy=true;$('photo-save').disabled=true;if($('photo-keep'))$('photo-keep').disabled=true;$('photo-status').textContent='Rendering photo…';
    const size=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect;
    // 3840 fits the minimum texture limit of both supported graphics backends.
    const max=Math.min(Number($('photo-size').value),download?3840:1920);
    const width=Math.round(aspect>=1?max:max*aspect),height=Math.round(aspect>=1?max/aspect:max);
    const captureDetails={...getCaptureContext(),position:camera.position.toArray(),direction:camera.getWorldDirection(new THREE.Vector3()).toArray(),width,height};
    try{
      let image;
      try{
        renderer.setPixelRatio(1);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
        // Copy in the same task as submission, before resizing the GPU canvas or
        // yielding to another animation frame. This works with WebGPU's transient
        // canvas texture as well as WebGL without preserveDrawingBuffer.
        const rendered=render();
        if(rendered?.then)await rendered;
        const snapshot=document.createElement('canvas');snapshot.width=width;snapshot.height=height;
        const context=snapshot.getContext('2d');
        if(!context)throw new Error('Photo canvas unavailable');
        context.drawImage(renderer.domElement,0,0,width,height);
        image=new Promise((resolve,reject)=>snapshot.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG encoding failed')),'image/png'));
      }finally{
        renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();await render();
      }
      const blob=await image,url=URL.createObjectURL(blob),link=document.createElement('a');
      if(lastURL)URL.revokeObjectURL(lastURL);lastURL=url;
      $('photo-result').href=url;$('photo-result').hidden=false;
      link.href=url;link.download=`fushimi-inari-${new Date().toISOString().replace(/[:.]/g,'-')}.png`;if(download)link.click();
      $('photo-status').textContent=download?`Saved ${width} × ${height} PNG`:'Photo captured';
      // Notify only after a real PNG exists; snapshot pose before asynchronous
      // encoding so later camera changes cannot earn a different photograph.
      try{const note=await onCaptured?.(includeImage?{...captureDetails,blob}:captureDetails);if(typeof note==='string'&&note)$('photo-status').textContent+=' · '+note;}
      catch(error){console.warn('Photo capture observer failed',error);}
    }catch(error){$('photo-status').textContent=`Could not save photo: ${error.message}. Try 1920 px.`;}
    finally{busy=false;$('photo-save').disabled=false;if($('photo-keep'))$('photo-keep').disabled=false;}
  }
  button.onclick=open;$('photo-close').onclick=close;$('photo-reset').onclick=reset;$('photo-save').onclick=()=>capture(true);if(includeImage)$('photo-keep').onclick=()=>capture(false);
  for(const id of ['photo-yaw','photo-pitch','photo-fov','photo-exposure'])$(id).oninput=apply;
  $('photo-grid-toggle').onchange=e=>grid.hidden=!e.target.checked;
  // Installed before the exploration-menu listener so Escape closes only this mode.
  addEventListener('keydown',e=>{if(saved&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}},true);
  return {get active(){return !!saved;},open,close};
}
