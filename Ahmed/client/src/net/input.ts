import type { ClientInput } from "shared";

/** Collects keyboard and mouse input. Only intent is sent; the server decides the result. */
export class InputState {
  private keys = new Set<string>();
  yaw = 0;
  pitch = 0;
  fire = false;
  private seq = 0;

  constructor(target: HTMLElement) {
    addEventListener("keydown", (e) => this.keys.add(e.code));
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    target.addEventListener("click", () => { void target.requestPointerLock?.(); });
    addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== target) return;
      this.yaw -= e.movementX * 0.0025;
      this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch - e.movementY * 0.0025));
    });
    addEventListener("mousedown", () => (this.fire = true));
    addEventListener("mouseup", () => (this.fire = false));
  }

  private k(...codes: string[]) { return codes.some((c) => this.keys.has(c)); }

  sample(): ClientInput {
    return {
      t: "input",
      seq: this.seq++,
      mx: (this.k("KeyD", "ArrowRight") ? 1 : 0) - (this.k("KeyA", "ArrowLeft") ? 1 : 0),
      mz: (this.k("KeyW", "ArrowUp") ? 1 : 0) - (this.k("KeyS", "ArrowDown") ? 1 : 0),
      yaw: Math.atan2(Math.sin(this.yaw), Math.cos(this.yaw)),
      pitch: this.pitch,
      sprint: this.k("ShiftLeft", "ShiftRight"),
      crouch: this.k("KeyC", "ControlLeft"),
      jump: this.k("Space"),
      fire: this.fire,
    };
  }
}
