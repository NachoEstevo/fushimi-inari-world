import * as THREE from 'three';
import {pathOffset} from './path-frame.mjs?v=10';
import {clippedCourtCells,courtPolygonArea} from './court-clipping.mjs';

// IMG_6470 shows a fine grey mineral forecourt, not turf. These apron limits are
// inferred within the mapped outer retaining wall way/1119779132, not surveyed.
const courtBounds=Object.freeze([-85.4,-69.2,-20.5,-4.0]);

export function buildEntranceShrineCourt(root,features,surfaces){
  const grid=.4,offset=.025,positions=[],uv=[],obstacles=[];
  // Match the rendered ribbon and its mitered 13 cm stone edge exactly.
  // Conservative circular buffers used to leave exposed soil along the join.
  for(const [index,s] of surfaces.segments.entries()){
    const pad=s.width+1;
    if(Math.max(s.a[0],s.b[0])+pad<courtBounds[0]||Math.min(s.a[0],s.b[0])-pad>courtBounds[1]||
      Math.max(s.a[2],s.b[2])+pad<courtBounds[2]||Math.min(s.a[2],s.b[2])-pad>courtBounds[3])continue;
    const adjacent=(candidate,end)=>candidate?.id===s.id&&Math.hypot(candidate[end][0]-(end==='b'?s.a:s.b)[0],candidate[end][2]-(end==='b'?s.a:s.b)[2])<.001?candidate:null;
    const na=pathOffset(s.a,s.b,adjacent(surfaces.segments[index-1],'b'));
    const nb=pathOffset(s.a,s.b,adjacent(surfaces.segments[index+1],'a'),true);
    const w=s.width/2+(s.kind==='stone' ? .13 : 0);
    obstacles.push([[s.a[0]+na[0]*w,s.a[2]+na[1]*w],[s.b[0]+nb[0]*w,s.b[2]+nb[1]*w],
      [s.b[0]-nb[0]*w,s.b[2]-nb[1]*w],[s.a[0]-na[0]*w,s.a[2]-na[1]*w]]);
  }
  // Triangulate concave source footprints before convex subtraction. Exact
  // footprint boundaries remain holes; neither buildings nor water are paved.
  for(const feature of [...(features.buildings??[]),...(features.water??[])]){
    if(Math.max(...feature.points.map(p=>p[0]))<courtBounds[0]||Math.min(...feature.points.map(p=>p[0]))>courtBounds[1]||
      Math.max(...feature.points.map(p=>p[2]))<courtBounds[2]||Math.min(...feature.points.map(p=>p[2]))>courtBounds[3])continue;
    const ring=feature.points.map(p=>new THREE.Vector2(p[0],p[2]));
    if(ring.length>1&&ring[0].equals(ring.at(-1)))ring.pop();
    for(const triangle of THREE.ShapeUtils.triangulateShape(ring,[]))obstacles.push(triangle.map(i=>[ring[i].x,ring[i].y]));
  }
  const polygons=clippedCourtCells(courtBounds,obstacles,grid);
  let triangles=0;
  for(const polygon of polygons)for(let i=1;i<polygon.length-1;i++){
    if(courtPolygonArea([polygon[0],polygon[i+1],polygon[i]])<1e-10)continue;
    for(const [px,pz] of [polygon[0],polygon[i+1],polygon[i]]){
      const y=surfaces.terrainHeight(px,pz)+offset;
      if(!Number.isFinite(y))throw new Error('Nonfinite shrine court terrain at '+px+','+pz);
      positions.push(px,y,pz);uv.push(px/1.6,pz/1.6);
    }
    triangles++;
  }
  if(!triangles)return null;
  const textureSize=256,pixels=new Uint8Array(textureSize*textureSize*4);let seed=647059;
  for(let i=0;i<pixels.length;i+=4){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const pixel=i/4,x=pixel%textureSize,z=Math.floor(pixel/textureSize);
    // Small aggregate grains with quiet, periodic colour variation. The
    // photograph supports mineral paving, not large pebbles or brown turf.
    const mottling=3*Math.sin(x*Math.PI*2/textureSize)*Math.cos(z*Math.PI*4/textureSize);
    const grey=132+seed%23+mottling-(seed%13===0?16:0);
    pixels[i]=grey;pixels[i+1]=grey+1;pixels[i+2]=grey;pixels[i+3]=255;
  }
  const map=new THREE.DataTexture(pixels,textureSize,textureSize,THREE.RGBAFormat);
  map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.anisotropy=4;map.needsUpdate=true;
  const material=new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:.008,color:'#ffffff',roughness:1,
    polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Fine grey mineral apron before three entrance shrines';
  mesh.receiveShadow=true;mesh.castShadow=false;
  mesh.userData={bounds:[...courtBounds],grid,boundaryPolicy:'exact polygon clipping',offset,cells:polygons.length,triangles,
    provenance:'IMG_6470 mineral courtyard appearance; outer envelope inferred from retaining wall way/1119779132 and front edge. Exact rendered path-edge and mapped building/water footprint clipping. Ground unchanged; no lawn or collider.'};
  root.add(mesh);return mesh;
}
