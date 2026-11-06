import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { createVoyage } from './model.js';

const surface = document.querySelector('[data-voyage]');
const isPreview = surface?.dataset.voyage === 'preview';
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const note = document.querySelector('#viewer-note');
const orbit = document.querySelector('#orbit');
const reset = document.querySelector('#reset');
const exportButton = document.querySelector('#export');
const hint = '拖动旋转 · 滚轮或双指缩放';
const direction = new THREE.Vector3(.68, .20, .79).normalize();
const target = new THREE.Vector3(0, 4.07, 0);
const fov = 31;
const clouds = new Image();
clouds.src = new URL('./sky.svg', import.meta.url).href;

function fitDistance(aspect) {
  const viewHeight = Math.max(isPreview ? 10.30 : 10.45, 7.38 / aspect);
  return viewHeight / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
}

function paintSky(canvas, ctx) {
  const { width, height } = canvas;
  const base = ctx.createLinearGradient(0, 0, 0, height);
  const stops = [[0,'#090f10'],[.28,'#111918'],[.49,'#182522'],[.65,'#203538'],[.83,'#111d22'],[1,'#0a1419']];
  for (const [at, color] of stops) base.addColorStop(at, color);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  function glowAt(x, y, color) {
    ctx.save();
    ctx.scale(width, height);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, .67);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1, 1);
    ctx.restore();
  }
  glowAt(.25, .70, '#23576182');
  glowAt(.73, .34, '#80663875');
  if (clouds.complete && clouds.naturalWidth) ctx.drawImage(clouds, 0, 0, width, height);
}

function snapshot(renderer, scene, camera, controlTarget, distance, width, height) {
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  const ctx = output.getContext('2d');
  if (!ctx) throw new Error('No 2D canvas');
  paintSky(output, ctx);
  const exportCamera = camera.clone();
  const angle = camera.position.clone().sub(controlTarget);
  angle.multiplyScalar(fitDistance(width / height) / distance);
  exportCamera.position.copy(controlTarget).add(angle);
  exportCamera.lookAt(controlTarget);
  const originalSize = renderer.getSize(new THREE.Vector2());
  const originalRatio = renderer.getPixelRatio();
  const tile = 1536;
  try {
    renderer.setPixelRatio(1);
    for (let y = 0; y < height; y += tile) {
      for (let x = 0; x < width; x += tile) {
        const w = Math.min(tile, width - x), h = Math.min(tile, height - y);
        renderer.setSize(w, h, false);
        exportCamera.setViewOffset(width, height, x, y, w, h);
        renderer.render(scene, exportCamera);
        ctx.drawImage(renderer.domElement, x, y);
      }
    }
  } finally {
    renderer.setPixelRatio(originalRatio);
    renderer.setSize(originalSize.x, originalSize.y, false);
    renderer.render(scene, camera);
  }
  return output;
}

function init() {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.09;
  renderer.setPixelRatio(Math.min(devicePixelRatio, isPreview ? 1.55 : 1.9));
  const { scene, animate } = createVoyage();
  const camera = new THREE.PerspectiveCamera(fov, 1, .12, 100);
  const canvas = renderer.domElement;
  surface.append(canvas);
  const controls = new OrbitControls(camera, canvas);
  controls.enabled = !isPreview;
  if (isPreview) {
    canvas.style.touchAction = 'auto';
    canvas.style.pointerEvents = 'none';
  }
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = .075;
  controls.autoRotate = !isPreview && !preference.matches;
  controls.autoRotateSpeed = .53;
  controls.minDistance = 8.5;
  controls.maxDistance = 39;
  controls.minPolarAngle = .55;
  controls.maxPolarAngle = 1.61;
  controls.target.copy(target);
  let distance = 0;
  let visible = true;
  let hasContext = true;
  let pointerActive = false;
  let suspendedUntil = 0;
  let elapsed = 0;
  let last = 0;
  let request = 0;

  function frameModel() {
    camera.position.copy(direction).multiplyScalar(distance).add(target);
    controls.target.copy(target);
    camera.lookAt(target);
  }

  function resize() {
    const width = surface.clientWidth, height = surface.clientHeight;
    if (width < 2 || height < 2) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const next = fitDistance(camera.aspect);
    if (distance) camera.position.sub(controls.target).multiplyScalar(next / distance).add(controls.target);
    else {
      distance = next;
      frameModel();
    }
    distance = next;
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  }

  let orbitWanted = !isPreview && !preference.matches;
  function syncOrbitButton() {
    if (!orbit) return;
    orbit.textContent = orbitWanted ? '暂停环绕' : '开始环绕';
    orbit.setAttribute('aria-pressed', String(orbitWanted));
  }

  function draw(timestamp) {
    request = 0;
    if (!visible || document.hidden || !hasContext) {
      last = 0;
      return;
    }
    const delta = last ? Math.min((timestamp - last) / 1000, .05) : 0;
    last = timestamp;
    if (!preference.matches) {
      elapsed += delta;
      animate(elapsed);
      if (isPreview) {
        const angle = Math.sin(elapsed * .21) * .19;
        camera.position.copy(direction).applyAxisAngle(camera.up, angle).multiplyScalar(distance).add(target);
        camera.lookAt(target);
      }
    }
    controls.autoRotate = orbitWanted && !pointerActive && timestamp >= suspendedUntil;
    const moving = !isPreview && controls.update(delta);
    renderer.render(scene, camera);
    if (!preference.matches || orbitWanted || pointerActive || moving) {
      request = requestAnimationFrame(draw);
    } else {
      last = 0;
    }
  }

  function wake() {
    if (!request && visible && !document.hidden && hasContext) request = requestAnimationFrame(draw);
  }

  function fallback() {
    surface.dataset.ready = 'false';
    if (note) note.textContent = '当前设备无法显示实时三维场景，已切换为预览图。';
    for (const button of [orbit, reset, exportButton]) if (button) button.disabled = true;
  }

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    hasContext = false;
    fallback();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    hasContext = true;
    resize();
    surface.dataset.ready = 'true';
    if (note) note.textContent = hint;
    for (const button of [orbit, reset, exportButton]) if (button) button.disabled = false;
    wake();
  });
  controls.addEventListener('start', () => {
    pointerActive = true;
    wake();
  });
  controls.addEventListener('end', () => {
    pointerActive = false;
    suspendedUntil = performance.now() + 2400;
  });
  preference.addEventListener('change', event => {
    if (event.matches) orbitWanted = false;
    syncOrbitButton();
    wake();
  });
  orbit?.addEventListener('click', () => {
    orbitWanted = !orbitWanted;
    suspendedUntil = 0;
    syncOrbitButton();
    wake();
  });
  reset?.addEventListener('click', () => {
    frameModel();
    suspendedUntil = performance.now() + 1500;
    wake();
  });
  exportButton?.addEventListener('click', async () => {
    exportButton.disabled = true;
    note.textContent = '正在渲染 7680 × 4320 静帧…';
    await new Promise(resolve => setTimeout(resolve, 60));
    try {
      const output = snapshot(renderer, scene, camera, controls.target, distance, 7680, 4320);
      const blob = await new Promise(resolve => output.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG encoding failed');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bottled-voyage-8k.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      note.textContent = '已导出 7680 × 4320 PNG。' + hint;
    } catch {
      note.textContent = '此设备暂时无法导出 8K 静帧，可尝试使用桌面浏览器。';
    } finally {
      exportButton.disabled = false;
    }
  });

  resize();
  new ResizeObserver(resize).observe(surface);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    wake();
  }).observe(surface);
  document.addEventListener('visibilitychange', wake);
  surface.dataset.ready = 'true';
  if (note) note.textContent = hint;
  for (const button of [orbit, reset, exportButton]) if (button) button.disabled = false;
  syncOrbitButton();
  wake();
}

if (surface) {
  try {
    init();
  } catch (error) {
    if (note) note.textContent = '当前设备无法显示实时三维场景，已切换为预览图。';
    console.warn('Voyage renderer could not start.', error);
  }
}
