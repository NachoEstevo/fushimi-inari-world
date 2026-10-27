// A real Scene preserves the environment/fog used by r180 NodeMaterials.
// Borrow children without reparenting them or cloning their geometry; the
// original world remains the owner while targetScene supplies its lights.
export function compileAddedGroup(renderer,scene,group,camera,{includeHiddenRoot=false,...options}={}){
  return compileSelectedVisuals(renderer,scene,[group],camera,{...options,includeHiddenRoots:includeHiddenRoot});
}

// Explicitly selected dormant visuals share one collection, scope and batch
// sequence. A hidden root is eligible; unrelated hidden descendants stay off.
export async function compileSelectedVisuals(renderer,scene,visuals,camera,{batchSize=12,yieldWork=()=>globalThis.scheduler?.yield?.()??new Promise(resolve=>setTimeout(resolve,0)),report=()=>{},includeHiddenRoots=true,collectBatchSize=128,now=()=>performance.now(),reuseRenderScene=false,onCompiled,getLights}={}){
  // Borrowing is safe only when submission happens before compileAsync yields.
  // The viewer's quality adapter enforces this too; protect direct renderers.
  if(reuseRenderScene&&renderer.hasInitialized?.()===false)throw new Error('Initialize the renderer before borrowing the render scene');
  const roots=new Set(visuals),seen=new Set(),leaves=[],stack=[...roots].reverse(),collectionSize=Math.max(1,Math.floor(collectBatchSize)||128);let visited=0,collectStart=now(),maxCollectMs=0;
  while(stack.length){
    if(++visited%collectionSize===0||now()-collectStart>=4){
      maxCollectMs=Math.max(maxCollectMs,now()-collectStart);report({phase:'collect',objects:leaves.length,visited,maxCollectMs});
      await yieldWork();collectStart=now();
    }
    const object=stack.pop();
    if(seen.has(object))continue;seen.add(object);
    if(!object.visible&&!(roots.has(object)&&includeHiddenRoots))continue;
    object.updateWorldMatrix(roots.has(object),false);
    if((object.isMesh||object.isLine||object.isPoints||object.isSprite)&&object.layers.test(camera.layers))leaves.push(object);
    for(let i=object.children.length-1;i>=0;i--)stack.push(object.children[i]);
  }
  maxCollectMs=Math.max(maxCollectMs,now()-collectStart);
  if(!leaves.length)return;
  // The renderer keys its light node and render context by scene and camera.
  // Opt in only with the actual render camera to warm the live render cache.
  let lights=[];
  if(reuseRenderScene&&getLights){
    lights=await getLights(camera,{yieldWork,collectBatchSize:collectionSize,now});
  }else if(reuseRenderScene){
    const pending=[scene];let scanned=0,start=now();
    while(pending.length){
      if(++scanned%collectionSize===0||now()-start>=4){await yieldWork();start=now();}
      const object=pending.pop();if(!object.visible)continue;
      if(object.isLight&&object.layers.test(camera.layers))lights.push(object);
      for(let i=object.children.length-1;i>=0;i--)pending.push(object.children[i]);
    }
  }
  const scope=reuseRenderScene?scene:scene.clone(false);
  // Scene.copy clones textures; retain the actual bound environment instead.
  if(!reuseRenderScene){
    scope.environment=scene.environment;scope.background=scene.background;scope.fog=scene.fog;
    for(const key of ['backgroundNode','environmentNode','fogNode'])scope[key]=scene[key];
  }
  const size=Math.max(1,Math.floor(batchSize)||12);let batches=0,maxSubmitMs=0;
  try{
    for(let i=0;i<leaves.length;i+=size){
      await yieldWork();const batch=leaves.slice(i,i+size),originalChildren=scope.children;
      const borrowed=reuseRenderScene?[...batch,...lights]:batch;
      const culling=borrowed.map(object=>object.frustumCulled),visibility=borrowed.map(object=>object.visible),children=borrowed.map(object=>object.children);
      const shadows=reuseRenderScene?lights.filter(light=>light.shadow).map(light=>({shadow:light.shadow,autoUpdate:light.shadow.autoUpdate,needsUpdate:light.shadow.needsUpdate})):[];
      let pending;const start=now();
      try{
        // compileAsync uses renderer frustum state. A prepared sector may be
        // outside the current view; compile its requested leaves regardless. Hidden
        // root leaves also need visibility during the synchronous submission.
        // The renderer recursively projects children. Every renderable is
        // already collected, so borrowing a parent's live subtree here would
        // resubmit its descendants and evade the per-batch object budget.
        scope.children=borrowed;
        borrowed.forEach(object=>{object.frustumCulled=false;object.visible=true;object.children=[];});
        // A shadow update during submission would render only the borrowed
        // subset into the real shadow map. Preserve pending updates for render.
        shadows.forEach(({shadow})=>{shadow.autoUpdate=false;shadow.needsUpdate=false;});
        pending=reuseRenderScene?renderer.compileAsync(scope,camera):renderer.compileAsync(scope,camera,scene);
      }finally{
        borrowed.forEach((object,index)=>{object.frustumCulled=culling[index];object.visible=visibility[index];object.children=children[index];});
        shadows.forEach(({shadow,autoUpdate,needsUpdate})=>{shadow.autoUpdate=autoUpdate;shadow.needsUpdate=needsUpdate;});
        scope.children=originalChildren;
      }
      maxSubmitMs=Math.max(maxSubmitMs,now()-start);
      await pending;onCompiled?.(batch);batches++;report({phase:'compile',objects:leaves.length,batches,maxSubmitMs,maxCollectMs});
    }
  }
  finally{if(!reuseRenderScene)scope.children=[];}
}

// Invalidate when lights are added, removed, or reparented. Visibility and
// layer changes are checked on every use without walking unrelated geometry.
export function createCompilationLightIndex(scene){
  let candidates=null,version=0;
  return {
    invalidate(){version++;candidates=null;},
    async getLights(camera,{yieldWork=async()=>{},collectBatchSize=128,now=()=>performance.now()}={}){
      while(!candidates){
        const epoch=version,found=[],pending=[scene];let scanned=0,start=now();
        while(pending.length){
          if(++scanned%collectBatchSize===0||now()-start>=4){await yieldWork();start=now();}
          const object=pending.pop();if(object.isLight)found.push(object);
          for(let i=object.children.length-1;i>=0;i--)pending.push(object.children[i]);
        }
        if(epoch===version)candidates=found;
      }
      return candidates.filter(light=>{
        if(!light.layers.test(camera.layers))return false;
        for(let object=light;object;object=object.parent){if(!object.visible)return false;if(object===scene)return true;}
        return false;
      });
    }
  };
}
