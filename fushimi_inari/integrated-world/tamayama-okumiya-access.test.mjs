import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {refineTamayamaOkumiyaAccess} from './tamayama-okumiya-access.mjs';

const features=JSON.parse(readFileSync(new URL('../geography/features.json',import.meta.url)));
// Actual derived access profiles from main 140adeb, including the existing
// integration/anchor grading (raw DEM alone does not reproduce these jumps).
// Rows: ax, az, bx, bz, ya, yb, rise. These are regression inputs, not changes
// to geographic source data or a claim that the inferred levels were surveyed.
const profiles=[
  {id:'way/1133055112',width:4.8,stair:false,rows:[
    [85.55,-33.752,87.01847847008081,-33.763,48.02555833987809,48.73886354381149,0],
    [87.01847847008081,-33.763,88.487,-33.763,48.73886354381149,49.23381009572485,0],
  ]},
  {id:'way/1133055113',width:2,stair:false,rows:[
    [86.955,-33.763,86.973,-34.893,48.71172311368552,48.755735184831664,0],
    [86.973,-34.893,86.991,-36.023,48.755735184831664,48.80029036163718,0],
  ]},
  {id:'way/1133055110',width:1.8,stair:true,rows:[
    [86.991,-36.023,87.037,-39.251,48.904864028557576,48.904864028557576,0.10457366692039471],
  ]},
  {id:'way/1392716577',width:6,stair:false,rows:[
    [114.952,-18.023,116.06,-18.112000000000002,52.28573527501524,52.63859375425969,0],
    [116.06,-18.112000000000002,117.168,-18.201,52.63859375425969,53.03718807028132,0],
  ]},
  {id:'way/105449724',width:3,stair:false,rows:[
    [117.168,-18.201,117.28596741060218,-16.722780027307287,53.03718807028132,53.185778880367494,0],
    [117.28596741060218,-16.722780027307287,117.40393482120434,-15.244560054614572,53.185778880367494,53.22905259082009,0],
    [117.40393482120434,-15.244560054614572,117.52190223180652,-13.766340081921857,53.22905259082009,53.196626144766284,0],
    [117.52190223180652,-13.766340081921857,117.63986964240868,-12.288120109229144,53.196626144766284,53.10444225828962,0],
    [117.63986964240868,-12.288120109229144,117.75783705301086,-10.809900136536427,53.10444225828962,52.9902968338765,0],
    [117.75783705301086,-10.809900136536427,117.87580446361302,-9.331680163843714,52.9902968338765,52.93382333468049,0],
    [117.87580446361302,-9.331680163843714,118.04632078005714,-7.859086795561291,52.93382333468049,52.995513817652466,0],
    [118.04632078005714,-7.859086795561291,118.24399641956221,-6.389401475780865,52.995513817652466,53.06476937535326,0],
    [118.24399641956221,-6.389401475780865,118.44167205906727,-4.919716156000437,53.06476937535326,53.13402493305405,0],
    [118.44167205906727,-4.919716156000437,118.63934769857234,-3.4500308362200114,53.13402493305405,53.20328049075484,0],
    [118.63934769857234,-3.4500308362200114,119.18818531137013,-2.3736508281193047,53.20328049075484,53.29642898036594,0],
    [119.18818531137013,-2.3736508281193047,120.6707902075801,-2.3431005520795365,53.29642898036594,53.4698804087668,0],
    [120.6707902075801,-2.3431005520795365,122.15339510379005,-2.3125502760397683,53.4698804087668,53.66362720438339,0],
    [122.15339510379005,-2.3125502760397683,123.636,-2.282,53.66362720438339,53.84112599999999,0],
  ]},
  {id:'way/1385048220',width:2,stair:false,rows:[
    [117.168,-18.201,117.71840449122224,-19.450284798833195,53.03718807028132,53.029813608782064,0],
    [117.71840449122224,-19.450284798833195,118.26880898244448,-20.699569597666386,53.029813608782064,52.93685144533802,0],
    [118.26880898244448,-20.699569597666386,118.81921347366672,-21.948854396499577,52.93685144533802,52.77057875336098,0],
    [118.81921347366672,-21.948854396499577,119.81885316463483,-22.526573037487452,52.77057875336098,52.84724309927296,0],
    [119.81885316463483,-22.526573037487452,121.18363987347612,-22.55842977811559,52.84724309927296,53.06456951815984,0],
    [121.18363987347612,-22.55842977811559,122.54842658231742,-22.590286518743724,53.06456951815984,53.187135753082025,0],
    [122.54842658231742,-22.590286518743724,123.91321329115871,-22.622143259371864,53.187135753082025,53.2350512711931,0],
    [123.91321329115871,-22.622143259371864,125.278,-22.654,53.2350512711931,53.27514480866099,0],
  ]},
];

function fixture(){
  const segments=profiles.flatMap(p=>p.rows.map(([ax,az,bx,bz,ya,yb,rise],index)=>({id:p.id,a:[ax,0,az],b:[bx,0,bz],ya,yb,width:p.width,kind:'stone',stair:p.stair,rise,curbLip:.025,distance:index*1.5})));
  // A real entrance ID outside both junctions must keep the legacy behavior.
  segments.push({id:'way/105449722',a:[-40,0,20],b:[-30,0,20],ya:20,yb:21,width:6,kind:'stone',stair:false,rise:0});
  const sample=(x,z)=>{
    let best=null;
    for(const s of segments){
      const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],t=Math.max(0,Math.min(1,((x-s.a[0])*dx+(z-s.a[2])*dz)/(dx*dx+dz*dz)));
      const distance=Math.hypot(x-s.a[0]-dx*t,z-s.a[2]-dz*t);
      if(distance<=s.width/2+.08&&(!best||distance<best.distance))best={height:s.ya+(s.yb-s.ya)*t,distance,segment:s};
    }
    return best;
  };
  return {segments,sample,height:(x,z)=>sample(x,z)?.height??19,terrainHeight:(x,z)=>sample(x,z)?.height-.045||19,edgeCovered:()=>false};
}
function maxLaneStep(network,id,lateral,spacing=.07){
  let previous=null,max=0;
  for(const s of network.segments.filter(s=>s.id===id)){
    const dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length=Math.hypot(dx,dz),count=Math.ceil(length/spacing);
    for(let i=0;i<=count;i++){
      const t=i/count,x=s.a[0]+dx*t-dz/length*lateral,z=s.a[2]+dz*t+dx/length*lateral,y=network.height(x,z);
      if(previous!==null)max=Math.max(max,Math.abs(y-previous));previous=y;
    }
  }
  return max;
}
const triangleHeight=(v,x,z)=>{
  const [ax,ay,az,bx,by,bz,cx,cy,cz]=v,den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);
  const a=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,b=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den,c=1-a-b;
  return {height:a*ay+b*by+c*cy,inside:a>1e-6&&b>1e-6&&c>1e-6};
};

test('real Tamayama and Okumiya lane switches become continuous rendered landings',()=>{
  const network=fixture();
  assert.ok(maxLaneStep(network,'way/1133055112',-.72)>.37);
  assert.ok(maxLaneStep(network,'way/1392716577',.72)>.34);
  refineTamayamaOkumiyaAccess(network,features);
  for(const side of [-.72,0,.72]){
    assert.ok(maxLaneStep(network,'way/1133055112',side)<.04);
    assert.ok(maxLaneStep(network,'way/1392716577',side)<.026);
  }
  // The side-flight's original 10.46 cm riser remains an actual step.
  const stair=network.segments.find(s=>s.id==='way/1133055110');
  const end=network.segments.filter(s=>s.id==='way/1133055113').at(-1);
  assert.ok(Math.abs(stair.ya-end.yb-.10457366692039471)<1e-10);
});

test('walk height follows every emitted triangle; clipped ribbons never stack',()=>{
  const network=fixture();refineTamayamaOkumiyaAccess(network,features);
  const triangles=network.segments.flatMap(s=>{
    const out=[],positions=s.accessJunctionTriangles??[];
    for(let i=0;i<positions.length;i+=9)out.push({s,v:positions.slice(i,i+9)});
    return out;
  });
  for(const {s,v} of triangles){
    const normalY=(v[5]-v[2])*(v[6]-v[0])-(v[3]-v[0])*(v[8]-v[2]);
    assert.ok(normalY>0,'all patch triangles face up');
    for(const weights of [[1/3,1/3,1/3],[.2,.3,.5],[.6,.25,.15]]){
      const x=v[0]*weights[0]+v[3]*weights[1]+v[6]*weights[2],z=v[2]*weights[0]+v[5]*weights[1]+v[8]*weights[2];
      const expected=v[1]*weights[0]+v[4]*weights[1]+v[7]*weights[2];
      assert.ok(Math.abs(network.height(x,z)-expected)<1e-7,`${s.id} render/walk disagreement`);
      assert.ok(network.terrainHeight(x,z)<=expected-.045+1e-8,'support cannot cover the pavement');
    }
    const x=(v[0]+v[3]+v[6])/3,z=(v[2]+v[5]+v[8])/3;
    for(const other of triangles)if(other.s.id!==s.id)assert.ok(!triangleHeight(other.v,x,z).inside,'different path ribbons overlap');
  }
});

test('mapped geometry and the protected side stair remain intact',()=>{
  const network=fixture(),original=structuredClone(network.segments),source=JSON.stringify(features);
  refineTamayamaOkumiyaAccess(network,features);
  assert.equal(JSON.stringify(features),source);
  assert.deepEqual(network.segments.map(({accessJunction,accessJunctionTriangles,...s})=>s),original);
  const protectedStair=network.segments.find(s=>s.id==='way/1133055110');
  assert.equal(protectedStair.accessJunction,undefined);
  assert.equal(network.height(86.995,-36.3),protectedStair.ya);
  assert.equal(network.edgeCovered(86.99,-36.16,48.8,'way/1133055112'),true,'no curb across the side-stair mouth');
  assert.equal(network.edgeCovered(86.99,-31.36,48.8,'way/1133055112'),false,'opposite landing edge stays closed');
});

test('unrelated paths and points beyond the local transition keep their old values',()=>{
  const network=fixture(),points=[];
  for(let x=-43;x<=-27;x+=.23)for(let z=16;z<=24;z+=.63)points.push([x,z]);
  for(let z=-11;z<=-5;z+=.17)for(const x of [117.4,117.8,118.2])points.push([x,z]);
  const before=points.map(([x,z])=>[network.height(x,z),network.terrainHeight(x,z)]);
  const entrance=network.segments.find(s=>s.id==='way/105449722');
  refineTamayamaOkumiyaAccess(network,features);
  assert.equal(entrance.accessJunction,undefined);
  points.forEach(([x,z],i)=>assert.deepEqual([network.height(x,z),network.terrainHeight(x,z)],before[i]));
});

test('bounded, idempotent patch adds no material or collision objects',()=>{
  const network=fixture(),stats=refineTamayamaOkumiyaAccess(network,features);
  assert.equal(stats.junctions.length,2);assert.equal(stats.segments,13);
  assert.ok(stats.triangles<850);assert.equal(stats.extraMaterials,0);assert.equal(stats.extraColliders,0);
  assert.strictEqual(refineTamayamaOkumiyaAccess(network,features),stats);
  const unrelated=fixture();assert.equal(refineTamayamaOkumiyaAccess(unrelated,{paths:[]}).segments,0);
  assert.ok(unrelated.segments.every(s=>s.accessJunction===undefined));
});
