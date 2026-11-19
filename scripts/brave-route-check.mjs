// Opt-in release test. CI supplies Brave and playwright-core outside the game build.
import {appendFile,mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';

import {verifyFieldNoteWalk} from './brave-field-note-check.mjs';

const routeCase=process.env.BRAVE_ROUTE_CASE??'both';
assert.ok(['both','senbon','summit-loop'].includes(routeCase),'Unknown Windows walking case: '+routeCase);
const {chromium}=await import(pathToFileURL(process.env.BRAVE_DRIVER));
const out='outputs/brave-route-check',base='http://127.0.0.1:8421/integrated-world/index.html';
await mkdir(out,{recursive:true});
const report={routeCase,errors:[],checkpoints:[],startup:[],frames:[]};
async function save(){
 await writeFile(out+'/report.tmp',JSON.stringify(report,null,2));
 await rename(out+'/report.tmp',out+'/report.json');
}
async function stage(label){
 report.stage=label;
 await appendFile(out+'/stages.ndjson',JSON.stringify({at:new Date().toISOString(),stage:label})+'\n');
 await save();
 console.log(label);
}
function within(work,ms,label){
 let timer;
 return Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out after '+ms+'ms')),ms);})]).finally(()=>clearTimeout(timer));
}
await stage('Launch Brave');
const browser=await chromium.launch({executablePath:process.env.BRAVE_EXE,headless:false});
report.browser=browser.version();
await stage('Create desktop context');
const context=await browser.newContext({viewport:{width:960,height:640},deviceScaleFactor:1});
const page=await context.newPage();
page.setDefaultTimeout(180000);
page.on('pageerror',error=>report.errors.push(error.message));
page.on('crash',()=>report.errors.push('Renderer process crashed'));
page.on('response',response=>{
 if(response.url().startsWith(base.split('/integrated-world')[0])&&response.status()>=400)
  report.errors.push(response.status()+' '+new URL(response.url()).pathname);
});
async function enter(search,label){
 await stage(label+' · navigate');
 const start=performance.now();
 await page.goto(base+search,{waitUntil:'domcontentloaded'});
 await stage(label+' · enter welcome');
 await page.locator('#welcome-enter').click();
 await page.locator('#menu-open').waitFor();
 report.startup.push({label,readyMs:Math.round(performance.now()-start),backend:await page.locator('body').getAttribute('data-renderer-backend')});
 await save();
}
async function capture(label,{requireHealth=false}={}){
 await stage(label+' · read checkpoint');
 const data=await within(page.evaluate(()=>({place:document.body.dataset.checkpoint??null,backend:document.body.dataset.rendererBackend,
  gpuError:document.body.dataset.gpuError??null,bootstrap:document.body.dataset.bootstrapError??null})),30000,'Checkpoint telemetry');
 const monitor=page.getByRole('button',{name:'Exportar diagnóstico'});
 if(await monitor.isVisible()){
  await stage(label+' · export health');
  const [download]=await Promise.all([page.waitForEvent('download'),monitor.click()]);
  data.health=JSON.parse(await readFile(await within(download.path(),30000,'Health download'),'utf8'));
 }
 report.checkpoints.push({label,...data});
 await stage(label+' · screenshot');
 await page.screenshot({path:out+'/'+label+'.png',timeout:120000});
 await save();
 if(requireHealth){
  assert.ok(data.health?.samples?.length>0,'Missing renderer health samples for '+label);
  assert.equal(data.health.samples.at(-1).backend,data.backend,'Health and audit backend must agree');
 }
 assert.ok(!data.gpuError&&!data.bootstrap&&!data.health?.firstError&&!data.health?.failed,'GPU or startup error in '+label);
}
async function route(label,itinerary,quality,speed){
 await stage(label+' · open route menu');
 await page.locator('#menu-open').click();
 await page.getByRole('tab',{name:'Settings'}).click();
 const preset=page.locator('#render-quality');
 if(await preset.inputValue()!==quality){
  await stage(label+' · select '+quality+' quality');
  await preset.selectOption(quality);
  await page.locator('#render-quality:not([aria-busy])').waitFor({state:'attached'});
 }
 await stage(label+' · select itinerary');
 await page.getByRole('tab',{name:'Routes'}).click();
 await page.locator('#itinerary').selectOption({label:itinerary});
 if(label==='summit-loop'){
  await page.locator('#itinerary').selectOption('custom');
  await page.locator('#start').selectOption({label:'Ichinomine · 231 m'});
  await page.locator('#destination').selectOption({label:'Gozendani Hōhaisho · 143 m'});
  await page.locator('#via').selectOption({label:'Mitsurugisha · 184 m'});
 }
 await page.locator('#speed').selectOption(speed);
 await stage(label+' · build route');
 await page.locator('#route').click();
 await stage(label+' · begin walking');
 await page.locator('#walk').click();
 await page.waitForFunction(()=>document.querySelector('#walk')?.textContent==='Following route…');
 await stage(label+' · record 120s of movement');
 await page.getByRole('button',{name:'Record movement 120s'}).press('Enter');
 await page.waitForFunction(()=>JSON.parse(document.body.dataset.movementFrameAudit??'{}').phase==='complete',null,{timeout:240000});
 await stage(label+' · read walk result');
 const sample=await within(page.evaluate(()=>JSON.parse(document.body.dataset.movementFrameAudit).result),30000,'Walk result');
 report.frames.push({label,...sample});
 await capture(label,{requireHealth:true});
 assert.equal(sample.duration,120,'Requested recording must span 120 seconds');
 assert.ok(sample.elapsedMs>=120000&&sample.frameCount>0,'Incomplete movement window');
 assert.equal(sample.contextStart.quality,quality);assert.equal(sample.contextEnd.quality,quality);
 assert.ok(sample.distanceWalked>50,'Route must move more than 50 metres');
}
try{
 await enter('','cold');
 await capture('keihan');
 await enter('?audit=1&gpuAudit=1&frameAudit=1&frameAuditSeconds=120','warm');
 await stage('Read graphics adapter');
 const adapter=await within(page.evaluate(async()=>{
  const a=await navigator.gpu?.requestAdapter();if(!a)return null;
  return {vendor:a.info.vendor,architecture:a.info.architecture,description:a.info.description,isFallbackAdapter:a.info.isFallbackAdapter};
 }),30000,'WebGPU adapter request');
 report.adapter=adapter;
 await stage('Read graphics driver');
 const system=await browser.newBrowserCDPSession();
 try{
  const {gpu}=await within(system.send('SystemInfo.getInfo'),30000,'GPU information');
  report.graphics={devices:gpu.devices.map(({vendorString,deviceString,driverVersion})=>({vendorString,deviceString,driverVersion})),renderer:gpu.auxAttributes?.glRenderer,features:gpu.featureStatus};
 }finally{await system.detach();}
 // Test default-device startup at desktop size. A VM without a WebGPU adapter
 // uses software rasterization; give its walking pass a smaller drawing buffer.
 if(!adapter)await page.setViewportSize({width:512,height:360});
 if(routeCase==='both'||routeCase==='senbon')await route('senbon','Senbon and the three summits','balanced','50');
 if(routeCase==='both'||routeCase==='summit-loop')await route('summit-loop','Summit loop via Gozendani','high','50');
 if(process.env.BRAVE_FIELD_NOTES==='1')report.fieldNotes=await verifyFieldNoteWalk(page,{capture});
 assert.deepEqual(report.errors,[]);
 console.log(JSON.stringify({startup:report.startup,adapter,frames:report.frames.map(({label,distanceWalked,p99,worst})=>({label,distanceWalked,p99,worst}))}));
}catch(error){
 report.failure=String(error);report.failedStage=report.stage;
 await stage('Capture failure state');
 report.lastState=await within(page.evaluate(()=>Object.fromEntries(['bootPhase','checkpointPreparation','deferredBuildings','deferredCompilation','walkingNeighborhood','renderQuality','gpuError','movementFrameAudit'].map(key=>[key,document.body.dataset[key]?.slice(-16000)]))),12000,'Failure telemetry').catch(()=>null);
 await stage('Capture failure screen text');
 report.lastScreen=await page.locator('body').innerText({timeout:12000}).catch(()=>null);
 await stage('Capture failure screenshot');
 await page.screenshot({path:out+'/failure.png',timeout:15000}).catch(()=>{});
 throw error;
}finally{
 await stage('Close Brave');
 try{await within(browser.close(),20000,'Browser shutdown');}
 catch(error){report.closeError=String(error);await save();console.error(error);process.exit(1);}
}
