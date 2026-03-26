import type { Page } from '@playwright/test';

export interface GameState {
  frameCount: number;
  energy: number;
  kills: number;
  deaths: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  running: boolean;
  playerAlive: boolean;
  enemy?: {
    position: { x: number; y: number; z: number };
    speed: number;
    energy: number;
    alive: boolean;
    skill: number;
  };
  projectileCount: number;
}

/** Wait until the game has rendered at least N frames */
export async function waitForFrames(page: Page, minFrames: number): Promise<void> {
  await page.waitForFunction(
    (n) => {
      const game = (window as unknown as Record<string, unknown>).__GAME__ as { getState(): { frameCount: number } } | undefined;
      return game && game.getState().frameCount >= n;
    },
    minFrames,
    { timeout: 10000 }
  );
}

/** Get current game state */
export async function getGameState(page: Page): Promise<GameState> {
  return page.evaluate(() => {
    const game = (window as unknown as Record<string, unknown>).__GAME__ as { getState(): GameState } | undefined;
    if (!game) throw new Error('Game not found');
    return game.getState();
  });
}

/** Press and hold a key for a duration (ms) */
export async function holdKey(page: Page, key: string, durationMs: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(durationMs);
  await page.keyboard.up(key);
}

/** Take a named screenshot and save to screenshots/ */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

/** Simulate a sequence of player actions */
export interface GameAction {
  key: string;
  durationMs: number;
  pauseAfterMs?: number;
}

export async function playActions(page: Page, actions: GameAction[]): Promise<void> {
  for (const action of actions) {
    await holdKey(page, action.key, action.durationMs);
    if (action.pauseAfterMs) {
      await page.waitForTimeout(action.pauseAfterMs);
    }
  }
}

/** Play through an automated combat session */
export async function playCombatSession(
  page: Page,
  options: {
    durationMs?: number;
    screenshotIntervalMs?: number;
    screenshotPrefix?: string;
  } = {}
): Promise<{ screenshots: string[]; finalState: GameState }> {
  const {
    durationMs = 8000,
    screenshotIntervalMs = 2000,
    screenshotPrefix = 'combat',
  } = options;

  const screenshots: string[] = [];
  let screenshotIndex = 0;

  // Combat maneuvers: mix of movement and firing
  const maneuvers: GameAction[] = [
    { key: 'ArrowUp', durationMs: 500, pauseAfterMs: 100 },
    { key: ' ', durationMs: 100, pauseAfterMs: 100 },
    { key: ' ', durationMs: 100, pauseAfterMs: 100 },
    { key: ' ', durationMs: 100, pauseAfterMs: 100 },
    { key: 'ArrowLeft', durationMs: 600, pauseAfterMs: 100 },
    { key: ' ', durationMs: 100, pauseAfterMs: 100 },
    { key: 'ArrowDown', durationMs: 400, pauseAfterMs: 100 },
    { key: ' ', durationMs: 100, pauseAfterMs: 50 },
    { key: ' ', durationMs: 100, pauseAfterMs: 50 },
    { key: 'ArrowRight', durationMs: 800, pauseAfterMs: 100 },
    { key: ' ', durationMs: 100, pauseAfterMs: 100 },
    { key: 'ArrowUp', durationMs: 1000, pauseAfterMs: 100 },
    { key: ' ', durationMs: 100, pauseAfterMs: 50 },
    { key: ' ', durationMs: 100, pauseAfterMs: 50 },
    { key: ' ', durationMs: 100, pauseAfterMs: 200 },
    { key: 'ArrowLeft', durationMs: 400, pauseAfterMs: 100 },
  ];

  const startTime = Date.now();
  let lastScreenshot = 0;
  let actionIndex = 0;

  while (Date.now() - startTime < durationMs) {
    if (Date.now() - lastScreenshot >= screenshotIntervalMs) {
      const name = `${screenshotPrefix}_${screenshotIndex++}`;
      await takeScreenshot(page, name);
      screenshots.push(name);
      lastScreenshot = Date.now();
    }

    const action = maneuvers[actionIndex % maneuvers.length];
    actionIndex++;
    await holdKey(page, action.key, action.durationMs);
    if (action.pauseAfterMs) {
      await page.waitForTimeout(action.pauseAfterMs);
    }
  }

  const finalName = `${screenshotPrefix}_final`;
  await takeScreenshot(page, finalName);
  screenshots.push(finalName);

  const finalState = await getGameState(page);
  return { screenshots, finalState };
}

/** Legacy alias */
export const playAutomatedSession = playCombatSession;
