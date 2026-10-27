import * as THREE from 'three';
import {createStationTactileDetail} from './station-tactile-detail.mjs';

// Station palette adapter. keihan-station currently leaves palette materials
// unnamed; exact sRGB matches deliberately fail closed when its palette changes.
// staticParts supplies dominant-axis metric UVs (one tile per 1.5 metres).
// Existing mapped materials include signs, posters and the ramp: retain those.
const PALETTE = new Map([
  ['777b79', 'pavement'], ['b7b6ac', 'stone'], ['27323a', 'dark'],
  ['c03220', 'paint'], ['e6e3d6', 'wall'], ['9aa3a5', 'metal'],
  ['d7ae35', 'tactile'], ['245b4b', 'green'], ['42677a', 'seat'],
  ['706049', 'wood'], ['aec1be', 'glass'], ['66707c', 'wall'],
]);

function grainTexture(kind) {
  const size = 256, data = new Uint8Array(size * size * 4);
  // Seeded, periodic fields avoid random refreshes and visible tile seams.
  const hash = (x, y) => {
    let n = Math.imul((x & 255) + 173, 374761393) ^ Math.imul((y & 255) + 919, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const fine = hash(x, y) - .5;
    const broad = Math.sin(x * Math.PI / 32) * Math.cos(y * Math.PI / 64);
    let value;
    if (kind === 'tactile') {
      // One inferred 300 mm warning tile, with five rounded studs per side.
      const dx = (x / size * 5) % 1 - .5, dy = (y / size * 5) % 1 - .5;
      const radius = Math.hypot(dx, dy);
      const stud = 1 - THREE.MathUtils.smoothstep(radius, .14, .24);
      const seam = Math.min(x, y, size - x, size - y) < 2;
      value = seam ? .10 : .22 + stud * .65;
    } else if (kind === 'weave') {
      // Filtered height only: no photographic fabric or high contrast albedo.
      const warp = Math.sin(x * Math.PI / 4), weft = Math.sin(y * Math.PI / 4);
      const over = (Math.floor(x / 8) + Math.floor(y / 8)) % 2;
      value = .5 + (over ? warp : weft) * .12 + (over ? weft : warp) * .025;
    } else if (kind === 'mineral') {
      const aggregate = hash(x >> 2, y >> 2) - .5;
      value = .77 + fine * .15 + aggregate * .12 + broad * .025;
    } else if (kind === 'metal') {
      value = .54 + (hash(0, y) - .5) * .13 + fine * .018;
    } else if (kind === 'wood') {
      const wave = Math.sin(x * Math.PI / 8 + Math.sin(y * Math.PI / 128) * .6);
      value = .65 + wave * .09 + fine * .035;
    } else value = .66 + fine * .045 + broad * .012;
    const v = Math.round(THREE.MathUtils.clamp(value, 0, 1) * 255), i = (y * size + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = v; data[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.name = `Station study ${kind}`;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  if (kind === 'tactile') texture.repeat.set(5, 5);
  if (kind === 'weave') texture.repeat.set(16, 16);
  texture.needsUpdate = true;
  return texture;
}

export function createStationMaterialStudy(station) {
  const group = station?.group ?? station;
  if (!group?.traverse) throw new TypeError('Station material study requires a station group');
  const textures = Object.fromEntries(['mineral', 'metal', 'wood', 'paint', 'tactile', 'weave'].map(k => [k, grainTexture(k)]));
  const replacements = new Map(), trainReplacements = new Map(), bindings = [];
  const stats = { meshes: 0, materials: 0, textures: 6, textureSize: 256, skippedMaterials: 0, enabled: false };
  const skipped = new Set();
  function replacement(original, inTrain) {
    let kind = original?.color && PALETTE.get(original.color.getHexString(THREE.SRGBColorSpace));
    if (!original?.isMeshStandardMaterial || !kind || original.map || original.userData?.label) {
      if (original) skipped.add(original);
      return original;
    }
    // The builder shares these two palette materials between indoor and
    // outdoor batches. Mineral asphalt and warning studs do not belong inside.
    const trainVariant = inTrain && (kind === 'pavement' || kind === 'tactile');
    const cache = trainVariant ? trainReplacements : replacements;
    if (cache.has(original)) return cache.get(original);
    if (trainVariant) kind = kind === 'pavement' ? 'vinyl' : 'entrance';
    const material = new THREE.MeshPhysicalMaterial();
    // Copy only Standard's common state; Physical.copy expects Physical fields.
    THREE.MeshStandardMaterial.prototype.copy.call(material, original);
    material.defines = { STANDARD: '', PHYSICAL: '' };
    material.name = `Station study: ${kind}`;
    material.userData = { ...original.userData, stationMaterialStudy: kind };
    if (kind === 'green' || kind === 'paint' || kind === 'glass' || kind === 'metal') material.userData.stationReflectionReceiver = true;
    material.envMapIntensity = kind === 'glass' ? 1.05 : kind === 'metal' ? .8 : .6;
    if (kind === 'glass') {
      material.roughness = .08; material.metalness = 0;
      material.opacity = .34; material.transparent = true; material.depthWrite = false;
      material.ior = 1.5; material.specularIntensity = 1;
    } else if (kind === 'metal') {
      material.metalness = .78; material.roughness = .52;
      material.roughnessMap = textures.metal;
      material.bumpMap = textures.metal; material.bumpScale = .00035;
    } else if (kind === 'green' || kind === 'paint') {
      material.metalness = kind === 'green' ? .12 : .04;
      material.roughness = kind === 'green' ? .55 : .78;
      material.roughnessMap = textures.paint;
      material.clearcoat = kind === 'green' ? .38 : .12;
      material.clearcoatRoughness = .32;
      // Paint varies in finish, not panel shape. Even submillimetre bump on
      // metric-UV batches can read as repeated dents under grazing reflections.
    } else {
      const mineral = kind === 'stone' || kind === 'pavement';
      const texture = kind === 'wood' ? textures.wood : mineral ? textures.mineral : textures.paint;
      material.roughness = mineral ? 1 : kind === 'wood' ? .98 : .92;
      material.roughnessMap = texture;
      if (mineral || kind === 'wood') {
        material.bumpMap = texture;
        material.bumpScale = mineral ? .003 : .0003;
      }
      if (kind === 'pavement') {
        // Reuse the linear height field as neutral aggregate albedo, retaining
        // its previous mean brightness instead of darkening the whole platform.
        material.map = textures.mineral; material.color.multiplyScalar(1 / .77);
      }
      if (kind === 'vinyl') {
        material.bumpMap = textures.paint; material.bumpScale = .00015;
      }
      if (kind === 'tactile' || kind === 'seat' || kind === 'entrance') {
        material.bumpMap = kind === 'seat' ? textures.weave : textures.tactile;
        material.bumpScale = 0;
      }
    }
    cache.set(original, material);
    return material;
  }
  group.traverse(mesh => {
    if (!mesh.isMesh || !mesh.geometry?.attributes.uv) return;
    let inTrain = false;
    if (station?.trainGroup) for (let owner = mesh; owner; owner = owner.parent) {
      if (owner === station.trainGroup) { inTrain = true; break; }
      if (owner === group) break;
    }
    const original = mesh.material;
    const upgraded = Array.isArray(original) ? original.map(m => replacement(m, inTrain)) : replacement(original, inTrain);
    if (Array.isArray(original) ? upgraded.some((m, i) => m !== original[i]) : upgraded !== original) {
      bindings.push({ mesh, original, upgraded });
    }
  });
  stats.meshes = bindings.length; stats.materials = replacements.size + trainReplacements.size; stats.skippedMaterials = skipped.size;
  const tactile = createStationTactileDetail(station); stats.tactileDetail = tactile?.stats ?? null;
  let disposed = false, highQuality = false;
  // Both profiles keep their existing shader features and texture bindings.
  // Material toggles change scalar uniforms. The caller prepares the fixed
  // High-only geometry before resuming the station render.
  function setQuality(mode) {
    if (disposed) return;
    const high = mode === 'high' || mode === 'ultra'; highQuality = high;
    tactile?.setEnabled(stats.enabled && high);
    for (const material of [...replacements.values(), ...trainReplacements.values()]) {
      const kind = material.userData.stationMaterialStudy;
      if (kind === 'tactile') material.bumpScale = high ? .004 : 0;
      if (kind === 'seat') material.bumpScale = high ? .0007 : 0;
      if (kind === 'metal') material.roughness = high ? .72 : .52;
      if (kind === 'green') {
        material.roughness = high ? .72 : .55;
        material.clearcoat = high ? .18 : .38;
        material.clearcoatRoughness = high ? .42 : .32;
      }
    }
  }
  function setEnabled(value) {
    if (disposed) return;
    stats.enabled = Boolean(value);
    tactile?.setEnabled(stats.enabled && highQuality);
    for (const { mesh, original, upgraded } of bindings) mesh.material = stats.enabled ? upgraded : original;
  }
  function dispose() {
    if (disposed) return;
    setEnabled(false); disposed = true;
    tactile?.dispose();
    for (const material of [...replacements.values(), ...trainReplacements.values()]) material.dispose();
    for (const texture of Object.values(textures)) texture.dispose();
  }
  return { setEnabled, setQuality, dispose, stats };
}
