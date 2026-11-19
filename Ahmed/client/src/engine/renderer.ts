import * as THREE from "three";

/**
 * 3D engine setup only: renderer, camera, light, sky colour and a flat placeholder ground.
 * The island map and characters are added later from /assets.
 */
export function createEngine(container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87b8d8);
  scene.fog = new THREE.Fog(0x87b8d8, 60, 400);

  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 2000);
  camera.position.set(0, 1.7, 0);

  scene.add(new THREE.HemisphereLight(0xbfe3ff, 0x6b5a3a, 0.8));
  const sun = new THREE.DirectionalLight(0xffe0b0, 2);
  sun.position.set(-100, 120, -80);
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: 0x5a7d4a }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  scene.add(new THREE.GridHelper(400, 80, 0x2f4a2a, 0x2f4a2a));

  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  return { renderer, scene, camera };
}
