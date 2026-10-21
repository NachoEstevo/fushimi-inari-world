// Only the illustrative Omotesando row, identified before geographic mapping.
// The reference shows slender lights here; other precinct lanterns stay owned
// by their existing builders. Source coordinates are not world coordinates.
const stations=[10,14.5,19,24.5,29.5,34.5,40.5];
const litStations=[14.5,24.5,34.5];
const near=(a,b)=>Number.isFinite(a)&&Math.abs(a-b)<1e-6;
const row=(x,z)=>near(Math.abs(x),6.8)&&stations.some(s=>near(z,s));

export function isUnsupportedEntranceProp(object){
  if(object.userData?.zone!=='entrance'||!row(object.position?.x,object.position?.z))return false;
  if(object.isPointLight)return litStations.some(s=>near(object.position.z,s))&&
    near(object.intensity,2.8)&&near(object.distance,12)&&near(object.decay,1.8);
  if(!object.isGroup||!['x','y','z'].every(axis=>near(object.scale?.[axis],.96))||object.children?.length!==6)return false;
  const has=(type,match)=>object.children.some(child=>child.geometry?.type===type&&match(child.geometry.parameters));
  return has('BoxGeometry',p=>near(p.width,.72)&&near(p.height,.26)&&near(p.depth,.72))&&
    has('CylinderGeometry',p=>near(p.radiusTop,.16)&&near(p.radiusBottom,.20)&&near(p.height,.98))&&
    has('BoxGeometry',p=>near(p.width,.66)&&near(p.height,.14)&&near(p.depth,.66))&&
    has('BoxGeometry',p=>near(p.width,.42)&&near(p.height,.38)&&near(p.depth,.42))&&
    has('ConeGeometry',p=>near(p.radius,.64)&&near(p.height,.36)&&p.radialSegments===6)&&
    has('SphereGeometry',p=>near(p.radius,.11));
}

export function isUnsupportedEntranceCollider(collider){
  const a=collider.args;
  return collider.zone==='entrance'&&collider.type==='cylinder'&&a?.at(-1)==='lantern'&&
    row(a[0],a[1])&&near(a[2],.34*.96)&&near(a[4]-a[3],2.2*.96);
}
