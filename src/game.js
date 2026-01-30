import { Stone } from "./stone.js";
import { buildPhysics } from "./physics.js";
import { Sheet } from "./sheet.js";
import { calculateScore } from "./scoring.js";
import { InputController } from "./input.js";
import { CurlingAI } from "./ai.js";

export class Game {
  constructor(canvas, ui, controls) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    this.controls = controls;
    this.sheet = new Sheet(canvas);
    this.physics = buildPhysics();
    this.ai = new CurlingAI();
    this.state = this.createInitialState();
    this.input = new InputController(canvas, { ...ui, hackPosition: this.sheet.hack }, () => {
      this.updateSliderValues();
    });
    this.attachControls();
  }

  createInitialState() {
    return {
      stones: [],
      currentTeam: 0,
      currentShot: 0,
      stonesPerTeam: 8,
      endNumber: 1,
      totalEnds: Number(this.ui.endsSetting.value),
      scores: [0, 0],
      hammerTeam: 0,
      sweeping: false,
      distanceTraveled: 0,
      shotHistory: [],
      endHistory: [],
      aiThinking: false,
      lastShot: null,
    };
  }

  start() {
    this.updateUI();
    this.updateSliderValues();
    requestAnimationFrame(() => this.animate());
  }

  attachControls() {
    this.controls.throwButton.addEventListener("click", () => this.throwStone());
    this.controls.undoButton.addEventListener("click", () => this.undoShot());
    this.controls.resetEndButton.addEventListener("click", () => this.resetEnd());
    this.controls.scoreEndButton.addEventListener("click", () => this.scoreEnd());
    this.controls.newGameButton.addEventListener("click", () => this.resetMatch());

    this.controls.sweepButton.addEventListener("mousedown", () => this.handleSweep(true));
    this.controls.sweepButton.addEventListener("mouseup", () => this.handleSweep(false));
    this.controls.sweepButton.addEventListener("mouseleave", () => this.handleSweep(false));

    window.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        this.throwStone();
      }
      if (event.key === "Shift") {
        this.handleSweep(true);
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.key === "Shift") {
        this.handleSweep(false);
      }
    });

    this.ui.endsSetting.addEventListener("change", () => {
      this.state.totalEnds = Number(this.ui.endsSetting.value);
    });

    this.ui.presetButtons.forEach((button) => {
      button.addEventListener("click", () => this.applyPreset(button));
    });
  }

  updateUI() {
    const stonesRemaining =
      this.state.stonesPerTeam -
      this.state.stones.filter((stone) => stone.team === this.state.currentTeam).length;

    this.ui.currentTeamLabel.textContent = this.teamName(this.state.currentTeam);
    this.ui.stonesLeftLabel.textContent = stonesRemaining;
    this.ui.shotNumberLabel.textContent = this.state.currentShot + 1;
    this.ui.endNumberLabel.textContent = this.state.endNumber;
    this.ui.hammerTeamLabel.textContent = this.teamName(this.state.hammerTeam);
    this.ui.turnIndicator.textContent = this.state.currentTeam === 0 ? "Player" : "AI";

    this.ui.teamCards.forEach((card, index) => {
      card.classList.toggle("active", index === this.state.currentTeam);
    });

    this.ui.scoreLabels.forEach((label, index) => {
      label.textContent = this.state.scores[index];
    });

    this.renderShotHistory();
    this.renderEndSummary();
  }

  updateSliderValues() {
    this.ui.powerValue.textContent = this.ui.powerInput.value;
    this.ui.curlValue.textContent = this.ui.curlInput.value;
    this.ui.angleValue.textContent = `${this.ui.angleInput.value}°`;
  }

  teamName(team) {
    return team === 0 ? "Red" : "Blue";
  }

  isStoneMoving() {
    return this.state.stones.some((stone) => stone.active);
  }

  throwStone() {
    if (this.isStoneMoving()) {
      return;
    }
    if (this.state.currentShot >= this.state.stonesPerTeam * 2) {
      return;
    }

    if (this.state.currentTeam === 1 && !this.state.aiThinking) {
      this.startAIThrow();
      return;
    }

    const power = Number(this.ui.powerInput.value);
    const angle = (Number(this.ui.angleInput.value) * Math.PI) / 180;
    const curl = Number(this.ui.curlInput.value);
    this.spawnStone(this.state.currentTeam, power, angle, curl);
  }

  spawnStone(team, power, angleRad, curl) {
    const speed = 0.08 + power * 0.065;
    const baseAngle = -Math.PI / 2 + angleRad;
    const stone = new Stone({
      team,
      position: { ...this.sheet.hack },
      velocity: { x: speed * Math.cos(baseAngle), y: speed * Math.sin(baseAngle) },
      radius: 14,
      mass: 1,
      curl,
    });

    this.state.stones.push(stone);
    this.state.distanceTraveled = 0;
    this.state.lastShot = { angle: baseAngle, power };
    this.recordShot(team, power, curl, Math.round((angleRad * 180) / Math.PI));

    this.state.currentShot += 1;
    this.state.currentTeam = this.state.currentShot % 2;
    this.updateUI();
  }

  applyPreset(button) {
    this.ui.powerInput.value = button.dataset.power;
    this.ui.curlInput.value = button.dataset.curl;
    this.ui.angleInput.value = button.dataset.angle;
    this.updateSliderValues();
  }

  undoShot() {
    if (this.isStoneMoving()) {
      return;
    }
    const lastStone = this.state.stones.pop();
    if (!lastStone) {
      return;
    }
    if (this.state.currentShot > 0) {
      this.state.currentShot -= 1;
      this.state.currentTeam = this.state.currentShot % 2;
    }
    this.state.shotHistory.shift();
    this.updateUI();
  }

  startAIThrow() {
    this.state.aiThinking = true;
    const difficulty = Number(this.ui.aiDifficulty.value);
    const aiShot = this.ai.chooseShot({
      stones: this.state.stones,
      houseCenter: this.sheet.houseCenter,
      hogLineY: this.sheet.hogLineY,
      difficulty,
    });

    this.ui.powerInput.value = aiShot.power.toFixed(0);
    this.ui.curlInput.value = aiShot.curl.toFixed(0);
    this.ui.angleInput.value = aiShot.angleDeg.toFixed(0);
    this.updateSliderValues();

    setTimeout(() => {
      this.spawnStone(1, aiShot.power, (aiShot.angleDeg * Math.PI) / 180, aiShot.curl);
      this.state.aiThinking = false;
    }, 600);
  }

  handleSweep(state) {
    this.state.sweeping = state;
    this.ui.sweepStatusLabel.textContent = state ? "On" : "Off";
  }

  resetEnd() {
    this.state.stones = [];
    this.state.currentShot = 0;
    this.state.currentTeam = this.state.hammerTeam;
    this.state.distanceTraveled = 0;
    this.state.lastShot = null;
    this.updateUI();
  }

  resetMatch() {
    this.state = this.createInitialState();
    this.updateUI();
  }

  scoreEnd() {
    if (this.isStoneMoving()) {
      return;
    }
    const result = calculateScore(this.state.stones, this.sheet.houseCenter, 70);
    let summary = "Blank end";
    if (result.team !== null && result.points > 0) {
      this.state.scores[result.team] += result.points;
      summary = `${this.teamName(result.team)} +${result.points}`;
      this.state.hammerTeam = result.team === 0 ? 1 : 0;
    }

    this.state.endHistory.push({ end: this.state.endNumber, summary });

    if (this.state.endNumber >= this.state.totalEnds) {
      this.state.endHistory.push({
        end: "Final",
        summary: `Final ${this.state.scores[0]} - ${this.state.scores[1]}`,
      });
    }

    this.state.endNumber += 1;
    this.resetEnd();
  }

  recordShot(team, power, curl, angle) {
    this.state.shotHistory.unshift({
      end: this.state.endNumber,
      shot: this.state.currentShot + 1,
      team,
      power: Math.round(power),
      curl: Math.round(curl),
      angle,
    });
    if (this.state.shotHistory.length > 10) {
      this.state.shotHistory.pop();
    }
  }

  renderShotHistory() {
    this.ui.shotHistoryList.innerHTML = "";
    this.state.shotHistory.forEach((shot) => {
      const item = document.createElement("li");
      item.textContent = `End ${shot.end}, Shot ${shot.shot} • ${this.teamName(shot.team)} • P${shot.power} C${shot.curl} A${shot.angle}`;
      this.ui.shotHistoryList.appendChild(item);
    });
  }

  renderEndSummary() {
    this.ui.endSummary.innerHTML = "";
    this.state.endHistory.forEach((end) => {
      const row = document.createElement("div");
      row.className = "end-item";
      row.innerHTML = `<span>${end.end}</span><span>${end.summary}</span>`;
      this.ui.endSummary.appendChild(row);
    });
  }

  updateTelemetry() {
    const movingStone = this.state.stones.find((stone) => stone.active);
    if (movingStone) {
      const speed = movingStone.speed;
      this.ui.speedLabel.textContent = `${speed.toFixed(2)} m/s`;
      this.ui.spinLabel.textContent = `${movingStone.curl.toFixed(1)} rad/s`;
    } else {
      this.ui.speedLabel.textContent = `0.00 m/s`;
      this.ui.spinLabel.textContent = `${Number(this.ui.curlInput.value).toFixed(1)} rad/s`;
    }
    this.ui.distanceLabel.textContent = `${this.state.distanceTraveled.toFixed(1)} m`;
  }

  updateStoneValidity(stone) {
    if (!stone.hasCrossedHog && this.sheet.isBeyondHogLine(stone)) {
      stone.hasCrossedHog = true;
    }
    if (!stone.active && !stone.hasCrossedHog) {
      stone.inPlay = false;
    }
    if (this.sheet.isBeyondBackLine(stone)) {
      stone.inPlay = false;
      stone.stop();
    }
  }

  drawStones() {
    this.state.stones.forEach((stone) => {
      if (!stone.inPlay) {
        return;
      }
      this.ctx.beginPath();
      this.ctx.fillStyle = stone.team === 0 ? "#ff5b5b" : "#5ad1ff";
      this.ctx.arc(stone.position.x, stone.position.y, stone.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.fillStyle = "rgba(255,255,255,0.8)";
      this.ctx.arc(stone.position.x, stone.position.y, stone.radius * 0.45, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  animate() {
    this.sheet.draw(this.ctx);

    const aimAngle = (Number(this.ui.angleInput.value) * Math.PI) / 180 - Math.PI / 2;
    if (this.state.lastShot) {
      this.sheet.drawLastShot(this.ctx, this.sheet.hack, this.state.lastShot.angle, this.state.lastShot.power);
    }
    if (!this.isStoneMoving() && this.state.currentTeam === 0) {
      this.sheet.drawAimGuide(
        this.ctx,
        this.sheet.hack,
        aimAngle,
        Number(this.ui.powerInput.value),
        true
      );
    }

    this.physics.step(this.state.stones, 1, this.state.sweeping, this.sheet.bounds);

    this.state.stones.forEach((stone) => {
      if (!stone.active) {
        this.updateStoneValidity(stone);
      }
      this.state.distanceTraveled += stone.speed * 0.02;
    });

    this.drawStones();
    this.updateTelemetry();

    if (!this.isStoneMoving() && this.state.currentTeam === 1 && !this.state.aiThinking) {
      this.throwStone();
    }

    requestAnimationFrame(() => this.animate());
  }
}
