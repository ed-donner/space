export interface KeyState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
}

export class InputManager {
  keys: KeyState = {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false,
  };

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.setKey(e.code, true);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.setKey(e.code, false);
  };

  private setKey(code: string, pressed: boolean): void {
    switch (code) {
      case 'ArrowUp':
        this.keys.up = pressed;
        break;
      case 'ArrowDown':
        this.keys.down = pressed;
        break;
      case 'ArrowLeft':
        this.keys.left = pressed;
        break;
      case 'ArrowRight':
        this.keys.right = pressed;
        break;
      case 'Space':
        this.keys.fire = pressed;
        break;
    }
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
