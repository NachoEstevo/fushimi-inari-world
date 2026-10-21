// Tamayama Inari, the small west-facing shrine at the top of the western
// precinct stair. OSM fixes identity/position; the photographs fix visible
// structure, not measured dimensions. Keep the neighbouring 305214601 separate.
export const TAMAYAMA_SOURCES=Object.freeze([
  'https://commons.wikimedia.org/wiki/File:20100714_Kyoto_Fushimi_Inari_1728.jpg',
  'https://www.pakutaso.com/20250410115post-42559.html'
]);

export const TAMAYAMA_LAYOUT=Object.freeze({
  id:'way/305214602',
  body:{width:3.4,height:2.6,depth:2.8,center:[0,1.5,-.4]},
  apron:{width:3.7,height:.22,depth:4.8,center:[0,.11,0]},
  roof:{halfWidth:2.4,back:-2.1,front:2.3,ridgeZ:-.70,ridgeY:4.30},
  karahafu:{halfWidth:2.4,back:1.04,front:2.48},
  porch:{postX:1.47,postZ:1.94,postWidth:.22,postBottom:.22,postTop:2.88},
  fence:{centerX:2.85,width:2.30,z:.40,bottom:.22,top:1.67},
  stoneLanterns:[[-2.25,1.85,0,.82],[2.25,1.85,0,.82],[-3.12,.94,0,.98],[3.12,.94,0,.98]],
  timberLanterns:[[-3.94,1.88],[3.94,1.88]],
  offering:{center:[0,.63,1.08],width:.90,height:.72,depth:.22}
});

export function tamayamaMainRoofHeight(z,x=0){
  const {roof}=TAMAYAMA_LAYOUT;
  const end=z>=roof.ridgeZ?roof.front:roof.back;
  const t=Math.min(1,Math.abs((z-roof.ridgeZ)/(end-roof.ridgeZ)));
  // Long front pitch and eased eaves visible from the southwest in 2010.
  return roof.ridgeY-1.32*(1-(1-t)**2)+.16*t**8+.09*(Math.abs(x)/roof.halfWidth)**6;
}

export function tamayamaKarahafuHeight(x,z=TAMAYAMA_LAYOUT.karahafu.front){
  const {karahafu}=TAMAYAMA_LAYOUT;
  const u=Math.abs(x)/karahafu.halfWidth;
  // A broad central arch, concave shoulders and lifted ends. The old flat box
  // could not express any of these characteristic silhouette changes.
  return 2.98+1.16*Math.exp(-((Math.abs(x)/1.30)**2.6))+.18*u**6+.10*(karahafu.front-z);
}

// Only real solid volumes. The old 4.8 x 4.4 m collision envelope covered the
// end of the public approach. Local +Z faces west after the actual group matrix.
// Floors are still owned by the retained apron and mapped path surfaces.
export function tamayamaLocalSolids(){
  const l=TAMAYAMA_LAYOUT,p=l.porch,f=l.fence,o=l.offering;
  const solids=[
    {id:'body',center:[0,-.4],half:[1.7,1.4],bottom:.20,top:2.80},
    {id:'offering',center:[o.center[0],o.center[2]],half:[o.width/2,o.depth/2],bottom:.27,top:.99}
  ];
  for(const side of [-1,1]){
    solids.push({id:`porch-${side}`,center:[side*p.postX,p.postZ],half:[p.postWidth/2,p.postWidth/2],bottom:p.postBottom,top:p.postTop});
    solids.push({id:`fence-${side}`,center:[side*f.centerX,f.z],half:[(f.width+.15)/2,.09],bottom:f.bottom,top:f.top});
  }
  l.stoneLanterns.forEach(([x,z,seat,scale],index)=>{
    solids.push({id:`stone-base-${index}`,center:[x,z],half:[.29*scale,.29*scale],bottom:seat,top:seat+.29*scale});
    solids.push({id:`stone-shaft-${index}`,center:[x,z],half:[.215*scale,.215*scale],bottom:seat+.29*scale,top:seat+1.515*scale});
    solids.push({id:`stone-cap-${index}`,center:[x,z],half:[.375*scale,.375*scale],bottom:seat+1.515*scale,top:seat+1.99*scale});
  });
  l.timberLanterns.forEach(([x,z],index)=>{
    solids.push({id:`timber-base-${index}`,center:[x,z],half:[.34,.34],bottom:0,top:.30});
    solids.push({id:`timber-shaft-${index}`,center:[x,z],half:[.13,.13],bottom:.30,top:2.57});
    solids.push({id:`timber-head-${index}`,center:[x,z],half:[.43,.43],bottom:2.57,top:3.56});
  });
  return solids;
}
