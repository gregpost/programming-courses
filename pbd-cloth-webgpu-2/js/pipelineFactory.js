/**
 * pipelineFactory.js
 * Factory для создания Compute и Render пайплайнов.
 * Используется для абстракции создания WebGPU пайплайнов.
 * Позволяет легко переключать шейдеры и формат канвы.
 * Применяет паттерн Factory.
 */

export class PipelineFactory {
  /**
   * Загружает WGSL-шейдер из файла и создает шейдерный модуль для WebGPU
   * Выполняет асинхронный запрос через Fetch API для получения исходного кода шейдера
   * Проверяет успешность HTTP-запроса и генерирует ошибку при неудачной загрузке
   * Создает шейдерный модуль с помощью device.createShaderModule для использования в пайплайнах
   * Логирует все этапы загрузки для отладки процесса инициализации графических ресурсов
   * @param {GPUDevice} device - WebGPU устройство для создания шейдерного модуля
   * @param {string} url - URL-адрес файла с WGSL-кодом шейдера
   * @returns {Promise<GPUShaderModule>} Шейдерный модуль, готовый к использованию в пайплайнах
   */
  static async loadShaderModule(device, url) {
    console.log(`[PipelineFactory.loadShaderModule] Loading shader module from: ${url}`);
    
    console.log(`[PipelineFactory.loadShaderModule] Fetching shader code`);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[PipelineFactory.loadShaderModule] Failed to fetch shader from ${url}: ${response.status}`);
      throw new Error(`Failed to fetch shader: ${url}`);
    }
    
    const code = await response.text();
    console.log(`[PipelineFactory.loadShaderModule] Shader code loaded, length: ${code.length} characters`);
    
    console.log(`[PipelineFactory.loadShaderModule] Creating shader module`);
    const shaderModule = device.createShaderModule({ code });
    console.log(`[PipelineFactory.loadShaderModule] Shader module created successfully`);
    
    return shaderModule;
  }

  /**
   * Создает вычислительный пайплайн для выполнения общих вычислений на GPU
   * Компилирует переданный WGSL-код в шейдерный модуль с точкой входа "main"
   * Настраивает автоматическую раскладку пайплайна с помощью layout: "auto"
   * Проверяет компиляцию шейдера через getCompilationInfo для отлова синтаксических ошибок
   * Обрабатывает возможные исключения при создании пайплайна с детальным логированием ошибок
   * Используется для физических расчетов и других не-графических вычислений на GPU
   * @param {GPUDevice} device - WebGPU устройство для создания пайплайна
   * @param {string} shaderCode - Исходный код WGSL-шейдера для вычислений
   * @returns {GPUComputePipeline} Готовый вычислительный пайплайн для отправки в очередь устройста
   */
  static createComputePipeline(device, shaderCode) {
    console.log(`[PipelineFactory.createComputePipeline] Creating compute pipeline`);
    console.log(`[PipelineFactory.createComputePipeline] Shader code length: ${shaderCode?.length || 0}`);
    
    try {
      console.log(`[PipelineFactory.createComputePipeline] Creating shader module...`);
      const shaderModule = device.createShaderModule({ 
        code: shaderCode
      });
      
      // FIX: Check if getCompilationInfo exists before calling it
      if (shaderModule.getCompilationInfo) {
        console.log(`[PipelineFactory.createComputePipeline] Checking shader compilation...`);
        shaderModule.getCompilationInfo().then((info) => {
          if (info.messages.length > 0) {
            console.warn(`[PipelineFactory.createComputePipeline] Shader compilation messages:`, info.messages);
          } else {
            console.log(`[PipelineFactory.createComputePipeline] Shader compiled successfully`);
          }
        }).catch(error => {
          console.warn(`[PipelineFactory.createComputePipeline] Could not get compilation info:`, error);
        });
      } else {
        console.log(`[PipelineFactory.createComputePipeline] getCompilationInfo not available, skipping validation`);
      }
      
      console.log(`[PipelineFactory.createComputePipeline] Setting up pipeline descriptor...`);
      const pipelineDescriptor = {
        layout: "auto",
        compute: { 
          module: shaderModule, 
          entryPoint: "main" 
        },
      };
      
      console.log(`[PipelineFactory.createComputePipeline] Creating pipeline...`);
      const pipeline = device.createComputePipeline(pipelineDescriptor);
      console.log(`[PipelineFactory.createComputePipeline] Compute pipeline created successfully`);
      
      return pipeline;
    } catch (error) {
      console.error(`[PipelineFactory.createComputePipeline] Error creating pipeline:`, error);
      throw error;
    }
  }

  /**
   * Создает рендер-пайплайн для визуализации 3D-графики через WebGPU
   * Асинхронно загружает шейдеры из внешнего файла с помощью loadShaderModule
   * Настраивает вершинный буфер с атрибутами позиции и дополнительными данными
   * Конфигурирует формат вывода цвета в соответствии с форматом канваса
   * Устанавливает топологию примитивов "triangle-list" для отрисовки треугольников
   * Проверяет компиляцию пайплайна и обрабатывает возможные ошибки валидации
   * Используется для рендеринга ткани и других графических объектов в симуляции
   * @param {GPUDevice} device - WebGPU устройство для создания рендер-пайплайна
   * @param {string} format - Формат цвета целевой текстуры (например, 'bgra8unorm')
   * @returns {Promise<GPURenderPipeline>} Готовый рендер-пайплайн для использования в проходах отрисовки
   */
  static async createRenderPipeline(device, format) {
    console.log(`[PipelineFactory.createRenderPipeline] Creating render pipeline with format: ${format}`);
    
    try {
      console.log(`[PipelineFactory.createRenderPipeline] Loading shader module for render pipeline`);
      const module = await PipelineFactory.loadShaderModule(device, "./shaders/cloth_render.wgsl");
      console.log(`[PipelineFactory.createRenderPipeline] Shader module loaded successfully`);
      
      console.log(`[PipelineFactory.createRenderPipeline] Setting up render pipeline descriptor`);
      const pipelineDescriptor = {
        layout: "auto",
        vertex: {
          module,
          entryPoint: "vs_main",
          buffers: [
            { 
              arrayStride: 16, 
              attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" }, 
                { shaderLocation: 1, offset: 12, format: "float32" }
              ] 
            },
          ],
        },
        fragment: { 
          module, 
          entryPoint: "fs_main", 
          targets: [{ format }] 
        },
        primitive: { topology: "triangle-list" },
      };
      
      console.log(`[PipelineFactory.createRenderPipeline] Creating render pipeline...`);
      const pipeline = device.createRenderPipeline(pipelineDescriptor);
      
      // FIX: Same issue here - check if getCompilationInfo exists
      if (pipeline.getCompilationInfo) {
        pipeline.getCompilationInfo().then((info) => {
          if (info.messages.length > 0) {
            console.error(`[PipelineFactory.createRenderPipeline] Pipeline compilation messages:`, info.messages);
          } else {
            console.log(`[PipelineFactory.createRenderPipeline] Render pipeline compiled successfully`);
          }
        }).catch(error => {
          console.warn(`[PipelineFactory.createRenderPipeline] Could not get compilation info:`, error);
        });
      } else {
        console.log(`[PipelineFactory.createRenderPipeline] getCompilationInfo not available, skipping validation`);
      }
      
      console.log(`[PipelineFactory.createRenderPipeline] Render pipeline created successfully`);
      return pipeline;
    } catch (error) {
      console.error(`[PipelineFactory.createRenderPipeline] Error creating render pipeline:`, error);
      throw error;
    }
  }
}
