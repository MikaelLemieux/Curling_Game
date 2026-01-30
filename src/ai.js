import { clamp } from "./utils.js";

export class CurlingAI {
  constructor() {
    this.mode = "draw";
  }

  chooseShot({ stones, houseCenter, hogLineY, difficulty }) {
    const active = stones.filter((stone) => stone.inPlay);
    const opponentStones = active.filter((stone) => stone.team === 0);
    if (opponentStones.length > 0) {
      this.mode = "takeout";
    } else {
      this.mode = "draw";
    }

    if (this.mode === "takeout") {
      const target = opponentStones.reduce((closest, stone) => {
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
      const power = clamp(82 * difficulty, 70, 100);
      const curl = clamp(-dx * 0.12, -12, 12);
      return { angleDeg: clamp((angle * 180) / Math.PI, -40, 40), power, curl };
    }

    const offsetX = (Math.random() - 0.5) * 40 * (1.1 - difficulty);
    const offsetY = (Math.random() - 0.5) * 30 * (1.1 - difficulty);
    const targetX = houseCenter.x + offsetX;
    const targetY = houseCenter.y + offsetY;

    const dx = targetX - houseCenter.x;
    const dy = targetY - (hogLineY + 260);
    const angle = Math.atan2(dy, dx) - Math.PI / 2;
    const power = clamp(64 * difficulty, 50, 80);
    const curl = clamp(dx * 0.1, -10, 10);

    return { angleDeg: clamp((angle * 180) / Math.PI, -40, 40), power, curl };
  }
}
