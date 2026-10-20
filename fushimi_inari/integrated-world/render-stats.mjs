export function renderStats(renderer){
  let start=0,frames=0,total=0;
  return (time,submitMs)=>{
    if(!start)start=time;frames++;total+=submitMs;
    if(time-start<1500)return;
    const stats={fps:Number((frames*1000/(time-start)).toFixed(1)),submitMs:Number((total/frames).toFixed(2)),
      calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,
      geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,
      width:innerWidth,height:innerHeight,pixelRatio:renderer.getPixelRatio(),visibility:document.visibilityState,
      time:new Date().toISOString()};
    document.body.dataset.renderStats=JSON.stringify(stats);
    const label=document.getElementById('render-stats');if(label)label.textContent=`${stats.fps} FPS · ${stats.calls} dibujos · ${(stats.triangles/1e6).toFixed(2)} M triángulos`;
    start=time;frames=0;total=0;
  };
}
