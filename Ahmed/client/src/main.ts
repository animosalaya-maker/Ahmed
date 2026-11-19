import { TICK_RATE, type PlayerState } from "shared";
import { createEngine } from "./engine/renderer";
import { Connection } from "./net/connection";
import { InputState } from "./net/input";

const statusEl = document.getElementById("status")!;
const { renderer, scene, camera } = createEngine(document.body);
const input = new InputState(renderer.domElement);

const url = import.meta.env.VITE_SERVER_URL ?? "ws://localhost:8080/play";
const conn = new Connection(url, "لاعب");
let myId = "";
let me: PlayerState | undefined;

const STATUS = { connecting: "جارٍ الاتصال…", online: "متصل ✓", offline: "غير متصل" } as const;
conn.onStatus = (s) => (statusEl.textContent = STATUS[s]);
conn.onMessage = (m) => {
  if (m.t === "welcome") myId = m.id;
  else if (m.t === "snapshot") me = m.players.find((p) => p.id === myId);
  else if (m.t === "error") statusEl.textContent = m.message;
};
conn.open();

setInterval(() => conn.send(input.sample()), 1000 / TICK_RATE);

function frame() {
  if (me) camera.position.set(me.x, me.y + 1.7, me.z);
  camera.rotation.set(input.pitch, input.yaw, 0, "YXZ");
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
