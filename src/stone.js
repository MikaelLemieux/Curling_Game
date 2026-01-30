import { distance } from "./utils.js";

export class Stone {
  constructor({ team, position, velocity, radius, mass, curl }) {
    this.team = team;
    this.position = { ...position };
    this.velocity = { ...velocity };
    this.radius = radius;
    this.mass = mass;
    this.curl = curl;
    this.inPlay = true;
    this.active = true;
  }

  get speed() {
    return Math.hypot(this.velocity.x, this.velocity.y);
  }

  stop() {
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.active = false;
  }

  overlaps(other) {
    return distance(this.position, other.position) < this.radius + other.radius;
  }
}
