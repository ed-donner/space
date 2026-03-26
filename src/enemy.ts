import * as THREE from 'three';
import type { ProjectileManager } from './projectiles';

export class EnemyShip {
  mesh: THREE.Group;
  position = new THREE.Vector3(0, 0, -500);
  quaternion = new THREE.Quaternion();
  speed = 90;
  energy = 100;
  alive = true;

  // AI state
  private waypointTimer = 0;
  private currentWaypoint = new THREE.Vector3();
  private waypointRadius = 800;
  private fireCooldown = 0;
  private skill = 1.0; // 0-2 scale, affects accuracy and aggression
  private mode: 'patrol' | 'attack' | 'evade' = 'patrol';

  // Explosion state
  private explosionParts: THREE.Mesh[] = [];
  private explosionTimer = 0;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.mesh = this.buildShipMesh();
    this.mesh.name = 'enemy-ship';
    scene.add(this.mesh);
    this.pickNewWaypoint();
  }

  setSkill(s: number): void {
    this.skill = Math.max(0.2, Math.min(2.5, s));
  }

  getSkill(): number {
    return this.skill;
  }

  private buildShipMesh(): THREE.Group {
    const group = new THREE.Group();

    // Main fuselage — angular, aggressive shape
    const bodyGeo = new THREE.ConeGeometry(5, 22, 6);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0x880000,
      specular: 0x442222,
      shininess: 40,
      flatShading: true,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);

    // Armored plating on top
    const plateGeo = new THREE.BoxGeometry(3, 1.5, 12);
    const plateMat = new THREE.MeshPhongMaterial({
      color: 0x444444,
      specular: 0x222222,
      shininess: 60,
      flatShading: true,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = 2;
    group.add(plate);

    // Wings — swept back, menacing
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(-18, 5);
    wingShape.lineTo(-16, 3);
    wingShape.lineTo(-5, -2);
    wingShape.lineTo(0, -1);
    wingShape.closePath();

    const wingExtrudeSettings = { depth: 0.8, bevelEnabled: false };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    const wingMat = new THREE.MeshPhongMaterial({
      color: 0x661111,
      specular: 0x331111,
      shininess: 30,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-2, -0.4, 2);
    group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.scale.x = -1;
    rightWing.position.set(2, -0.4, 2);
    group.add(rightWing);

    // Wing tips — red glow
    const tipGeo = new THREE.SphereGeometry(1, 6, 6);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const leftTip = new THREE.Mesh(tipGeo, tipMat);
    leftTip.position.set(-20, -0.4, 7);
    group.add(leftTip);
    const rightTip = new THREE.Mesh(tipGeo, tipMat);
    rightTip.position.set(20, -0.4, 7);
    group.add(rightTip);

    // Twin engines
    const engineGeo = new THREE.CylinderGeometry(1.5, 2, 4, 6);
    engineGeo.rotateX(Math.PI / 2);
    const engineMat = new THREE.MeshPhongMaterial({
      color: 0x333333,
      specular: 0x111111,
      shininess: 20,
      flatShading: true,
    });
    const leftEngine = new THREE.Mesh(engineGeo, engineMat);
    leftEngine.position.set(-4, -0.5, 10);
    group.add(leftEngine);
    const rightEngine = new THREE.Mesh(engineGeo, engineMat);
    rightEngine.position.set(4, -0.5, 10);
    group.add(rightEngine);

    // Engine glow
    const glowGeo = new THREE.SphereGeometry(1.8, 6, 6);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.8 });
    const leftGlow = new THREE.Mesh(glowGeo, glowMat);
    leftGlow.position.set(-4, -0.5, 12);
    leftGlow.name = 'engine-glow-l';
    group.add(leftGlow);
    const rightGlow = new THREE.Mesh(glowGeo, glowMat);
    rightGlow.position.set(4, -0.5, 12);
    rightGlow.name = 'engine-glow-r';
    group.add(rightGlow);

    // Cockpit — sinister red
    const cockpitGeo = new THREE.SphereGeometry(2.5, 6, 4);
    cockpitGeo.scale(1, 0.5, 1.4);
    const cockpitMat = new THREE.MeshPhongMaterial({
      color: 0x220000,
      emissive: 0x330000,
      specular: 0xff2222,
      shininess: 100,
      transparent: true,
      opacity: 0.8,
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 2.2, -4);
    group.add(cockpit);

    return group;
  }

  private lastKnownPlayerPos = new THREE.Vector3();

  private pickNewWaypoint(): void {
    // Waypoints orbit around last known player position
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 200 + Math.random() * this.waypointRadius;

    this.currentWaypoint.set(
      this.lastKnownPlayerPos.x + r * Math.sin(phi) * Math.cos(theta),
      this.lastKnownPlayerPos.y + r * Math.sin(phi) * Math.sin(theta),
      this.lastKnownPlayerPos.z + r * Math.cos(phi)
    );
    this.waypointTimer = 0;
  }

  respawn(playerPosition: THREE.Vector3): void {
    // Spawn at a random position 400-800 units from player
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 400 + Math.random() * 400;

    this.position.set(
      playerPosition.x + r * Math.sin(phi) * Math.cos(theta),
      playerPosition.y + r * Math.sin(phi) * Math.sin(theta),
      playerPosition.z + r * Math.cos(phi)
    );
    this.quaternion.identity();
    this.energy = 100;
    this.alive = true;
    this.mesh.visible = true;
    this.fireCooldown = 2; // grace period
    this.pickNewWaypoint();
    this.clearExplosion();
  }

  private clearExplosion(): void {
    for (const p of this.explosionParts) {
      this.scene.remove(p);
    }
    this.explosionParts.length = 0;
    this.explosionTimer = 0;
  }

  explode(): void {
    this.alive = false;
    this.mesh.visible = false;

    // Create explosion particles
    const colors = [0xff4400, 0xff8800, 0xffcc00, 0xff0000, 0xffffff];
    for (let i = 0; i < 20; i++) {
      const size = 1 + Math.random() * 3;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 1,
      });
      const part = new THREE.Mesh(geo, mat);
      part.position.copy(this.position);
      part.userData['velocity'] = new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
      );
      part.userData['rotSpeed'] = new THREE.Vector3(
        Math.random() * 5,
        Math.random() * 5,
        Math.random() * 5,
      );
      this.scene.add(part);
      this.explosionParts.push(part);
    }
    this.explosionTimer = 0;
  }

  update(dt: number, playerPosition: THREE.Vector3, projectiles?: ProjectileManager): void {
    this.lastKnownPlayerPos.copy(playerPosition);

    // Update explosion animation
    if (!this.alive) {
      this.explosionTimer += dt;
      for (const p of this.explosionParts) {
        const vel = p.userData['velocity'] as THREE.Vector3;
        const rot = p.userData['rotSpeed'] as THREE.Vector3;
        p.position.addScaledVector(vel, dt);
        p.rotation.x += rot.x * dt;
        p.rotation.y += rot.y * dt;
        p.rotation.z += rot.z * dt;
        // Fade out
        const mat = p.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 1 - this.explosionTimer / 2);
      }
      return;
    }

    const distToPlayer = this.position.distanceTo(playerPosition);

    // AI mode selection — aggressive: always attack unless low energy
    if (this.energy < 20) {
      this.mode = 'evade';
    } else if (distToPlayer < 1200) {
      this.mode = 'attack';
    } else {
      // Too far — close distance
      this.mode = 'attack';
    }

    // Determine target
    let target: THREE.Vector3;
    if (this.mode === 'attack') {
      target = playerPosition;
    } else if (this.mode === 'evade') {
      // Fly away from player
      target = this.position.clone().addScaledVector(
        new THREE.Vector3().subVectors(this.position, playerPosition).normalize(),
        500
      );
    } else {
      // Patrol waypoints
      this.waypointTimer += dt;
      const distToWaypoint = this.position.distanceTo(this.currentWaypoint);
      if (distToWaypoint < 50 || this.waypointTimer > 8) {
        this.pickNewWaypoint();
      }
      target = this.currentWaypoint;
    }

    // Steer toward target
    const desired = new THREE.Vector3().subVectors(target, this.position).normalize();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);

    const targetQuat = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.quaternion);
    const lookMatrix = new THREE.Matrix4().lookAt(
      new THREE.Vector3(0, 0, 0), desired, up
    );
    targetQuat.setFromRotationMatrix(lookMatrix);

    const turnRate = 1.2 + this.skill * 0.5;
    this.quaternion.slerp(targetQuat, Math.min(1, turnRate * dt));
    this.quaternion.normalize();

    // Bank into turns
    const cross = new THREE.Vector3().crossVectors(forward, desired);
    const rollAmount = cross.dot(new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion));
    const rollQuat = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1), rollAmount * 0.5 * dt
    );
    this.quaternion.multiply(rollQuat);
    this.quaternion.normalize();

    // Move forward
    const newForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    this.position.addScaledVector(newForward, this.speed * dt);

    // Animate engine glow
    const glowL = this.mesh.getObjectByName('engine-glow-l') as THREE.Mesh | undefined;
    const glowR = this.mesh.getObjectByName('engine-glow-r') as THREE.Mesh | undefined;
    if (glowL && glowR) {
      const pulse = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
      glowL.scale.setScalar(pulse);
      glowR.scale.setScalar(pulse);
    }

    // Shooting AI
    this.fireCooldown -= dt;
    if (this.mode === 'attack' && this.fireCooldown <= 0 && projectiles) {
      const dot = newForward.dot(desired);
      // Fire when roughly facing player
      const accuracyThreshold = 0.85 - this.skill * 0.08;
      if (dot > accuracyThreshold && distToPlayer < 1000) {
        // Lead targeting: aim toward where the player will be
        const fireDir = desired.clone();
        // Add some inaccuracy based on inverse skill
        const spread = 0.06 / this.skill;
        fireDir.x += (Math.random() - 0.5) * spread;
        fireDir.y += (Math.random() - 0.5) * spread;
        fireDir.normalize();

        projectiles.fire(this.position, fireDir, this.quaternion, false);
        this.fireCooldown = 1.0 / this.skill;
      }
    }

    // Update mesh
    this.mesh.position.copy(this.position);
    this.mesh.quaternion.copy(this.quaternion);
  }

  getState() {
    return {
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      speed: this.speed,
      energy: this.energy,
      alive: this.alive,
      skill: this.skill,
    };
  }
}
