async function main() {
  // 1. Проверка поддержки WebGPU и инициализация устройства
  if (!navigator.gpu) {
    throw new Error("WebGPU не поддерживается в этом браузере.");
  }

  // Запрашиваем адаптер и логическое устройство
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("Не удалось получить адаптер WebGPU.");
  }
  const device = await adapter.requestDevice();

  // 2. Конфигурация канваса
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('webgpu');
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
  });

  // 3. Создание шейдерного модуля на WGSL
  const module = device.createShaderModule({
    label: 'Наши шейдеры для красного треугольника',
    code: /* wgsl */ `
      @vertex fn vs(
        @builtin(vertex_index) vertexIndex : u32
      ) -> @builtin(position) vec4f {
        // Позиции вершин треугольника в clip space
        let pos = array(
          vec2f( 0.0,  0.5),  // верхняя середина
          vec2f(-0.5, -0.5),  // нижний левый угол
          vec2f( 0.5, -0.5)   // нижний правый угол
        );
        return vec4f(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment fn fs() -> @location(0) vec4f {
        // Возвращаем красный цвет (R=1.0, G=0.0, B=0.0, A=1.0)
        return vec4f(1.0, 0.0, 0.0, 1.0);
      }
    `,
  });

  // 4. Создание конвейера рендеринга
  const pipeline = device.createRenderPipeline({
    label: 'Простой конвейер рендеринга',
    layout: 'auto',
    vertex: {
      module,
      entryPoint: 'vs',
    },
    fragment: {
      module,
      entryPoint: 'fs',
      targets: [{ format: presentationFormat }],
    },
  });

  // 5. Кодирование команд и отрисовка
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
      },
    ],
  });

  pass.setPipeline(pipeline);
  pass.draw(3); // Рисуем 3 вершины
  pass.end();

  // Завершаем кодирование и отправляем буфер команд в очередь
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
}

// Запускаем нашу асинхронную функцию
main().catch((error) => console.error(error));