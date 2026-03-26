import { test, expect } from '@playwright/test';
import {
  waitForFrames,
  getGameState,
  holdKey,
  takeScreenshot,
} from './helpers';

// Play 5 full games for Phase 6 analysis
for (let gameNum = 1; gameNum <= 5; gameNum++) {
  test(`Phase 6 - Game ${gameNum}`, async ({ page }) => {
    await page.goto('/');
    await waitForFrames(page, 5);

    const gameDuration = 20000; // 20 seconds per game
    const startTime = Date.now();
    let screenshotIdx = 0;
    let lastScreenshot = 0;

    // Combat-oriented maneuvers - alternate between chasing and evasion
    while (Date.now() - startTime < gameDuration) {
      const elapsed = Date.now() - startTime;
      const state = await getGameState(page);

      // Take screenshot every 5 seconds
      if (Date.now() - lastScreenshot > 5000) {
        await takeScreenshot(page, `phase6_game${gameNum}_${screenshotIdx++}`);
        lastScreenshot = Date.now();
      }

      // Decide action based on game state
      if (!state.playerAlive) {
        // Wait for respawn
        await page.waitForTimeout(500);
        continue;
      }

      // Mix of combat maneuvers
      const phase = Math.floor(elapsed / 3000) % 4;
      switch (phase) {
        case 0:
          // Chase forward and fire
          await holdKey(page, 'ArrowUp', 300);
          await holdKey(page, ' ', 100);
          await page.waitForTimeout(50);
          await holdKey(page, ' ', 100);
          await page.waitForTimeout(50);
          await holdKey(page, ' ', 100);
          break;
        case 1:
          // Roll left and fire
          await holdKey(page, 'ArrowLeft', 400);
          await holdKey(page, ' ', 100);
          await holdKey(page, 'ArrowUp', 200);
          await holdKey(page, ' ', 100);
          break;
        case 2:
          // Aggressive: pitch down, fire burst
          await holdKey(page, 'ArrowDown', 300);
          for (let i = 0; i < 4; i++) {
            await holdKey(page, ' ', 80);
            await page.waitForTimeout(180);
          }
          break;
        case 3:
          // Roll right, pitch up, fire
          await holdKey(page, 'ArrowRight', 500);
          await holdKey(page, 'ArrowUp', 300);
          await holdKey(page, ' ', 100);
          await holdKey(page, ' ', 100);
          break;
      }
      await page.waitForTimeout(100);
    }

    // Final state and screenshot
    const finalState = await getGameState(page);
    await takeScreenshot(page, `phase6_game${gameNum}_final`);

    console.log(`\n=== Game ${gameNum} Results ===`);
    console.log(`  Kills: ${finalState.kills}`);
    console.log(`  Deaths: ${finalState.deaths}`);
    console.log(`  Player Energy: ${finalState.energy}`);
    console.log(`  Player Alive: ${finalState.playerAlive}`);
    console.log(`  Enemy Energy: ${finalState.enemy?.energy}`);
    console.log(`  Enemy Alive: ${finalState.enemy?.alive}`);
    console.log(`  Enemy Skill: ${finalState.enemy?.skill?.toFixed(2)}`);
    console.log(`  Frames: ${finalState.frameCount}`);

    // Game should have had some action
    expect(finalState.frameCount).toBeGreaterThan(500);
  });
}
