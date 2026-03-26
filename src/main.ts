import { Game } from './game';

const app = document.getElementById('app')!;
const game = new Game(app);
game.start();

// Expose game instance for test harness
(window as unknown as Record<string, unknown>).__GAME__ = game;
