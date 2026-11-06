import * as THREE from './vendor/three.module.js';

const TAU = Math.PI * 2;
const vector = (x, y, z) => new THREE.Vector3(x, y, z);
const v2 = (x, y) => new THREE.Vector2(x, y);
const standard = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: .7, ...options });
const island = { x: 1.48, z: -1.78 };
const glassProfile = [
  [0, .38], [2.36, .38], [2.58, .42], [2.75, .54], [2.83, .76],
  [2.86, 1.15], [2.86, 4.12], [2.84, 4.50], [2.77, 4.84], [2.62, 5.12],
  [2.4, 5.37], [2.08, 5.61], [1.7, 5.84], [1.35, 6.08], [1.05, 6.36],
  [.91, 6.65], [.84, 6.98], [.83, 7.63], [.91, 7.79], [.95, 7.89],
  [.90, 7.95], [.77, 7.95], [.73, 7.89], [.76, 7.63],
];

function random(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  parent.add(object);
  return object;
}

function cylinder(parent, upper, lower, height, material, x, y, z, segments = 32) {
  return mesh(parent, new THREE.CylinderGeometry(upper, lower, height, segments), material, x, y, z);
}

function box(parent, width, height, depth, material, x, y, z) {
  return mesh(parent, new THREE.BoxGeometry(width, height, depth), material, x, y, z);
}

function rod(parent, a, b, radius, material, segments = 7) {
  const difference = b.clone().sub(a);
  const center = a.clone().lerp(b, .5);
  const object = cylinder(parent, radius, radius, difference.length(), material, center.x, center.y, center.z, segments);
  object.quaternion.setFromUnitVectors(vector(0, 1, 0), difference.normalize());
  return object;
}

function tube(parent, points, radius, material, segments = 30) {
  return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), segments, radius, 7, false), material);
}

function ring(parent, radius, thickness, material, y) {
  const torus = mesh(parent, new THREE.TorusGeometry(radius, thickness, 9, 100), material, 0, y);
  torus.rotation.x = -Math.PI / 2;
  return torus;
}

function grainTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const rng = random(42);
  ctx.fillStyle = '#b0754a';
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 1300; i++) {
    const x = rng() * 512;
    const y = rng() * 256;
    const tone = rng() < .5 ? '41,17,9' : '244,213,156';
    ctx.fillStyle = 'rgba(' + tone + ',' + (.06 + rng() * .24) + ')';
    ctx.fillRect(x, y, 5 + rng() * 135, 1 + rng() * 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function buildStand(scene, brass, woodTexture, includeDesk) {
  const dark = standard('#252724', { roughness: .34, metalness: .27, map: woodTexture });
  const bevel = [
    [0, -.17], [3.29, -.17], [3.43, -.10], [3.43, .01], [3.34, .08],
    [3.27, .11], [3.25, .24], [3.17, .29], [3.0, .32], [2.96, .38], [0, .38],
  ];
  mesh(scene, new THREE.LatheGeometry(bevel.map(([r, y]) => v2(r, y)), 112), dark);
  ring(scene, 3.34, .019, brass, .075);
  ring(scene, 3.21, .028, brass, .27);
  ring(scene, 2.99, .014, brass, .368);
  if (!includeDesk) return;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 5, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(5,13,15,.88)');
  gradient.addColorStop(.52, 'rgba(5,13,15,.62)');
  gradient.addColorStop(1, 'rgba(5,13,15,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const shadow = mesh(scene, new THREE.PlaneGeometry(12, 10), new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false,
  }), 0, -.188, 0);
  shadow.rotation.x = -Math.PI / 2;
  const table = mesh(scene, new THREE.PlaneGeometry(22, 14), standard('#4e4733', {
    roughness: .86, map: woodTexture,
  }), 0, -.21, 2.3);
  table.rotation.x = -Math.PI / 2;
  const journal = new THREE.Group();
  journal.position.set(-4.15, -.15, -.32);
  journal.rotation.y = -.33;
  scene.add(journal);
  const paper = standard('#a7986b');
  const binding = standard('#172c36');
  for (const [offset, y, rotation] of [[0, .05, 0], [.17, .25, .17]]) {
    const book = new THREE.Group();
    book.position.set(offset, y, 0);
    book.rotation.y = rotation;
    journal.add(book);
    box(book, 1.24, .13, .83, paper, 0, 0, 0);
    box(book, 1.32, .035, .89, binding, 0, .075, 0);
    box(book, 1.32, .035, .89, binding, 0, -.075, 0);
    box(book, .073, .18, .89, binding, -.623, 0, 0);
    for (const x of [-.42,.42]) box(book, .015, .006, .65, brass, x, .095, 0);
  }
}

const glowVertex = `
  varying vec2 coords;
  void main() {
    coords = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function buildGlass(scene, brass, cord) {
  const shell = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec3 worldPosition;
      varying vec3 worldNormal;
      void main() {
        vec4 p = modelMatrix * vec4(position, 1.0);
        worldPosition = p.xyz;
        worldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * p;
      }
    `,
    fragmentShader: `
      varying vec3 worldPosition;
      varying vec3 worldNormal;
      void main() {
        vec3 n = normalize(worldNormal);
        vec3 view = normalize(cameraPosition - worldPosition);
        float grazing = pow(1.0 - max(dot(n, view), 0.0), 3.5);
        vec3 reflection = reflect(-view, n);
        float softbox = exp(-pow((reflection.x + .65) * 13.0, 2.0))
          * smoothstep(-.24,.38,reflection.y) * (1.0 - smoothstep(.74,.96,reflection.y));
        float gold = pow(max(dot(reflection, normalize(vec3(.62,.42,-.48))),0.0),34.0);
        float rim = .5 + .5 * n.x;
        vec3 color = mix(vec3(.19,.61,.63),vec3(.85,.68,.38),rim);
        color = mix(color, vec3(.78,.93,.80) * 1.43, min(1.0, softbox*.74 + gold));
        float base = 1.0 - smoothstep(.49,.93,worldPosition.y);
        float alpha = .028 + grazing*.59 + softbox*.25 + gold*.28 + base*.19;
        gl_FragColor = vec4(color, min(.82, alpha));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const profile = new THREE.SplineCurve(glassProfile.map(([r, y]) => v2(r, y)));
  const points = profile.getPoints(136).map(p => v2(Math.max(0, p.x), p.y));
  const bottle = mesh(scene, new THREE.LatheGeometry(points, 144), shell);
  bottle.renderOrder = 9;
  const glassEdge = new THREE.MeshBasicMaterial({ color: '#c9d8a9', transparent: true, opacity: .36, depthWrite: false });
  ring(scene, .889, .035, glassEdge, 7.90).renderOrder = 10;
  ring(scene, .763, .015, glassEdge, 7.89).renderOrder = 10;
  ring(scene, 2.65, .044, glassEdge, .51).renderOrder = 10;
  for (let i = 0; i < 3; i++) ring(scene, .854, .021, cord, 7.21 + i * .041);
  const tie = [vector(.63, 7.29, .56), vector(.81, 7.20, .63), vector(.89, 6.99, .67), vector(.92, 6.79, .71)];
  tube(scene, tie, .018, cord);
  const seal = cylinder(scene, .194, .194, .047, brass, .92, 6.65, .71, 28);
  seal.rotation.x = Math.PI / 2;

  const rng = random(192);
  const dropGeometry = new THREE.SphereGeometry(1, 12, 8);
  const drops = new THREE.InstancedMesh(dropGeometry, new THREE.MeshPhysicalMaterial({
    color: '#cee8db', roughness: .15, metalness: .22, transparent: true, opacity: .41, depthWrite: false,
  }), 98);
  const glints = new THREE.InstancedMesh(dropGeometry, new THREE.MeshBasicMaterial({
    color: '#f4edd0', transparent: true, opacity: .60, depthWrite: false,
  }), drops.count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < drops.count; i++) {
    const angle = rng() * TAU;
    const y = .93 + rng() * 4.75;
    const right = glassProfile.findIndex(([, height]) => height > y);
    const [r0, y0] = glassProfile[right - 1];
    const [r1, y1] = glassProfile[right];
    const radius = THREE.MathUtils.lerp(r0, r1, (y - y0) / (y1 - y0)) + .008;
    const size = .014 + Math.pow(rng(), 2) * .052;
    dummy.position.set(Math.sin(angle) * radius, y, Math.cos(angle) * radius);
    dummy.rotation.set(0, angle, .12);
    dummy.scale.set(size, size * (1.13 + rng() * .68), size * .48);
    dummy.updateMatrix();
    drops.setMatrixAt(i, dummy.matrix);
    dummy.position.x += Math.sin(angle) * size * .4;
    dummy.position.z += Math.cos(angle) * size * .4;
    dummy.position.y += size * .46;
    dummy.scale.setScalar(size * .24);
    dummy.updateMatrix();
    glints.setMatrixAt(i, dummy.matrix);
  }
  drops.renderOrder = 10;
  glints.renderOrder = 11;
  scene.add(drops, glints);
}

const waveDefinition = `
  float swell(vec2 p, float time) {
    return sin(p.x*2.1+p.y*.95-time*1.8)*.079
      + sin(p.x*3.7-p.y*2.4+time*2.3)*.042
      + sin(p.y*7.4+p.x*2.8-time*2.8)*.023;
  }
`;

function buildWater(scene, time) {
  const waterLevel = 2.75;
  const radius = 2.765;
  const depth = waterLevel - .61;
  const waterBody = mesh(scene, new THREE.CylinderGeometry(radius, 2.67, depth, 112, 1, true), new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: glowVertex,
    fragmentShader: `
      varying vec2 coords;
      void main() {
        vec3 ink = mix(vec3(.006,.035,.030), vec3(.015,.15,.15), pow(coords.y, 1.55));
        float drift = sin(coords.x*68.0+sin(coords.y*10.0)*2.0)*.5+.5;
        float strand = pow(.5+.5*sin(coords.x*203.0 + sin(coords.y*16.0)*1.9), 12.0);
        ink += strand * drift * .012 * sin(coords.y*3.14159);
        float meniscus = smoothstep(.86, 1.0, coords.y);
        gl_FragColor = vec4(ink, .16 + meniscus*.39 + strand*.07);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  }), 0, .61 + depth * .5, 0);
  waterBody.renderOrder = 5;
  const water = new THREE.ShaderMaterial({
    uniforms: { time },
    vertexShader: `
      uniform float time;
      varying vec3 waterPosition;
      ${waveDefinition}
      void main() {
        vec3 p = position;
        p.y += swell(p.xz,time) * (1.0-smoothstep(2.48,2.765,length(p.xz)));
        vec4 world = modelMatrix * vec4(p,1.0);
        waterPosition = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec3 waterPosition;
      ${waveDefinition}
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(27.19,77.91))) * 12458.5453);
      }
      float noise(vec2 p) {
        vec2 cell = floor(p), f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(hash(cell),hash(cell+vec2(1,0)),f.x),
          mix(hash(cell+vec2(0,1)),hash(cell+1.0),f.x),f.y);
      }
      void main() {
        vec2 p = waterPosition.xz;
        float h = swell(p,time);
        float ripple = noise(p*23.0 + time*.31);
        vec3 n = normalize(vec3(h-swell(p+vec2(.018,0.0),time), .018, h-swell(p+vec2(0.0,.018),time)));
        vec3 eye = normalize(cameraPosition - waterPosition);
        float fresnel = pow(1.0-max(dot(n,eye),0.0),3.3);
        vec3 reflection = reflect(-eye,n);
        float sun = pow(max(dot(reflection, normalize(vec3(-.43,.52,-.67))),0.0),22.0);
        vec3 color = mix(vec3(.004,.032,.041),vec3(.014,.128,.145), smoothstep(-.14,.13,h)*.69 + ripple*.21);
        color += fresnel*vec3(.025,.065,.061) + sun*vec3(.29,.19,.072);
        float wake = exp(-pow((abs(p.y+.04)-.25-abs(p.x)*.22)*14.0,2.0));
        wake *= (1.0-smoothstep(1.05,2.2,p.x)) * smoothstep(-2.72,-2.38,p.x);
        float shore = exp(-pow((length((p-vec2(${island.x},${island.z}))*vec2(.97,1.24))-.52)*19.0,2.0));
        float foam = smoothstep(.149,.257,h + ripple*.105 + max(wake,shore)*.182);
        foam *= smoothstep(.23,.65,noise(p*44.0-vec2(time*1.05,0)));
        color = mix(color,vec3(.76,1.0,1.08),min(foam,.88));
        gl_FragColor = vec4(color,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const rows = 69;
  const spokes = 138;
  const vertices = [];
  const indices = [];
  for (let row = 0; row <= rows; row++) {
    const r = radius * row / rows;
    for (let col = 0; col <= spokes; col++) {
      const angle = TAU * col / spokes;
      vertices.push(r * Math.cos(angle), 0, r * Math.sin(angle));
      if (row < rows && col < spokes) {
        const a = row * (spokes + 1) + col;
        const b = a + spokes + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  mesh(scene, geometry, water, 0, waterLevel, 0);
  return waterLevel;
}

const hullStations = [
  [-2.16,.025,.52], [-1.93,.39,.39], [-1.55,.58,.24], [-1.06,.65,.14],
  [-.49,.67,.10], [.18,.64,.10], [.72,.54,.15], [1.2,.41,.23],
  [1.66,.26,.38], [2.07,.075,.58], [2.19,.016,.63],
];

function clothGeometry(outline, holes, billow) {
  function path(points, target) {
    target.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) target.lineTo(x, y);
    target.closePath();
    return target;
  }
  const shape = path(outline, new THREE.Shape());
  shape.holes = holes.map(hole => path(hole, new THREE.Path()));
  const flat = new THREE.ShapeGeometry(shape).toNonIndexed();
  const positions = flat.getAttribute('position');
  const vertices = [];
  const normals = [];
  const uv = [];
  const ymin = Math.min(...outline.map(point => point[1]));
  const ymax = Math.max(...outline.map(point => point[1]));
  const halfWidth = Math.max(...outline.map(point => Math.abs(point[0])));
  const resolution = 5;
  for (let i = 0; i < positions.count; i += 3) {
    const ax = positions.getX(i), ay = positions.getY(i);
    const bx = positions.getX(i + 1), by = positions.getY(i + 1);
    const cx = positions.getX(i + 2), cy = positions.getY(i + 2);
    function push(s, t) {
      const z = ax + (bx - ax) * s / resolution + (cx - ax) * t / resolution;
      const y = ay + (by - ay) * s / resolution + (cy - ay) * t / resolution;
      const u = .5 + z / (halfWidth * 2);
      const v = (y - ymin) / (ymax - ymin);
      const weave = z * 23 + v * 7;
      const depth = billow * Math.sin(Math.PI * v) * Math.sin(Math.PI * u) + .0065 * Math.sin(weave);
      const slopeY = (billow * Math.PI * Math.cos(Math.PI * v) * Math.sin(Math.PI * u) + .0455 * Math.cos(weave)) / (ymax - ymin);
      const slopeZ = billow * Math.PI * Math.sin(Math.PI * v) * Math.cos(Math.PI * u) / (halfWidth * 2) + .1495 * Math.cos(weave);
      const length = Math.hypot(1, slopeY, slopeZ);
      vertices.push(depth, y, z);
      normals.push(-1 / length, slopeY / length, slopeZ / length);
      uv.push(u, v);
    }
    for (let a = 0; a < resolution; a++) {
      for (let b = 0; b < resolution - a; b++) {
        push(a, b); push(a + 1, b); push(a, b + 1);
        if (a + b < resolution - 1) {
          push(a + 1, b); push(a + 1, b + 1); push(a, b + 1);
        }
      }
    }
  }
  flat.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return geometry;
}

function fabricTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const rng = random(52);
  const dye = ctx.createLinearGradient(0, 0, 0, 256);
  dye.addColorStop(0, '#fcf6e1');
  dye.addColorStop(.65, '#e9d7ba');
  dye.addColorStop(1, '#cbb28f');
  ctx.fillStyle = dye;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 2) {
    ctx.fillStyle = 'rgba(75,51,37,.09)';
    ctx.fillRect(i, 0, 1, 256);
    ctx.fillRect(0, i, 256, 1);
  }
  for (let i = 16; i < 256; i += 38) {
    ctx.fillStyle = 'rgba(108,74,57,.2)';
    ctx.fillRect(i, 0, 2, 256);
    ctx.fillStyle = 'rgba(255,252,232,.37)';
    ctx.fillRect(i + 2, 0, 2, 256);
  }
  for (let i = 0; i < 950; i++) {
    ctx.fillStyle = 'rgba(115,71,42,.10)';
    ctx.fillRect(rng() * 256, rng() * 256, rng() * 3, rng() * 3);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function buildHull(ship, timber, darkTimber, decking, brass) {
  const rng = random(867);
  const rows = 8;
  for (const side of [-1, 1]) {
    for (let plank = 0; plank < rows; plank++) {
      const vertices = [];
      const uv = [];
      const indices = [];
      const band = plank / rows;
      for (let i = 0; i < hullStations.length; i++) {
        const [x, width, sheer] = hullStations[i];
        for (const t of [band, (plank + 1) / rows]) {
          const flare = .17 + .83 * Math.pow(t, .62);
          const y = -.46 + .92 * t + sheer * (.66 + .34 * t);
          vertices.push(x, y, side * width * flare);
          uv.push((x + 2.2) / 1.7, t * 2);
        }
        if (i < hullStations.length - 1) {
          const a = i * 2;
          indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      mesh(ship, geometry, plank === 5 ? brass : timber[plank % timber.length]);
    }
    const edge = hullStations.map(([x, width, sheer]) => vector(x, .46 + sheer, side * width));
    tube(ship, edge, .036, brass, 65);
    tube(ship, edge.map(p => p.clone().add(vector(0, .17, 0))), .024, darkTimber, 65);
    for (const point of edge.slice(1, -1)) {
      rod(ship, point, point.clone().add(vector(0, .18, 0)), .021, darkTimber);
    }
    for (let i = 1; i < hullStations.length - 1; i++) {
      const [x, width, y] = hullStations[i];
      if (width < .33) continue;
      const port = cylinder(ship, .053, .053, .023, brass, x, .23 + y, side * width * .94, 14);
      port.rotation.x = Math.PI / 2;
      const center = cylinder(ship, .032, .032, .027, darkTimber, x, .23 + y, side * width * .954, 12);
      center.rotation.x = Math.PI / 2;
    }
  }
  for (let row = -5; row <= 5; row++) {
    const z = row * .102;
    const usable = hullStations.filter(station => station[1] > Math.abs(z) + .045);
    for (let i = 0; i < usable.length - 1; i++) {
      const [a, , y0] = usable[i], [b, , y1] = usable[i + 1];
      const plank = box(ship, b - a + .009, .055, .098, decking[Math.floor(rng() * decking.length)], (a + b) / 2, .439 + (y0 + y1) / 2, z);
      plank.rotation.z = Math.atan2(y1 - y0, b - a);
    }
  }
  box(ship, .6, .23, .81, darkTimber, -1.45, .87, 0);
  box(ship, .66, .055, .89, decking[1], -1.45, 1.01, 0);
  box(ship, .48, .095, .47, timber[0], .19, .58, 0);
  for (const z of [-.31, 0, .31]) {
    box(ship, .022, .10, .095, brass, -1.755, .891, z);
    box(ship, .025, .063, .061, darkTimber, -1.773, .891, z);
  }
  const lantern = new THREE.MeshBasicMaterial({ color: '#ffd18a' });
  for (const x of [-1.94, 1.82]) {
    const y = x < 0 ? 1.17 : 1.15;
    cylinder(ship, .085, .063, .17, lantern, x, y, 0, 9);
    cylinder(ship, .025, .099, .071, brass, x, y + .103, 0, 9);
    cylinder(ship, .087, .077, .035, brass, x, y - .096, 0, 9);
  }
}

function buildShip(scene, waterLevel, woodTexture, brass, cord) {
  const ship = new THREE.Group();
  ship.position.y = waterLevel - .05;
  scene.add(ship);
  const darkTimber = standard('#493021', { map: woodTexture });
  const timber = ['#75432d','#895333','#905b3c','#6c3628'].map(color => standard(color, {
    map: woodTexture, bumpMap: woodTexture, bumpScale: .035, side: THREE.DoubleSide,
  }));
  const decking = ['#bd8c55','#d2a474','#a9784f'].map(color => standard(color, { map: woodTexture }));
  buildHull(ship, timber, darkTimber, decking, brass);
  const sailMap = fabricTexture();
  const sail = standard('#fff3df', {
    map: sailMap, bumpMap: sailMap, bumpScale: .027, side: THREE.DoubleSide, roughness: .94,
    emissive: '#79442c', emissiveIntensity: .14,
  });
  const flag = standard('#bb503f', { side: THREE.DoubleSide, roughness: 1 });
  const masts = [
    { x: -.94, top: 2.84, sizes: [[1.08, 1.77, 2.62, false], [.74, 1.22, 1.79, false]] },
    { x: .20, top: 3.70, sizes: [[1.50, 2.08, 3.39, true], [1.19, 1.44, 2.15, true], [.76, 1.09, 1.48, false]] },
    { x: 1.14, top: 2.86, sizes: [[1.05, 1.70, 2.60, false], [.80, 1.19, 1.76, true]] },
  ];
  for (const { x, top, sizes } of masts) {
    rod(ship, vector(x, .54, 0), vector(x - .11, top, 0), .049, darkTimber, 12);
    cylinder(ship, .083, .093, .058, brass, x - .10, top - .10, 0, 12);
    const pennant = [[0,0],[-.28,.095],[-.57,.048],[-.42,.15],[-.58,.24],[-.27,.21],[0,.20]];
    const pennantMesh = mesh(ship, clothGeometry(pennant, [], .077), flag, x - .10, top - .10);
    pennantMesh.rotation.y = .96;
    for (const [width, bottom, upper, damaged] of sizes) {
      const w = width / 2;
      const h = upper - bottom;
      const outline = [[-w*.83,upper],[w*.83,upper],[w*.98,bottom+h*.23],[w*.91,bottom+.045],
        [w*.62,bottom+.013],[w*.43,bottom+(damaged?.093:.026)],[w*.33,bottom],[0,bottom+.028],
        [-w*.42,bottom+.003],[-w*.87,bottom+.071],[-w,bottom+h*.24]];
      const holes = damaged ? [
        [[-.29*w,bottom+.34*h],[-.09*w,bottom+.31*h],[.02*w,bottom+.42*h],
          [-.13*w,bottom+.53*h],[-.25*w,bottom+.49*h],[-.36*w,bottom+.40*h]],
        [[.43*w,bottom+.63*h],[.55*w,bottom+.58*h],[.67*w,bottom+.68*h],[.50*w,bottom+.77*h]],
      ] : [];
      mesh(ship, clothGeometry(outline, holes, width * .21), sail, x + .055);
      rod(ship, vector(x + .045, upper + .016, -w * 1.03), vector(x + .045, upper + .016, w * 1.03), .023, darkTimber);
      for (const z of [-w, w]) {
        rod(ship, vector(x + .05, upper, z), vector(x - .115, top - .14, 0), .006, cord, 5);
      }
    }
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        rod(ship, vector(x - .04, top - .47, 0), vector(x - .35 + i * .21, .69, side * .55), .009, cord, 5);
      }
    }
  }
  rod(ship, vector(1.45,.93,0), vector(2.53,1.43,0), .036, darkTimber);
  rod(ship, vector(.1,3.51,0), vector(-1.03,2.77,0), .009, cord, 5);
  rod(ship, vector(.1,3.51,0), vector(1.04,2.73,0), .009, cord, 5);
  rod(ship, vector(1.04,2.73,0), vector(2.51,1.43,0), .012, cord, 5);
  const jib = mesh(ship, clothGeometry([[-.72,0],[.49,.035],[-.68,1.32],[-.66,.27]], [], .13), sail, 1.86, 1.24);
  jib.rotation.y = -Math.PI / 2 + .13;
  return ship;
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 1, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(.16, 'rgba(255,255,255,.67)');
  gradient.addColorStop(.42, 'rgba(255,255,255,.14)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function lightBeam(scene, origin, direction, width, length, color, strength, order) {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      lightColor: { value: new THREE.Color(color) },
      strength: { value: strength },
    },
    vertexShader: glowVertex,
    fragmentShader: `
      uniform vec3 lightColor;
      uniform float strength;
      varying vec2 coords;
      void main() {
        float t = 1.0-coords.y;
        float edges = exp(-pow(abs(coords.x-.5)*2.8/(.31+t*.67),2.0));
        float fade = smoothstep(0.0,.08,t)*(1.0-smoothstep(.24,1.0,t));
        gl_FragColor = vec4(lightColor, edges*fade*strength);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const beam = new THREE.Group();
  beam.position.copy(origin);
  beam.quaternion.setFromUnitVectors(vector(0, -1, 0), direction.clone().normalize());
  scene.add(beam);
  for (const angle of [0, Math.PI / 2]) {
    const plane = mesh(beam, new THREE.PlaneGeometry(width, length), material, 0, -length / 2);
    plane.rotation.y = angle;
    plane.renderOrder = order;
  }
}

function buildLighthouse(scene, waterLevel, brass, glow) {
  const { x, z } = island;
  const rng = random(133);
  const rocks = ['#544b62','#64616d','#736071','#455b69'].map(color => standard(color));
  const top = standard('#5d7561');
  for (let i = 0; i < 30; i++) {
    const angle = rng() * TAU;
    const distance = Math.sqrt(rng()) * .46;
    const size = .14 + rng() * .20;
    const rock = mesh(scene, new THREE.DodecahedronGeometry(size, 0), rocks[i % rocks.length],
      x + Math.cos(angle) * distance, waterLevel + .03 + (.56 - distance) * .39, z + Math.sin(angle) * distance * .82);
    rock.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    rock.scale.y = .55 + rng() * .48;
  }
  cylinder(scene, .35, .45, .13, top, x, waterLevel + .30, z, 12);
  const cream = standard('#eed8be');
  const burgundy = standard('#9b4e57');
  const brick = standard('#483c4c', { roughness: .65 });
  for (let i = 0; i < 7; i++) {
    cylinder(scene, .227 - i * .011, .238 - i * .011, .223, i % 2 === 0 ? cream : burgundy,
      x, waterLevel + .425 + i * .22, z, 18);
  }
  const lanternY = waterLevel + 2.00;
  const amber = new THREE.MeshBasicMaterial({ color: '#ffc17e' });
  cylinder(scene, .182, .182, .27, amber, x, lanternY, z, 12);
  cylinder(scene, .266, .241, .07, brick, x, lanternY - .14, z, 18);
  cylinder(scene, .066, .247, .14, burgundy, x, lanternY + .197, z, 16);
  cylinder(scene, .046, .055, .10, brass, x, lanternY + .304, z, 12);
  for (let i = 0; i < 7; i++) {
    const angle = i * TAU / 7;
    cylinder(scene, .013, .013, .27, brick, x + Math.cos(angle) * .183, lanternY, z + Math.sin(angle) * .183, 6);
  }
  box(scene, .113, .16, .019, brick, x, waterLevel + .45, z + .22);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glow, color: '#ff9a50', transparent: true, opacity: .75, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  halo.position.set(x, lanternY, z);
  halo.scale.setScalar(1.65);
  halo.renderOrder = 7;
  scene.add(halo);
  lightBeam(scene, vector(x - .13, lanternY, z), vector(-1,.06,.11), .8, 3.30, '#ffb373', .18, 6);
}

function buildSpray(scene, waterLevel, glow) {
  const rng = random(72);
  const seeds = [];
  const positions = new Float32Array(102 * 3);
  for (let i = 0; i < positions.length / 3; i++) {
    seeds.push({
      x: -2.28 + rng() * 4.51,
      z: (.38 + rng() * .31) * (rng() < .5 ? -1 : 1),
      phase: rng(),
      drift: rng() * .18,
    });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: '#d1f4ff', size: .056, map: glow, transparent: true, opacity: .75, depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  points.frustumCulled = false;
  points.renderOrder = 4;
  scene.add(points);
  return function moveSpray(elapsed) {
    seeds.forEach(({ x, z, phase, drift }, i) => {
      const age = (elapsed * (.6 + drift) + phase) % 1;
      const offset = i * 3;
      positions[offset] = x - age * drift;
      positions[offset + 1] = waterLevel + Math.sin(age * Math.PI) * (.05 + drift) - age * .025;
      positions[offset + 2] = z + Math.sign(z) * age * drift * 1.9;
    });
    geometry.attributes.position.needsUpdate = true;
  };
}

function buildSeabed(scene, brass, wood) {
  const rng = random(773);
  const sand = standard('#b7ac74', { roughness: .96 });
  cylinder(scene, 2.69, 2.45, .19, sand, 0, .567, 0, 90);
  const pavers = [];
  for (let row = -13; row <= 13; row++) {
    for (let col = -13; col <= 13; col++) {
      const x = (col + (row % 2) * .33) * .194;
      const z = row * .191;
      if (Math.hypot(x, z) > 2.57 || rng() < .035) continue;
      pavers.push({ x, z, height: .024 + rng() * .082, yaw: (rng() - .5) * .13, tone: .63 + rng() * .41 });
    }
  }
  const dummy = new THREE.Object3D();
  const tesserae = new THREE.InstancedMesh(new THREE.BoxGeometry(.184, 1, .179), sand, pavers.length);
  const tileColor = new THREE.Color();
  pavers.forEach(({ x, z, height, yaw, tone }, i) => {
    dummy.position.set(x, .655 + height * .43, z);
    dummy.scale.set(1, height, 1);
    dummy.rotation.set(0, yaw, 0);
    dummy.updateMatrix();
    tesserae.setMatrixAt(i, dummy.matrix);
    tesserae.setColorAt(i, tileColor.setRGB(tone, tone * (.86 + rng() * .18), tone * (.78 + rng() * .20)));
  });
  scene.add(tesserae);

  const reef = ['#3d6360', '#55756a', '#375258', '#5d6b56'].map(color => standard(color));
  const reefLocations = [[-1.69,.81],[.48,-1.93],[1.65,.89],[1.36,-.97],[-1.53,-.81]];
  const rockGeometry = new THREE.DodecahedronGeometry(1);
  reefLocations.forEach(([x,z], section) => {
    for (let i = 0; i < 11; i++) {
      const angle = rng() * TAU;
      const radius = .24 + rng() * .31;
      const scale = .11 + rng() * .26;
      const stone = mesh(scene, rockGeometry, reef[(section + i) % reef.length], x + Math.cos(angle)*radius,
        .70 + scale*.45, z + Math.sin(angle)*radius*.70);
      stone.rotation.set(rng(), rng()*TAU, rng());
      stone.scale.set(scale, scale*(.45+rng()), scale*(.72+rng()*.56));
    }
  });

  const foliage = ['#506b47','#728f45','#22494b','#a37e47','#934e56','#75696f'].map(color => standard(color, { roughness: .93 }));
  const bulbs = new THREE.IcosahedronGeometry(1, 0);
  const plants = [[-1.9,1.03],[-1.45,.99],[-1.82,-.60],[1.84,.92],[1.78,.49],[1.42,1.28],
    [-.75,1.91],[.92,-1.75],[.49,-2.19],[-.4,-1.33],[-2.10,.3],[1.46,-.78]];
  plants.forEach(([x,z], i) => {
    const color = foliage[i % foliage.length];
    for (let stalk = 0; stalk < 5; stalk++) {
      const length = .27 + rng() * .63;
      const angle = rng() * TAU;
      const radius = .09 + rng() * .22;
      const points = [
        vector(x, .70, z), vector(x + Math.cos(angle)*radius*.43, .70+length*.51, z + Math.sin(angle)*radius*.50),
        vector(x+Math.cos(angle)*radius, .70+length, z+Math.sin(angle)*radius),
      ];
      tube(scene, points, .019 + length*.016, color, 9);
      for (let leaf = 1; leaf <= 3; leaf++) {
        const f = leaf / 3;
        const center = points[0].clone().lerp(points[2], f);
        const tip = mesh(scene, bulbs, color, center.x + Math.cos(angle)*.049, center.y, center.z + Math.sin(angle)*.049);
        tip.scale.set(.06+.03*f, .041, .08+.03*f);
        tip.rotation.z = (rng()-.5)*1.8;
      }
    }
  });

  const crate = new THREE.Group();
  crate.position.set(.91,.79,1.34);
  crate.rotation.y = -.32;
  scene.add(crate);
  const cedar = standard('#765136', { map: wood });
  const darkWood = standard('#4a3d2a', { map: wood });
  const treasure = new THREE.MeshBasicMaterial({ color: '#d7a75c' });
  box(crate,.58,.23,.37,darkWood,0,.10,0);
  box(crate,.45,.028,.27,treasure,0,.235,0);
  const lid = box(crate,.59,.075,.37,cedar,0,.317,-.145);
  lid.rotation.x = -.66;
  for (const x of [-.22,.22]) {
    box(crate,.045,.22,.382,brass,x,.11,0);
    const band = box(crate,.045,.087,.379,brass,x,.318,-.145);
    band.rotation.x = lid.rotation.x;
  }
  for (let i=0;i<10;i++) {
    cylinder(scene,.04,.04,.012,brass,.66+rng()*.61,.731+rng()*.025,1.54+rng()*.35,9);
  }
  for (let i=0;i<4;i++) {
    const x = -.95+i*.27;
    const spar = box(scene,.18,.07,.62,cedar,x,.747,-.24+(rng()-.5)*.34);
    spar.rotation.y = -.33+rng()*.35;
  }

  const bodies = new THREE.SphereGeometry(1,10,6);
  const fins = new THREE.BufferGeometry();
  fins.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0,-.14,.10,0,-.14,-.10,0],3));
  fins.computeVertexNormals();
  const schools = ['#cead68','#679493'].map((color, school) => {
    const fishMaterial = standard(color, { metalness: .16, roughness: .49, side: THREE.DoubleSide });
    return Array.from({length: 7}, (_,index) => {
      const fish = new THREE.Group();
      const body = mesh(fish,bodies,fishMaterial);
      body.scale.set(.12,.050,.028);
      const tail = mesh(fish,fins,fishMaterial,-.09,0,0);
      fish.scale.setScalar(.62 + rng()*.63);
      scene.add(fish);
      return { fish, tail, school, index, phase: rng()*TAU };
    });
  }).flat();
  return elapsed => {
    schools.forEach(({fish,tail,school,index,phase}) => {
      const angle = elapsed * (school ? -.28 : .36) + (school ? -.55 : 1.05) + index*.185;
      const radius = (school ? 1.59 : 1.93) + .14*Math.sin(phase);
      fish.position.set(Math.cos(angle)*radius, 1.34+school*.48+index*.072+.075*Math.sin(elapsed*1.4+phase), Math.sin(angle)*radius);
      fish.rotation.y = (school ? -Math.PI : 0) - angle - Math.PI*.5;
      tail.rotation.y = Math.sin(elapsed*7.7+phase)*.42;
    });
  };
}

export function createVoyage({ includeDesk = true } = {}) {
  const scene = new THREE.Scene();
  const time = { value: 0 };
  const wood = grainTexture();
  const glow = glowTexture();
  const brass = standard('#deab65', { metalness: .62, roughness: .36, side: THREE.DoubleSide });
  const cord = standard('#a78967', { roughness: .95 });
  scene.add(new THREE.HemisphereLight('#cce6d3', '#5d644f', 1.54));
  const key = new THREE.DirectionalLight('#ffcc80', 2.18);
  key.position.set(6, 8, -3);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#8bcaca', 1.91);
  fill.position.set(-5, 4, 7);
  scene.add(fill);
  const bounce = new THREE.PointLight('#f3bb66', 17, 16, 2);
  bounce.position.set(4, 3, 5);
  scene.add(bounce);
  buildStand(scene, brass, wood, includeDesk);
  buildGlass(scene, brass, cord);
  const moveFish = buildSeabed(scene, brass, wood);
  const waterLevel = buildWater(scene, time);
  const ship = buildShip(scene, waterLevel, wood, brass, cord);
  buildLighthouse(scene, waterLevel, brass, glow);
  const moveSpray = buildSpray(scene, waterLevel, glow);
  lightBeam(scene, vector(.48,7.83,-.22), vector(-.25,-1,.19), 2.25, 5.94, '#efc77a', .13, 5);
  function animate(elapsed) {
    time.value = elapsed;
    ship.position.y = waterLevel - .05 + Math.sin(elapsed * 1.34) * .057;
    ship.rotation.x = Math.sin(elapsed * 1.12 + .5) * .033;
    ship.rotation.z = Math.sin(elapsed * 1.47) * .021;
    moveSpray(elapsed);
    moveFish(elapsed);
  }
  animate(0);
  return { scene, animate };
}
