// simulationController.js
export class SimulationController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.frameCount = 0;
  }
  start() {
    const loop = () => {
      this.view.renderFrame(this.frameCount++);
      requestAnimationFrame(loop);
    };
    loop();
  }
}
