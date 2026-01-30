export class Sheet {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.bounds = {
      left: 110,
      right: canvas.width - 110,
      top: 60,
      bottom: canvas.height - 60,
    };
    this.houseCenter = {
      x: canvas.width / 2,
      y: 220,
    };
    this.hack = {
      x: canvas.width / 2,
      y: canvas.height - 110,
    };
    this.hogLineY = this.houseCenter.y + 260;
    this.backLineY = this.houseCenter.y - 90;
  }

  draw(ctx) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const gradient = ctx.createLinearGradient(0, this.bounds.bottom, 0, this.bounds.top);
    gradient.addColorStop(0, "#0b1c34");
    gradient.addColorStop(1, "#1a3a68");
    ctx.fillStyle = gradient;
    ctx.fillRect(
      this.bounds.left,
      this.bounds.top,
      this.bounds.right - this.bounds.left,
      this.bounds.bottom - this.bounds.top
    );

    ctx.strokeStyle = "rgba(207, 227, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.bounds.left,
      this.bounds.top,
      this.bounds.right - this.bounds.left,
      this.bounds.bottom - this.bounds.top
    );

    this.drawHouse(ctx);
    this.drawLines(ctx);
  }

  drawHouse(ctx) {
    const rings = [70, 50, 30, 12];
    const colors = ["#c41c3b", "#ffffff", "#2564ff", "#ffffff"];
    rings.forEach((radius, index) => {
      ctx.beginPath();
      ctx.fillStyle = colors[index];
      ctx.arc(this.houseCenter.x, this.houseCenter.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawLines(ctx) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(this.bounds.left, this.hogLineY);
    ctx.lineTo(this.bounds.right, this.hogLineY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.bounds.left, this.backLineY);
    ctx.lineTo(this.bounds.right, this.backLineY);
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash([8, 8]);
    ctx.moveTo(this.canvas.width / 2, this.bounds.top);
    ctx.lineTo(this.canvas.width / 2, this.bounds.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawAimGuide(ctx, start, angleRad, power, showTrajectory) {
    const length = 60 + power * 1.5;
    ctx.strokeStyle = "rgba(74, 195, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(start.x + Math.cos(angleRad) * length, start.y + Math.sin(angleRad) * length);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = "rgba(74, 195, 255, 0.8)";
    ctx.arc(start.x, start.y, 8, 0, Math.PI * 2);
    ctx.fill();

    if (showTrajectory) {
      this.drawTrajectoryPreview(ctx, start, angleRad, power);
    }
  }

  drawTrajectoryPreview(ctx, start, angleRad, power) {
    let simX = start.x;
    let simY = start.y;
    let vx = (0.08 + power * 0.065) * Math.cos(angleRad);
    let vy = (0.08 + power * 0.065) * Math.sin(angleRad);
    let speed = Math.hypot(vx, vy);

    ctx.strokeStyle = "rgba(74, 195, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(simX, simY);

    for (let i = 0; i < 240; i += 1) {
      vx *= 0.992;
      vy *= 0.992;
      simX += vx;
      simY += vy;
      speed = Math.hypot(vx, vy);
      ctx.lineTo(simX, simY);
      if (speed < 0.03) {
        break;
      }
    }
    ctx.stroke();
  }

  isBeyondHogLine(stone) {
    return stone.position.y < this.hogLineY;
  }

  isBeyondBackLine(stone) {
    return stone.position.y < this.backLineY;
  }
}
