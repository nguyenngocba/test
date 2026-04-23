class EventBus {
    constructor() { this.events = {}; }
    on(name, cb) { if (!this.events[name]) this.events[name] = []; this.events[name].push(cb); }
    off(name, cb) { if (!this.events[name]) return; this.events[name] = this.events[name].filter(f => f !== cb); }
    emit(name, data) { if (!this.events[name]) return; this.events[name].forEach(cb => { try { cb(data); } catch(e) { console.error(e); } }); }
    once(name, cb) { const wrapper = (d) => { cb(d); this.off(name, wrapper); }; this.on(name, wrapper); }
}

export const eventBus = new EventBus();
export const EVENTS = {
    LOGIN: 'auth:login', LOGOUT: 'auth:logout',
    MATERIAL_ADDED: 'material:added', MATERIAL_UPDATED: 'material:updated', MATERIAL_DELETED: 'material:deleted',
    PROJECT_ADDED: 'project:added', PROJECT_DELETED: 'project:deleted',
    SUPPLIER_ADDED: 'supplier:added', SUPPLIER_DELETED: 'supplier:deleted',
    TRANSACTION_CREATED: 'transaction:created',
    PANE_CHANGED: 'ui:paneChanged', DATA_CHANGED: 'data:changed'
};