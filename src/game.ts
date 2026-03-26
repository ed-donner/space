import * as THREE from 'three';
import { InputManager } from './input';
import { HUD } from './hud';
import { EnemyShip } from './enemy';
import { ProjectileManager } from './projectiles';

export class Game {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  input: InputManager;
  hud: HUD;
  container: HTMLElement;
  running = false;
  frameCount = 0;

  // Player state
  playerQuaternion = new THREE.Quaternion();
  playerPosition = new THREE.Vector3(0, 0, 0);
  playerSpeed = 80;
  energy = 100;
  kills = 0;
  deaths = 0;
  playerAlive = true;
  respawnTimer = 0;
  fireCooldown = 0;

  // Screen flash effect
  private screenFlash = 0;
  private screenFlashColor = '#fff';

  // Enemy
  enemy: EnemyShip;

  // Projectiles
  projectiles: ProjectileManager;

  // Starfield layers
  private starfieldFar!: THREE.Points;
  private starfieldNear!: THREE.Points;
  private dustField!: THREE.Points;

  constructor(container: HTMLElement) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000005);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      20000
    );

    this.input = new InputManager();
    this.hud = new HUD(container);

    this.setupScene();
    this.setupResize();

    this.projectiles = new ProjectileManager(this.scene);
    this.enemy = new EnemyShip(this.scene);
  }

  private setupScene(): void {
    const ambient = new THREE.AmbientLight(0x444444);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(100, 50, 100);
    this.scene.add(sun);

    // Secondary fill light
    const fill = new THREE.DirectionalLight(0x4444ff, 0.3);
    fill.position.set(-50, -30, -50);
    this.scene.add(fill);

    this.createStarfields();
  }

  private createStarfields(): void {
    this.starfieldFar = this.makeStarLayer({
      count: 1500,
      radiusMin: 5000,
      radiusMax: 9000,
      size: 4,
      colorBase: 0.8,
      colorVariance: 0.2,
    });
    this.starfieldFar.name = 'starfield';
    this.scene.add(this.starfieldFar);

    this.starfieldNear = this.makeStarLayer({
      count: 800,
      radiusMin: 1500,
      radiusMax: 4000,
      size: 2.5,
      colorBase: 0.6,
      colorVariance: 0.3,
    });
    this.scene.add(this.starfieldNear);

    this.dustField = this.makeStarLayer({
      count: 300,
      radiusMin: 200,
      radiusMax: 800,
      size: 1.5,
      colorBase: 0.3,
      colorVariance: 0.15,
    });
    this.scene.add(this.dustField);
  }

  private makeStarLayer(opts: {
    count: number;
    radiusMin: number;
    radiusMax: number;
    size: number;
    colorBase: number;
    colorVariance: number;
  }): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(opts.count * 3);
    const colors = new Float32Array(opts.count * 3);

    for (let i = 0; i < opts.count; i++) {
      const r = opts.radiusMin + Math.random() * (opts.radiusMax - opts.radiusMin);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const brightness = opts.colorBase + Math.random() * opts.colorVariance;
      const tint = Math.random();
      if (tint < 0.6) {
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness;
        colors[i * 3 + 2] = brightness;
      } else if (tint < 0.75) {
        colors[i * 3] = brightness * 0.8;
        colors[i * 3 + 1] = brightness * 0.85;
        colors[i * 3 + 2] = brightness;
      } else if (tint < 0.9) {
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness * 0.95;
        colors[i * 3 + 2] = brightness * 0.7;
      } else {
        colors[i * 3] = brightness;
        colors[i * 3 + 1] = brightness * 0.7;
        colors[i * 3 + 2] = brightness * 0.5;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: opts.size,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    return new THREE.Points(geometry, material);
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
  }

  private lastTime = 0;

  private loop = (): void => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();
    this.frameCount++;
  };

  private update(dt: number): void {
    // Handle respawn
    if (!this.playerAlive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.playerAlive = true;
        this.energy = 100;
        this.fireCooldown = 1;
      }
    }

    if (this.playerAlive) {
      this.updatePlayerMovement(dt);
      this.updatePlayerShooting(dt);
    }

    // Update enemy
    this.enemy.update(dt, this.playerPosition, this.projectiles);

    // Handle enemy respawn
    if (!this.enemy.alive && this.enemy['explosionTimer'] > 2.5) {
      this.enemy.respawn(this.playerPosition);
    }

    // Update projectiles
    this.projectiles.update(dt);

    // Hit detection: player shots hitting enemy
    if (this.enemy.alive) {
      if (this.projectiles.checkHit(this.enemy.position, 15, false)) {
        this.enemy.energy -= 20;
        this.screenFlash = 0.1;
        this.screenFlashColor = '#ff4400';
        if (this.enemy.energy <= 0) {
          this.enemy.energy = 0;
          this.enemy.explode();
          this.kills++;
          // Increase enemy skill after each kill
          this.enemy.setSkill(this.enemy.getSkill() + 0.15);
          this.screenFlash = 0.3;
          this.screenFlashColor = '#ff8800';
        }
      }
    }

    // Hit detection: enemy shots hitting player
    if (this.playerAlive) {
      if (this.projectiles.checkHit(this.playerPosition, 12, true)) {
        this.energy -= 15;
        this.screenFlash = 0.15;
        this.screenFlashColor = '#ff0000';
        if (this.energy <= 0) {
          this.energy = 0;
          this.playerDied();
        }
      }
    }

    // Decay screen flash
    if (this.screenFlash > 0) {
      this.screenFlash -= dt;
    }

    // Starfield follows player
    this.starfieldFar.position.copy(this.playerPosition);
    this.starfieldNear.position.copy(this.playerPosition);
    this.dustField.position.copy(this.playerPosition);
    this.dustField.rotation.y += 0.01 * dt;
    this.dustField.rotation.x += 0.005 * dt;

    // HUD data
    const relativeEnemyPos = new THREE.Vector3()
      .subVectors(this.enemy.position, this.playerPosition);
    const inverseQuat = this.playerQuaternion.clone().invert();
    relativeEnemyPos.applyQuaternion(inverseQuat);
    const distToEnemy = this.playerPosition.distanceTo(this.enemy.position);

    const euler = new THREE.Euler().setFromQuaternion(this.playerQuaternion, 'YXZ');
    this.hud.update({
      energy: this.energy,
      kills: this.kills,
      deaths: this.deaths,
      rotation: euler,
      target: this.enemy.alive ? {
        relativePosition: relativeEnemyPos,
        distance: distToEnemy,
        energy: this.enemy.energy,
      } : undefined,
      playerAlive: this.playerAlive,
      respawnTimer: this.respawnTimer,
      screenFlash: this.screenFlash > 0 ? this.screenFlash : 0,
      screenFlashColor: this.screenFlashColor,
      enemySkill: this.enemy.getSkill(),
    });
  }

  private updatePlayerMovement(dt: number): void {
    const rollSpeed = 2.0;
    const pitchSpeed = 1.5;

    if (this.input.keys.left) {
      const q = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1), rollSpeed * dt
      );
      this.playerQuaternion.multiply(q);
    }
    if (this.input.keys.right) {
      const q = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1), -rollSpeed * dt
      );
      this.playerQuaternion.multiply(q);
    }
    if (this.input.keys.up) {
      const q = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0), -pitchSpeed * dt
      );
      this.playerQuaternion.multiply(q);
    }
    if (this.input.keys.down) {
      const q = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0), pitchSpeed * dt
      );
      this.playerQuaternion.multiply(q);
    }

    this.playerQuaternion.normalize();
    this.camera.quaternion.copy(this.playerQuaternion);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerQuaternion);
    this.playerPosition.addScaledVector(forward, this.playerSpeed * dt);
    this.camera.position.copy(this.playerPosition);
  }

  private updatePlayerShooting(dt: number): void {
    this.fireCooldown -= dt;
    if (this.input.keys.fire && this.fireCooldown <= 0) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.playerQuaternion);
      this.projectiles.fire(this.playerPosition, forward, this.playerQuaternion, true);
      this.fireCooldown = 0.25;
      this.screenFlash = 0.05;
      this.screenFlashColor = '#00ff44';
    }
  }

  private playerDied(): void {
    this.playerAlive = false;
    this.deaths++;
    this.respawnTimer = 3;
    this.screenFlash = 0.5;
    this.screenFlashColor = '#ff0000';
    // Decrease enemy skill on player death
    this.enemy.setSkill(this.enemy.getSkill() - 0.2);
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  getState() {
    const euler = new THREE.Euler().setFromQuaternion(this.playerQuaternion, 'YXZ');
    return {
      frameCount: this.frameCount,
      energy: this.energy,
      kills: this.kills,
      deaths: this.deaths,
      position: {
        x: this.playerPosition.x,
        y: this.playerPosition.y,
        z: this.playerPosition.z,
      },
      rotation: {
        x: euler.x,
        y: euler.y,
        z: euler.z,
      },
      running: this.running,
      playerAlive: this.playerAlive,
      enemy: this.enemy.getState(),
      projectileCount: this.projectiles.projectiles.length,
    };
  }
}
