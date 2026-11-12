import test from 'node:test';
import assert from 'node:assert/strict';
import {createStampHandleGeometry,createCommemorativeInkGeometry} from './reception-stamp-geometry.mjs';
test('stamp plate contacts y=0 and sculpted handle stays within the existing hand footprint',()=>{
 const g=createStampHandleGeometry();g.computeBoundingBox();const b=g.boundingBox;
 assert.ok(Math.abs(b.min.y)<1e-7);assert.ok(b.max.y>.13&&b.max.y<.14);assert.ok(b.max.x-b.min.x<=.066);
 const p=g.attributes.position;const radii=[];for(let i=0;i<p.count;i++)if(p.getY(i)>.01)radii.push(Math.hypot(p.getX(i),p.getZ(i)));
 assert.ok(Math.max(...radii)-Math.min(...radii)>.015);assert.ok(g.attributes.color.count===p.count);assert.ok(p.count/3<500);g.dispose();
});
test('imprint leaves uninked negative space on the paper and uses no extra texture',()=>{
 const g=createCommemorativeInkGeometry();g.computeBoundingBox();let area=0;const p=g.attributes.position;
 const indices=g.index?.array??Array.from({length:p.count},(_,i)=>i);for(let i=0;i<indices.length;i+=3){const [a,b,c]=indices.slice(i,i+3);area+=Math.abs((p.getX(b)-p.getX(a))*(p.getZ(c)-p.getZ(a))-(p.getZ(b)-p.getZ(a))*(p.getX(c)-p.getX(a)))/2;}
 assert.ok(area>0&&area<.065*.065*.35);assert.ok(g.boundingBox.max.x<.033);assert.ok(g.boundingBox.max.z<.033);assert.ok(g.boundingBox.max.y-g.boundingBox.min.y<1e-7);g.dispose();
});
