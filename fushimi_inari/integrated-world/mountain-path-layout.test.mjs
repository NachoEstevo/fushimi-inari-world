import test from 'node:test';
import assert from 'node:assert/strict';
import {isMountainPathSegment,mountainShoulder,mountainPathUV,mountainTreadUV} from './mountain-path-layout.mjs';

const segment={id:'mountain',kind:'stone',a:[400,0,-100],b:[401,0,-100],ya:80,yb:80,width:2,distance:12};
const ground=(x,z)=>80-(z+100)*.6;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('mountain pass leaves entrance, both Senbon branches and lower elevations outside its scope',()=>{
  assert.equal(isMountainPathSegment(segment),true);
  for(const patch of [
    {a:[254,0,50]},
    {a:[80,0,0],b:[81,0,0],ya:42,yb:42},
    {id:'way/260121328'},
    {id:'way/377968455'},
    {ya:59.99},
    {kind:'restricted'},
  ])assert.equal(isMountainPathSegment({...segment,...patch}),false);
});

test('soil shoulder follows downhill terrain instead of floating at tread height',()=>{
  const a=[400,80,-98.87],b=[401,80,-98.87];
  const quad=mountainShoulder(a,b,[0,1],[0,1],1,ground,()=>false,.36);
  assert.ok(quad);
  for(const point of quad.slice(2))near(point[1],ground(point[0],point[2])-.04);
  assert.ok(quad[2][1]<79.2,'downhill edge must lower to the slope');
  for(const point of quad)assert.ok(point[2]>-99,'all shoulder vertices stay outside the 2 m walk surface');
});

test('shoulder triangles face upward on both sides without reversing at a rising grade',()=>{
  for(const side of [-1,1]){
    const a=[400,80,-100+side*1.13],b=[401,80.2,-100+side*1.13];
    const quad=mountainShoulder(a,b,[0,1],[0,1],side,ground,()=>false,.36);
    assert.ok(quad);
    for(const [i,j,k] of [[0,2,1],[0,3,2]]){
      const [a,b,c]=[quad[i],quad[j],quad[k]];
      const normalY=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
      assert.ok(normalY>0,'reversed path triangulation must produce an upward normal');
    }
  }
});

test('shoulders do not bridge another route, a cliff or missing terrain samples',()=>{
  const args=[[400,80,-98.87],[401,80,-98.87],[0,1],[0,1],1];
  assert.equal(mountainShoulder(...args,ground,(x)=>x>400.4&&x<400.6),null);
  assert.equal(mountainShoulder(...args,()=>70,()=>false),null);
  assert.equal(mountainShoulder(...args,()=>NaN,()=>false),null);
  assert.equal(mountainShoulder(...args,ground,()=>false,0),null);
});

test('inside of a short acute bend does not emit a folded soil ribbon',()=>{
  const folded=mountainShoulder([400,80,-98.87],[400.1,80,-98.87],[0,1],[-1.5,1],1,()=>79.9,()=>false,.36);
  assert.equal(folded,null);
});

test('paving UVs remain continuous through a bend; step edge follows ascent and descent',()=>{
  const first=mountainPathUV(segment,1);
  const next=mountainPathUV({...segment,a:segment.b,b:[401,0,-99],distance:13},1);
  near(first[1][1],next[0][1]);near(first[2][1],next[3][1]);
  const up=mountainTreadUV({...segment,riserAt:'a'}),down=mountainTreadUV({...segment,riserAt:'b'});
  assert.equal(up[0][1],1);assert.equal(down[1][1],1);
  for(const uv of [...first,...next,...up,...down])assert.ok(uv.every(Number.isFinite));
});
