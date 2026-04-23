class EventBus {
    constructor() {
        this.events = {};
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    off(eventName, callback) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }

    emit(eventName, data) {
        if (!this.events[eventName]) return;
        this.events[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event ${eventName}:`, error);
            }
        });
    }

    once(eventName, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(eventName, wrapper);
        };
        this.on(eventName, wrapper);
    }
}

export const eventBus = new EventBus();

export const EVENTS = {
    // Auth
    LOGIN: 'auth:login',
    LOGOUT: 'auth:logout',
    
    // Data changes
    MATERIAL_ADDED: 'material:added',
    MATERIAL_UPDATED: 'material:updated',
    MATERIAL_DELETED: 'material:deleted',
    
    PROJECT_ADDED: 'project:added',
    PROJECT_UPDATED: 'project:updated',
    PROJECT_DELETED: 'project:deleted',
    
    SUPPLIER_ADDED: 'supplier:added',
    SUPPLIER_UPDATED: 'supplier:updated',
    SUPPLIER_DELETED: 'supplier:deleted',
    
    TRANSACTION_CREATED: 'transaction:created',
    
    // UI
    PANE_CHANGED: 'ui:paneChanged',
    MODAL_OPEN: 'ui:modalOpen',
    MODAL_CLOSE: 'ui:modalClose',
    DATA_CHANGED: 'data:changed',
    
    // Export
    EXPORT_START: 'export:start',
    EXPORT_COMPLETE: 'export:complete'
};