import test from 'node:test';
import assert from 'node:assert/strict';
import {qualityPixelRatio,createRenderQuality} from './render-quality.mjs';
test('existing ratios stay unchanged and Ultra has a four-million-pixel ceiling',()=>{
 assert.equal(qualityPixelRatio('balanced',3,1920,1080),1.25);
 assert.equal(qualityPixelRatio('high',3,1920,1080),1.7);
 assert.equal(qualityPixelRatio('ultra',1,1280,720),1.5);
 for(const [w,h] of [[1920,1080],[3840,2160],[8000,4000]])assert.ok(w*h*qualityPixelRatio('ultra',3,w,h)**2<=4000000.001);
});
test('preset switches dispose old shadow targets and restore original texture filtering',async()=>{
 const oldDocument=globalThis.document;
 globalThis.document={body:{dataset:{}}};globalThis.innerWidth=1000;globalThis.innerHeight=700;globalThis.devicePixelRatio=2;
 let disposed=0,ratio=1;const texture={isTexture:true,image:{},anisotropy:4};
 const renderer={capabilities:{maxTextureSize:4096,getMaxAnisotropy:()=>16},setPixelRatio:v=>ratio=v,getPixelRatio:()=>ratio,setSize(){}};
 const sun={shadow:{map:{dispose:()=>disposed++},mapSize:{x:4096,set(x){this.x=x;}}}};
 const quality=createRenderQuality({renderer,scene:{traverse:f=>f({material:{map:texture}})},camera:{},sun});
 try{await quality.setMode('high');assert.equal(sun.shadow.mapSize.x,2048);assert.equal(disposed,1);assert.equal(texture.anisotropy,4);assert.equal(ratio,1.7);await quality.setMode('balanced');assert.equal(ratio,1.25);quality.dispose();}
 finally{globalThis.document=oldDocument;}
});
