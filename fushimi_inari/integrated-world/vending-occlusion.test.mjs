import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {createVendingOcclusion} from './vending-occlusion.mjs';
const machine={spec:{position:[0,0,0]}},eye=new Vector3(0,1.4,3),button=new Vector3(0,1.4,.38);
test('walls occlude clicks but the cabinet and distant geometry do not',()=>{
 const cabinet={type:'box',args:[0,0,.52,.35,0,0,1.85]};
 assert.equal(createVendingOcclusion([cabinet],[machine])(eye,button,machine),false);
 const wall={type:'box',args:[0,1.5,2,.1,Math.PI/4,0,3]};
 assert.equal(createVendingOcclusion([cabinet,wall],[machine])(eye,button,machine),true);
 const far={type:'box',args:[0,8,2,.1,0,0,3]};
 assert.equal(createVendingOcclusion([far],[machine])(eye,button,machine),false);
});
test('a narrow post blocks only at its actual radius and height',()=>{
 const post={type:'cylinder',args:[0,1.5,.1,0,2]};
 const blocks=createVendingOcclusion([post],[machine]);assert.equal(blocks(eye,button,machine),true);
 assert.equal(blocks(new Vector3(.2,1.4,3),new Vector3(.2,1.4,.38),machine),false);
 assert.equal(blocks(new Vector3(0,2.2,3),new Vector3(0,2.2,.38),machine),false);
});

test('only the matching real cabinet is ignored when collecting from the low tray',()=>{
 const own={type:'box',args:[0,0,.57,.39,0,0,1.85,'keihan-platform-vending']};
 const eye=new Vector3(0,1.7,1),tray=new Vector3(0,.4,.409*.8);
 assert.equal(createVendingOcclusion([own],[machine])(eye,tray,machine),false);
 const other={type:'box',args:[0,.7,.52,.35,0,0,1.85,'keihan-street-vending']};
 assert.equal(createVendingOcclusion([own,other],[machine])(eye,tray,machine),true);
 const wall={type:'box',args:[0,0,.57,.39,0,0,1.85,'wall']};
 assert.equal(createVendingOcclusion([wall],[machine])(eye,tray,machine),true);
});
