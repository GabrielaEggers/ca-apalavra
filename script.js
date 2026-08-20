// --- CONFIGURAÇÃO DA CENA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0c4ff);
scene.fog = new THREE.FogExp2(0xa0c4ff, 0.015);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// --- ILUMINAÇÃO REALISTA ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
sunLight.position.set(50, 80, 30);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 150;
const d = 40;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
scene.add(sunLight);

// --- TERRENO E OBSTÁCULOS ---
const groundGeo = new THREE.PlaneGeometry(200, 200, 64, 64);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a5a40, roughness: 0.9, metalness: 0.1 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const obstacles = [];

function createTree(x, z) {
  const group = new THREE.Group();
  
  // Tronco
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.6, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.9 })
  );
  trunk.position.y = 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // Copas
  const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.6 });
  for (let i = 0; i < 3; i++) {
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.2 - i * 0.4, 2.5, 8), leavesMat);
    leaves.position.y = 3.5 + i * 1.3;
    leaves.castShadow = true;
    group.add(leaves);
  }

  group.position.set(x, 0, z);
  scene.add(group);

  // Adiciona caixa de colisão para a árvore
  const box = new THREE.Box3().setFromObject(trunk);
  obstacles.push(box);
}

function createRock(x, z) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.5),
    new THREE.MeshStandardMaterial({ color: 0x6c757d, roughness: 0.8 })
  );
  rock.position.set(x, 0.8, z);
  rock.rotation.set(Math.random(), Math.random(), Math.random());
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);

  const box = new THREE.Box3().setFromObject(rock);
  obstacles.push(box);
}

// Gerar floresta e rochas
for (let i = 0; i < 35; i++) {
  const x = (Math.random() - 0.5) * 160;
  const z = (Math.random() - 0.5) * 160;
  if (Math.hypot(x, z) > 5) createTree(x, z);
}
for (let i = 0; i < 20; i++) {
  const x = (Math.random() - 0.5) * 160;
  const z = (Math.random() - 0.5) * 160;
  if (Math.hypot(x, z) > 5) createRock(x, z);
}

// --- PERSONAGEM EM TERCEIRA PESSOA ---
const playerGroup = new THREE.Group();

const bodyMesh = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.4, 1, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 })
);
bodyMesh.position.y = 0.9;
bodyMesh.castShadow = true;
playerGroup.add(bodyMesh);

scene.add(playerGroup);

// --- CONTROLES E FÍSICA ---
const keys = {};
let cameraAngleX = 0;
let cameraAngleY = 0.3;
let isLocked = false;

document.addEventListener('click', () => {
  document.body.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  isLocked = document.pointerLockElement === document.body;
});

document.addEventListener('mousemove', (e) => {
  if (!isLocked) return;
  cameraAngleX -= e.movementX * 0.003;
  cameraAngleY += e.movementY * 0.003;
  cameraAngleY = Math.max(0.1, Math.min(1.2, cameraAngleY)); // Limita inclinação
});

window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

let velocityY = 0;
const gravity = -20;
let isGrounded = true;

function updatePlayer(delta) {
  const moveSpeed = keys['shift'] ? 10 : 5;
  let moveX = 0;
  let moveZ = 0;

  if (keys['w']) moveZ -= 1;
  if (keys['s']) moveZ += 1;
  if (keys['a']) moveX -= 1;
  if (keys['d']) moveX += 1;

  // Direção relativa à rotação da câmera
  if (moveX !== 0 || moveZ !== 0) {
    const length = Math.hypot(moveX, moveZ);
    moveX /= length;
    moveZ /= length;

    const angle = cameraAngleX;
    const dx = (moveX * Math.cos(angle) + moveZ * Math.sin(angle)) * moveSpeed * delta;
    const dz = (-moveX * Math.sin(angle) + moveZ * Math.cos(angle)) * moveSpeed * delta;

    // Testar colisões nos obstáculos
    const nextPos = playerGroup.position.clone().add(new THREE.Vector3(dx, 0, dz));
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      nextPos.clone().add(new THREE.Vector3(0, 0.9, 0)),
      new THREE.Vector3(0.8, 1.8, 0.8)
    );

    let collided = false;
    for (const obs of obstacles) {
      if (playerBox.intersectsBox(obs)) {
        collided = true;
        break;
      }
    }

    if (!collided) {
      playerGroup.position.x += dx;
      playerGroup.position.z += dz;
      playerGroup.rotation.y = angle + Math.atan2(moveX, moveZ) + Math.PI;
    }
  }

  // Pulo e Gravidade
  if (keys[' '] && isGrounded) {
    velocityY = 8;
    isGrounded = false;
  }

  velocityY += gravity * delta;
  playerGroup.position.y += velocityY * delta;

  if (playerGroup.position.y <= 0) {
    playerGroup.position.y = 0;
    velocityY = 0;
    isGrounded = true;
  }

  // Câmera Orbital
  const cameraDistance = 6;
  camera.position.x = playerGroup.position.x + cameraDistance * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
  camera.position.y = playerGroup.position.y + 1.5 + cameraDistance * Math.sin(cameraAngleY);
  camera.position.z = playerGroup.position.z + cameraDistance * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);
  camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.2, playerGroup.position.z);
}

// --- LOOP DE RENDERIZAÇÃO ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  updatePlayer(delta);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();