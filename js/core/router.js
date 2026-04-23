import { eventBus, EVENTS } from './eventBus.js';

class Router {
    constructor() {
        this.routes = ['entry', 'dashboard', 'projects', 'suppliers', 'logs', 'settings'];
    }

    init() {
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
        this.handleRoute();
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'entry';
        if (this.routes.includes(hash)) {
            eventBus.emit(EVENTS.PANE_CHANGED, hash);
        }
    }

    navigate(pane, addToHistory = true) {
        if (addToHistory) {
            window.history.pushState({}, '', `#${pane}`);
        }
        eventBus.emit(EVENTS.PANE_CHANGED, pane);
    }
}

export const router = new Router();