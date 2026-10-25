// Shared by the two pedestrian owners; a greeting never changes route ownership.
export function createPersonInteraction({vendor=false,now=()=>performance.now()}={}){
 let started=-Infinity;
 const duration=vendor?2100:1800;
 const action=()=>{
  if(now()-started<duration)return vendor?'The attendant is serving.':'The visitor returns your greeting.';
  started=now();
  return vendor?'The attendant welcomes you at the counter.':'The visitor bows hello.';
 };
 return {data:{language:'en',title:vendor?'Food attendant':'Visitor',proximity:true,
  prompt:vendor?'Greet the attendant':'Say hello',cooldownMs:duration,reach:vendor?3.6:2.8,
  directAction:action,actions:[{label:vendor?'Greet the attendant':'Say hello',run:action}]},
  progress(time=now()){const elapsed=time-started;return elapsed>=0&&elapsed<duration?elapsed/duration:null;}};
}

export function posePersonGreeting(rig,progress){
 if(progress===null)return;
 const bow=Math.sin(Math.PI*progress);
 rig.Head?.bone.rotateX(bow*.24);
 // A small, relaxed acknowledgement keeps hands within the body silhouette.
 rig['UpperArm.R']?.bone.rotateZ(-bow*.18);
}
