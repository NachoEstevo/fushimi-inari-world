import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const omotesandoNoticeIdR96='way/1543133162';
// Appearance reconstruction only: the mapped open roof is not evidence for
// an enclosed building, named shrine, inscription or four-post shelter.
export function buildOmotesandoNoticeR96(root,features,surfaces,materials={},colliders=[]){
 const name='Mapped small roofed entrance notice structure R96',old=root.getObjectByName(name);if(old)return {group:old,builtIds:[omotesandoNoticeIdR96],...old.userData};
 const feature=features.buildings?.find(b=>b.id===omotesandoNoticeIdR96);if(!feature)return {built:false,builtIds:[]};
 if(feature.tags?.building!=='roof')throw Error('R96 notice source no longer open roof');
 const ring=feature.points.slice(0,-1);if(ring.length!==4)throw Error('R96 notice requires original roof quadrilateral');
 const height=(x,z)=>{const y=surfaces.height(x,z);if(!Number.isFinite(y))throw Error('Nonfinite R96 roofed notice seat');return y;};
 const minX=Math.min(...ring.map(p=>p[0])),maxX=Math.max(...ring.map(p=>p[0])),minZ=Math.min(...ring.map(p=>p[2])),maxZ=Math.max(...ring.map(p=>p[2])),cx=(minX+maxX)/2,cz=(minZ+maxZ)/2,width=maxX-minX,depth=maxZ-minZ;
 // The existing source rectangle is axis aligned. Refuse a changed footprint
 // rather than silently fitting a new rectangle over changed map geometry.
 if(ring.some(p=>Math.min(Math.abs(p[0]-minX),Math.abs(p[0]-maxX))>1e-6||Math.min(Math.abs(p[2]-minZ),Math.abs(p[2]-maxZ))>1e-6))throw Error('R96 notice roof registration changed');
 const seats=ring.map(p=>height(p[0],p[2])),base=height(cx,cz),eave=base+2.10,ridge=base+2.48,group=new THREE.Group();group.name=name;
 const timber=new THREE.MeshStandardMaterial({color:'#685137',roughness:.96}),panel=new THREE.MeshStandardMaterial({color:'#b8b59c',roughness:.98}),tile=new THREE.MeshStandardMaterial({color:'#626b65',roughness:.9});
 const batches=new Map(),pending=[],supports=[];
 const put=(g,mat)=>{g.deleteAttribute('uv');if(!batches.has(mat))batches.set(mat,[]);const non=g.index?g.toNonIndexed():g;if(non!==g)g.dispose();batches.get(mat).push(non);};
 const box=(w,h,d,x,y,z,mat)=>put(new THREE.BoxGeometry(w,h,d).translate(x,y,z),mat);
 // Two continuous timber uprights carry the panel and roof tie. Lower area
 // stays open; there is no fabricated opaque room or four-corner canopy.
 for(const x of [minX+.12,maxX-.12]){const seat=Math.min(height(x-.05,cz-.05),height(x+.05,cz+.05),height(x,cz))-.06;box(.10,eave-seat,.10,x,(eave+seat)/2,cz,timber);supports.push({x,z:cz,bottom:seat,top:eave});pending.push({type:'box',args:[x,cz,.05,.05,0,seat,eave,'mapped_notice_support_r96']});}
 const panelBottom=base+.70,panelTop=base+1.96,panelWidth=width-.24;
 box(panelWidth,panelTop-panelBottom,.075,cx,(panelBottom+panelTop)/2,cz,panel);
 for(const y of [panelBottom,panelTop])box(width-.12,.085,.12,cx,y,cz,timber);
 for(const x of [minX+.10,maxX-.10])box(.085,panelTop-panelBottom,.12,x,(panelBottom+panelTop)/2,cz,timber);
 box(width-.10,.11,.14,cx,eave-.055,cz,timber);
 pending.push({type:'box',args:[cx,cz,panelWidth/2,.06,0,panelBottom-.05,panelTop+.05,'mapped_notice_panel_r96']});
 // North/south ridge. Each sloped roof panel is a closed thin prism, seated
 // on the timber tie and end triangular rafters, within the source outline.
 const roofY=x=>eave+(ridge-eave)*(1-Math.abs(x-cx)/(width/2));
 const prism=(x0,x1,z0,z1)=>{const p=[[x0,roofY(x0),z0],[x1,roofY(x1),z0],[x1,roofY(x1),z1],[x0,roofY(x0),z1]];p.push(...p.map(v=>[v[0],v[1]-.06,v[2]]));const v=[];for(const f of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])for(const i of [f[0],f[1],f[2],f[0],f[2],f[3]])v.push(...p[i]);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();put(g,tile);};
 prism(minX,cx,minZ,maxZ);prism(cx,maxX,minZ,maxZ);
 const beam=(a,b,r,mat)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av),g=new THREE.CylinderGeometry(r,r,delta.length(),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));g.translate(...av.add(bv).multiplyScalar(.5).toArray());put(g,mat);};
 // Roof load transfers through short gable frames into the central tie and
 // two uprights. Member dimensions remain explicitly photo estimates.
 for(const z of [cz-.055,cz+.055]){beam([minX+.05,eave-.07,z],[cx,ridge-.065,z],.032,timber);beam([cx,ridge-.065,z],[maxX-.05,eave-.07,z],.032,timber);}
 box(.07,ridge-eave-.02,.10,cx,(ridge+eave)/2-.04,cz,timber);
 // Restrained ridge and eave tile rolls are clipped to mapped roof bounds.
 beam([cx,ridge-.015,minZ+.04],[cx,ridge-.015,maxZ-.04],.035,tile);
 for(const x of [minX+.025,maxX-.025])beam([x,eave-.025,minZ+.04],[x,eave-.025,maxZ-.04],.025,tile);
 for(const [mat,parts]of batches){const geometry=mergeGeometries(parts,false);if(!geometry)throw Error('R96 notice batch mismatch');parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,mat);mesh.name='R96 notice '+(mat===timber?'timber support':mat===panel?'uninscribed pale panel':'pitched tile roof');mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
 group.userData={built:true,sourceId:feature.id,footprint:ring,width,depth,base,eave,ridge,seats,supports,drawBatches:group.children.length,triangles:group.children.reduce((n,m)=>n+m.geometry.attributes.position.count/3,0),collidersAdded:pending.length,provenance:'Exact OSM roof footprint way1543133162; probable counterpart in Townphoto k01111.jpg behind left festival banner west of lantern. Visible dark pitched roof, brown timber and pale panel; source identity and hidden contents unresolved.',limits:'Roof2.48m above center ground and all timber/panel dimensions inferred, below existing3m source envelope. No inscription, deity, shop identity, gate, enclosed room, temporary banner or four-post canopy claimed.'};root.add(group);colliders.push(...pending);return {group,builtIds:[feature.id],...group.userData};
}
