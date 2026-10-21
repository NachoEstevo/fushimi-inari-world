import * as THREE from 'three';
import {tamayamaShoulderPlan} from './tamayama-shoulders-layout.mjs';
import {clipConvex,polygonArea} from './entrance-area-surfaces-layout.mjs';
import {makeShoulderTriangleHeight} from './omotesando-shoulders-layout.mjs';

export function buildTamayamaAccessShoulders(root,features,network,materials){
  if(root.getObjectByName('Tamayama upper access mineral shoulders'))return null;
  const target=network.segments.filter(s=>s.id==='way/649175020');
  if(!target.length||!materials.gravelMat)return null;
  const points=target.flatMap(s=>[s.a,s.b]),margin=Math.max(...target.map(s=>s.width/2))+1.2;
  const bounds=[Math.min(...points.map(p=>p[0]))-margin,Math.max(...points.map(p=>p[0]))+margin,Math.min(...points.map(p=>p[2]))-margin,Math.max(...points.map(p=>p[2]))+margin];
  const obstacles=[];
  for(const f of [...(features.buildings??[]),...(features.water??[])]){
    if(Math.max(...f.points.map(p=>p[0]))<bounds[0]||Math.min(...f.points.map(p=>p[0]))>bounds[1]||Math.max(...f.points.map(p=>p[2]))<bounds[2]||Math.min(...f.points.map(p=>p[2]))>bounds[3])continue;
    const ring=f.points.map(p=>new THREE.Vector2(p[0],p[2]));
    if(ring[0].equals(ring.at(-1)))ring.pop();
    for(const tri of THREE.ShapeUtils.triangulateShape(ring,[]))obstacles.push(tri.map(i=>[ring[i].x,ring[i].y]));
  }
  const polygons=tamayamaShoulderPlan(network,obstacles),positions=[],uv=[],grid=.4;
  for(const polygon of polygons){
    const xs=polygon.map(p=>p[0]),zs=polygon.map(p=>p[1]);
    for(let x=Math.floor(Math.min(...xs)/grid)*grid;x<Math.max(...xs);x+=grid)for(let z=Math.floor(Math.min(...zs)/grid)*grid;z<Math.max(...zs);z+=grid){
      let p=clipConvex(polygon,[[x,z],[x+grid,z],[x+grid,z+grid],[x,z+grid]]);
      if(polygonArea(p)<0)p=[...p].reverse();
      for(let i=1;i<p.length-1;i++)for(const [px,pz]of [p[0],p[i+1],p[i]]){
        const y=network.terrainHeight(px,pz)+.012;
        if(!Number.isFinite(y))throw Error('Nonfinite Tamayama mineral shoulder');
        positions.push(px,y,pz);uv.push(px/1.5,pz/1.5);
      }
    }
  }
  if(!positions.length)return null;
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
  const material=materials.gravelMat.clone();material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Tamayama upper access mineral shoulders';mesh.receiveShadow=true;
  // Register exactly the emitted triangle planes; route interiors were cut
  // away, so the existing paving and stair walking levels retain ownership.
  const before=network.height.bind(network),height=makeShoulderTriangleHeight(geometry.attributes.position.array);
  network.height=(x,z)=>height(x,z)??before(x,z);
  const record={sourcePath:'way/649175020',renderedWidth:target[0].width,estimatedShoulderWidth:1,triangles:positions.length/9,walkingHeightRegistered:true,
    provenance:'Supplied June2012 Tamayama upper landing grey mineral margins; inferred1m strip beside existing network width, exact path/building/water clipping; terrain unchanged, no new platform polygon'};
  mesh.userData=record;root.add(mesh);return record;
}
