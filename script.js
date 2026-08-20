const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configurações do Jogador
const player = {
  x: 400,
  y: 300,
  size: 16,
  speed: 3,
  health: 100,
  hunger: 100,
  stamina: 100,
  wood: 0,
  stone: 0,
  food: 0,
  hasAxe: false
};

// Teclas pressionadas
const keys = {};

// Recursos espalhados pelo mapa
let resources = [];
const RESOURCE_TYPES = {
  WOOD: { color: '#8B4513', name: 'Madeira', size: 12 },
  STONE: { color: '#808080', name: 'Pedra', size: 10 },
  FOOD: { color: '#FF4500', name: 'Comida', size: 8 }
};

// Gerar recursos aleatórios no mapa
function spawnResources(count) {
  for (let i = 0; i < count; i++) {
    const types = [RESOURCE_TYPES.WOOD, RESOURCE_TYPES.STONE, RESOURCE_TYPES.FOOD];
    const type = types[Math.floor(Math.random() * types.length)];
    resources.push({
      x: Math.random() * (canvas.width - 40) + 20,
      y: Math.random() * (canvas.height - 40) + 20,
      type: type
    });
  }
}

// Inicialização de controles
window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// Atualização de movimento e mecânicas
function update() {
  if (player.health <= 0) return;

  // Movimento
  let isMoving = false;
  if ((keys['w'] || keys['arrowup']) && player.y > player.size) { player.y -= player.speed; isMoving = true; }
  if ((keys['s'] || keys['arrowdown']) && player.y < canvas.height - player.size) { player.y += player.speed; isMoving = true; }
  if ((keys['a'] || keys['arrowleft']) && player.x > player.size) { player.x -= player.speed; isMoving = true; }
  if ((keys['d'] || keys['arrowright']) && player.x < canvas.width - player.size) { player.x += player.speed; isMoving = true; }

  // Sistema de Fome e Vida
  if (isMoving) {
    player.hunger -= 0.02;
  } else {
    player.hunger -= 0.005;
  }

  if (player.hunger <= 0) {
    player.hunger = 0;
    player.health -= 0.05; // Perde vida se estiver com fome
  }

  // Coleta de Recursos por sobreposição
  resources.forEach((res, index) => {
    const dist = Math.hypot(player.x - res.x, player.y - res.y);
    if (dist < player.size + res.type.size) {
      const yieldAmount = player.hasAxe && res.type === RESOURCE_TYPES.WOOD ? 2 : 1;
      
      if (res.type === RESOURCE_TYPES.WOOD) player.wood += yieldAmount;
      if (res.type === RESOURCE_TYPES.STONE) player.stone += yieldAmount;
      if (res.type === RESOURCE_TYPES.FOOD) player.food += yieldAmount;

      resources.splice(index, 1);
      setTimeout(() => spawnResources(1), 3000); // Repõe recurso após 3s
    }
  });

  updateUI();
}

// Atualizar a Interface do Usuário (UI)
function updateUI() {
  document.getElementById('health-val').textContent = Math.max(0, Math.floor(player.health));
  document.getElementById('hunger-val').textContent = Math.max(0, Math.floor(player.hunger));
  document.getElementById('stamina-val').textContent = Math.floor(player.stamina);
  document.getElementById('wood-val').textContent = player.wood;
  document.getElementById('stone-val').textContent = player.stone;
  document.getElementById('food-val').textContent = player.food;
}

// Ações do painel de construção/consumo
function craftItem(item) {
  if (item === 'food' && player.food > 0) {
    player.food--;
    player.hunger = Math.min(100, player.hunger + 20);
  } else if (item === 'camp' && player.wood >= 10) {
    player.wood -= 10;
    player.health = Math.min(100, player.health + 40);
    alert("Você descansou no acampamento e recuperou vida!");
  } else if (item === 'axe' && player.wood >= 5 && player.stone >= 5 && !player.hasAxe) {
    player.wood -= 5;
    player.stone -= 5;
    player.hasAxe = true;
    alert("Machado criado! Agora você coleta o dobro de madeira.");
  }
}

// Renderização gráfica no Canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Desenhar Recursos
  resources.forEach(res => {
    ctx.beginPath();
    ctx.arc(res.x, res.y, res.type.size, 0, Math.PI * 2);
    ctx.fillStyle = res.type.color;
    ctx.fill();
    ctx.closePath();
  });

  // Desenhar Jogador
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fillStyle = player.health > 0 ? '#3b82f6' : '#888';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.closePath();

  // Tela de Game Over
  if (player.health <= 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ff4d4d';
    ctx.font = '30px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER - Você Morreu', canvas.width / 2, canvas.height / 2);
  }
}

// Loop Principal do Jogo
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Iniciar o jogo
spawnResources(15);
gameLoop();