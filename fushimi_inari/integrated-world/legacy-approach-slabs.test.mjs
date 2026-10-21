import test from 'node:test';
import assert from 'node:assert/strict';
import {isLegacyApproachSlab,clearLegacyApproachSlabs} from './legacy-approach-slabs.mjs';
const mesh=(w,h,d,z)=>({isMesh:true,geometry:{parameters:{width:w,height:h,depth:d},dispose(){this.disposed=true;}},position:{z},removeFromParent(){this.removed=true;}});
test('cleanup removes exact three slabs and nine stripes while preserving architecture',()=>{
 const slabs=[mesh(36,.36,30,37.5),mesh(9.2,.06,28.5,36.8),mesh(44,.05,5.2,49.5),...Array.from({length:9},()=>mesh(.42,.06,3.6,49.5))],roof=mesh(25.2,.65,6.8,.2),parent={isGroup:true,children:[...slabs,roof]},root={traverse(fn){fn(parent);}};
 assert.deepEqual(clearLegacyApproachSlabs(root),{removed:12,slabs:3,stripes:9});assert.ok(slabs.every(m=>m.removed&&m.geometry.disposed));assert.equal(roof.removed,undefined);
});
test('similar geometry outside exact source station is preserved',()=>{
 assert.equal(isLegacyApproachSlab(mesh(44,.05,5.2,0)),false);assert.equal(isLegacyApproachSlab(mesh(44,.06,5.2,49.5)),false);
 const root={traverse(fn){fn({isGroup:true,children:[mesh(44,.05,5.2,49.5)]});}};assert.equal(clearLegacyApproachSlabs(root).removed,0);
});
