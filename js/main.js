import { app } from './core/app.js';

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

window.app = app;