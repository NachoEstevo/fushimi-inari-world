// A real Scene preserves the environment/fog used by r180 NodeMaterials.
// Borrow children without reparenting them or cloning their geometry; the
// original world remains the owner while targetScene supplies its lights.
export function compileAddedGroup(renderer,scene,group,camera,{includeHiddenRoot=false,...options}={}){
  return compileSelectedVisuals(renderer,scene,[group],camera,{...options,includeHiddenRoots:includeHiddenRoot});
}

// Explicitly selected dormant visuals share one collection, scope and batch
// sequence. A hidden root is eligible; unrelated hidden descendants stay off.
export async function compileSelectedVisuals(renderer,scene,visuals,camera,{batchSize=12,yieldWork=()=>globalThis.scheduler?.yield?.()??new Promise(resolve=>setTimeout(resolve,0)),report=()=>{},includeHiddenRoots=true,collectBatchSize=128,now=()=>performance.now()}={}){
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
    if(object.isMesh||object.isLine||object.isPoints||object.isSprite)leaves.push(object);
    for(let i=object.children.length-1;i>=0;i--)stack.push(object.children[i]);
  }
  maxCollectMs=Math.max(maxCollectMs,now()-collectStart);
  if(!leaves.length)return;
  const scope=scene.clone(false);
  // Scene.copy clones textures; retain the actual bound environment instead.
  scope.environment=scene.environment;scope.background=scene.background;
  for(const key of ['backgroundNode','environmentNode','fogNode'])scope[key]=scene[key];
  const size=Math.max(1,Math.floor(batchSize)||12);let batches=0,maxSubmitMs=0;
  try{
    for(let i=0;i<leaves.length;i+=size){
      await yieldWork();scope.children=leaves.slice(i,i+size);
      const culling=scope.children.map(object=>object.frustumCulled),visibility=scope.children.map(object=>object.visible),children=scope.children.map(object=>object.children);
      let pending;const start=now();
      try{
        // compileAsync uses renderer frustum state. A prepared sector may be
        // outside the current view; compile its requested leaves regardless. Hidden
        // root leaves also need visibility during the synchronous submission.
        // The renderer recursively projects children. Every renderable is
        // already collected, so borrowing a parent's live subtree here would
        // resubmit its descendants and evade the per-batch object budget.
        scope.children.forEach(object=>{object.frustumCulled=false;object.visible=true;object.children=[];});
        pending=renderer.compileAsync(scope,camera,scene);
      }finally{scope.children.forEach((object,index)=>{object.frustumCulled=culling[index];object.visible=visibility[index];object.children=children[index];});}
      maxSubmitMs=Math.max(maxSubmitMs,now()-start);
      await pending;batches++;report({phase:'compile',objects:leaves.length,batches,maxSubmitMs,maxCollectMs});
    }
  }
  finally{scope.children=[];}
}
