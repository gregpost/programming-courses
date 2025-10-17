// ===== error_handler.js =====
/**
 * ErrorHandler.js
 * Перехватывает все JavaScript ошибки и выводит их на страницу в отдельный блок.
 * Поддерживает синхронные ошибки и ошибки промисов.
 * Добавляет удобный визуальный вывод для отладки WebGPU и UI.
 */

export function setupErrorHandler() {
  const errorLog = document.createElement("div");
  errorLog.id = "error-log";
  errorLog.style.cssText = "color: red; padding: 10px; white-space: pre-wrap; font-family: monospace;";
  document.body.prepend(errorLog);

  window.addEventListener("error", (event) => {
    errorLog.textContent = `Ошибка: ${event.message}\nФайл: ${event.filename}\nСтрока: ${event.lineno}, Колонка: ${event.colno}`;
  });

  window.addEventListener("unhandledrejection", (event) => {
    errorLog.textContent = `Ошибка промиса: ${event.reason}`;
  });
}
