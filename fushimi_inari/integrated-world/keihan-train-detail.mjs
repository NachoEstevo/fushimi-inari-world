import * as THREE from 'three';

export function keihanServiceMaterial(){
 const m=new THREE.MeshStandardMaterial({color:'#eff2d9',roughness:.38,metalness:.12,emissive:'#e4ecc2',emissiveIntensity:.08});
 m.name='Keihan inferred service and carriage display atlas';
 m.userData={service:'Local / Yodoyabashi',provenance:'Interpretive P2 direction display, not an observed departure or scheduled service',carIdentifier:'Selected carriage position, not a surveyed fleet vehicle number'};
 if(globalThis.document?.createElement){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');if(ctx){
  ctx.fillStyle='#142322';ctx.fillRect(0,0,1024,256);ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#f2f3d8';ctx.font='bold 43px "Yu Gothic",sans-serif';ctx.fillText('普通  Local',256,57);ctx.font='bold 48px "Yu Gothic",sans-serif';ctx.fillText('淀屋橋',256,126);ctx.font='31px sans-serif';ctx.fillText('Yodoyabashi',256,195);
  ctx.strokeStyle='#a7b4a4';ctx.lineWidth=5;ctx.strokeRect(568,32,400,192);ctx.fillStyle='#f1f2dd';ctx.font='bold 62px sans-serif';ctx.fillText('KEIHAN',768,99);ctx.font='30px sans-serif';ctx.fillText('京阪電車',768,166);
  m.map=new THREE.CanvasTexture(c);m.map.colorSpace=THREE.SRGBColorSpace;m.map.anisotropy=4;m.emissiveMap=m.map;m.color.set('#ffffff');
 }}return m;
}

export function keihanDisplayPlane(parts,material,{x,y,z,width,height,side=0,identity=false}){
 const g=new THREE.PlaneGeometry(width,height),uv=g.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setX(i,(uv.getX(i)+(identity?1:0))*.5);
 if(side)g.rotateY(side*Math.PI/2);g.translate(x,y,z);parts.put(g,material,false);
}

// Keihan's official 13000 reference documents bucket longitudinal seating,
// curved stanchions, tall end dividers and orange entrance identification.
// https://www.keihan.co.jp/traffic/railfan/vehicle/13000.html
// Dimensions below are appearance estimates, not surveyed construction data.
export function detailKeihanCar(parts,spec,p,carIndex,center){
 const {carWidth:W,carLength:L}=spec.train,selected=carIndex===spec.train.selectedCar;
 let seats=0,dividers=0,windows=0;
 for(const side of [-1,1]){
  // A recessed sill and upper rubber gasket give glazing a real section.
  const edges=[-L/2,...spec.train.doorOffsets.flatMap(v=>[v-.65,v+.65]),L/2];
  for(let i=0;i<edges.length-1;i+=2){
   const lo=edges[i],hi=edges[i+1],span=hi-lo,mid=(lo+hi)/2;
   if(selected)for(const y of [1.32,2.38])parts.box(.095,.035,span-.14,side*(W/2+.012),y,center+mid,p.dark);
   if(selected)parts.box(.13,.035,span-.16,side*(W/2-.025),1.29,center+mid,p.metal);
   const panes=Math.max(1,Math.round((span-.16)/1.35));
   for(let k=1;k<panes;k++)parts.box(.095,1.08,.045,side*(W/2+.012),1.85,center+lo+.08+(span-.16)*k/panes,p.dark);
   windows+=panes;
   if(!selected||span<=1)continue;
   const count=Math.max(1,Math.floor((span-.30)/.46)),pitch=(span-.30)/count;
   // Individual cushions/backrests break the monolithic bench silhouette.
   for(let k=0;k<count;k++){
    const z=center+lo+.15+pitch*(k+.5);
    parts.box(.48,.16,pitch-.024,side*.98,.47,z,p.seat);
    const back=new THREE.BoxGeometry(.115,.54,pitch-.024);
    back.rotateZ(-side*.08);back.translate(side*1.18,.80,z);parts.put(back,p.seat);seats++;
    parts.box(.40,.025,pitch-.04,side*.99,.568,z,p.seat);
   }
   parts.box(.12,.17,span-.38,side*1.19,.27,center+mid,p.metal);
   for(const end of [lo+.10,hi-.10]){
    parts.box(.56,.83,.045,side*1.00,.76,center+end,p.cream);
    parts.beam([side*.73,.36,center+end],[side*.73,1.24,center+end],.018,p.metal,.018,6);dividers++;
   }
   // Three linked segments suggest the slightly bowed standing handrail.
   for(const [a,b] of [[[side*.74,.54],[side*.66,1.12]],[[side*.66,1.12],[side*.72,1.85]],[[side*.72,1.85],[side*.72,2.51]]])
    parts.beam([a[0],a[1],center+mid],[b[0],b[1],center+mid],.018,p.metal,.018,6);
  }
  for(const v of spec.train.doorOffsets){
   parts.box(.32,.012,1.28,side*(W/2-.13),.012,center+v,p.yellow);
   if(selected){parts.box(.05,.13,1.30,side*(W/2-.08),2.52,center+v,p.dark);parts.box(.054,.09,.72,side*(W/2-.08),2.52,center+v,p.cream);}
  }
  // Recessed panel joints and a stainless kick rail catch light differently
  // from painted bodywork, using the existing metal material batch.
  parts.box(.018,.045,L-.12,side*(W/2+.041),.11,center,p.metal);
  if(p.service){
   keihanDisplayPlane(parts,p.service,{x:side*(W/2+.047),y:2.77,z:center,width:1.04,height:.25,side});
   if(selected)keihanDisplayPlane(parts,p.service,{x:side*(W/2+.047),y:1.13,z:center+spec.train.doorOffsets[0]+.94,width:.32,height:.16,side,identity:true});
   if(selected)for(const v of spec.train.doorOffsets)keihanDisplayPlane(parts,p.service,{x:side*(W/2-.108),y:2.52,z:center+v,width:.71,height:.09,side:-side});
  }
 }
 // Two compact air-conditioning housings, rather than a featureless roof slab.
 for(const v of [-4.5,4.5]){
  parts.box(1.68,.22,2.85,0,3.40,center+v,p.metal);
  for(let k=-2;k<=2;k++)parts.box(1.48,.014,.055,0,3.518,center+v+k*.48,p.dark);
 }
 if(selected)for(const bogie of [-6,6])for(const side of [-1,1])for(const axle of [-.65,.65]){
  const wheel=new THREE.CylinderGeometry(.33,.33,.13,12);wheel.rotateZ(Math.PI/2);wheel.translate(side*.91,-.54,center+bogie+axle);parts.put(wheel,p.dark);
 }
 return {seats,dividers,windows};
}

// Uses the leaf-local box callback, so seals and interior panels follow motion.
export function detailKeihanDoor(box,p,side){
 for(const edge of [-1,1])box(.081,.94,.018,0,1.66,edge*.245,p.dark);
 for(const y of [1.20,2.12])box(.081,.025,.51,0,y,0,p.dark);
 box(.018,1.14,.59,-side*.045,.61,0,p.metal);
 box(.02,.26,.59,-side*.045,2.25,0,p.metal);
 box(.085,2.36,.016,0,1.18,0.319,p.dark);
 box(.018,.13,.055,-side*.058,.96,.23,p.dark);
}
