import test from 'node:test';
import assert from 'node:assert/strict';
import { bambooCulms, bambooNodeStations, bambooRadius, bambooProfile, bambooGeometryData, bambooBranches, bambooBranchPoint } from './bamboo-profile.mjs';

test('bamboo nodes fit within every culm with distinct, non-uniform internodes', () => {
  for (const culm of bambooCulms) {
    const heights = [0, ...bambooNodeStations.map(t => t * culm.height), culm.height];
    const intervals = heights.slice(1).map((y, i) => y - heights[i]);
    assert.ok(Math.min(...intervals) > .25);
    assert.ok(Math.max(...intervals) < .50);
    assert.ok(Math.max(...intervals) - Math.min(...intervals) > .10);
    assert.ok(bambooRadius(culm, 1) < bambooRadius(culm, 0));
  }
  const rows = bambooProfile();
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i].t > rows[i - 1].t);
});

test('geometry and texture share the same node heights, with real radial relief', () => {
  const rows = bambooProfile();
  for (const station of bambooNodeStations) {
    const raised = rows.filter(row => Math.abs(row.t - station) < .001);
    assert.equal(raised.length, 2);
    for (const culm of bambooCulms) for (const row of raised) {
      const relief = bambooRadius(culm, row.t, row.relief) - bambooRadius(culm, row.t);
      assert.ok(relief > .003 && relief < .008);
    }
  }
});

test('both bamboo levels have finite indexed vertices, unit normals and closed culm caps', () => {
  for (const detail of ['near', 'far']) {
    const geometry = bambooGeometryData(detail), count = geometry.positions.length / 3;
    assert.equal(geometry.normals.length, geometry.positions.length);
    assert.equal(geometry.uv.length, count * 2);
    assert.equal(geometry.indices.length % 3, 0);
    assert.ok(geometry.indices.every(i => Number.isInteger(i) && i >= 0 && i < count));
    assert.ok([...geometry.positions, ...geometry.normals, ...geometry.uv].every(Number.isFinite));
    for (let i = 0; i < geometry.normals.length; i += 3) assert.ok(Math.abs(Math.hypot(...geometry.normals.slice(i, i + 3)) - 1) < 1e-8);
    assert.equal(Math.min(...geometry.positions.filter((_, i) => i % 3 === 1)), 0);
    assert.equal(Math.max(...geometry.positions.filter((_, i) => i % 3 === 1)), 7.6);
    assert.ok(Math.max(...geometry.positions.filter((_, i) => i % 3 !== 1).map(Math.abs)) < 1.35);
    for (let i = 0; i < geometry.positions.length; i += 3) if (geometry.positions[i + 1] < 1) {
      assert.ok(Math.abs(geometry.positions[i]) < .45 && Math.abs(geometry.positions[i + 2]) < .45, 'root footprint must remain unchanged');
    }
    assert.ok(geometry.normals.some((n, i) => i % 3 === 1 && n === -1));
    assert.ok(geometry.normals.some((n, i) => i % 3 === 1 && n === 1));
  }
});

test('distant geometry preserves the cluster envelope with a bounded triangle budget', () => {
  const near = bambooGeometryData('near'), far = bambooGeometryData('far');
  assert.ok(near.indices.length / 3 <= 5000, 'raised joints and twigs must remain below 5000 triangles per four-culm cluster');
  assert.ok(far.indices.length / 3 <= 512, 'overview culms and twigs must remain below 512 triangles per cluster');
  assert.ok(far.indices.length < near.indices.length / 9);
  for (let axis = 0; axis < 3; axis++) {
    const a = near.positions.filter((_, i) => i % 3 === axis), b = far.positions.filter((_, i) => i % 3 === axis);
    assert.ok(Math.abs(Math.max(...a) - Math.max(...b)) < .01);
    assert.ok(Math.abs(Math.min(...a) - Math.min(...b)) < .01);
  }
  assert.deepEqual(bambooGeometryData('near'), near);
});

test('every foliage branch is attached to a node and stays below its culm tip', () => {
  const branches = bambooBranches();
  assert.equal(branches.length, 16);
  for (const branch of branches) {
    const culm = bambooCulms[branch.culm], t = bambooNodeStations[branch.node];
    assert.equal(branch.start[1], t * culm.height);
    const cx = culm.x + culm.leanX * t * t, cz = culm.z + culm.leanZ * t * t;
    assert.ok(Math.abs(Math.hypot(branch.start[0] - cx, branch.start[2] - cz) - (bambooRadius(culm, t) - .004)) < 1e-10);
    for (const fraction of [0, .25, .5, .75, 1]) assert.ok(bambooBranchPoint(branch, fraction)[1] < culm.height - .20);
  }
});
