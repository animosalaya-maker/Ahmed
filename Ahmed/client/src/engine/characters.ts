import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/** Original low-poly soldier characters, built in code (no downloaded models). */
export type Headgear = "helmet" | "cap" | "beanie" | "hood";

export interface CharacterLook {
  id: string;
  name: string;
  skin: number;
  hair: number;
  shirt: number;
  pants: number;
  vest: number;
  boots: number;
  accent: number;
  headgear: Headgear;
  gear: number;
}

export const CHARACTERS: CharacterLook[] = [
  { id: "falcon", name: "الصقر", skin: 0xc68a5e, hair: 0x2b1a10, shirt: 0xb89a6a, pants: 0x8a7550, vest: 0x6b5a3a, boots: 0x3a2a1a, accent: 0xffcf4a, headgear: "helmet", gear: 0x7d6a45 },
  { id: "wave", name: "الموج", skin: 0xe0b08a, hair: 0x1a1a1a, shirt: 0x2f4a6b, pants: 0x27384f, vest: 0x1d2a3a, boots: 0x15181d, accent: 0x4fb0ff, headgear: "cap", gear: 0x2a3644 },
  { id: "jungle", name: "الغابة", skin: 0x8d5a3b, hair: 0x120c08, shirt: 0x4f6b3a, pants: 0x3d5230, vest: 0x34442a, boots: 0x25201a, accent: 0x58d36b, headgear: "beanie", gear: 0x2f3d26 },
  { id: "volcano", name: "البركان", skin: 0xd9a77a, hair: 0x3a2416, shirt: 0x2a2a2e, pants: 0x323238, vest: 0x1c1c20, boots: 0x111114, accent: 0xff6a3a, headgear: "hood", gear: 0x3a2020 },
];

const mat = (color: number, rough = 0.85, metal = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, flatShading: true });
const box = (w: number, h: number, d: number, m: THREE.Material, r = 0.04) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), m);
const cap = (r: number, len: number, m: THREE.Material) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 3, 8), m);

export interface Character {
  root: THREE.Group;
  look: CharacterLook;
  parts: { hips: THREE.Group; torso: THREE.Group; head: THREE.Group; legL: THREE.Group; legR: THREE.Group; armL: THREE.Group; armR: THREE.Group };
}

function limb(upper: THREE.Material, lower: THREE.Material, end: THREE.Material, len: number, r: number, endSize: [number, number, number], endOffZ: number) {
  const g = new THREE.Group();
  const a = cap(r, len * 0.42, upper); a.position.y = -len * 0.25; g.add(a);
  const b = cap(r * 0.92, len * 0.42, lower); b.position.y = -len * 0.72; g.add(b);
  const e = box(...endSize, end, 0.03); e.position.set(0, -len - endSize[1] * 0.3, endOffZ); g.add(e);
  return g;
}

export function createCharacter(look: CharacterLook): Character {
  const M = {
    skin: mat(look.skin, 0.7), hair: mat(look.hair), shirt: mat(look.shirt), pants: mat(look.pants), vest: mat(look.vest),
    boots: mat(look.boots), gear: mat(look.gear), accent: mat(look.accent, 0.5), dark: mat(0x1a1c1f, 0.5, 0.3),
    metal: mat(0x2a2d30, 0.45, 0.6), eye: new THREE.MeshBasicMaterial({ color: 0x111111 }), lens: mat(0x6fd3ff, 0.1, 0.8),
  };
  const root = new THREE.Group();
  const hips = new THREE.Group(); hips.position.y = 0.95; root.add(hips);
  const pelvis = box(0.42, 0.2, 0.26, M.pants); hips.add(pelvis);
  const belt = box(0.44, 0.06, 0.28, M.dark, 0.02); belt.position.y = 0.09; hips.add(belt);

  // legs
  const legL = limb(M.pants, M.pants, M.boots, 0.82, 0.085, [0.16, 0.14, 0.28], 0.05); legL.position.set(-0.11, -0.06, 0); hips.add(legL);
  const legR = limb(M.pants, M.pants, M.boots, 0.82, 0.085, [0.16, 0.14, 0.28], 0.05); legR.position.set(0.11, -0.06, 0); hips.add(legR);
  const holster = box(0.08, 0.16, 0.12, M.gear); holster.position.set(0.05, -0.2, 0); legR.add(holster);
  const knee = box(0.15, 0.1, 0.06, M.gear, 0.02); knee.position.set(0, -0.48, 0.08); legL.add(knee);
  const knee2 = knee.clone(); legR.add(knee2);

  // torso
  const torso = new THREE.Group(); torso.position.y = 0.12; hips.add(torso);
  const chest = box(0.48, 0.56, 0.28, M.shirt, 0.08); chest.position.y = 0.3; torso.add(chest);
  const vest = box(0.52, 0.42, 0.33, M.vest, 0.06); vest.position.y = 0.3; torso.add(vest);
  for (let i = 0; i < 3; i++) { const p = box(0.12, 0.13, 0.07, M.gear, 0.02); p.position.set(-0.16 + i * 0.16, 0.2, 0.18); torso.add(p); }
  const radio = box(0.07, 0.14, 0.05, M.dark, 0.015); radio.position.set(-0.2, 0.44, 0.17); torso.add(radio);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 4), M.dark); ant.position.set(-0.22, 0.58, 0.17); torso.add(ant);
  const badge = box(0.08, 0.05, 0.02, M.accent, 0.01); badge.position.set(0.15, 0.42, 0.175); torso.add(badge);
  const pack = box(0.38, 0.44, 0.18, M.gear, 0.06); pack.position.set(0, 0.32, -0.24); torso.add(pack);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 8), M.accent); roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.58, -0.24); torso.add(roll);
  const neck = cap(0.07, 0.05, M.skin); neck.position.y = 0.62; torso.add(neck);

  // arms
  const armL = limb(M.shirt, M.shirt, M.dark, 0.6, 0.075, [0.11, 0.12, 0.11], 0); armL.position.set(-0.32, 0.52, 0); torso.add(armL);
  const armR = limb(M.shirt, M.shirt, M.dark, 0.6, 0.075, [0.11, 0.12, 0.11], 0); armR.position.set(0.32, 0.52, 0); torso.add(armR);
  for (const a of [armL, armR]) { const pad = box(0.17, 0.12, 0.17, M.vest, 0.04); pad.position.y = -0.02; a.add(pad); }

  // head
  const head = new THREE.Group(); head.position.y = 0.82; torso.add(head);
  const face = box(0.3, 0.32, 0.3, M.skin, 0.1); head.add(face);
  for (const s of [-1, 1]) { const e = box(0.045, 0.05, 0.02, M.eye, 0.01); e.position.set(0.07 * s, 0.02, 0.15); head.add(e);
    const brow = box(0.08, 0.02, 0.02, M.hair, 0.005); brow.position.set(0.07 * s, 0.07, 0.152); head.add(brow);
    const ear = box(0.04, 0.08, 0.06, M.skin, 0.015); ear.position.set(0.155 * s, 0, 0); head.add(ear); }
  const nose = box(0.05, 0.07, 0.05, M.skin, 0.015); nose.position.set(0, -0.03, 0.16); head.add(nose);
  const beard = box(0.24, 0.08, 0.06, M.hair, 0.03); beard.position.set(0, -0.13, 0.13); head.add(beard);

  if (look.headgear === "helmet") {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.gear); h.scale.set(1.05, 0.9, 1.1); h.position.y = 0.06; head.add(h);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 4, 12), M.gear); rim.rotation.x = Math.PI / 2; rim.scale.set(1.05, 1.1, 1); rim.position.y = 0.06; head.add(rim);
    const gog = box(0.24, 0.07, 0.05, M.dark, 0.02); gog.position.set(0, 0.15, 0.16); head.add(gog);
    for (const s of [-1, 1]) { const l = box(0.08, 0.05, 0.02, M.lens, 0.01); l.position.set(0.06 * s, 0.15, 0.19); head.add(l); }
  } else if (look.headgear === "cap") {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.vest); c.position.y = 0.08; c.scale.set(1, 0.7, 1.05); head.add(c);
    const brim = box(0.24, 0.025, 0.14, M.vest, 0.01); brim.position.set(0, 0.09, 0.2); head.add(brim);
    const logo = box(0.06, 0.04, 0.01, M.accent, 0.005); logo.position.set(0, 0.14, 0.17); head.add(logo);
    const hs = box(0.04, 0.09, 0.08, M.dark, 0.01); hs.position.set(-0.17, 0, 0); head.add(hs);
  } else if (look.headgear === "beanie") {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.175, 10, 6, 0, Math.PI * 2, 0, Math.PI / 1.9), M.vest); b.position.y = 0.05; head.add(b);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.06, 12), M.accent); band.position.y = 0.06; head.add(band);
    const paint = box(0.26, 0.04, 0.01, M.dark, 0.005); paint.position.set(0, 0.0, 0.153); head.add(paint);
  } else {
    const hood = box(0.36, 0.38, 0.36, M.vest, 0.14); hood.position.set(0, 0.04, -0.03); head.add(hood);
    face.position.z = 0.02;
    const mask = box(0.26, 0.12, 0.05, M.dark, 0.03); mask.position.set(0, -0.08, 0.18); head.add(mask);
    for (const s of [-1, 1]) { const g = box(0.03, 0.04, 0.02, M.accent, 0.005); g.position.set(0.09 * s, -0.08, 0.21); head.add(g); }
    beard.visible = false;
  }

  root.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return { root, look, parts: { hips, torso, head, legL, legR, armL, armR } };
}

/** Plays a simple procedural animation: idle breathing, walk, or run. */
export function animateCharacter(c: Character, t: number, speed: number): void {
  const { hips, torso, head, legL, legR, armL, armR } = c.parts;
  const s = Math.min(1, speed / 7);
  const f = 6 + 6 * s;
  const sw = Math.sin(t * f) * (0.15 + 0.6 * s);
  legL.rotation.x = sw;
  legR.rotation.x = -sw;
  armL.rotation.x = -sw * 0.8;
  armR.rotation.x = sw * 0.8;
  hips.position.y = 0.95 + Math.abs(Math.cos(t * f)) * 0.04 * s;
  torso.rotation.x = 0.12 * s;
  const breathe = Math.sin(t * 2) * 0.01 * (1 - s);
  torso.scale.set(1, 1 + breathe, 1);
  head.rotation.y = Math.sin(t * 0.7) * 0.15 * (1 - s);
}
