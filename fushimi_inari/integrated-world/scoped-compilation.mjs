// A real Scene preserves the environment/fog used by r180 NodeMaterials.
// Borrow children without reparenting them or cloning their geometry; the
// original world remains the owner while targetScene supplies its lights.
export async function compileAddedGroup(renderer,scene,group,camera){
  group.updateWorldMatrix(true,true);
  const scope=scene.clone(false);
  // Scene.copy clones textures; retain the actual bound environment instead.
  scope.environment=scene.environment;scope.background=scene.background;
  for(const key of ['backgroundNode','environmentNode','fogNode'])scope[key]=scene[key];
  scope.children=[group];
  try{return await renderer.compileAsync(scope,camera,scene);}
  finally{scope.children=[];}
}
