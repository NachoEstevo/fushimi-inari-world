// Architectural source levels, independent of the old procedural mountain.
// Sideways extension is intentional: the mapped court is wider than the old 44 m strip.
export function precinctLevel(z){
  if(z>=6.5)return 0;
  if(z>=2.5)return 1.6*(6.5-z)/4;
  if(z>=-19.6)return 1.6;
  if(z>=-22.2)return 1.6+1.6*(-19.6-z)/2.6;
  return 3.2;
}

// Video shows one connected lower courtyard, not an independent DEM mound
// beneath each building. Keep a broad level interior and release at its edges.
export function lowerCourtBlend(x,z,existing,level){
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const side=1-smooth((Math.abs(x)-28)/5);
  const front=smooth((-z-2.5)/3);
  const rear=1-smooth((-z-33)/7);
  const weight=side*front*rear;
  return existing+(level-existing)*weight;
}
