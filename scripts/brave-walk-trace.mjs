// Isolated Windows/Brave diagnostic. The release server and BRAVE_DRIVER /
// BRAVE_EXE are supplied by the route job. The normal route benchmark runs alone.
import {mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {promisify} from 'node:util';
import {gunzip} from 'node:zlib';
import {setTimeout as sleep} from 'node:timers/promises';

const durationMs=12000,maxCompressed=16*1024*1024,maxJson=64*1024*1024;
const markerName='brave-walk-trace-start',endSyncId='brave-walk-trace-end';
const unzip=promisify(gunzip);
const ms=us=>Math.round(us)/1000;

function deadline(promise,limit,label){
 let timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' timed out')),limit);});
 return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
}

// Chromium emits complete slices (X) and nested begin/end pairs (B/E).
// GPU-process events describe host scheduling; hardware timestamps, if
// available, come from the viewer's WebGPU query sets in the movement audit.
export function summarizeWalkTrace(events,{pageMarkMs,walk,dataLossOccurred=false}){
 const marker=events.find(e=>e.name===markerName&&e.cat?.includes('blink.user_timing'));
 const processNames=new Map(),threadNames=new Map();
 const track=e=>e.pid+'/'+e.tid;
 for(const e of events)if(e.ph==='M'){
  if(e.name==='process_name')processNames.set(e.pid,e.args?.name);
  if(e.name==='thread_name')threadNames.set(track(e),e.args?.name);
 }
 if(!marker)return {markerMissing:true,dataLossOccurred,eventCount:events.length};
 const start=marker.ts,slices=[];
 const endMarker=events.find(e=>e.name==='clock_sync'&&e.args?.sync_id===endSyncId);
 let lastActivityUs=start;
 for(const e of events)if(e.ph!=='M'&&Number.isFinite(e.ts)){
  lastActivityUs=Math.max(lastActivityUs,e.ts+(Number.isFinite(e.dur)?e.dur:0));
 }
 const end=Math.min(start+durationMs*1000,endMarker?.ts??lastActivityUs);
 const observedWindowMs=ms(Math.max(0,end-start));
 function add(e,dur){
  if(!Number.isFinite(dur)||dur<=0||e.ts>=end||e.ts+dur<=start)return;
  const thread=threadNames.get(track(e))??'',process=processNames.get(e.pid)??'';
  const lane=e.pid===marker.pid&&e.tid===marker.tid?'rendererMain'
   :/gpu/i.test(process)||/gpu|vizcompositor/i.test(thread)?'gpuProcess':null;
  if(lane)slices.push({lane,name:e.name,category:e.cat,pid:e.pid,tid:e.tid,thread,process,
   timestampUs:e.ts,startMs:ms(e.ts-start),durationMs:ms(dur),windowMs:ms(Math.min(e.ts+dur,end)-Math.max(e.ts,start))});
 }
 for(const e of events)if(e.ph==='X')add(e,e.dur);
 const stacks=new Map();
 for(const e of events.filter(e=>e.ph==='B'||e.ph==='E').sort((a,b)=>a.ts-b.ts)){
  const key=track(e);
  if(e.ph==='B'){if(!stacks.has(key))stacks.set(key,[]);stacks.get(key).push(e);}
  else{const begin=stacks.get(key)?.pop();if(begin)add(begin,e.ts-begin.ts);}
 }
 slices.sort((a,b)=>b.windowMs-a.windowMs);
 const worst=walk?.slowFrames?.[0];
 let worstFrame=null;
 if(worst&&Number.isFinite(pageMarkMs)&&Number.isFinite(walk.startTimeMs)){
  const to=walk.startTimeMs-pageMarkMs+worst.elapsedMs,from=to-worst.gap;
  const intersects=to>0&&from<observedWindowMs;
  const overlap=e=>Math.max(0,Math.min(to,observedWindowMs,e.startMs+e.durationMs)-Math.max(from,0,e.startMs));
  worstFrame={startMs:from,endMs:to,gapMs:worst.gap,position:worst.position,
   intersectsWindow:intersects,fullyInsideWindow:from>=0&&to<=observedWindowMs,
   overlapping:intersects?slices.filter(e=>overlap(e)>0).sort((a,b)=>overlap(b)-overlap(a)).slice(0,15):[]};
 }
 return {markerMissing:false,startTimestampUs:start,windowMs:durationMs,observedWindowMs,dataLossOccurred,eventCount:events.length,
  endSyncTimestampUs:endMarker?.ts??null,lastActivityMs:ms(lastActivityUs-start),
  rendererMain:slices.filter(e=>e.lane==='rendererMain').slice(0,12),gpuProcess:slices.filter(e=>e.lane==='gpuProcess').slice(0,12),worstFrame};
}

async function readTrace(session,handle){
 const chunks=[];let bytes=0;
 try{
  for(;;){
   const {data,eof,base64Encoded}=await session.send('IO.read',{handle,size:256*1024});
   const chunk=Buffer.from(data,base64Encoded?'base64':'utf8');
   bytes+=chunk.length;if(bytes>maxCompressed)throw Error('Trace exceeds 16 MiB compressed limit');
   chunks.push(chunk);if(eof)break;
  }
 }finally{await session.send('IO.close',{handle}).catch(()=>{});}
 return Buffer.concat(chunks,bytes);
}

// startWalk should mark the page with markerName and return that performance
// mark's startTime. A Node timer stops tracing even when the renderer stalls.
export async function recordBraveWalkTrace(page,{outDir,label,startWalk,readWalk}){
 if(!/^[a-z0-9-]+$/i.test(label))throw Error('Invalid trace label');
 await mkdir(outDir,{recursive:true});
 const session=await page.context().newCDPSession(page);
 let recording=false,onComplete;
 const complete=new Promise(resolve=>{onComplete=resolve;session.once('Tracing.tracingComplete',onComplete);});
 try{
  await session.send('Tracing.start',{transferMode:'ReturnAsStream',streamFormat:'json',streamCompression:'gzip',
   traceConfig:{recordMode:'recordUntilFull',traceBufferSizeInKb:8192,
    includedCategories:['toplevel','devtools.timeline','blink.user_timing','gpu','viz','cc','v8']}});
  recording=true;
  const stop=async()=>{
   await sleep(durationMs);
   // This browser-process marker also signals when a full buffer cut off the
   // tail. Avoid evaluating script in a potentially stalled renderer to stop.
   await deadline(session.send('Tracing.recordClockSyncMarker',{syncId:endSyncId}),2000,'Trace end marker').catch(()=>{});
   await deadline(session.send('Tracing.end'),15000,'Tracing.end');recording=false;
   const result=await deadline(complete,45000,'Tracing.tracingComplete');
   if(!result.stream)throw Error('Brave returned no trace stream');
   const bytes=await deadline(readTrace(session,result.stream),45000,'CDP trace read');
   await writeFile(join(outDir,label+'.trace.json.gz'),bytes);
   return {result,bytes};
  };
  // On virtual Windows the page may wait seconds for a renderer slot. Start the
  // stop clock once the page's mark is acknowledged, allowing twelve complete
  // seconds after admission even if sending the mark itself had to wait.
  const pageMarkMs=await deadline(Promise.resolve().then(()=>startWalk(markerName)),30000,'Start walk');
  const {bytes,result}=await stop();
  const {traceEvents,metadata={}}=JSON.parse((await unzip(bytes,{maxOutputLength:maxJson})).toString('utf8'));
  const walk=await readWalk();
  const gpu={renderer:metadata['gpu-gl-renderer'],vendor:metadata['gpu-gl-vendor'],driverVersion:metadata['gpu-driver-version']};
  const summary={label,pageMarkMs,bytes:bytes.length,gpu,...summarizeWalkTrace(traceEvents,{
   pageMarkMs,walk,dataLossOccurred:result.dataLossOccurred}),walk};
  await writeFile(join(outDir,label+'.trace-summary.json'),JSON.stringify(summary,null,2));
  return summary;
 }finally{
  if(recording)await deadline(session.send('Tracing.end'),5000,'Trace cleanup').catch(()=>{});
  session.off('Tracing.tracingComplete',onComplete);await session.detach().catch(()=>{});
 }
}

async function run(){
 const {BRAVE_DRIVER,BRAVE_EXE}=process.env;
 if(!BRAVE_DRIVER||!BRAVE_EXE)throw Error('Supply BRAVE_DRIVER and BRAVE_EXE from the Windows route job');
 const itinerary=process.env.BRAVE_TRACE_ROUTE??'keihan_omotesando',quality=process.env.BRAVE_TRACE_QUALITY??'balanced';
 if(!['balanced','high'].includes(quality))throw Error('Unknown trace quality');
 const {chromium}=await import(pathToFileURL(BRAVE_DRIVER));
 const browser=await chromium.launch({executablePath:BRAVE_EXE,headless:false});
 try{
  const context=await browser.newContext({viewport:{width:960,height:640},deviceScaleFactor:1});
  const page=await context.newPage();page.setDefaultTimeout(120000);
  await page.goto('http://127.0.0.1:8421/integrated-world/index.html?audit=1&frameAudit=1&frameAuditSeconds=12&gpuTiming=1',{waitUntil:'domcontentloaded'});
  await page.locator('#welcome-enter').click();await page.locator('#menu-open').click();
  await page.getByRole('tab',{name:'Settings'}).click();
  const preset=page.locator('#render-quality');
  if(await preset.inputValue()!==quality){await preset.selectOption(quality);await page.locator('#render-quality:not([aria-busy])').waitFor({state:'attached'});}
  await page.getByRole('tab',{name:'Routes'}).click();await page.locator('#itinerary').selectOption(itinerary);
  await page.locator('#speed').selectOption('12');await page.locator('#route').click();
  await page.locator('#walk:enabled').click();
  await page.waitForFunction(()=>document.querySelector('#walk')?.textContent==='Following route…');
  const summary=await recordBraveWalkTrace(page,{outDir:'outputs/brave-route-check',label:'trace-'+itinerary.replaceAll('_','-')+'-'+quality,
   startWalk:name=>page.evaluate(name=>{
    const record=document.querySelector('#movement-frame-audit button');
    if(!record)throw Error('Movement audit control is unavailable');
    const start=performance.mark(name).startTime;record.click();return start;
   },name),
   readWalk:async()=>{
    await page.waitForFunction(()=>['complete','error','aborted'].includes(JSON.parse(document.body.dataset.movementFrameAudit??'{}').phase),null,{timeout:60000});
    const audit=await page.evaluate(()=>JSON.parse(document.body.dataset.movementFrameAudit));
    if(audit.phase!=='complete')throw Error(audit.error??'Movement recording failed');
    return audit.result;
   }});
  console.log(JSON.stringify({label:summary.label,eventCount:summary.eventCount,bytes:summary.bytes,markerMissing:summary.markerMissing,distance:summary.walk.distanceWalked,worst:summary.walk.worst}));
  if(summary.markerMissing||!(summary.walk.distanceWalked>0))throw Error('Trace did not capture a marked, moving route');
 }finally{await browser.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await run();
