// Opt-in release test. CI supplies Brave and playwright-core outside the game build.
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';

const {chromium}=await import(pathToFileURL(process.env.BRAVE_DRIVER));
const out='outputs/brave-route-check',base='http://127.0.0.1:8421/integrated-world/index.html';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BRAVE_EXE,headless:false});
const context=await browser.newContext({viewport:{width:960,height:640},deviceScaleFactor:1});
const page=await context.newPage();
page.setDefaultTimeout(120000);
const report={browser:browser.version(),errors:[],checkpoints:[],startup:[],frames:[]};
page.on('pageerror',error=>report.errors.push(error.message));
page.on('crash',()=>report.errors.push('Renderer process crashed'));
page.on('response',response=>{
 if(response.url().startsWith(base.split('/integrated-world')[0])&&response.status()>=400)
  report.errors.push(response.status()+' '+new URL(response.url()).pathname);
});
const save=()=>writeFile(out+'/report.json',JSON.stringify(report,null,2));
async function enter(search,label){
 const start=performance.now();
 await page.goto(base+search,{waitUntil:'domcontentloaded'});
 await page.locator('#welcome-enter').click();
 await page.locator('#menu-open').waitFor();
 report.startup.push({label,readyMs:Math.round(performance.now()-start),backend:await page.locator('body').getAttribute('data-renderer-backend')});
 await save();
}
async function capture(label){
 const data=await page.evaluate(()=>({place:document.body.dataset.checkpoint??null,backend:document.body.dataset.rendererBackend,
  gpuError:document.body.dataset.gpuError??null,bootstrap:document.body.dataset.bootstrapError??null,
  health:JSON.parse(document.body.dataset.rendererHealth??'null')}));
 report.checkpoints.push({label,...data});
 await page.screenshot({path:out+'/'+label+'.png',timeout:120000});
 await save();
 assert.ok(!data.gpuError&&!data.bootstrap&&!data.health?.firstError&&!data.health?.failed,'GPU or startup error in '+label);
}
async function route(label,itinerary,quality,speed){
 await page.locator('#menu-open').click();
 await page.getByRole('tab',{name:'Settings'}).click();
 await page.locator('#render-quality').selectOption(quality);
 await page.getByRole('tab',{name:'Routes'}).click();
 await page.locator('#itinerary').selectOption({label:itinerary});
 await page.locator('#speed').selectOption(speed);
 await page.locator('#route').click();
 await page.locator('#walk').click();
 await page.getByRole('button',{name:'Record movement 120s'}).press('Enter');
 await page.waitForFunction(()=>JSON.parse(document.body.dataset.movementFrameAudit??'{}').phase==='complete',null,{timeout:240000});
 const sample=await page.evaluate(()=>JSON.parse(document.body.dataset.movementFrameAudit).result);
 report.frames.push({label,...sample});
 assert.ok(sample.distanceWalked>50,'Route must move through the world');
 await capture(label);
}
try{
 await enter('','cold');
 await capture('keihan');
 await enter('?audit=1&gpuAudit=1&frameAudit=1&frameAuditSeconds=120','warm');
 const adapter=await page.evaluate(async()=>{
  const a=await navigator.gpu?.requestAdapter();if(!a)return null;
  return {vendor:a.info.vendor,architecture:a.info.architecture,description:a.info.description,isFallbackAdapter:a.info.isFallbackAdapter};
 });
 report.adapter=adapter;
 await route('senbon','Senbon and the three summits','balanced','12');
 await route('summit-loop','Summit loop via Gozendani','high','50');
 assert.deepEqual(report.errors,[]);
 console.log(JSON.stringify({startup:report.startup,adapter,frames:report.frames.map(({label,distanceWalked,p99,worst})=>({label,distanceWalked,p99,worst}))}));
}finally{
 await save();
 await browser.close();
}
