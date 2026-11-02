import * as THREE from 'three';

// Editable sculpture source. Run shinme-horse-bake.mjs to regenerate the
// unified runtime surface; no remeshing or extra batches run in the world.
function loft(parts,material,z,sections,segments=12,sides=10){
  const center=new THREE.CatmullRomCurve3(sections.map(([x,y])=>new THREE.Vector3(x,y,0)));
  const radius=new THREE.CatmullRomCurve3(sections.map(([, ,a,b])=>new THREE.Vector3(a,b,0)));
  const positions=[],indices=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments,p=center.getPoint(t),tangent=center.getTangent(t),r=radius.getPoint(t);
    const length=Math.hypot(tangent.x,tangent.y),nx=-tangent.y/length,ny=tangent.x/length;
    for(let j=0;j<sides;j++){
      const angle=2*Math.PI*j/sides,c=Math.cos(angle),s=Math.sin(angle);
      positions.push(p.x+nx*Math.max(.002,r.x)*c,p.y+ny*Math.max(.002,r.x)*c,z+Math.max(.002,r.y)*s);
    }
  }
  for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){
    const a=i*sides+j,b=i*sides+(j+1)%sides,c=(i+1)*sides+j,d=(i+1)*sides+(j+1)%sides;
    indices.push(a,b,c,b,d,c);
  }
  for(const [ring,t,reverse] of [[0,0,true],[segments,1,false]]){
    const p=center.getPoint(t),cap=positions.length/3;positions.push(p.x,p.y,z);
    for(let j=0;j<sides;j++){
      const a=ring*sides+j,b=ring*sides+(j+1)%sides;
      indices.push(cap,...(reverse?[b,a]:[a,b]));
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();parts.put(geometry,material);
}

export function addShinmeHorseSource(parts,p,z){
  const shape=(sections,segments=12,sides=10,offset=0)=>loft(parts,p.paper,z+offset,sections,segments,sides);
  // Withers, rounded ribcage and hindquarters; the arched neck joins the chest.
  shape([[-.70,1.52,.025,.025],[-.50,1.53,.28,.23],[-.24,1.53,.36,.28],
    [.19,1.54,.36,.28],[.49,1.56,.33,.27],[.69,1.59,.22,.18],[.75,1.61,.02,.02]],16,12);
  shape([[-.32,1.40,.10,.10],[-.39,1.58,.29,.22],[-.48,1.80,.28,.22],[-.61,2.10,.22,.18],
    [-.67,2.31,.15,.14],[-.68,2.40,.07,.10]],12,12);
  // A long cheek and tapered lower face give the head its equine profile.
  shape([[-.67,2.43,.08,.10],[-.74,2.34,.16,.15],[-.82,2.23,.16,.16],
    [-.94,2.12,.13,.13],[-1.04,2.04,.12,.13],[-1.09,2.02,.045,.06]],12,10);
  for(const side of [-1,1]){
    const shift=side*.015,legZ=side*.14;
    // Forearm/knee/cannon/fetlock and rounded thigh/hock rather than straight posts.
    shape([[-.40+shift,1.68,.055,.06],[-.44+shift,1.43,.16,.13],[-.46+shift,1.22,.13,.11],
      [-.49+shift,.99,.085,.075],[-.48+shift,.76,.06,.06],[-.51+shift,.49,.06,.06]],9,8,legZ);
    shape([[.43+shift,1.72,.06,.07],[.48+shift,1.48,.19,.14],[.58+shift,1.28,.17,.13],
      [.67+shift,1.05,.10,.085],[.63+shift,.85,.075,.07],[.59+shift,.55,.06,.06],
      [.57+shift,.49,.06,.06]],9,8,legZ);
    shape([[-.67,2.36,.055,.05],[-.66,2.53,.047,.04],[-.69,2.67,.006,.008]],5,8,side*.095);
  }
  // Carved mane and falling tail remain pale like the photographed statue.
  shape([[-.58,2.48,.04,.08],[-.45,2.30,.075,.09],[-.32,2.08,.075,.09],
    [-.14,1.90,.08,.09],[.01,1.78,.025,.035]],10,8);
  shape([[-.69,2.45,.045,.08],[-.78,2.40,.055,.10],[-.86,2.33,.015,.035]],6,8);
  shape([[.70,1.68,.075,.09],[.83,1.51,.09,.09],[.90,1.23,.09,.08],
    [.91,.98,.07,.06],[.95,.83,.015,.018]],8,8);
}
