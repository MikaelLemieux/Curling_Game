import { clamp } from "./utils.js";

export class InputController {
  constructor(canvas, ui, onChange) {
    this.canvas = canvas;
    this.ui = ui;
    this.onChange = onChange;
    this.dragging = false;
    this.attachEvents();
  }

  attachEvents() {
    this.canvas.addEventListener("mousedown", (event) => this.handleDown(event));
    this.canvas.addEventListener("mousemove", (event) => this.handleMove(event));
    window.addEventListener("mouseup", () => this.handleUp());

    [this.ui.powerInput, this.ui.curlInput, this.ui.angleInput].forEach((input) => {
      input.addEventListener("input", () => this.onChange());
    });
  }

  handleDown(event) {
    this.dragging = true;
    this.handleMove(event);
  }

  handleMove(event) {
    if (!this.dragging) {
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dx = x - this.ui.hackPosition.x;
    const dy = y - this.ui.hackPosition.y;
    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    const angleDeg = clamp((angle * 180) / Math.PI, -40, 40);
    this.ui.angleInput.value = angleDeg.toFixed(0);

    const power = clamp(Math.hypot(dx, dy), 20, 100);
    this.ui.powerInput.value = power.toFixed(0);

    this.onChange();
  }

  handleUp() {
    this.dragging = false;
  }
}
