export function renderStats(renderer){
  let previous=null,intervals=[],total=0;
  const reset=()=>{previous=null;intervals=[];total=0;};
  const record=(time,submitMs)=>{
    if(document.hidden){reset();return;}
    if(previous===null){previous=time;return;}
    const delta=time-previous;previous=time;
    if(delta<=0)return;
    intervals.push(delta);total+=submitMs;
    const elapsed=intervals.reduce((sum,value)=>sum+value,0);
    if(elapsed<1000)return;
    const sorted=[...intervals].sort((a,b)=>a-b),mean=elapsed/intervals.length;
    const stats={fps:Number((1000/mean).toFixed(1)),frameMs:Number(mean.toFixed(1)),
      worstMs:Number(sorted.at(-1).toFixed(1)),p95Ms:Number(sorted[Math.ceil(sorted.length*.95)-1].toFixed(1)),
      submitMs:Number((total/intervals.length).toFixed(2)),
      calls:renderer.info.render.drawCalls??renderer.info.render.calls,triangles:renderer.info.render.triangles,
      geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,
      width:innerWidth,height:innerHeight,pixelRatio:renderer.getPixelRatio(),visibility:document.visibilityState,
      time:new Date().toISOString()};
    document.body.dataset.renderStats=JSON.stringify(stats);
    const label=document.getElementById('render-stats');
    if(label){label.textContent=`${Math.round(stats.fps)} FPS · ${stats.frameMs} ms · pico ${stats.worstMs} ms`;
      label.dataset.health=stats.worstMs>100?'stall':stats.fps<30?'slow':'steady';
      label.title=`Tiempo entre cuadros; pico del último intervalo. CPU envío: ${stats.submitMs} ms (no es tiempo GPU). ${stats.calls} llamadas de dibujo.`;}
    intervals=[];total=0;
  };
  record.reset=reset;return record;
}
