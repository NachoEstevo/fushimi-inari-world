import {MeshStandardNodeMaterial} from 'three/webgpu';
import {Fn, If, materialColor, materialNormal, materialRoughness, mix, normalViewGeometry, normalWorldGeometry, positionLocal, sin, smoothstep, uniform, vec2, vec3} from 'three/tsl';
import {createMineralSurfaceFinish} from './mineral-surface-finish.mjs';

function fade(near, far, distance) {
  return smoothstep(near, far, distance).oneMinus();
}

function basinWetness() {
  const {x,y,z} = positionLocal;
  // The stone rim rises .12 m above the water. Inner stone retains a waterline
  // and the top catches splashes near the inlet and the two ladle rests.
  const innerEdge = x.abs().div(.94).max(z.abs().div(.465)).toVar();
  const innerWall = fade(1.004, 1.045, innerEdge);
  const waterline = y.add(sin(x.mul(20).add(z.mul(13))).mul(.012));
  const innerDamp = innerWall.mul(fade(.30,.43,waterline));
  const splash = fade(.06,.42,vec2(x.sub(.57).mul(.74),z.sub(.39)).length())
    .max(fade(.06,.37,vec2(x.add(.55).mul(.79),z.sub(.44)).length()))
    .max(fade(.04,.20,vec2(x.sub(.68),z.add(.44)).length()).mul(.72));
  const rimDamp = normalWorldGeometry.y.max(0).mul(fade(1.07,1.27,innerEdge)).mul(splash);

  // Capillary moisture fades upward from the foot. Two overlapping areas
  // below the ladle rests lift that fade where splashes feed the front drain.
  const front = smoothstep(.51,.61,z);
  const fromFoot = y.add(.36);
  const left = fade(.05,.50,x.add(.57).sub(fromFoot.mul(.23)).abs());
  const right = fade(.02,.32,x.sub(.49).add(fromFoot.mul(.40)).abs());
  const rise = left.mul(.067).add(right.mul(.093)).mul(front);
  const baseDamp = left.mul(.09).add(right.mul(.14)).add(.26);
  const foot = fade(-.377,-.137,y.sub(rise)).mul(front.mul(baseDamp).add(.29));
  const damp = innerDamp.max(rimDamp.mul(.76)).max(foot);
  // Only the damp inner edge and the closest splash areas hold a sheen.
  return vec2(damp, rimDamp.mul(.74).max(innerWall.mul(fade(.322,.41,waterline)).mul(.53)));
}

function pavingWetness() {
  const {x,z} = positionLocal;
  const top = normalWorldGeometry.y.max(0);
  const fromDrain = z.sub(.93);
  // The existing channel's open side feeds an irregular apron and narrow
  // tongues of runoff toward the front edge of the pavilion.
  const lobe = vec2(x.add(fromDrain.mul(.17)).div(1.36),fromDrain.div(.73)).length()
    .add(sin(x.mul(19).add(z.mul(17))).mul(.047));
  const damp = fade(.34,1.10,lobe).mul(smoothstep(.69,.94,z)).mul(top);
  const trailA = x.sub(.54).add(fromDrain.mul(.38)).add(sin(z.mul(12)).mul(.038)).abs();
  const trailB = x.add(.71).sub(fromDrain.mul(.26)).abs();
  const film = fade(.035,.19,trailA).max(fade(.011,.13,trailB).mul(.65));
  return vec2(damp, damp.mul(film));
}

function wetStoneMaterial(source, label, highQuality, wetnessForSurface, paved) {
  const material = new MeshStandardNodeMaterial().copy(source);
  material.name = label;
  const wetness = Fn(() => {
    const value = vec2(0).toVar();
    If(highQuality, () => { value.assign(wetnessForSurface()); });
    return value;
  }, 'vec2')().toVar('temizuyaWetness');
  const dryRoughness = materialRoughness.toVar('temizuyaDryRoughness');
  const damp = wetness.x, film = wetness.y;
  // The shared flagstone roughness map already separates the pale joints
  // from the slab faces. Darken the joint while keeping its broken specular.
  const joint = paved ? smoothstep(.71,.79,dryRoughness) : 0;
  const wetTint = paved ? mix(vec3(.52,.57,.61),vec3(.40,.44,.47),joint) : vec3(.47,.53,.57);
  const dampRoughness = paved ? mix(.57,.81,joint) : .68;
  const filmCoverage = paved ? film.mul(joint.oneMinus()) : film;
  material.colorNode = materialColor.mul(mix(vec3(1),wetTint,damp));
  material.roughnessNode = mix(mix(dryRoughness,dampRoughness,damp),.24,filmCoverage);
  material.normalNode = mix(materialNormal,normalViewGeometry,film.mul(.47)).normalize();
  return material;
}

const finishes = new WeakMap();

export function installTemizuyaWetStone(pavilion, basin, sourceFlagstone) {
  if (pavilion?.userData.zone !== 'temizuya' || basin?.parent !== pavilion) return null;
  if (finishes.has(pavilion)) return finishes.get(pavilion);
  const deck = pavilion.children.find(mesh =>
    mesh.material === sourceFlagstone && mesh.geometry?.parameters?.width === 5.2 &&
    mesh.geometry.parameters.height === .28 && mesh.geometry.parameters.depth === 3.8
  );
  const calibrated = createMineralSurfaceFinish(deck?.material,sourceFlagstone);
  if (!calibrated || !basin.material?.isMeshStandardMaterial) return null;
  const highQuality = uniform(false);
  const originalBasin = basin.material, originalDeck = deck.material;
  const basinMaterial = wetStoneMaterial(originalBasin,'Temizuya damp basin granite',highQuality,basinWetness,false);
  const deckMaterial = wetStoneMaterial(calibrated,'Temizuya flagstone runoff',highQuality,pavingWetness,true);
  if (calibrated !== originalDeck) calibrated.dispose();
  basin.material = basinMaterial;
  deck.material = deckMaterial;

  const finish = {
    highQuality,
    setQuality(mode) { highQuality.value = mode === 'high' || mode === 'ultra'; },
    dispose() {
      if (!finishes.delete(pavilion)) return;
      basin.material = originalBasin;
      deck.material = originalDeck;
      basinMaterial.dispose();
      deckMaterial.dispose();
    }
  };
  finishes.set(pavilion,finish);
  return finish;
}
