import { distance } from "./utils.js";

// Physics is deterministic and frame-based. Each frame applies friction, curl force
// (perpendicular to velocity), then resolves collisions with elastic impulses.

export class PhysicsEngine {
  constructor({ friction, sweepFriction, curlStrength, sweepCurlMultiplier, restitution, angularDrag }) {
    this.friction = friction;
    this.sweepFriction = sweepFriction;
    this.curlStrength = curlStrength;
    this.sweepCurlMultiplier = sweepCurlMultiplier;
    this.restitution = restitution;
    this.angularDrag = angularDrag;
  }

  step(stones, dt, sweeping, bounds) {
    const friction = sweeping ? this.sweepFriction : this.friction;
    const curlStrength = sweeping ? this.curlStrength * this.sweepCurlMultiplier : this.curlStrength;

    stones.forEach((stone) => {
      if (!stone.active) {
        return;
      }

      const speed = stone.speed;
      if (speed < 0.02) {
        stone.stop();
        return;
      }

      stone.curl *= this.angularDrag;
      const curlForce = stone.curl * curlStrength;
      if (curlForce !== 0 && speed > 0) {
        const normX = -stone.velocity.y / speed;
        const normY = stone.velocity.x / speed;
        stone.velocity.x += normX * curlForce * dt * speed;
        stone.velocity.y += normY * curlForce * dt * speed;
      }

      stone.velocity.x *= friction;
      stone.velocity.y *= friction;

      stone.position.x += stone.velocity.x * dt;
      stone.position.y += stone.velocity.y * dt;

      this.applyBounds(stone, bounds);
    });

    this.resolveCollisions(stones);
  }

  applyBounds(stone, bounds) {
    if (!bounds) {
      return;
    }
    const leftLimit = bounds.left + stone.radius;
    const rightLimit = bounds.right - stone.radius;
    const topLimit = bounds.top + stone.radius;
    const bottomLimit = bounds.bottom + stone.radius;

    if (stone.position.x < leftLimit) {
      stone.position.x = leftLimit;
      stone.velocity.x *= -0.6;
    }
    if (stone.position.x > rightLimit) {
      stone.position.x = rightLimit;
      stone.velocity.x *= -0.6;
    }
    if (stone.position.y < topLimit) {
      stone.position.y = topLimit;
      stone.velocity.y *= -0.6;
    }
    if (stone.position.y > bottomLimit) {
      stone.position.y = bottomLimit;
      stone.velocity.y *= -0.6;
    }
  }

  resolveCollisions(stones) {
    for (let i = 0; i < stones.length; i += 1) {
      for (let j = i + 1; j < stones.length; j += 1) {
        const a = stones[i];
        const b = stones[j];
        if (!a.inPlay || !b.inPlay) {
          continue;
        }
        const dist = distance(a.position, b.position);
        const minDist = a.radius + b.radius;
        if (dist > 0 && dist < minDist) {
          const nx = (b.position.x - a.position.x) / dist;
          const ny = (b.position.y - a.position.y) / dist;

          const overlap = minDist - dist;
          a.position.x -= nx * overlap * 0.5;
          a.position.y -= ny * overlap * 0.5;
          b.position.x += nx * overlap * 0.5;
          b.position.y += ny * overlap * 0.5;

          const relVelX = a.velocity.x - b.velocity.x;
          const relVelY = a.velocity.y - b.velocity.y;
          const velAlongNormal = relVelX * nx + relVelY * ny;
          if (velAlongNormal > 0) {
            continue;
          }

          const impulse =
            (-1 * (1 + this.restitution) * velAlongNormal) /
            (1 / a.mass + 1 / b.mass);
          const impulseX = impulse * nx;
          const impulseY = impulse * ny;

          a.velocity.x += -impulseX / a.mass;
          a.velocity.y += -impulseY / a.mass;
          b.velocity.x += impulseX / b.mass;
          b.velocity.y += impulseY / b.mass;
          a.active = true;
          b.active = true;
        }
      }
    }
  }
}

export const buildPhysics = () =>
  new PhysicsEngine({
    friction: 0.992,
    sweepFriction: 0.996,
    curlStrength: 0.00004,
    sweepCurlMultiplier: 0.7,
    restitution: 0.9,
    angularDrag: 0.998,
  });
