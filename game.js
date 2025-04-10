const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const map = [
  "####################",
  "#..................#",
  "#..####............#",
  "#...........######.#",
  "#..........#.......#",
  "#..........#.......#",
  "#..........######..#",
  "#..................#",
  "#...#####..........#",
  "#..................#",
  "#..........######..#",
  "#..........#.......#",
  "#..........#.......#",
  "#...........######.#",
  "#..####............#",
  "#..................#",
  "####################"
];

const tileSize = 64;
const fov = Math.PI / 3;
const numRays = 160;

let player = {
  x: 100,
  y: 100,
  angle: 0,
  speed: 0,
  rotation: 0
};

// Carrega imagem do inimigo
const enemyImage = new Image();
enemyImage.src = "enemy.png"; // já está no seu projeto

const enemies = [];

function spawnEnemies(count) {
  while (enemies.length < count) {
    const mapX = Math.floor(Math.random() * map[0].length);
    const mapY = Math.floor(Math.random() * map.length);
    if (map[mapY][mapX] === '.') {
      const enemyX = mapX * tileSize + tileSize / 2;
      const enemyY = mapY * tileSize + tileSize / 2;

      // Evita spawn muito perto do jogador
      const dx = enemyX - player.x;
      const dy = enemyY - player.y;
      if (Math.hypot(dx, dy) > 200) {
        enemies.push({ x: enemyX, y: enemyY, hp: 100 });
      }
    }
  }
}

spawnEnemies(10); // você pode aumentar esse número pra mais inimigos

function drawEnemies() {
  enemies.forEach(enemy => {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const angleToEnemy = Math.atan2(dy, dx) - player.angle;
    const dist = Math.hypot(dx, dy);
    const size = 10000 / dist; // tamanho ajustado
    if (Math.abs(angleToEnemy) < fov / 2) {
      const screenX = (angleToEnemy + fov / 2) / fov * canvas.width;
      const imgSize = Math.max(size, 10);
      ctx.drawImage(enemyImage, screenX - imgSize / 2, canvas.height / 2 - imgSize, imgSize, imgSize);
    }
  });
}

function moveEnemies() {
  enemies.forEach(enemy => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 20) {
      enemy.x += (dx / dist) * 0.5;
      enemy.y += (dy / dist) * 0.5;
    }
  });
}

function damageEnemyInFront() {
  const threshold = 0.3;
  const range = 150;
  let target = enemies.find(enemy => {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    const diff = Math.abs(angle - player.angle);
    return dist < range && diff < threshold;
  });
  if (target) target.hp -= 50;
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].hp <= 0) enemies.splice(i, 1);
  }
}

function castRays() {
  const step = fov / numRays;
  const start = player.angle - fov / 2;
  for (let i = 0; i < numRays; i++) {
    let rayAngle = start + i * step;
    let distance = 0;
    let hit = false;
    while (!hit && distance < 800) {
      distance += 1;
      let rayX = player.x + Math.cos(rayAngle) * distance;
      let rayY = player.y + Math.sin(rayAngle) * distance;
      let mapX = Math.floor(rayX / tileSize);
      let mapY = Math.floor(rayY / tileSize);
      if (map[mapY] && map[mapY][mapX] === "#") {
        hit = true;
        const correctedDist = distance * Math.cos(rayAngle - player.angle);
        const height = 30000 / correctedDist;
        let brightness = Math.max(200 - distance, 50);
        ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
        ctx.fillRect(i * (canvas.width / numRays), canvas.height / 2 - height / 2, canvas.width / numRays + 1, height);
      }
    }
  }
}

function draw() {
  ctx.fillStyle = "#888";
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
  ctx.fillStyle = "#444";
  ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
  castRays();
  drawEnemies();
}

function update() {
  player.angle += player.rotation;
  const nextX = player.x + Math.cos(player.angle) * player.speed;
  const nextY = player.y + Math.sin(player.angle) * player.speed;
  if (map[Math.floor(player.y / tileSize)][Math.floor(nextX / tileSize)] !== "#") player.x = nextX;
  if (map[Math.floor(nextY / tileSize)][Math.floor(player.x / tileSize)] !== "#") player.y = nextY;
  moveEnemies();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function setupButton(id, onPress, onRelease) {
  const el = document.getElementById(id);
  el.addEventListener("touchstart", e => { e.preventDefault(); onPress(); });
  el.addEventListener("touchend", e => { e.preventDefault(); onRelease(); });
}

setupButton("forward", () => player.speed = 2, () => player.speed = 0);
setupButton("backward", () => player.speed = -2, () => player.speed = 0);
setupButton("left", () => player.rotation = -0.05, () => player.rotation = 0);
setupButton("right", () => player.rotation = 0.05, () => player.rotation = 0);

const gunSound = document.getElementById("gunSound");
const flash = document.getElementById("muzzleFlash");
const weapon = document.getElementById("weapon");
const fireBtn = document.getElementById("fireBtn");

fireBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  flash.style.opacity = 0.8;
  setTimeout(() => flash.style.opacity = 0, 80);
  weapon.classList.add("flash");
  gunSound.currentTime = 0;
  gunSound.play();
  damageEnemyInFront();
  setTimeout(() => weapon.classList.remove("flash"), 100);
});

loop();