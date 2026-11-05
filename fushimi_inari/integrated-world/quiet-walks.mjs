// Walks are invitations over memories the journal already owns; they keep no
// separate counters or completion flags.
export const ZEN_QUIET_WALKS=Object.freeze([
 {id:'station',title:'First pause',finished:'A pause by the canal.',steps:[
  {text:'Meet Aki at the station.',done:s=>!!s.moments.aki},
  {text:'Pick up a drink for the walk.',done:s=>!!s.moments.drink},
  {text:'Photograph the canal and both banks.',done:s=>!!s.photoPrompts['canal-light']}
 ]},
 {id:'gates',title:'Torii rhythm',finished:'The space between the gates.',steps:[
  {text:'Photograph the gates at Senbon Torii.',done:s=>!!s.photoPrompts['gate-rhythm']},
  {text:'Make a sketch among the gates.',done:s=>!!s.sketches['sketch-gates']}
 ]},
 {id:'mountain',title:'Mountain day',finished:'A day on the mountain.',steps:[
  {text:'Photograph Kyoto from Yotsutsuji.',done:s=>!!s.photoPrompts['kyoto-view']},
  {text:'Pause for tea at Suehiro-ya.',done:s=>!!s.moments.tea},
  {text:'Return by train.',done:s=>{
   const returned=s.moments.return??0,visit=s.visit;
   return returned>Math.max(visit.startedAt,s.moments.tea??0,s.photoPrompts['kyoto-view']??0)&&visit.finishedAt>=returned;
  }}
 ]}
]);

export function describeQuietWalks(state){
 return ZEN_QUIET_WALKS.map(({id,title,finished,steps})=>{
  const next=steps.find(step=>!step.done(state));
  return {id,title,finished,complete:!next,next:next?.text??null};
 });
}
