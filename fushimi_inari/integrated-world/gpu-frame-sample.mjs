// r187 records a begin/end timestamp pair per render pass. Its resolved map
// contains durations, not endpoints. It cannot establish disjoint GPU work or
// the elapsed span of a displayed frame, so keep observations per named pass.
export function createGpuFrameSample(renderer){
  const {backend,inspector}=renderer;
  const supported=!!(backend.isWebGPUBackend&&backend.trackTimestamp&&inspector?.beginRender);
  backend.trackTimestamp=false;
  let generation=0,pending=false,active=null,next=0,count=0,rejected=0,invalidPasses=0;
  const passes=new Map();

  function begin(time){
    if(!supported||pending||active||time<next)return;
    const labels=new Map(),original=inspector.beginRender,owned=Object.hasOwn(inspector,'beginRender');
    function identify(uid,scene,camera,target){
      const result=original.call(this,uid,scene,camera,target);
      labels.set(uid,{
        name:scene?.name||scene?.material?.name||scene?.type||'Scene',
        target:target?.texture?.name||(target?'Offscreen':'Canvas'),
        contextId:uid.split(':')[2],
      });
      return result;
    }
    inspector.beginRender=identify;
    active={labels,restore(){
      if(inspector.beginRender!==identify)return;
      if(owned)inspector.beginRender=original;else delete inspector.beginRender;
    }};
    backend.trackTimestamp=true;
    next=time+250;
  }

  function end(){
    if(!active)return;
    const {labels,restore}=active;active=null;restore();
    const current=generation,pool=backend.timestampQueryPool.render;
    // r187 may return its previous result on a failed/empty resolve. A fresh
    // frames array is published only after the new GPU buffer has been read.
    const previousFrames=pool?.frames;
    const expected=[...labels.entries()].filter(([uid])=>pool?.queryOffsets.has(uid));
    pending=true;
    let read;
    try{read=renderer.resolveTimestampsAsync('render');}
    catch{pending=false;rejected++;return;}
    finally{backend.trackTimestamp=false;}
    Promise.resolve(read).then(()=>{
      if(current!==generation)return;
      if(!expected.length||pool.frames===previousFrames){rejected++;return;}
      let valid=0;
      for(const [uid,label] of expected){
        const value=pool.timestamps.get(uid);
        // Quantization can legitimately return zero. Counter resets and
        // missing query results are excluded from the named distribution.
        if(!Number.isFinite(value)||value<0){invalidPasses++;continue;}
        const key=JSON.stringify([label.name,label.target,label.contextId]);
        let pass=passes.get(key);
        if(!pass){pass={...label,values:[]};passes.set(key,pass);}
        pass.values.push(value);valid++;
      }
      if(valid)count++;else rejected++;
    }).catch(()=>{if(current===generation)rejected++;}).finally(()=>{pending=false;});
  }

  return {begin,end,reset(){generation++;passes.clear();count=0;next=0;rejected=0;invalidPasses=0;},
    get stats(){
      const distributions=Array.from(passes.values(),({name,target,contextId,values})=>{
        const sorted=values.slice().sort((a,b)=>a-b),n=sorted.length;
        return {name,target,contextId,count:n,p50Ms:sorted[Math.ceil(n*.5)-1],p95Ms:sorted[Math.ceil(n*.95)-1],maxMs:sorted[n-1]};
      });
      distributions.sort((a,b)=>b.p95Ms-a.p95Ms||a.name.localeCompare(b.name));
      return {supported,measurement:'individual-render-pass',count,rejected,invalidPasses,passes:distributions};
    }};
}
