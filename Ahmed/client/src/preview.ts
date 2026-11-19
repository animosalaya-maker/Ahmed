import * as THREE from "three";
import { CHARACTERS, animateCharacter, createCharacter } from "./engine/characters";

const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
r.setPixelRatio(Math.min(2, devicePixelRatio));
r.setSize(innerWidth, innerHeight);
r.outputColorSpace = THREE.SRGBColorSpace;
r.toneMapping = THREE.ACESFilmicToneMapping;
r.toneMappingExposure = 1.35;
r.shadowMap.enabled = true;
r.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(r.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b8d8);
scene.fog = new THREE.Fog(0x87b8d8, 12, 40);
scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x7a6440, 1.1));
const sun = new THREE.DirectionalLight(0xffe3b8, 2.6);
sun.position.set(4, 8, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
scene.add(sun);
const fill = new THREE.DirectionalLight(0xdbeaff, 1.2); fill.position.set(-3, 3, 8); scene.add(fill);
const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: 0xe6cf8f, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x1f8fb0, roughness: 0.3 }));
sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.02, -40); scene.add(sea);

const cam = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 200);
cam.position.set(0, 1.9, 8.2); cam.lookAt(0, 1.15, 0);

const chars = CHARACTERS.map((look, i) => {
  const c = createCharacter(look);
  c.root.position.x = (i - 1.5) * 1.45;
  c.root.rotation.y = (i - 1.5) * -0.18;
  scene.add(c.root);
  return c;
});
const labels = document.getElementById("labels")!;
const els = chars.map((c) => {
  const d = document.createElement("div"); d.className = "lbl";
  d.innerHTML = `${c.look.name}`;
  d.style.color = "#" + c.look.accent.toString(16).padStart(6, "0");
  labels.appendChild(d); return d;
});

const clock = new THREE.Clock();
const walk = location.hash === "#walk";
function frame() {
  const t = clock.getElapsedTime();
  chars.forEach((c, i) => {
    animateCharacter(c, t + i * 0.7, walk ? (i % 2 ? 7 : 3) : 0);
    const p = c.root.position.clone(); p.y = 2.35; p.project(cam);
    els[i]!.style.left = ((p.x + 1) / 2) * innerWidth + "px";
    els[i]!.style.top = ((1 - p.y) / 2) * innerHeight - 30 + "px";
  });
  r.render(scene, cam);
  requestAnimationFrame(frame);
}
frame();
addEventListener("resize", () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); r.setSize(innerWidth, innerHeight); });
