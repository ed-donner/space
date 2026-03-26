import { test, expect } from '@playwright/test';
import {
  waitForFrames,
  getGameState,
  holdKey,
  takeScreenshot,
} from './helpers';

for (let gameNum = 1; gameNum <= 3; gameNum++) {
  test(`Phase 7 - Final Game ${gameNum}`, async ({ page }) => {
    await page.goto('/');
    await waitForFrames(page, 5);

    const gameDuration = 25000;
    const startTime = Date.now();
    let screenshotIdx = 0;
    let lastScreenshot = 0;

    while (Date.now() - startTime < gameDuration) {
      const state = await getGameState(page);

      // Screenshot every 5 seconds
      if (Date.now() - lastScreenshot > 5000) {
        await takeScreenshot(page, `phase7_game${gameNum}_${screenshotIdx++}`);
        lastScreenshot = Date.now();
      }

      if (!state.playerAlive) {
        await page.waitForTimeout(500);
        continue;
      }

      // More sophisticated combat: mix of aggressive and defensive
      const elapsed = Date.now() - startTime;
      const phase = Math.floor(elapsed / 2500) % 6;
      switch (phase) {
        case 0: // Forward and fire burst
          await holdKey(page, 'ArrowUp', 400);
          for (let i = 0; i < 5; i++) {
            await holdKey(page, ' ', 60);
            await page.waitForTimeout(200);
          }
          break;
        case 1: // Roll left into attack
          await holdKey(page, 'ArrowLeft', 600);
          await holdKey(page, ' ', 80);
          await holdKey(page, 'ArrowUp', 300);
          await holdKey(page, ' ', 80);
          break;
        case 2: // Evasive - roll right, pitch down
          await holdKey(page, 'ArrowRight', 800);
          await holdKey(page, 'ArrowDown', 400);
          break;
        case 3: // Attack run - pitch up and fire
          await holdKey(page, 'ArrowUp', 600);
          for (let i = 0; i < 3; i++) {
            await holdKey(page, ' ', 80);
            await page.waitForTimeout(180);
          }
          break;
        case 4: // Hard roll and fire
          await holdKey(page, 'ArrowLeft', 300);
          await holdKey(page, 'ArrowRight', 300);
          await holdKey(page, ' ', 80);
          await holdKey(page, ' ', 80);
          break;
        case 5: // Steady approach and sustained fire
          for (let i = 0; i < 6; i++) {
            await holdKey(page, ' ', 60);
            await page.waitForTimeout(200);
          }
          break;
      }
      await page.waitForTimeout(50);
    }

    const finalState = await getGameState(page);
    await takeScreenshot(page, `phase7_game${gameNum}_final`);

    console.log(`\n=== Final Game ${gameNum} ===`);
    console.log(`  Kills: ${finalState.kills} | Deaths: ${finalState.deaths}`);
    console.log(`  Shield: ${finalState.energy}% | Player Alive: ${finalState.playerAlive}`);
    console.log(`  Enemy Energy: ${finalState.enemy?.energy}% | Enemy Alive: ${finalState.enemy?.alive}`);
    console.log(`  Enemy Skill: ${finalState.enemy?.skill?.toFixed(2)}`);
    console.log(`  Frames: ${finalState.frameCount}`);

    expect(finalState.frameCount).toBeGreaterThan(500);
  });
}
