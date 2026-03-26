import * as THREE from 'three';

export interface Projectile {
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  isPlayer: boolean;
}

const LASER_SPEED = 400;
const LASER_MAX_AGE = 2.0;
const LASER_LENGTH = 14;

export class ProjectileManager {
  projectiles: Projectile[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private makeLaserBolt(isPlayer: boolean): THREE.Group {
    const group = new THREE.Group();
    const color = isPlayer ? 0x00ff44 : 0xff2200;
    const glowColor = isPlayer ? 0x00ff88 : 0xff4400;

    // Core bolt
    const coreGeo = new THREE.CylinderGeometry(0.4, 0.4, LASER_LENGTH, 4);
    coreGeo.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({ color });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    // Glow shell
    const glowGeo = new THREE.CylinderGeometry(1.2, 1.2, LASER_LENGTH * 0.8, 6);
    glowGeo.rotateX(Math.PI / 2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    return group;
  }

  fire(origin: THREE.Vector3, direction: THREE.Vector3, quaternion: THREE.Quaternion, isPlayer: boolean): void {
    const group = this.makeLaserBolt(isPlayer);
    const pos = origin.clone().addScaledVector(direction, 15);
    group.position.copy(pos);
    group.quaternion.copy(quaternion);
    this.scene.add(group);

    this.projectiles.push({
      group,
      position: pos,
      velocity: direction.clone().multiplyScalar(LASER_SPEED),
      age: 0,
      isPlayer,
    });
  }

  update(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;

      if (p.age > LASER_MAX_AGE) {
        this.scene.remove(p.group);
        this.projectiles.splice(i, 1);
        continue;
      }

      p.position.addScaledVector(p.velocity, dt);
      p.group.position.copy(p.position);
    }
  }

  checkHit(targetPos: THREE.Vector3, hitRadius: number, isPlayerTarget: boolean): boolean {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (isPlayerTarget && p.isPlayer) continue;
      if (!isPlayerTarget && !p.isPlayer) continue;

      const dist = p.position.distanceTo(targetPos);
      if (dist < hitRadius) {
        this.scene.remove(p.group);
        this.projectiles.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  clear(): void {
    for (const p of this.projectiles) {
      this.scene.remove(p.group);
    }
    this.projectiles.length = 0;
  }
}
