// A real Scene preserves the environment/fog used by r180 NodeMaterials.
// Borrow children without reparenting them or cloning their geometry; the
// original world remains the owner while targetScene supplies its lights.
export async function compileAddedGroup(renderer,scene,group,camera,{batchSize=12,yieldWork=()=>new Promise(resolve=>setTimeout(resolve,0)),report=()=>{}}={}){
  group.updateWorldMatrix(true,true);
  const scope=scene.clone(false);
  // Scene.copy clones textures; retain the actual bound environment instead.
  scope.environment=scene.environment;scope.background=scene.background;
  for(const key of ['backgroundNode','environmentNode','fogNode'])scope[key]=scene[key];
  const leaves=[];group.traverseVisible(object=>{if(object.isMesh||object.isLine||object.isPoints||object.isSprite)leaves.push(object);});
  const size=Math.max(1,Math.floor(batchSize)||12);let batches=0,maxSubmitMs=0;
  try{
    for(let i=0;i<leaves.length;i+=size){
      await yieldWork();scope.children=leaves.slice(i,i+size);
      const start=performance.now(),pending=renderer.compileAsync(scope,camera,scene);
      maxSubmitMs=Math.max(maxSubmitMs,performance.now()-start);
      await pending;batches++;report({objects:leaves.length,batches,maxSubmitMs});
    }
  }
  finally{scope.children=[];}
}
