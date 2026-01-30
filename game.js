const canvas = document.getElementById("sheet");
const ctx = canvas.getContext("2d");

const powerInput = document.getElementById("power");
const curlInput = document.getElementById("curl");
const angleInput = document.getElementById("angle");
const throwButton = document.getElementById("throwStone");
const sweepButton = document.getElementById("sweep");
const resetEndButton = document.getElementById("resetEnd");
const scoreEndButton = document.getElementById("scoreEnd");
const newGameButton = document.getElementById("newGame");

const currentTeamLabel = document.getElementById("currentTeam");
const stonesLeftLabel = document.getElementById("stonesLeft");
const shotNumberLabel = document.getElementById("shotNumber");
const endNumberLabel = document.getElementById("endNumber");

const speedLabel = document.getElementById("speed");
const spinLabel = document.getElementById("spin");
const distanceLabel = document.getElementById("distance");
const sweepStatusLabel = document.getElementById("sweepStatus");

const scoreLabels = [
  document.getElementById("scoreTeam0"),
  document.getElementById("scoreTeam1"),
];
const teamCards = document.querySelectorAll(".team-card");

const rink = {
  left: 90,
  right: canvas.width - 90,
  top: 50,
  bottom: canvas.height - 40,
  houseCenter: {
    x: canvas.width / 2,
    y: 190,
  },
  hack: {
    x: canvas.width / 2,
    y: canvas.height - 90,
  },
};

const teamData = [
  { name: "Aurora", color: "#5ad1ff", accent: "#8ee4ff" },
  { name: "Frostbite", color: "#ff6b9f", accent: "#ffd6e4" },
];

const gameState = {
  stones: [],
  currentTeam: 0,
  currentShot: 0,
  totalShots: 16,
  stonesPerTeam: 8,
  endNumber: 1,
  scores: [0, 0],
  sweeping: false,
  distanceTraveled: 0,
};

const frictionBase = 0.992;
const frictionSweep = 0.996;
const dt = 1;

let dragStart = null;

function createStone(team, speed, angleRad, curl) {
  return {
    team,
    x: rink.hack.x,
    y: rink.hack.y,
    vx: speed * Math.cos(angleRad),
    vy: speed * Math.sin(angleRad),
    radius: 14,
    spin: curl,
    active: true,
  };
}

function drawSheet() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, rink.bottom, 0, rink.top);
  gradient.addColorStop(0, "#0b1c34");
  gradient.addColorStop(1, "#1a3a68");
  ctx.fillStyle = gradient;
  ctx.fillRect(rink.left, rink.top, rink.right - rink.left, rink.bottom - rink.top);

  ctx.strokeStyle = "rgba(207, 227, 255, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(rink.left, rink.top, rink.right - rink.left, rink.bottom - rink.top);

  drawHouse();
  drawLines();
}

function drawHouse() {
  const { x, y } = rink.houseCenter;
  const rings = [70, 50, 30, 12];
  const colors = ["#c41c3b", "#ffffff", "#2564ff", "#ffffff"];
  rings.forEach((radius, index) => {
    ctx.beginPath();
    ctx.fillStyle = colors[index];
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawLines() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(rink.left, rink.top + 150);
  ctx.lineTo(rink.right, rink.top + 150);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(rink.left, rink.bottom - 120);
  ctx.lineTo(rink.right, rink.bottom - 120);
  ctx.stroke();

  ctx.beginPath();
  ctx.setLineDash([8, 8]);
  ctx.moveTo(canvas.width / 2, rink.top);
  ctx.lineTo(canvas.width / 2, rink.bottom);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawStones() {
  gameState.stones.forEach((stone) => {
    ctx.beginPath();
    ctx.fillStyle = teamData[stone.team].color;
    ctx.arc(stone.x, stone.y, stone.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = teamData[stone.team].accent;
    ctx.arc(stone.x, stone.y, stone.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function drawAimGuide() {
  if (isStoneMoving()) {
    return;
  }
  const power = Number(powerInput.value);
  const angle = (Number(angleInput.value) * Math.PI) / 180;
  const baseAngle = -Math.PI / 2 + angle;
  const length = 60 + power * 1.5;

  ctx.strokeStyle = "rgba(74, 195, 255, 0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rink.hack.x, rink.hack.y);
  ctx.lineTo(
    rink.hack.x + Math.cos(baseAngle) * length,
    rink.hack.y + Math.sin(baseAngle) * length
  );
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = "rgba(74, 195, 255, 0.8)";
  ctx.arc(rink.hack.x, rink.hack.y, 8, 0, Math.PI * 2);
  ctx.fill();
}

function updatePhysics() {
  const friction = gameState.sweeping ? frictionSweep : frictionBase;

  gameState.stones.forEach((stone) => {
    if (!stone.active) {
      return;
    }

    const speed = Math.hypot(stone.vx, stone.vy);
    if (speed < 0.02) {
      stone.vx = 0;
      stone.vy = 0;
      stone.active = false;
      return;
    }

    const curlFactor = stone.spin * 0.00004;
    if (curlFactor !== 0) {
      const normX = -stone.vy / speed;
      const normY = stone.vx / speed;
      stone.vx += normX * curlFactor * dt * speed;
      stone.vy += normY * curlFactor * dt * speed;
    }

    stone.vx *= friction;
    stone.vy *= friction;

    stone.x += stone.vx * dt;
    stone.y += stone.vy * dt;

    gameState.distanceTraveled += speed * 0.02;

    if (stone.x - stone.radius < rink.left) {
      stone.x = rink.left + stone.radius;
      stone.vx *= -0.6;
    }
    if (stone.x + stone.radius > rink.right) {
      stone.x = rink.right - stone.radius;
      stone.vx *= -0.6;
    }
    if (stone.y - stone.radius < rink.top) {
      stone.y = rink.top + stone.radius;
      stone.vy *= -0.6;
    }
    if (stone.y + stone.radius > rink.bottom) {
      stone.y = rink.bottom - stone.radius;
      stone.vy *= -0.6;
    }
  });

  resolveCollisions();
}

function resolveCollisions() {
  for (let i = 0; i < gameState.stones.length; i += 1) {
    for (let j = i + 1; j < gameState.stones.length; j += 1) {
      const a = gameState.stones[i];
      const b = gameState.stones[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius;

      if (dist > 0 && dist < minDist) {
        const nx = dx / dist;
        const ny = dy / dist;

        const overlap = minDist - dist;
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;

        const relVelX = a.vx - b.vx;
        const relVelY = a.vy - b.vy;
        const velAlongNormal = relVelX * nx + relVelY * ny;

        if (velAlongNormal > 0) {
          continue;
        }

        const restitution = 0.9;
        const impulse = (-1 * (1 + restitution) * velAlongNormal) / 2;
        const impulseX = impulse * nx;
        const impulseY = impulse * ny;

        a.vx += -impulseX;
        a.vy += -impulseY;
        b.vx += impulseX;
        b.vy += impulseY;
        a.active = true;
        b.active = true;
      }
    }
  }
}

function updateTelemetry() {
  const movingStone = gameState.stones.find((stone) => stone.active);
  if (movingStone) {
    const speed = Math.hypot(movingStone.vx, movingStone.vy);
    speedLabel.textContent = `${speed.toFixed(2)} m/s`;
    spinLabel.textContent = `${movingStone.spin.toFixed(1)} rad/s`;
  } else {
    speedLabel.textContent = `0.00 m/s`;
    spinLabel.textContent = `${Number(curlInput.value).toFixed(1)} rad/s`;
  }
  distanceLabel.textContent = `${gameState.distanceTraveled.toFixed(1)} m`;
  sweepStatusLabel.textContent = gameState.sweeping ? "On" : "Off";
}

function updateUI() {
  currentTeamLabel.textContent = teamData[gameState.currentTeam].name;
  const stonesRemaining =
    gameState.stonesPerTeam -
    gameState.stones.filter((stone) => stone.team === gameState.currentTeam).length;
  stonesLeftLabel.textContent = stonesRemaining;
  shotNumberLabel.textContent = gameState.currentShot + 1;
  endNumberLabel.textContent = gameState.endNumber;

  teamCards.forEach((card, index) => {
    card.classList.toggle("active", index === gameState.currentTeam);
  });
}

function isStoneMoving() {
  return gameState.stones.some((stone) => stone.active);
}

function throwStone() {
  if (isStoneMoving()) {
    return;
  }
  if (gameState.currentShot >= gameState.totalShots) {
    return;
  }

  const power = Number(powerInput.value);
  const angle = (Number(angleInput.value) * Math.PI) / 180;
  const curl = Number(curlInput.value);
  const speed = 0.08 + power * 0.065;
  const baseAngle = -Math.PI / 2 + angle;

  const stone = createStone(gameState.currentTeam, speed, baseAngle, curl);
  gameState.stones.push(stone);
  gameState.currentShot += 1;
  gameState.currentTeam = gameState.currentShot % 2;
  gameState.distanceTraveled = 0;
  updateUI();
}

function resetEnd() {
  gameState.stones = [];
  gameState.currentShot = 0;
  gameState.currentTeam = gameState.endNumber % 2;
  gameState.distanceTraveled = 0;
  updateUI();
}

function resetMatch() {
  gameState.endNumber = 1;
  gameState.scores = [0, 0];
  scoreLabels.forEach((label, index) => {
    label.textContent = gameState.scores[index];
  });
  resetEnd();
}

function scoreEnd() {
  if (isStoneMoving()) {
    return;
  }
  const scoredTeam = calculateScore();
  if (scoredTeam.team !== null) {
    gameState.scores[scoredTeam.team] += scoredTeam.points;
    scoreLabels.forEach((label, index) => {
      label.textContent = gameState.scores[index];
    });
  }
  gameState.endNumber += 1;
  resetEnd();
}

function calculateScore() {
  const stones = gameState.stones.map((stone) => ({
    team: stone.team,
    dist: Math.hypot(stone.x - rink.houseCenter.x, stone.y - rink.houseCenter.y),
  }));
  if (stones.length === 0) {
    return { team: null, points: 0 };
  }
  stones.sort((a, b) => a.dist - b.dist);
  const leadingTeam = stones[0].team;
  const opponentClosest = stones.find((stone) => stone.team !== leadingTeam);
  const opponentDist = opponentClosest ? opponentClosest.dist : Infinity;

  const points = stones.filter(
    (stone) => stone.team === leadingTeam && stone.dist < opponentDist
  ).length;

  return { team: leadingTeam, points };
}

function animate() {
  drawSheet();
  updatePhysics();
  drawAimGuide();
  drawStones();
  updateTelemetry();
  requestAnimationFrame(animate);
}

function handleSweep(state) {
  gameState.sweeping = state;
  sweepStatusLabel.textContent = state ? "On" : "Off";
}

throwButton.addEventListener("click", throwStone);
resetEndButton.addEventListener("click", resetEnd);
scoreEndButton.addEventListener("click", scoreEnd);
newGameButton.addEventListener("click", resetMatch);

sweepButton.addEventListener("mousedown", () => handleSweep(true));
sweepButton.addEventListener("mouseup", () => handleSweep(false));
sweepButton.addEventListener("mouseleave", () => handleSweep(false));

sweepButton.addEventListener("touchstart", () => handleSweep(true));
sweepButton.addEventListener("touchend", () => handleSweep(false));

canvas.addEventListener("mousedown", (event) => {
  const rect = canvas.getBoundingClientRect();
  dragStart = { x: event.clientX - rect.left, y: event.clientY - rect.top };
});

canvas.addEventListener("mousemove", (event) => {
  if (!dragStart || isStoneMoving()) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  const dx = current.x - rink.hack.x;
  const dy = current.y - rink.hack.y;
  const angle = Math.atan2(dy, dx) + Math.PI / 2;
  const angleDeg = Math.max(-40, Math.min(40, (angle * 180) / Math.PI));
  angleInput.value = angleDeg.toFixed(0);

  const distance = Math.min(180, Math.hypot(dx, dy));
  const power = Math.max(15, Math.min(100, distance));
  powerInput.value = power.toFixed(0);
});

canvas.addEventListener("mouseup", () => {
  dragStart = null;
});

canvas.addEventListener("mouseleave", () => {
  dragStart = null;
});

updateUI();
animate();
