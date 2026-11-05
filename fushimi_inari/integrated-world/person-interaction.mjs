import {posePersonWave} from './person-presence.mjs';

const visitorLines={
 reception:['The mountain feels peaceful today.','Enjoy your walk up the mountain.'],
 entrance:['It is lovely to be here.','There is so much to notice along the way.'],
 temizuya:['A quiet moment before the path.','The sound of water is calming.'],
 romon:['The gate is beautiful, isn’t it?','Take your time as you enter.'],
 gehaiden:['It feels peaceful here.','There is always something new to notice.'],
 naihaiden:['A good place to pause for a moment.','The mountain feels close from here.'],
 street:['There is plenty to see along this street.','Enjoy your walk to the shrine.'],
 default:['Hello. Enjoy your walk.','A quiet moment is always welcome.']
};
const vendorLines={
 senbei:['The senbei is freshly toasted.','Take your time looking around.'],
 'soft-serve':['A cool treat for the walk?','Welcome. Take your time choosing.'],
 grill:['Something warm from the grill?','Welcome. Everything is freshly prepared.'],
 default:['Welcome. Take your time.','A little snack for the walk?']
};

// Shared by the two pedestrian owners; a greeting never changes route ownership.
export function createPersonInteraction({vendor=false,seed=0,zone='default',kind='default',now=()=>performance.now()}={}){
 let started=-Infinity,activeTime=0,managed=false,blocked=false,count=0;
 const duration=vendor?2100:1800,variant=Math.abs(Math.trunc(Number(seed)||0));
 const gesture=(vendor?['bow','nod']:['bow','nod','wave'])[variant%(vendor?2:3)];
 const lines=(vendor?vendorLines[kind]:visitorLines[zone])??(vendor?vendorLines.default:visitorLines.default);
 const action=()=>{
  const time=managed?activeTime:now();
  if(time-started<duration)return vendor?'The attendant smiles.':'The visitor smiles.';
  started=time;return lines[(variant+count++)%lines.length];
 };
 return {gesture,data:{language:'en',title:vendor?'Food attendant':'Visitor',proximity:true,
  prompt:vendor?'Greet the attendant':'Say hello',cooldownMs:duration,reach:vendor?3.6:2.8,
  directAction:action,actions:[{label:vendor?'Greet the attendant':'Say hello',run:action}]},
  advance(dt,paused=false){
   if(!managed){activeTime=now();managed=true;}
   blocked=paused;
   if(!blocked&&Number.isFinite(dt))activeTime+=Math.max(0,Math.min(.05,dt))*1000;
  },
  progress(time){const elapsed=(managed?activeTime:time??now())-started;return elapsed>=0&&elapsed<duration?elapsed/duration:null;}};
}

export function posePersonGreeting(rig,progress,gesture='bow'){
 if(progress===null||!Number.isFinite(progress))return;
 const amount=Math.sin(Math.PI*Math.max(0,Math.min(1,progress)));
 if(gesture==='wave'){
  rig.Head?.bone.rotateX(amount*.08);posePersonWave(rig,amount,progress);
 }else if(gesture==='nod'){
  rig.Head?.bone.rotateX(amount*.15);rig.Torso?.bone.rotateX(amount*.025);
 }else{
  rig.Head?.bone.rotateX(amount*.24);rig.Torso?.bone.rotateX(amount*.075);
  rig['UpperArm.R']?.bone.rotateZ(-amount*.18);
 }
}
