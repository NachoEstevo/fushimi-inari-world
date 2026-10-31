    export class SpatialCollisionWorld {
      constructor(cellSize = 4.0) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.boxes = [];
        this.boxGrid = new Map();
        this.largeBoxes = [];
      }
      _key(cx, cz) { return `${cx},${cz}`; }
      addCylinder(x, z, r, yMin = -100, yMax = 500, tag = 'col') {
        const minCx = Math.floor((x - r) / this.cellSize);
        const maxCx = Math.floor((x + r) / this.cellSize);
        const minCz = Math.floor((z - r) / this.cellSize);
        const maxCz = Math.floor((z + r) / this.cellSize);
        const col = { x, z, r, yMin, yMax, tag };
        for (let cx = minCx; cx <= maxCx; cx++) {
          for (let cz = minCz; cz <= maxCz; cz++) {
            const k = this._key(cx, cz);
            if (!this.grid.has(k)) this.grid.set(k, []);
            this.grid.get(k).push(col);
          }
        }
      }
      addBox(cx, cz, halfW, halfD, yaw = 0, yMin = -100, yMax = 500, tag = 'box') {
        const cos = Math.cos(yaw), sin = Math.sin(yaw);
        const index = this.boxes.length;
        this.boxes.push({cx, cz, halfW, halfD, cos, sin,
          cosF: Math.cos(-yaw), sinF: Math.sin(-yaw), yMin, yMax, tag});
        // The exact rotated AABB makes the broadphase conservative. Very
        // large objects stay in a small fallback list instead of filling cells.
        const extentX = Math.abs(cos * halfW) + Math.abs(sin * halfD);
        const extentZ = Math.abs(sin * halfW) + Math.abs(cos * halfD);
        const x0 = Math.floor((cx - extentX) / this.cellSize), x1 = Math.floor((cx + extentX) / this.cellSize);
        const z0 = Math.floor((cz - extentZ) / this.cellSize), z1 = Math.floor((cz + extentZ) / this.cellSize);
        if (!Number.isFinite(x0+x1+z0+z1) || (x1-x0+1)*(z1-z0+1)>4096) {
          this.largeBoxes.push(index); return;
        }
        for (let x=x0; x<=x1; x++) for (let z=z0; z<=z1; z++) {
          const key=this._key(x,z);
          if (!this.boxGrid.has(key)) this.boxGrid.set(key,[]);
          this.boxGrid.get(key).push(index);
        }
      }
      _boxCandidates(x,z,radius,start) {
        const r=Math.abs(radius),size=this.cellSize;
        const x0=Math.floor((x-r)/size),x1=Math.floor((x+r)/size);
        const z0=Math.floor((z-r)/size),z1=Math.floor((z+r)/size);
        if (!Number.isFinite(x0+x1+z0+z1) || (x1-x0+1)*(z1-z0+1)>256)
          return this.boxes.map((_,i)=>i).slice(start);
        const found=new Set(this.largeBoxes.filter(i=>i>=start));
        for(let cx=x0;cx<=x1;cx++)for(let cz=z0;cz<=z1;cz++)
          for(const i of this.boxGrid.get(this._key(cx,cz))??[])if(i>=start)found.add(i);
        return [...found].sort((a,b)=>a-b);
      }
      resolvePlayer(px, py, pz, playerRadius = 0.28) {
        let x = px, z = pz;
        const footY = py - 1.55;
        const headY = py + 0.15;

        for (let iter = 0; iter < 3; iter++) {
          const gcx = Math.floor(x / this.cellSize);
          const gcz = Math.floor(z / this.cellSize);
          for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
              const bucket = this.grid.get(this._key(gcx + dx, gcz + dz));
              if (!bucket) continue;
              for (let i = 0; i < bucket.length; i++) {
                const c = bucket[i];
                if (headY < c.yMin || footY > c.yMax) continue;
                const vx = x - c.x;
                const vz = z - c.z;
                const distSq = vx * vx + vz * vz;
                const minDist = playerRadius + c.r;
                if (distSq < minDist * minDist && distSq > 1e-8) {
                  const dist = Math.sqrt(distSq);
                  const push = (minDist - dist);
                  x += (vx / dist) * push;
                  z += (vz / dist) * push;
                }
              }
            }
          }

          // After a push, later boxes must be queried at the new position, but
          // earlier boxes must not be revisited until the next outer iteration.
          let cursor=0, candidates=this._boxCandidates(x,z,playerRadius,cursor);
          for (let n=0; n<candidates.length; n++) {
            const i=candidates[n], b=this.boxes[i];
            if (headY < b.yMin || footY > b.yMax) continue;
            const relX = x - b.cx;
            const relZ = z - b.cz;
            const lx = relX * b.cos - relZ * b.sin;
            const lz = relX * b.sin + relZ * b.cos;
            const clampX = Math.max(-b.halfW, Math.min(b.halfW, lx));
            const clampZ = Math.max(-b.halfD, Math.min(b.halfD, lz));
            const dx = lx - clampX;
            const dz = lz - clampZ;
            const distSq = dx * dx + dz * dz;
            if (distSq < playerRadius * playerRadius) {
              let nLx = 0, nLz = 0;
              if (distSq > 1e-7) {
                const dist = Math.sqrt(distSq);
                const push = playerRadius - dist;
                nLx = lx + (dx / dist) * push;
                nLz = lz + (dz / dist) * push;
              } else {
                const penX = b.halfW - Math.abs(lx);
                const penZ = b.halfD - Math.abs(lz);
                if (penX < penZ) {
                  nLx = (lx >= 0 ? 1 : -1) * (b.halfW + playerRadius);
                  nLz = lz;
                } else {
                  nLx = lx;
                  nLz = (lz >= 0 ? 1 : -1) * (b.halfD + playerRadius);
                }
              }
              x = b.cx + nLx * b.cosF - nLz * b.sinF;
              z = b.cz + nLx * b.sinF + nLz * b.cosF;
              cursor=i+1;
              candidates=this._boxCandidates(x,z,playerRadius,cursor);n=-1;
            }
          }
        }
        return { x, z };
      }
    }

