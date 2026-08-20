// Configuração Básica da Cena 3D
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Céu azul
scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Iluminação
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 40, 20);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
scene.add(dirLight);

// Terreno
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x557a2b });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Criando o Personagem (Malha 3D de Robô/Humanoide Básico)
const playerGroup = new THREE.Group();

// Corpo
const bodyGeo = new THREE.CylinderGeometry(0.5, 0.3, 1.2, 8);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2196f3 });
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.y = 1;
body.castShadow = true;
playerGroup.add(body);

// Cabeça
const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa });
const head = new THREE.Mesh(headGeo, headMat);
head.position.y = 1.8;
head.castShadow = true;
playerGroup.add(head);

scene.add(playerGroup);

// Estado do Jogador
const stats = { health: 100, hunger: 100, wood: 0, stone: 0, food: 0 };
const keys = {};

// Gerador de Recursos no Mundo (Árvores, Pedras e Comida)
const resources = [];

function createTree(x, z) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.3, 2),
    new THREE.MeshStandardMaterial({ color: 0x5c4033 })
  );
  trunk.position.y = 1;
  trunk.castShadow = true;
  group.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 3, 8),
    new THREE.MeshStandardMaterial({ color: 0x2e8b57 })
  );
  leaves.position.y = 2.8;
  leaves.castShadow = true;
  group.add(leaves);

  group.position.set(x, 0, z);
  group.userData = { type: 'wood' };
  scene.add(group);
  resources.push(group);
}

function createRock(x, z) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.6),
    new THREE.MeshStandardMaterial({ color: 0x808080 })
  );
  rock.position.set(x, 0.4, z);
  rock.castShadow = true;
  rock.userData = { type: 'stone' };
  scene.add(rock);
  resources.push(rock);
}

function createFoodNode(x, z) {
  const food = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff4500 })
  );
  food.position.set(x, 0.4, z);
  food.castShadow = true;
  food.userData = { type: 'food' };
  scene.add(food);
  resources.push(food);
}

// Espalhar itens pelo terreno
for (let i = 0; i < 20; i++) {
  createTree((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80);
  createRock((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80);
  createFoodNode((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80);
}

// Controles
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
window.addEventListener('resize', onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Loop de Atualização
const speed = 0.15;
let walkCycle = 0;

function update() {
  if (stats.health <= 0) return;

  let moveX = 0;
  let moveZ = 0;

  if (keys['w'] || keys['arrowup']) moveZ -= 1;
  if (keys['s'] || keys['arrowdown']) moveZ += 1;
  if (keys['a'] || keys['arrowleft']) moveX -= 1;
  if (keys['d'] || keys['arrowright']) moveX += 1;

  if (moveX !== 0 || moveZ !== 0) {
    // Normalizar movimento diagonal
    const length = Math.hypot(moveX, moveZ);
    moveX /= length;
    moveZ /= length;

    playerGroup.position.x += moveX * speed;
    playerGroup.position.z += moveZ * speed;

    // Girar o personagem na direção do movimento
    const targetAngle = Math.atan2(moveX, moveZ);
    playerGroup.rotation.y = targetAngle;

    // Animação simples de caminhada (oscilação da cabeça/corpo)
    walkCycle += 0.2;
    body.position.y = 1 + Math.sin(walkCycle) * 0.05;

    // Gastar fome ao andar
    stats.hunger -= 0.03;
  } else {
    stats.hunger -= 0.01;
  }

  // Limite das bordas do mapa
  playerGroup.position.x = Math.max(-48, Math.min(48, playerGroup.position.x));
  playerGroup.position.z = Math.max(-48, Math.min(48, playerGroup.position.z));

  // Sistema de Fome e Vida
  if (stats.hunger <= 0) {
    stats.hunger = 0;
    stats.health -= 0.08;
  }

  // Coleta de Recursos por Aproximação
  for (let i = resources.length - 1; i >= 0; i--) {
    const res = resources[i];
    const dist = playerGroup.position.distanceTo(res.position);

    if (dist < 1.5) {
      const type = res.userData.type;
      if (type === 'wood') stats.wood++;
      if (type === 'stone') stats.stone++;
      if (type === 'food') {
        stats.food++;
        stats.hunger = Math.min(100, stats.hunger + 15); // Come automaticamente ao coletar comida
      }

      scene.remove(res);
      resources.splice(i, 1);
    }
  }

  // Atualização da Câmera em Terceira Pessoa (Segue o Personagem)
  camera.position.x = playerGroup.position.x;
  camera.position.y = playerGroup.position.y + 6;
  camera.position.z = playerGroup.position.z + 10;
  camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1, playerGroup.position.z);

  // Atualizar HUD
  document.getElementById('health-val').textContent = Math.max(0, Math.floor(stats.health));
  document.getElementById('hunger-val').textContent = Math.max(0, Math.floor(stats.hunger));
  document.getElementById('wood-val').textContent = stats.wood;
  document.getElementById('stone-val').textContent = stats.stone;
  document.getElementById('food-val').textContent = stats.food;
}

// Loop Principal
function animate() {
  requestAnimationFrame(animate);
  update();
  renderer.render(scene, camera);
}

animate();