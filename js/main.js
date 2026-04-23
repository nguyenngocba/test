import { app } from './core/app.js';

// Khởi động ứng dụng
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Export toàn cục cho các sự kiện inline (nếu cần)
window.app = app;