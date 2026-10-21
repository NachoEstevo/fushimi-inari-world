const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
// Approximate vegetation envelope shared with the distant woodland direction.
// Not a surveyed lawn map. Preserve bare path margins and steep exposed banks.
export function groundCover(x,y,z,slope,pathDistance){
  const edge=135+Math.max(0,Math.abs(z)-350)*.25+Math.sin(z*.012)*35;
  return smooth(edge-12,edge+24,x)*smooth(50,75,y)
    *(1-smooth(.55,1.45,slope))*smooth(2.5,5.5,pathDistance);
}
