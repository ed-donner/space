import * as THREE from 'three';

export interface RadarTarget {
  relativePosition: THREE.Vector3;
  distance: number;
  energy: number;
}

export interface HUDState {
  energy: number;
  kills: number;
  deaths: number;
  rotation: THREE.Euler;
  target?: RadarTarget;
  playerAlive: boolean;
  respawnTimer: number;
  screenFlash: number;
  screenFlashColor: string;
  enemySkill: number;
}

export class HUD {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'hud';
    this.canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    `;
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  update(state: HUDState): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // Screen flash overlay
    if (state.screenFlash > 0) {
      ctx.fillStyle = state.screenFlashColor;
      ctx.globalAlpha = Math.min(0.4, state.screenFlash);
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    this.drawCockpitFrame(w, h, ctx);
    this.drawCrosshair(w, h, ctx);
    this.drawEnergyBar(w, h, ctx, state.energy);
    this.drawRadar(w, h, ctx, state.target);
    this.drawScoreboard(w, h, ctx, state.kills, state.deaths);

    // Enemy energy bar
    if (state.target) {
      this.drawEnemyEnergyBar(w, h, ctx, state.target.energy);
      ctx.fillStyle = '#0f0';
      ctx.font = '11px monospace';
      ctx.fillText(`RANGE: ${Math.round(state.target.distance)}`, 20, h - 20);
    }

    // Death screen
    if (!state.playerAlive) {
      ctx.fillStyle = 'rgba(100, 0, 0, 0.3)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DESTROYED', w / 2, h / 2 - 30);
      ctx.font = '18px monospace';
      ctx.fillStyle = '#ff4444';
      ctx.fillText(`Respawning in ${Math.ceil(state.respawnTimer)}...`, w / 2, h / 2 + 10);
      ctx.textAlign = 'left';
    }

    // Title
    ctx.fillStyle = '#0f0';
    ctx.font = '12px monospace';
    ctx.fillText('RETRO SPACE SHOOTER', 20, 30);
  }

  private drawCockpitFrame(w: number, h: number, ctx: CanvasRenderingContext2D): void {
    // Bottom cockpit — more detailed dashboard
    ctx.beginPath();
    ctx.moveTo(0, h * 0.82);
    ctx.lineTo(w * 0.08, h * 0.74);
    ctx.lineTo(w * 0.2, h * 0.76);
    ctx.lineTo(w * 0.3, h * 0.73);
    ctx.lineTo(w * 0.42, h * 0.76);
    ctx.lineTo(w * 0.5, h * 0.74);
    ctx.lineTo(w * 0.58, h * 0.76);
    ctx.lineTo(w * 0.7, h * 0.73);
    ctx.lineTo(w * 0.8, h * 0.76);
    ctx.lineTo(w * 0.92, h * 0.74);
    ctx.lineTo(w, h * 0.82);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();

    // Gradient fill for dashboard
    const dashGrad = ctx.createLinearGradient(0, h * 0.73, 0, h);
    dashGrad.addColorStop(0, 'rgba(15, 40, 15, 0.7)');
    dashGrad.addColorStop(0.3, 'rgba(8, 25, 8, 0.8)');
    dashGrad.addColorStop(1, 'rgba(5, 15, 5, 0.9)');
    ctx.fillStyle = dashGrad;
    ctx.fill();

    // Dashboard edge highlight
    ctx.strokeStyle = '#0a0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner panel lines on dashboard
    ctx.strokeStyle = 'rgba(0, 150, 0, 0.2)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 6; i++) {
      const y = h * 0.78 + i * 8;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, y);
      ctx.lineTo(w * 0.4, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.6, y);
      ctx.lineTo(w * 0.72, y);
      ctx.stroke();
    }

    // Side struts
    ctx.fillStyle = 'rgba(10, 30, 10, 0.5)';
    // Left strut
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.04, 0);
    ctx.lineTo(w * 0.06, h * 0.74);
    ctx.lineTo(0, h * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 100, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Right strut
    ctx.beginPath();
    ctx.moveTo(w * 0.96, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h * 0.82);
    ctx.lineTo(w * 0.94, h * 0.74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top bar with gradient
    const topGrad = ctx.createLinearGradient(0, 0, 0, 42);
    topGrad.addColorStop(0, 'rgba(10, 30, 10, 0.5)');
    topGrad.addColorStop(1, 'rgba(5, 15, 5, 0.1)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, 42);
    ctx.strokeStyle = 'rgba(0, 100, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 42);
    ctx.lineTo(w, 42);
    ctx.stroke();
  }

  private drawCrosshair(w: number, h: number, ctx: CanvasRenderingContext2D): void {
    const cx = w / 2;
    const cy = h / 2;

    // Outer ring
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.stroke();

    // Inner crosshair
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;

    const size = 18;
    const gap = 6;

    ctx.beginPath();
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx - gap, cy);
    ctx.moveTo(cx + gap, cy);
    ctx.lineTo(cx + size, cy);
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx, cy - gap);
    ctx.moveTo(cx, cy + gap);
    ctx.lineTo(cx, cy + size);
    ctx.stroke();

    // Corner brackets
    ctx.beginPath();
    ctx.moveTo(cx - size, cy - size);
    ctx.lineTo(cx - size, cy - size + 6);
    ctx.moveTo(cx - size, cy - size);
    ctx.lineTo(cx - size + 6, cy - size);

    ctx.moveTo(cx + size, cy - size);
    ctx.lineTo(cx + size, cy - size + 6);
    ctx.moveTo(cx + size, cy - size);
    ctx.lineTo(cx + size - 6, cy - size);

    ctx.moveTo(cx - size, cy + size);
    ctx.lineTo(cx - size, cy + size - 6);
    ctx.moveTo(cx - size, cy + size);
    ctx.lineTo(cx - size + 6, cy + size);

    ctx.moveTo(cx + size, cy + size);
    ctx.lineTo(cx + size, cy + size - 6);
    ctx.moveTo(cx + size, cy + size);
    ctx.lineTo(cx + size - 6, cy + size);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawEnergyBar(w: number, h: number, ctx: CanvasRenderingContext2D, energy: number): void {
    const barW = 180;
    const barH = 12;
    const x = w / 2 - barW / 2;
    const y = h - 45;

    ctx.fillStyle = '#0a0';
    ctx.font = '10px monospace';
    ctx.fillText('SHIELD', x, y - 3);

    ctx.fillStyle = 'rgba(0, 50, 0, 0.5)';
    ctx.fillRect(x, y, barW, barH);

    const fill = Math.max(0, Math.min(1, energy / 100));
    const color = energy > 50 ? '#0f0' : energy > 25 ? '#ff0' : '#f00';
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, (barW - 2) * fill, barH - 2);

    // Segmented look
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      const sx = x + (barW / 10) * i;
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx, y + barH);
      ctx.stroke();
    }

    ctx.strokeStyle = '#0a0';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barW, barH);

    // Numeric readout
    ctx.fillStyle = color;
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(energy)}%`, x + barW + 30, y + 10);
    ctx.textAlign = 'left';
  }

  private drawEnemyEnergyBar(w: number, h: number, ctx: CanvasRenderingContext2D, energy: number): void {
    const barW = 120;
    const barH = 8;
    const x = w / 2 - barW / 2;
    const y = h * 0.74 - 20;

    ctx.fillStyle = '#a00';
    ctx.font = '9px monospace';
    ctx.fillText('TARGET', x, y - 2);

    ctx.fillStyle = 'rgba(50, 0, 0, 0.5)';
    ctx.fillRect(x, y, barW, barH);

    const fill = Math.max(0, Math.min(1, energy / 100));
    ctx.fillStyle = '#f00';
    ctx.fillRect(x + 1, y + 1, (barW - 2) * fill, barH - 2);

    ctx.strokeStyle = '#a00';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barW, barH);
  }

  private drawRadar(
    w: number,
    h: number,
    ctx: CanvasRenderingContext2D,
    target?: RadarTarget
  ): void {
    const radarSize = 75;
    const cx = w - radarSize - 25;
    const cy = h - radarSize - 28;

    // Background
    ctx.fillStyle = 'rgba(0, 25, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(cx, cy, radarSize, 0, Math.PI * 2);
    ctx.fill();

    // Sweep effect
    const sweepAngle = (Date.now() * 0.002) % (Math.PI * 2);
    const sweepGrad = ctx.createConicGradient(sweepAngle, cx, cy);
    sweepGrad.addColorStop(0, 'rgba(0, 100, 0, 0.15)');
    sweepGrad.addColorStop(0.1, 'rgba(0, 40, 0, 0)');
    sweepGrad.addColorStop(1, 'rgba(0, 40, 0, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radarSize, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#0a0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radarSize, 0, Math.PI * 2);
    ctx.stroke();

    // Cross
    ctx.strokeStyle = 'rgba(0, 80, 0, 0.5)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - radarSize, cy);
    ctx.lineTo(cx + radarSize, cy);
    ctx.moveTo(cx, cy - radarSize);
    ctx.lineTo(cx, cy + radarSize);
    ctx.stroke();

    // Range rings
    ctx.beginPath();
    ctx.arc(cx, cy, radarSize * 0.33, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, radarSize * 0.66, 0, Math.PI * 2);
    ctx.stroke();

    // Player dot
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Enemy blip
    if (target) {
      const radarRange = 1500;
      const rx = (target.relativePosition.x / radarRange) * radarSize;
      const ry = (target.relativePosition.z / radarRange) * radarSize;

      const dist = Math.sqrt(rx * rx + ry * ry);
      const maxR = radarSize - 4;
      let bx = rx;
      let by = ry;
      if (dist > maxR) {
        bx = (rx / dist) * maxR;
        by = (ry / dist) * maxR;
      }

      // Pulsing blip
      const pulse = 3 + Math.sin(Date.now() * 0.008) * 1.5;
      ctx.fillStyle = '#f00';
      ctx.beginPath();
      ctx.arc(cx + bx, cy + by, pulse, 0, Math.PI * 2);
      ctx.fill();

      // Height stalk
      const heightLine = Math.max(-radarSize * 0.4, Math.min(radarSize * 0.4,
        (-target.relativePosition.y / radarRange) * radarSize
      ));
      if (Math.abs(heightLine) > 2) {
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + bx, cy + by);
        ctx.lineTo(cx + bx, cy + by + heightLine);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + bx - 2, cy + by + heightLine);
        ctx.lineTo(cx + bx + 2, cy + by + heightLine);
        ctx.stroke();
      }
    }

    // Label
    ctx.fillStyle = '#0a0';
    ctx.font = '10px monospace';
    ctx.fillText('RADAR', cx - 18, cy - radarSize - 6);
  }

  private drawScoreboard(w: number, _h: number, ctx: CanvasRenderingContext2D, kills: number, deaths: number): void {
    ctx.fillStyle = '#0f0';
    ctx.font = '13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`KILLS: ${kills}`, w - 20, 25);
    ctx.fillStyle = '#f44';
    ctx.fillText(`DEATHS: ${deaths}`, w - 20, 40);
    ctx.textAlign = 'left';
  }
}
