import * as THREE from 'three';
import {staticParts} from './mountain-landmarks-geometry.mjs';

export function refineMitsurugiStoneAndWell(compound){
  const near=(a,b)=>Math.abs(a-b)<.002;
  const base=compound.children.find(o=>o.geometry?.parameters?.width===1.4&&o.geometry.parameters.height===.78&&near(o.position.x,-3.8)&&near(o.position.z,.8));
  const roof=compound.children.find(o=>o.geometry?.parameters?.width===2.2&&o.geometry.parameters.height===.35&&near(o.position.x,-3.8)&&near(o.position.z,.8));
  const rock=compound.children.find(o=>o.geometry?.type==='DodecahedronGeometry'&&o.geometry.parameters.radius===1.45&&near(o.position.x,3.2));
  if(!base||!roof||!rock)return null;
  // Official photo: a tall irregular rock with a blunt, off-centre crown,
  // steep face and a lower shoulder, rather than a spheroid on a pedestal.
  const ring=[[1,0],[.69,.73],[.18,1],[-.63,.80],[-1,.18],[-.72,-.65],[-.19,-1],[.67,-.82]];
  const courses=[[-1.38,.93,-.05],[-.65,1.04,-.02],[.22,.91,.04],[.95,.73,.13],[1.30,.46,.23]];
  const bands=courses.map(([y,r,offset],j)=>ring.map(([x,z],i)=>[
    x*r+offset,y+.07*Math.sin(i*1.8+j*.62),z*r*(.82+.09*Math.cos(i*2.1+j*.32))
  ]));
  const points=[];for(let j=1;j<bands.length;j++)for(let i=0;i<ring.length;i++){
    const k=(i+1)%ring.length,p=bands[j-1],q=bands[j];points.push(...p[i],...q[i],...p[k],...p[k],...q[i],...q[k]);
  }
  for(let i=0;i<ring.length;i++)points.push(...bands.at(-1)[i],.24,1.42,-.11,...bands.at(-1)[(i+1)%ring.length]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  const uv=[];for(let i=0;i<points.length;i+=3)uv.push(points[i]+points[i+2]*.48,points[i+1]);
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();
  rock.geometry.dispose();rock.geometry=g;rock.name='Tsurugiishi rock';
  const group=new THREE.Group();group.position.set(base.position.x,base.position.y-.39,base.position.z);
  group.name='Mitsurugi well of the sword';compound.add(group);
  const stone=rock.material,metal=roof.material,cloth=new THREE.MeshStandardMaterial({color:'#452551',roughness:.96,side:THREE.DoubleSide});
  const parts=staticParts(group);
  // June 2020 view: open stone curb, granite uprights, paired cloth leaves and
  // a pitched metal cover. The adjacent separately mapped cover is untouched.
  for(const side of [-1,1]){
    parts.box(1.46,.28,.16,0,.14,side*.61,stone);parts.box(.16,.28,1.06,side*.65,.14,0,stone);
    for(const z of [-.56,.56])parts.box(.15,1.16,.15,side*.61,.86,z,stone);
    const u=side*.98;
    const panel=[[0,1.77,-.8],[u,1.45,-.8],[u,1.45,.8],[0,1.77,.8]];
    const order=side>0?[0,2,1,0,3,2]:[0,1,2,0,2,3];parts.sheet(order.flatMap(i=>panel[i]),metal);
    parts.box(.065,.075,1.62,u,1.43,0,metal);
    const span=.53;
    parts.sheet([side*.035,1.42,.59,side*.59,1.42,.59,side*.59,.91,.59,
      side*.035,1.42,.59,side*.59,.91,.59,side*.18,1.04,.62],cloth);
    parts.box(span,.035,.032,side*.31,1.42,.60,stone);
  }
  parts.box(.10,.075,1.65,0,1.77,0,metal);
  const stats=parts.flush();
  for(const old of [base,roof]){old.removeFromParent();old.geometry.dispose();}
  return {...stats,rockSource:'https://inari.jp/en/map/spot_14/',wellSource:'https://swordtrip.wordpress.com/2020/06/28/kyoto/',
    limits:'Shapes inferred from photographs within the existing registered compound; individual object coordinates and hidden geometry are not surveyed.'};
}
