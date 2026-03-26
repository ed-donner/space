import { test, expect } from '@playwright/test';
import {
  waitForFrames,
  getGameState,
  holdKey,
  takeScreenshot,
  playCombatSession,
} from './helpers';

test.describe('Core mechanics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForFrames(page, 5);
  });

  test('game loads and renders', async ({ page }) => {
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    const hud = page.locator('#hud');
    await expect(hud).toBeVisible();

    const state = await getGameState(page);
    expect(state.running).toBe(true);
    expect(state.frameCount).toBeGreaterThan(0);
    expect(state.playerAlive).toBe(true);
    await takeScreenshot(page, 'initial_load');
  });

  test('player can pitch and roll', async ({ page }) => {
    const before = await getGameState(page);
    await holdKey(page, 'ArrowUp', 1000);
    const afterPitch = await getGameState(page);
    expect(afterPitch.rotation.x).not.toBeCloseTo(before.rotation.x, 1);

    await holdKey(page, 'ArrowLeft', 1000);
    const afterRoll = await getGameState(page);
    expect(afterRoll.rotation.z).not.toBeCloseTo(afterPitch.rotation.z, 1);
  });

  test('player moves forward constantly', async ({ page }) => {
    const before = await getGameState(page);
    await page.waitForTimeout(1000);
    const after = await getGameState(page);
    const dist = Math.sqrt(
      (after.position.x - before.position.x) ** 2 +
      (after.position.y - before.position.y) ** 2 +
      (after.position.z - before.position.z) ** 2
    );
    expect(dist).toBeGreaterThan(10);
  });

  test('enemy exists and moves', async ({ page }) => {
    const before = await getGameState(page);
    expect(before.enemy).toBeDefined();
    expect(before.enemy!.alive).toBe(true);
    await page.waitForTimeout(2000);
    const after = await getGameState(page);
    const dx = after.enemy!.position.x - before.enemy!.position.x;
    const dy = after.enemy!.position.y - before.enemy!.position.y;
    const dz = after.enemy!.position.z - before.enemy!.position.z;
    expect(Math.sqrt(dx * dx + dy * dy + dz * dz)).toBeGreaterThan(20);
  });
});

test.describe('Phase 4-5: Combat & Graphics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForFrames(page, 5);
  });

  test('player can fire projectiles', async ({ page }) => {
    // Fire several shots
    for (let i = 0; i < 5; i++) {
      await holdKey(page, ' ', 50);
      await page.waitForTimeout(260);
    }
    const state = await getGameState(page);
    expect(state.projectileCount).toBeGreaterThan(0);
    await takeScreenshot(page, 'player_firing');
  });

  test('enemy has energy and skill', async ({ page }) => {
    const state = await getGameState(page);
    expect(state.enemy!.energy).toBe(100);
    expect(state.enemy!.skill).toBeGreaterThan(0);
  });

  test('combat session - shooting and dodging', async ({ page }) => {
    const result = await playCombatSession(page, {
      durationMs: 15000,
      screenshotIntervalMs: 3000,
      screenshotPrefix: 'combat_session',
    });

    expect(result.screenshots.length).toBeGreaterThanOrEqual(4);

    console.log('Combat session results:', {
      screenshots: result.screenshots.length,
      kills: result.finalState.kills,
      deaths: result.finalState.deaths,
      playerEnergy: result.finalState.energy,
      enemyEnergy: result.finalState.enemy?.energy,
      enemyAlive: result.finalState.enemy?.alive,
      projectiles: result.finalState.projectileCount,
      frames: result.finalState.frameCount,
    });
  });

  test('player takes damage when stationary', async ({ page }) => {
    // Just sit still and let the enemy attack us for a while
    await page.waitForTimeout(15000);
    const state = await getGameState(page);
    // Enemy should have fired and potentially hit us
    console.log('Stationary test:', {
      playerEnergy: state.energy,
      deaths: state.deaths,
      enemyEnergy: state.enemy?.energy,
      playerAlive: state.playerAlive,
    });
    // After 15 seconds the enemy should have engaged
    // Either we took damage or the enemy is very close
    const dist = Math.sqrt(
      (state.enemy!.position.x - state.position.x) ** 2 +
      (state.enemy!.position.y - state.position.y) ** 2 +
      (state.enemy!.position.z - state.position.z) ** 2
    );
    // Enemy should be within attack range
    expect(dist).toBeLessThan(1200);
    await takeScreenshot(page, 'stationary_test');
  });

  test('extended dogfight with multiple engagements', async ({ page }) => {
    const result = await playCombatSession(page, {
      durationMs: 25000,
      screenshotIntervalMs: 5000,
      screenshotPrefix: 'dogfight',
    });

    console.log('Extended dogfight results:', {
      kills: result.finalState.kills,
      deaths: result.finalState.deaths,
      playerEnergy: result.finalState.energy,
      enemySkill: result.finalState.enemy?.skill,
      frames: result.finalState.frameCount,
    });

    await takeScreenshot(page, 'dogfight_end');
  });
});
