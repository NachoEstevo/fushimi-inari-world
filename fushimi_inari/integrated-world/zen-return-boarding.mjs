import {KEIHAN_SEATING,keihanCarSeatSpans} from './keihan-seat-layout.mjs';
const point=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const axis=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);

// No geometry construction or world traversal: the owner and camera consume
// the same seat centers/dimensions, transformed through the real track frame.
export function createZenReturnBoardingPlan(spec){
 const train=spec?.train,track=spec?.track,platform=spec?.route?.platformDoor,seat=KEIHAN_SEATING;
 if(!train||!track||!point(platform)||!axis(track.origin)||!axis(track.east)||!axis(track.direction)||!Number.isFinite(train.floor)||!Number.isFinite(train.carWidth)||train.carWidth<2||
  Math.abs(Math.hypot(...track.east)-1)>.001||Math.abs(Math.hypot(...track.direction)-1)>.001||Math.abs(track.east[0]*track.direction[0]+track.east[1]*track.direction[1])>.001)return null;
 const center=train.carCenters?.[train.selectedCar],door=train.doorOffsets?.[train.selectedDoor];if(!Number.isFinite(center)||!Number.isFinite(door))return null;
 const doorV=center+door,spans=keihanCarSeatSpans(train,center),following=spans.filter(s=>s.lo>=door+seat.vestibuleHalf-1e-6),preceding=spans.filter(s=>s.hi<=door-seat.vestibuleHalf+1e-6).reverse();
 let chosen=null;
 for(const bay of [...following,...preceding]){
  const candidates=bay.lo>door?bay.seats:bay.seats.slice().reverse();
  for(const v of candidates){
   // Stay a cushion away from the tall end divider and away from the bowed
   // central stanchion. No furniture is moved to create this sitting route.
   if(Math.abs(v-(center+bay.lo))<.50||Math.abs(v-(center+bay.hi))<.50||Math.abs(v-(center+bay.mid))<.50)continue;
   chosen={v,bay};break;
  }
  if(chosen)break;
 }
 if(!chosen)return null;
 const at=(u,y,v)=>[track.origin[0]+track.east[0]*u+track.direction[0]*v,train.floor+y,track.origin[1]+track.east[1]*u+track.direction[1]*v];
 const seatTop=seat.capY+seat.capHeight/2,eye=seatTop+.70,v=chosen.v,forward=v>doorV?1:-1;
 return {
  platform:{position:[platform[0],platform[1]+1.7,platform[2]],target:at(-1.1,1.7,doorV)},
  entry:{position:at(.10,1.7,doorV),target:at(-1.1,1.7,doorV)},
  aisle:{position:at(.10,1.7,v),target:at(.10,1.7,v+forward*4)},
  approach:{position:at(.40,1.7,v),target:at(seat.capX,eye+.12,v)},
  seated:{position:at(seat.capX,eye,v),target:at(-1.15,eye+.12,v+forward*1.25)},
  axis:[track.direction[0],0,track.direction[1]],
  seat:{side:1,v,localX:seat.capX,localTop:seatTop,surfaceY:train.floor+seatTop,pitch:chosen.bay.pitch},
  departureDistance:Number.isFinite(spec.arrival?.travelDistance)?Math.max(0,Math.min(24,spec.arrival.travelDistance)):24
 };
}
