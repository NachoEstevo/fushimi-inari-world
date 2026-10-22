import test from 'node:test';
import assert from 'node:assert/strict';
import {visitorClearance,planVisitorRoutes,createVisitorState,stepVisitor} from './visitor-navigation.mjs';
const assembly=(colliders=[])=>({colliders,walkHeight:()=>0,spatial:{byId:{entrance:{target:[0,0,0]}}},surfaces:{segments:Array.from({length:6},(_,i)=>({id:'path',distance:i,a:[i,0,0],b:[i+1,0,0],width:3,kind:'path',stair:false}))}});
test('visitor capsule rejects rails crossing the torso, solid bodies and cylinder centers',()=>{
 const clear=visitorClearance(assembly([{type:'box',args:[2,0,2,.04,0,.8,1.1]},{type:'cylinder',args:[8,0,.2,0,3]}]));
 assert.equal(clear(2,0),false);assert.equal(clear(2,.3),false);assert.equal(clear(2,.6),true);assert.equal(clear(8,0),false);
});
test('routes require an entirely clear public path with continuous walking height',()=>{
 assert.equal(planVisitorRoutes(assembly()).length,1);
 assert.equal(planVisitorRoutes(assembly([{type:'box',args:[3,0,.1,2,0,0,3]}])).length,0);
 const steep=assembly();steep.walkHeight=x=>x>2?2:0;assert.equal(planVisitorRoutes(steep).length,0);
 const stairs=assembly();stairs.surfaces.segments.forEach(s=>s.stair=true);assert.equal(planVisitorRoutes(stairs).length,0);
});
test('visitors pause, yield without overlapping, resume and reverse while staying on route',()=>{
 const route={points:[[0,0,0],[0,0,2],[0,0,4]]},p=createVisitorState(route);p.pause=0;
 stepVisitor(p,.05,[{x:0,y:0,z:.5}]);assert.equal(p.state,'yield');assert.equal(p.z,0);
 stepVisitor(p,.05,[]);assert.equal(p.state,'walk');assert.ok(p.z>0);
 let paused=false,returned=false;for(let i=0;i<700;i++){stepVisitor(p,.05,[]);paused ||= p.state==='pause';returned ||= p.direction===-1;assert.ok(p.z>=0&&p.z<=4);assert.equal(p.x,0);}
 assert.ok(paused&&returned);
 const before=p.z;stepVisitor(p,100,[]);assert.ok(Math.abs(p.z-before)<=p.speed*.05+.0001);
});
