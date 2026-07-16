import * as THREE from 'three';
import { gsap } from 'gsap';

export class ThreeCanvas {
  constructor() {
    this.canvas = document.getElementById('bg-canvas');
    if (!this.canvas) return;

    this._animating = true;
    this._gsapTransitioning = false;

    this.init();
    this.createConstellation();
    this.createMinimalNode();
    this.addLights();
    this.setupEvents();
    this.animate();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0b10, 0.025);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 10);
    this._cameraTargetX = 0;
    this._cameraTargetY = 0;
    this._cameraBaseZ = 10;

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.time = 0;
  }

  createConstellation() {
    // Sparse, professional particle constellation
    const count = 350;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      // Spawn particles inside a large sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 8 + Math.random() * 12; // radius between 8 and 20

      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Circular particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grad.addColorStop(0, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 16);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.09,
      color: 0x9ca3af,
      transparent: true,
      opacity: 0.55,
      map: texture,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  createMinimalNode() {
    // Clean, single wireframe globe to represent a quiet connection node
    this.nodeGroup = new THREE.Group();
    this.nodeGroup.position.set(3, 0, 0);

    const sphereGeo = new THREE.SphereGeometry(2.2, 24, 24);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x1f2230,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    this.nodeMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.nodeGroup.add(this.nodeMesh);

    // Single outer orbit ring representing connection paths
    const ringGeo = new THREE.RingGeometry(2.6, 2.63, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.18,
    });
    this.nodeRing = new THREE.Mesh(ringGeo, ringMat);
    this.nodeRing.rotation.x = Math.PI / 3;
    this.nodeGroup.add(this.nodeRing);

    // Second thinner ring for depth
    const ring2Geo = new THREE.RingGeometry(3.0, 3.02, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.08,
    });
    this.nodeRing2 = new THREE.Mesh(ring2Geo, ring2Mat);
    this.nodeRing2.rotation.x = Math.PI / 5;
    this.nodeRing2.rotation.y = Math.PI / 4;
    this.nodeGroup.add(this.nodeRing2);

    this.scene.add(this.nodeGroup);
  }

  addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x6366f1, 0.5, 30);
    pointLight.position.set(5, 5, 5);
    this.scene.add(pointLight);
  }

  setupEvents() {
    this._resizeHandler = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this._resizeHandler);

    this._mouseMoveHandler = (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 1.2;
      this.mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 1.2;
    };
    window.addEventListener('mousemove', this._mouseMoveHandler);
  }

  transitionToPage(pageName) {
    if (!this.nodeGroup) return;

    // Kill any active GSAP tweens on these objects to prevent interference
    gsap.killTweensOf(this.nodeGroup.position);
    gsap.killTweensOf(this.nodeGroup.scale);

    this._gsapTransitioning = true;
    const tl = gsap.timeline({
      defaults: { duration: 1.2, ease: 'power2.out' },
      onComplete: () => { this._gsapTransitioning = false; }
    });

    switch (pageName) {
      case 'landing':
        tl.to(this.nodeGroup.position, { x: 3.5, y: 0, z: 0 }, 0)
          .to(this.nodeGroup.scale, { x: 1, y: 1, z: 1 }, 0);
        this._cameraBaseZ = 10;
        break;

      case 'login':
      case 'register':
        tl.to(this.nodeGroup.position, { x: 4, y: -1, z: -2 }, 0)
          .to(this.nodeGroup.scale, { x: 0.85, y: 0.85, z: 0.85 }, 0);
        this._cameraBaseZ = 9;
        break;

      case 'student-dashboard':
      case 'trainer-dashboard':
      case 'admin-dashboard':
      case 'dashboard':
        tl.to(this.nodeGroup.position, { x: -4.5, y: -2, z: -1 }, 0)
          .to(this.nodeGroup.scale, { x: 0.75, y: 0.75, z: 0.75 }, 0);
        this._cameraBaseZ = 9.5;
        break;

      case 'courses':
        tl.to(this.nodeGroup.position, { x: 5, y: 1, z: -3 }, 0)
          .to(this.nodeGroup.scale, { x: 0.7, y: 0.7, z: 0.7 }, 0);
        this._cameraBaseZ = 10;
        break;

      case 'quiz':
        tl.to(this.nodeGroup.position, { x: -3, y: 3, z: -2 }, 0)
          .to(this.nodeGroup.scale, { x: 0.6, y: 0.6, z: 0.6 }, 0);
        this._cameraBaseZ = 9;
        break;

      default:
        tl.to(this.nodeGroup.position, { x: 5, y: 3, z: -4 }, 0)
          .to(this.nodeGroup.scale, { x: 0.8, y: 0.8, z: 0.8 }, 0);
        this._cameraBaseZ = 9.5;
        break;
    }
  }

  animate() {
    if (!this._animating) return;
    requestAnimationFrame(() => this.animate());

    this.time += 0.002;

    // Slow, soothing rotations
    if (this.points) {
      this.points.rotation.y = this.time * 0.4;
      this.points.rotation.x = this.time * 0.15;
    }

    if (this.nodeGroup) {
      this.nodeMesh.rotation.y += 0.0008;
      this.nodeMesh.rotation.x += 0.0003;
      this.nodeRing.rotation.z -= 0.0015;
      if (this.nodeRing2) this.nodeRing2.rotation.z += 0.001;
    }

    // Gentle mouse parallax — only apply to XY, not Z (which GSAP controls)
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Smooth camera position towards mouse offset + base Z
    const targetCamX = this.mouse.x;
    const targetCamY = this.mouse.y;
    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.04;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.04;
    this.camera.position.z += (this._cameraBaseZ - this.camera.position.z) * 0.04;
    this.camera.lookAt(this.scene.position);

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this._animating = false;
    window.removeEventListener('resize', this._resizeHandler);
    window.removeEventListener('mousemove', this._mouseMoveHandler);
    this.renderer.dispose();
  }
}
