// Timestamp only the passes submitted by one displayed frame. Three assigns its
// own frame IDs to nested render() calls, so the final resolve value alone only
// measures the last such group. Every timed render pass is disjoint on the GPU.
export function createGpuFrameSample(renderer){
  const backend=renderer.backend;
  const supported=!!(backend.isWebGPUBackend && backend.trackTimestamp);
  backend.trackTimestamp=false;
  let generation=0,pending=false,enabled=false,next=0,samples=[],rejected=0;
  function begin(time){
    if(!supported||pending||time<next)return;
    enabled=true;
    backend.trackTimestamp=true;
    next=time+250;
  }
  function end(){
    if(!enabled)return;
    enabled=false;
    const current=generation;
    pending=true;
    const read=renderer.resolveTimestampsAsync('render');
    backend.trackTimestamp=false;
    read.then(()=>{
      if(current!==generation)return;
      const times=backend.timestampQueryPool.render?.timestamps;
      if(!times?.size)return;
      let ms=0;
      for(const value of times.values())ms+=value;
      if(ms>0&&Number.isFinite(ms))samples.push(ms);
    }).catch(()=>{if(current===generation)rejected++;}).finally(()=>{pending=false;});
  }
  return {begin,end,reset(){generation++;samples=[];next=0;rejected=0;},
    get stats(){const sorted=samples.slice().sort((a,b)=>a-b);
      const percentile=p=>sorted[Math.max(0,Math.ceil(sorted.length*p)-1)]??null;
      return {supported,count:sorted.length,rejected,p50Ms:percentile(.5),p95Ms:percentile(.95),maxMs:percentile(1)};
    }};
}
