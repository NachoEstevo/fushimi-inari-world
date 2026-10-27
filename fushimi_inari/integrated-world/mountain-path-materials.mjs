import {fineGranite} from './surface-materials.mjs';

export function mountainPathMaterials(legacy){
  // Paving shares the existing flagstone material, and darker risers share
  // fine granite with the curbs via vertex color. Only the tread wear tile
  // and mossy retaining face need distinct mountain material batches.
  const retaining=legacy.materials.stoneMat.clone();
  retaining.roughness=.98;
  retaining.normalScale?.set(.65,.65);
  const tread=fineGranite(),canvas=tread.map.image,ctx=canvas.getContext('2d');
  const w=canvas.width,h=canvas.height;
  // Mineral wear is baked once into a 512×256 tile. The front bevel is a
  // subtle light strip and dirt collects in the back joint, without adding
  // floating decals or geometry to thousands of steps.
  let gradient=ctx.createLinearGradient(0,0,0,h);
  gradient.addColorStop(0,'rgba(222,218,199,.06)');
  gradient.addColorStop(.08,'rgba(222,218,199,0)');
  gradient.addColorStop(.78,'rgba(47,52,39,0)');
  gradient.addColorStop(1,'rgba(47,52,39,.10)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  // Broken dirt and mineral flecks vary the joint without a continuous
  // painted stripe. The tile remains shared by every tread.
  let seed=4371;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  for(let i=0;i<100;i++){
    const x=Math.floor(random()*(w-10)),y=i%2?Math.floor(random()*20):h-1-Math.floor(random()*20);
    ctx.fillStyle=i%3?'rgba(56,56,47,.10)':'rgba(219,214,199,.12)';ctx.fillRect(x,y,2+Math.floor(random()*8),1+Math.floor(random()*3));
  }
  tread.map.needsUpdate=true;tread.bumpMap=tread.map;tread.bumpScale=.003;
  tread.roughness=.97;
  return {mountainTread:tread,mountainRetaining:retaining};
}
