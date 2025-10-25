/**
 * gpuManager.js
 * Singleton для работы с WebGPU.
 * Отвечает за инициализацию устройства GPU, контекста Canvas и формата.
 * Использует метод getInstance() для единственного доступа к устройству.
 * Применяет паттерн Singleton.
 */
export class GPUManager {
  static instance;
  
  /**
   * Статический метод для получения единственного экземпляра GPUManager
   * Реализует паттерн Singleton, гарантируя единственность экземпляра на протяжении жизни приложения
   * При первом вызове инициализирует WebGPU: получает адаптер, устройство, контекст и формат
   * При последующих вызовах возвращает существующий экземпляр, избегая повторной инициализации
   * @param {HTMLCanvasElement} canvas - Canvas элемент для создания WebGPU контекста
   * @returns {Promise<GPUManager>} Единственный экземпляр GPUManager
   * @throws {Error} Если не удается получить адаптер, устройство или контекст WebGPU
   * @example
   * const gpuManager = await GPUManager.getInstance(canvasElement);
   */
  static async getInstance(canvas) {
    console.log(`[GPUManager.getInstance] Requesting GPUManager instance`);
    
    if (!GPUManager.instance) {
      console.log(`[GPUManager.getInstance] No instance exists, creating new one`);
      
      console.log(`[GPUManager.getInstance] Requesting GPU adapter`);
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.error(`[GPUManager.getInstance] Failed to get GPU adapter`);
        throw new Error("Failed to get GPU adapter");
      }
      console.log(`[GPUManager.getInstance] GPU adapter obtained`);
      
      console.log(`[GPUManager.getInstance] Requesting GPU device`);
      const device = await adapter.requestDevice();
      if (!device) {
        console.error(`[GPUManager.getInstance] Failed to get GPU device`);
        throw new Error("Failed to get GPU device");
      }
      console.log(`[GPUManager.getInstance] GPU device obtained`);
      
      console.log(`[GPUManager.getInstance] Getting WebGPU context from canvas`);
      const context = canvas.getContext("webgpu");
      if (!context) {
        console.error(`[GPUManager.getInstance] Failed to get WebGPU context`);
        throw new Error("Failed to get WebGPU context");
      }
      console.log(`[GPUManager.getInstance] WebGPU context obtained`);
      
      console.log(`[GPUManager.getInstance] Getting preferred canvas format`);
      const format = navigator.gpu.getPreferredCanvasFormat();
      console.log(`[GPUManager.getInstance] Preferred format: ${format}`);
      
      console.log(`[GPUManager.getInstance] Configuring context with device and format`);
      context.configure({ device, format, alphaMode: "opaque" });
      console.log(`[GPUManager.getInstance] Context configured successfully`);
      
      console.log(`[GPUManager.getInstance] Creating new GPUManager instance`);
      GPUManager.instance = new GPUManager(device, context, format);
      console.log(`[GPUManager.getInstance] GPUManager instance created successfully`);
    } else {
      console.log(`[GPUManager.getInstance] Returning existing GPUManager instance`);
    }
    
    return GPUManager.instance;
  }
  
  /**
   * Приватный конструктор GPUManager, вызываемый только из getInstance()
   * Инициализирует менеджер с готовыми WebGPU ресурсами: устройством, контекстом и форматом
   * Сохраняет ссылки на ключевые объекты WebGPU для последующего использования в приложении
   * Логирует процесс инициализации для отладки создания графического контекста
   * @param {GPUDevice} device - WebGPU устройство, полученное от адаптера
   * @param {GPUCanvasContext} context - Контекст canvas, настроенный для WebGPU рендеринга
   * @param {string} format - Формат текстуры, рекомендуемый для данного canvas и устройства
   */
  constructor(device, context, format) {
    console.log(`[GPUManager.constructor] Initializing GPUManager with:`, {
      device: !!device,
      context: !!context,
      format: format
    });
    this.device = device;
    this.context = context;
    this.format = format;
    console.log(`[GPUManager.constructor] GPUManager initialized successfully`);
  }
}
