/**
 * simulationController.js
 * Controller MVC для симуляции ткани.
 * Запускает анимационный цикл и обновляет View.
 * Применяет паттерн MVC.
 */
export class SimulationController {
  constructor(model, view) {
    console.log(`[SimulationController.constructor] Creating SimulationController`);
    console.log(`[SimulationController.constructor] Model:`, model ? 'provided' : 'missing');
    console.log(`[SimulationController.constructor] View:`, view ? 'provided' : 'missing');
    
    this.model = model;
    this.view = view;
    this.frameCount = 0;
    
    console.log(`[SimulationController.constructor] SimulationController initialized with frameCount: ${this.frameCount}`);
  }
  
  start() {
    console.log(`[SimulationController.start] Starting animation loop`);
    console.log(`[SimulationController.start] Initial frameCount: ${this.frameCount}`);
    
    const loop = () => {
      console.log(`[SimulationController.loop] Frame ${this.frameCount}: rendering frame`);
      
      try {
        this.view.renderFrame(this.frameCount);
        console.log(`[SimulationController.loop] Frame ${this.frameCount}: render completed successfully`);
      } catch (error) {
        console.error(`[SimulationController.loop] Frame ${this.frameCount}: render error:`, error);
      }
      
      this.frameCount++;
      
      if (this.frameCount % 60 === 0) {
        console.log(`[SimulationController.loop] Completed ${this.frameCount} frames`);
      }
      
      console.log(`[SimulationController.loop] Frame ${this.frameCount}: scheduling next frame`);
      requestAnimationFrame(loop);
    };
    
    console.log(`[SimulationController.start] Starting first animation frame`);
    loop();
    console.log(`[SimulationController.start] Animation loop started`);
  }
}