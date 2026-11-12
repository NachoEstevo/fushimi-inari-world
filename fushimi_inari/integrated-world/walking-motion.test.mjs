import test from 'node:test';
import assert from 'node:assert/strict';
import {walkingSpeed,movementSteps,paceSpeed,smoothWalkingEye,createFootstepCadence,createWalkingVelocity,createHeadBob,HEAD_BOB} from './walking-motion.mjs';
test('fast and boosted walking retain bounded collision substeps',()=>{
  for(const speed of [1.6,3,6,10])for(const boost of [false,true]){
    const actual=walkingSpeed(speed,boost),step=movementSteps(.1,actual);
    assert.ok(step.distance<=.12);
    assert.ok(Math.abs(step.count*step.distance-.1*actual)<1e-9);
  }
});
test('invalid settings cannot create negative or unbounded movement',()=>{
  assert.equal(walkingSpeed('invalid'),3);
  assert.equal(walkingSpeed(100),10);
  assert.equal(movementSteps(-1,3).distance,0);
  assert.ok(Math.abs(movementSteps(4,3).count*movementSteps(4,3).distance-.3)<1e-9);
});
test('slow and fast paces stay ordered and fall back to slow',()=>{
  assert.ok(paceSpeed('slow','walk')<paceSpeed('fast','walk'));
  assert.ok(paceSpeed('slow','fly')<paceSpeed('fast','fly'));
  assert.equal(paceSpeed('unknown','walk'),paceSpeed('slow','walk'));
  for(const pace of ['slow','fast'])assert.equal(walkingSpeed(paceSpeed(pace,'walk')),paceSpeed(pace,'walk'));
});
test('a tread transition settles exponentially at the same rate across frame rates',()=>{
  for(const support of [.18,-.18]){
    const samples=[30,60,120].map(hz=>{let eye=1.7;for(let i=0;i<hz/2;i++)eye=smoothWalkingEye(eye,support,1/hz);return eye;});
    assert.ok(Math.abs(samples[0]-samples[2])<1e-12);
    assert.ok(Math.abs(samples[0]-(support+1.7))<.00003);
  }
});
test('visual stair lag stays above the tread and inside the downhill head margin',()=>{
  let eye=1.7;
  for(let i=1;i<=50;i++){
    const support=i*.18;eye=smoothWalkingEye(eye,support,1/120);
    assert.ok(eye>=support+1.5);assert.ok(eye<support+1.7);
  }
  for(let i=49;i>=0;i--){
    const support=i*.18;eye=smoothWalkingEye(eye,support,1/120);
    assert.ok(eye<=support+1.82);assert.ok(eye>support+1.7);
  }
  assert.equal(smoothWalkingEye(20,0,1/60),1.7,'large discontinuities reset');
  assert.equal(smoothWalkingEye(1.7,.18,0),1.7);
});
test('slow, fast and Shift have distinct cadence at 30/60/120 Hz with at most one frame of quantization',()=>{
  for(const hz of [30,60,120]){
    const counts=[];
    for(const [pace,boost,interval] of [['slow',false,.52],['fast',false,.44],['slow',true,.38],['fast',true,.38]]){
    const cadence=createFootstepCadence(),times=[],speed=walkingSpeed(paceSpeed(pace,'walk'),boost);
      for(let i=1;i<=hz*10;i++)if(cadence.update(speed/hz,1/hz,pace,boost))times.push(i/hz);
      counts.push(times.length);
      for(let i=0;i<times.length;i++){
        const gap=times[i]-(times[i-1]??0);
        assert.ok(gap>=interval-1e-9);assert.ok(gap<interval+1/hz+1e-9);
      }
    }
    assert.ok(counts[0]<counts[1]&&counts[1]<counts[2]);assert.equal(counts[2],counts[3]);
  }
});
test('changing pace while walking uses elapsed time without resetting or queuing sounds',()=>{
  const cadence=createFootstepCadence();
  for(let i=0;i<4;i++)assert.equal(cadence.update(.8,.1,'slow'),false);
  assert.equal(cadence.update(.8,.01,'slow',true),true,'Shift adopts 0.38 s cadence immediately');
  for(let i=0;i<5;i++)assert.equal(cadence.update(.8,.1,'slow'),false);
  assert.equal(cadence.update(.8,.02,'slow'),true,'releasing Shift restores 0.52 s');
  for(let i=0;i<4;i++)assert.equal(cadence.update(.8,.1,'fast'),false);
  assert.equal(cadence.update(.8,.04,'fast'),true);
});
test('footstep cadence needs travelled distance, drops idle progress and never catches up after a hitch',()=>{
  const cadence=createFootstepCadence();
  for(let i=0;i<120;i++)assert.equal(cadence.update(0,1/60),false);
  assert.equal(cadence.update(.74,.1),false);
  assert.equal(cadence.update(0,.1),false);
  assert.equal(cadence.update(.02,.1),false,'standing discarded prior partial stride');
  cadence.reset();
  assert.equal(cadence.update(10,1),false,'a hitch advances at most 0.1 s');
  for(let i=0;i<4;i++)assert.equal(cadence.update(10,.1),false);
  assert.equal(cadence.update(10,.1),true);
  assert.equal(cadence.update(10,1/60),false,'no queued backlog');
  cadence.reset();assert.equal(cadence.update(.1,.1),false);
});
test('eased velocity is frame-rate independent, converges exactly and survives the 0.1 s clamp',()=>{
  const run=(hz,seconds,target)=>{const v=createWalkingVelocity();let x=0;for(let i=0;i<Math.round(hz*seconds);i++){v.update(target[0],target[1],5,1/hz);x+=v.dx;}return {v,x};};
  const samples=[30,60,144].map(hz=>run(hz,.5,[5,0]));
  for(const s of samples){assert.ok(Math.abs(s.x-samples[0].x)<1e-9);assert.equal(s.v.x,5);assert.equal(s.v.z,0);}
  assert.ok(Math.abs(samples[0].x-(5*.5-5*.15/2))<1e-9);
  const coarse=createWalkingVelocity();coarse.update(5,0,5,1);assert.ok(Math.abs(coarse.x-5*.1/.15)<1e-12);assert.ok(Math.abs(coarse.dx-5*.1/.15/2*.1)<1e-12,'dt clamps to 0.1 s');
  // A turn eases through intermediate directions instead of snapping.
  const turn=createWalkingVelocity();for(let i=0;i<10;i++)turn.update(5,0,5,.1);turn.update(0,5,5,1/60);assert.ok(turn.x>4&&turn.z>0&&turn.z<1);
  const stop=createWalkingVelocity();for(let i=0;i<10;i++)stop.update(5,0,5,.1);stop.update(0,0,5,.05);assert.ok(Math.abs(stop.x-5*(1-.05/.11))<1e-9);stop.update(0,0,5,.1);assert.equal(stop.x,0);
  for(const bad of [NaN,Infinity])assert.equal(createWalkingVelocity().update(bad,0,5,1/60).dx,0);
});
test('constrained velocity keeps only the accepted direction',()=>{
  const v=createWalkingVelocity();for(let i=0;i<10;i++)v.update(3,3,5,.1);
  v.constrain(0,.05);assert.equal(v.x,0);assert.equal(v.z,3);
  v.constrain(0,0);assert.equal(v.x,0);assert.equal(v.z,0);
  for(let i=0;i<10;i++)v.update(3,0,5,.1);v.constrain(-.01,0);assert.equal(v.x,0,'never reverses into a bounce');
});
test('head bob ramps with speed, stays bounded, and is exactly zero when idle or disabled',()=>{
  for(const hz of [30,60,144]){
    const bob=createHeadBob();let maxV=0,maxL=0;
    for(let i=0;i<hz*3;i++){bob.update({dt:1/hz,speedFraction:1,interval:.52});maxV=Math.max(maxV,Math.abs(bob.vertical));maxL=Math.max(maxL,Math.abs(bob.lateral));}
    assert.ok(maxV<=HEAD_BOB.vertical+1e-12&&maxV>HEAD_BOB.vertical*.9);assert.ok(maxL<=HEAD_BOB.lateral+1e-12&&maxL>HEAD_BOB.lateral*.9);
    for(let i=0;i<Math.ceil(hz*HEAD_BOB.rampSeconds)+1;i++)bob.update({dt:1/hz,speedFraction:0});
    assert.equal(bob.vertical,0);assert.equal(bob.lateral,0);
  }
  const sprint=createHeadBob();let peak=0;for(let i=0;i<300;i++){sprint.update({dt:1/60,speedFraction:1,boost:true,interval:.38});peak=Math.max(peak,Math.abs(sprint.vertical));}
  assert.ok(peak>HEAD_BOB.vertical*1.15&&peak<=HEAD_BOB.vertical*HEAD_BOB.sprint+1e-12);
  const off=createHeadBob();for(let i=0;i<60;i++)off.update({dt:1/60,speedFraction:1});off.update({dt:1/60,speedFraction:1,enabled:false});assert.equal(off.vertical,0);assert.equal(off.lateral,0);
  const step=createHeadBob();let last=0,jump=0;for(let i=0;i<120;i++){step.update({dt:1/60,speedFraction:1,footstep:i%31===30});jump=Math.max(jump,Math.abs(step.vertical-last));last=step.vertical;}
  assert.ok(jump<HEAD_BOB.vertical*.5,'footfall alignment never pops the view');
});
