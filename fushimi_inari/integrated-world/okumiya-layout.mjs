import {roofHeight} from './roof-profile.mjs';

// Photo-inferred details fit the retained source pavilion; these dimensions
// describe a visual reconstruction, not a measured architectural survey.
export const okumiyaLayout=Object.freeze({
  roofWidth:7.8,roofDepth:6.2,roofCentreZ:.28,ridgeZ:-.27,
  roofRise:2.05,roofEaveY:3.5416,
  wallWidth:5.6,wallDepth:3.8,verandaWidth:6.3,verandaDepth:4.4,
  verandaFloor:1.61,railTop:2.09,
  frontBayCentres:Object.freeze([-1.8,0,1.8]),
  frontPostCentres:Object.freeze([-2.7,-.9,.9,2.7])
});

export function okumiyaRoofY(x,z){
  const local=z-okumiyaLayout.roofCentreZ;
  const t=local>=-.55?(local+.55)/3.65:(local+.55)/2.55;
  // Keep the R65 eave height while restoring the taller photographed gable.
  // The profile's endpoint is 0.28 * rise, so subtract it before anchoring.
  return okumiyaLayout.roofEaveY+roofHeight(t,okumiyaLayout.roofRise)-okumiyaLayout.roofRise*.28+.12*Math.pow(Math.abs(x/3.9),6);
}

// Follow the long front roof slope. Flat beams previously intersected the
// eave at one end and floated far below the roof at the other.
export function okumiyaRafter(x,back=1.91,front=3.36){
  return Array.from({length:5},(_,i)=>{
    const z=back+(front-back)*i/4;
    return[x,okumiyaRoofY(x,z)-.1425,z];
  });
}

// The photo shows a U-shaped veranda rail. Keeping the front open also
// avoids introducing a barrier across the existing interaction approach.
export function okumiyaRailRuns(){
  return[
    {axis:'x',fixed:-2.12,start:-3.08,end:3.08},
    {axis:'z',fixed:-3.08,start:-2.12,end:1.92},
    {axis:'z',fixed:3.08,start:-2.12,end:1.92}
  ];
}

// IMG6628 and6974 show lattice only around the projecting prayer-front
// corners, not a wrap around the white main sanctuary. Depth is estimated.
export function okumiyaLatticeReturns(){
 return [-1,1].map(side=>({side,x:side*2.84,y:1.05,z:1.582,height:1.12,depth:.72,frontZ:1.942}));
}

// The white and vermilion gable-fascia bands follow the existing roof exactly.
export function okumiyaBargeboard(side){
 return Array.from({length:33},(_,i)=>{const z=-2.82+i*6.2/32;return[side*3.90,okumiyaRoofY(side*3.90,z)-.23,z];});
}
