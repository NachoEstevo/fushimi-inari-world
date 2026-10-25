import {attribute,positionLocal,materialColor,materialNormal,normalView,vec2,vec3,float,mix,smoothstep,sin,dot,fract,floor,max,texture,varying} from 'three/tsl';

// Keep terrain coordinates interpolated from the original, unsplit geometry.
export const terrainXZ=varying(positionLocal.xz,'terrainGroundXZ');
export const groundHash=p=>fract(sin(dot(p,vec2(127.1,311.7))).mul(43758.5453));
const noise=p=>{
 const i=floor(p),f=fract(p),s=f.mul(f).mul(float(3).sub(f.mul(2)));
 return mix(mix(groundHash(i),groundHash(i.add(vec2(1,0))),s.x),mix(groundHash(i.add(vec2(0,1))),groundHash(i.add(vec2(1,1))),s.x),s.y);
};

// Synchronous TSL counterpart of courtyard-ground.mjs. The caller supplies a
// MeshStandardNodeMaterial with the original maps and physical properties.
export function blendCourtyardGround(material,gravel,romon){
 // Streaming indexes direct material texture references. Keep this same
 // Texture visible to that index while the graph samples its updated image.
 material.terrainGravelMap=gravel.map;
 const offset=terrainXZ.sub(vec2(romon.target[0],romon.target[2]));
 const c=Math.cos(romon.yaw),s=Math.sin(romon.yaw);
 const local=vec2(offset.x.mul(c).sub(offset.y.mul(s)),offset.x.mul(s).add(offset.y.mul(c)));
 const court=float(1).sub(smoothstep(29.7,30.3,local.x.abs()))
  .mul(smoothstep(-55.3,-54.7,local.y)).mul(float(1).sub(smoothstep(21.7,22.3,local.y)));
 const grass=varying(attribute('precinctGrass','float'),'precinctGrassWeight');
 const cover=varying(attribute('groundCover','float'),'groundCoverWeight');
 const base=material.colorNode??materialColor;
 const fleck=dot(base.rgb,vec3(.299,.587,.114));
 const patch=float(.5).add(sin(terrainXZ.x.mul(.17).add(sin(terrainXZ.y.mul(.11)))).mul(sin(terrainXZ.y.mul(.19))).mul(.5));
 const greens=mix(vec3(.055,.12,.024),vec3(.12,.21,.043),patch).mul(fleck.mul(2.5).add(.65));
 const grassPatch=noise(terrainXZ.mul(.37)).mul(.65).add(noise(terrainXZ.mul(1.13)).mul(.35));
 const precinct=mix(vec3(.075,.145,.033),vec3(.17,.255,.073),grassPatch).mul(noise(terrainXZ.mul(24)).mul(.23).add(.87));
 material.colorNode=mix(mix(mix(base.rgb,greens,cover.mul(.88)),precinct,grass),texture(gravel.map,terrainXZ.div(1.5)).rgb,court);
 material.normalNode=mix(material.normalNode??materialNormal,normalView,max(court,grass.mul(.9))).normalize();
 material.needsUpdate=true;
}
