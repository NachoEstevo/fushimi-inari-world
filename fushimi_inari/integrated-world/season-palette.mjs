export const seasons=['spring','autumn'];
export const validSeason=value=>seasons.includes(value)?value:'spring';
const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
function noise(x,z){
  const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz;
  const u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);
  const a=hash(ix,iz)*(1-u)+hash(ix+1,iz)*u,b=hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u;
  return a*(1-v)+b*v;
}
export function woodlandPatch(x,z){return .55*noise(x/110,z/110)+.30*noise(x/43,z/43)+.15*hash(x,z);}
// Majority evergreen; only deciduous groups change to warm autumn hues.
export function canopyPalette(season,a,b,c,flowering=false){
  const deciduous=a>.64;
  if(season==='spring'&&flowering)return [.94,.24,.40+b*.13];
  if(season==='autumn'&&deciduous)return [.025+b*.105,.64+c*.20,.12+b*.07];
  return [.23+c*.065,.32+a*.15,(season==='spring'?.065:.045)+b*.04];
}
