import { clamp } from "./utils.js";

export class CurlingAI {
  constructor() {
    this.mode = "draw";
  }

  chooseShot({ stones, houseCenter, hogLineY, difficulty }) {
    const active = stones.filter((stone) => stone.inPlay);
    const opponentStones = active.filter((stone) => stone.team === 0);
    const opponentInHouse = opponentStones.filter(
      (stone) =>
        Math.hypot(stone.position.x - houseCenter.x, stone.position.y - houseCenter.y) < 70
    );

    if (opponentInHouse.length > 0) {
      this.mode = "takeout";
    } else if (opponentStones.length === 0) {
      this.mode = "draw";
    } else {
      this.mode = "guard";
    }

    if (this.mode === "takeout") {
      const target = opponentInHouse.reduce((closest, stone) => {
        if (!closest) {
          return stone;
        }
        const dist = Math.hypot(
          stone.position.x - houseCenter.x,
          stone.position.y - houseCenter.y
        );
        const closestDist = Math.hypot(
          closest.position.x - houseCenter.x,
          closest.position.y - houseCenter.y
        );
        return dist < closestDist ? stone : closest;
      }, null);

      const dx = target.position.x - houseCenter.x;
      const dy = target.position.y - (hogLineY + 260);
      const angle = Math.atan2(dy, dx) - Math.PI / 2;
      const power = clamp(86 * difficulty, 72, 100);
      const curl = clamp(-dx * 0.12, -12, 12);
      return { angleDeg: clamp((angle * 180) / Math.PI, -40, 40), power, curl };
    }

    if (this.mode === "guard") {
      const offsetX = (Math.random() - 0.5) * 90 * (1.2 - difficulty);
      const targetX = houseCenter.x + offsetX;
      const targetY = hogLineY + 40;
      const dx = targetX - houseCenter.x;
      const dy = targetY - (hogLineY + 260);
      const angle = Math.atan2(dy, dx) - Math.PI / 2;
      const power = clamp(52 * difficulty, 42, 70);
      const curl = clamp(dx * 0.12, -12, 12);
      return { angleDeg: clamp((angle * 180) / Math.PI, -40, 40), power, curl };
    }

    const offsetX = (Math.random() - 0.5) * 40 * (1.1 - difficulty);
    const offsetY = (Math.random() - 0.5) * 30 * (1.1 - difficulty);
    const targetX = houseCenter.x + offsetX;
    const targetY = houseCenter.y + offsetY;

    const dx = targetX - houseCenter.x;
    const dy = targetY - (hogLineY + 260);
    const angle = Math.atan2(dy, dx) - Math.PI / 2;
    const power = clamp(66 * difficulty, 50, 82);
    const curl = clamp(dx * 0.1, -10, 10);

    return { angleDeg: clamp((angle * 180) / Math.PI, -40, 40), power, curl };
  }
}
