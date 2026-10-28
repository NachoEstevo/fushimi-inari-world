// Shared by the emitted Keihan carriage geometry and its return-camera plan.
// These are the existing appearance dimensions, not surveyed railway metrics.
export const KEIHAN_SEATING=Object.freeze({
 vestibuleHalf:.65,cushionX:.98,cushionY:.47,cushionWidth:.48,cushionHeight:.16,
 backX:1.18,backY:.80,backWidth:.115,backHeight:.54,backTilt:.08,
 capX:.99,capY:.568,capWidth:.40,capHeight:.025,cushionGap:.024,capGap:.04
});

export function keihanCarSeatSpans(train,center=0,seating=true){
 if(!Number.isFinite(train?.carLength)||train.carLength<=0||!Array.isArray(train.doorOffsets)||!train.doorOffsets.every(Number.isFinite)||!Number.isFinite(center))return [];
 const edges=[-train.carLength/2,...train.doorOffsets.flatMap(v=>[v-KEIHAN_SEATING.vestibuleHalf,v+KEIHAN_SEATING.vestibuleHalf]),train.carLength/2],spans=[];
 for(let i=0;i<edges.length-1;i+=2){
  const lo=edges[i],hi=edges[i+1],span=hi-lo,mid=(lo+hi)/2,count=seating&&span>1?Math.max(1,Math.floor((span-.30)/.46)):0,pitch=count?(span-.30)/count:0;
  const seats=Array.from({length:count},(_,k)=>center+lo+.15+pitch*(k+.5));spans.push({lo,hi,span,mid,count,pitch,seats});
 }
 return spans;
}
