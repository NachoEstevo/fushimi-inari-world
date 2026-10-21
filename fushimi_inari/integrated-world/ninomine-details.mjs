import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Local legacy coordinates, metres. Existing placements and stair clear width
// remain authoritative. Silhouette/wear below is photograph-inferred, not surveyed.
export function refineNinomine(object,materials={}){
  if(object.userData.zone!=='ninomine'||!object.isGroup||object.userData.ninomineRefined)return;
  object.userData.ninomineRefined=true;
  const black=materials.blackNemakiMat??new THREE.MeshStandardMaterial({color:'#262724',roughness:.94});
  const stone=(materials.entryStoneMat??materials.stoneMat??new THREE.MeshStandardMaterial({color:'#85867d'})).clone();
  stone.roughness=.98;
  const miniPieces=[
    new THREE.BoxGeometry(.04,.38,.06).translate(-.115,-.02,0),
    new THREE.BoxGeometry(.04,.38,.06).translate(.115,-.02,0),
    new THREE.BoxGeometry(.34,.035,.05).translate(0,.165,0),
    new THREE.BoxGeometry(.29,.035,.05).translate(0,.09,0),
    new THREE.BoxGeometry(.035,.075,.045).translate(0,.125,0),
  ];
  const mini=mergeGeometries(miniPieces);miniPieces.forEach(g=>g.dispose());
  const cap=new THREE.BoxGeometry(.36,.025,.06,8,1,1),cp=cap.attributes.position;
  for(let i=0;i<cp.count;i++)cp.setY(i,cp.getY(i)+.016*Math.pow(cp.getX(i)/.18,4));
  cap.computeVertexNormals();
  const targets=[];object.traverse(m=>{if(m.isMesh)targets.push(m);});
  for(const mesh of targets){
    const p=mesh.geometry?.parameters;
    if(mesh.geometry?.type!=='BoxGeometry')continue;
    if(p.width===.36&&p.height===.42&&p.depth===.06){
      // Replace solid red blocks by open offerings, retaining every authored
      // transform. Black kasagi is visible in user photograph 5.
      mesh.geometry=mini;
      const top=new THREE.Mesh(cap,black);top.position.y=.195;mesh.add(top);
      top.castShadow=true;top.receiveShadow=true;
    }
    if(p.depth===.26&&p.width>=.44&&p.width<=.65&&p.height>=.9&&p.height<=1.93){
      const geo=new THREE.BoxGeometry(p.width,p.height,p.depth,8,8,1),v=geo.attributes.position;
      const crown=Math.min(.24,p.width*.38),colors=[];
      for(let i=0;i<v.count;i++){
        const x=v.getX(i),y=v.getY(i),z=v.getZ(i),blend=Math.max(0,(y-(p.height/2-crown))/crown);
        v.setY(i,y-blend*crown*(1-Math.sqrt(Math.max(0,1-(x/(p.width/2))**2))));
        // Low-contrast mineral/moss variation; no fabricated inscriptions.
        const n=Math.sin(x*53+y*37+z*19)*Math.sin(y*71-x*29),moss=Math.max(0,n-.25)*.12;
        colors.push(.91-moss,.92-moss*.45,.87-moss);
      }
      geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
      mesh.geometry=geo;mesh.material=stone;
      stone.vertexColors=true;
    }
    if(Math.abs(p.width-.68)<.001&&Math.abs(p.height-1.26)<.001&&Math.abs(p.depth-2.61)<.001){
      // Cheek-wall top descends toward the first tread. Change only upper
      // vertices; underside, horizontal footprint and 3.6 m stair opening stay.
      const geo=new THREE.BoxGeometry(p.width,p.height,p.depth,1,1,8),v=geo.attributes.position;
      for(let i=0;i<v.count;i++)if(v.getY(i)>0)v.setY(i,v.getY(i)-.84*(v.getZ(i)/p.depth+.5));
      geo.computeVertexNormals();mesh.geometry=geo;
    }
  }
  object.userData.ninomineDetailProvenance='photo-inferred; existing layout retained; no surveyed dimensions';
}
