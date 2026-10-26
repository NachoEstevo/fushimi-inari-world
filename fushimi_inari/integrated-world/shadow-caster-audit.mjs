// Capture the objects actually submitted by one synchronous shadow render.
// The original callbacks remain in place and are restored even on failure.
export function captureShadowCasters({scene,shadowCamera,render,label=object=>object.name||object.type}){
 const originals=[],records=[];
 const triangleCount=(geometry,group)=>{
  const available=geometry.index?.count??geometry.attributes.position?.count??0;
  const range=geometry.drawRange??{start:0,count:Infinity},start=Math.max(0,range.start,group?.start??0);
  const end=Math.min(available,range.start+range.count,group?group.start+group.count:Infinity);
  return Math.max(0,Math.floor((end-start)/3));
 };
 try{
  scene.traverse(object=>{
   if(!object.isMesh)return;
   const original=object.onBeforeRender;originals.push([object,original]);
   object.onBeforeRender=function(...args){
    if(args[2]===shadowCamera){
     const geometry=args[3],material=args[4],group=args[5],instances=object.isInstancedMesh?object.count:1;
     records.push({id:object.uuid,name:object.name||object.type,label:label(object),material:material?.name||material?.type||'',triangles:triangleCount(geometry,group)*instances,instances});
    }
    return original.apply(this,args);
   };
  });
  const result=render();
  if(result&&typeof result.then==='function')throw new TypeError('Shadow caster capture requires a synchronous render');
 }finally{for(const [object,callback] of originals)object.onBeforeRender=callback;}
 const totalTriangles=records.reduce((sum,record)=>sum+record.triangles,0);
 return {draws:records.length,top:records.sort((a,b)=>b.triangles-a.triangles).slice(0,25),totalTriangles,totalDraws:records.length};
}
