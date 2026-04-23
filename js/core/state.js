import { eventBus, EVENTS } from './eventBus.js';
import { storage } from './storage.js';
import { DEFAULT_CATEGORIES, DEFAULT_UNITS, DEFAULT_USERS, DEFAULT_PROJECTS, DEFAULT_SUPPLIERS, DEFAULT_MATERIALS } from '../utils/constants.js';

class State {
    constructor() {
        this._data = {
            materials: [], transactions: [], projects: [], suppliers: [], logs: [],
            categories: [...DEFAULT_CATEGORIES], units: [...DEFAULT_UNITS],
            nextMid: 1, nextTid: 1, nextPid: 1, nextSid: 1, nextLogId: 1, users: []
        };
        this._currentUser = null;
        this._currentPane = 'entry';
        this._filters = { projectSearch: '', supplierSearch: '' };
    }

    get materials() { return [...this._data.materials]; }
    get transactions() { return [...this._data.transactions]; }
    get projects() { return [...this._data.projects]; }
    get suppliers() { return [...this._data.suppliers]; }
    get logs() { return [...this._data.logs]; }
    get categories() { return [...this._data.categories]; }
    get units() { return [...this._data.units]; }
    get users() { return [...this._data.users]; }
    get filters() { return { ...this._filters }; }
    getCurrentUser() { return this._currentUser ? { ...this._currentUser } : null; }
    getCurrentPane() { return this._currentPane; }
    setCurrentUser(user) { this._currentUser = user ? { ...user } : null; this._save(); }
    setCurrentPane(pane) { this._currentPane = pane; }
    setFilter(name, value) { this._filters[name] = value; eventBus.emit(EVENTS.DATA_CHANGED); }

    addMaterial(m) { this._data.materials.push({ ...m }); this._save(); eventBus.emit(EVENTS.MATERIAL_ADDED); eventBus.emit(EVENTS.DATA_CHANGED); return m; }
    updateMaterial(id, updates) { const idx = this._data.materials.findIndex(m => m.id === id); if (idx !== -1) { this._data.materials[idx] = { ...this._data.materials[idx], ...updates }; this._save(); eventBus.emit(EVENTS.MATERIAL_UPDATED); eventBus.emit(EVENTS.DATA_CHANGED); return true; } return false; }
    deleteMaterial(id) { this._data.materials = this._data.materials.filter(m => m.id !== id); this._data.transactions = this._data.transactions.filter(t => t.mid !== id); this._save(); eventBus.emit(EVENTS.MATERIAL_DELETED); eventBus.emit(EVENTS.DATA_CHANGED); return true; }

    addProject(p) { this._data.projects.push({ ...p }); this._save(); eventBus.emit(EVENTS.PROJECT_ADDED); eventBus.emit(EVENTS.DATA_CHANGED); return p; }
    updateProject(id, updates) { const idx = this._data.projects.findIndex(p => p.id === id); if (idx !== -1) { this._data.projects[idx] = { ...this._data.projects[idx], ...updates }; this._save(); eventBus.emit(EVENTS.DATA_CHANGED); return true; } return false; }
    deleteProject(id) { this._data.projects = this._data.projects.filter(p => p.id !== id); this._data.transactions = this._data.transactions.filter(t => t.projectId !== id); this._save(); eventBus.emit(EVENTS.PROJECT_DELETED); eventBus.emit(EVENTS.DATA_CHANGED); return true; }

    addSupplier(s) { this._data.suppliers.push({ ...s }); this._save(); eventBus.emit(EVENTS.SUPPLIER_ADDED); eventBus.emit(EVENTS.DATA_CHANGED); return s; }
    updateSupplier(id, updates) { const idx = this._data.suppliers.findIndex(s => s.id === id); if (idx !== -1) { this._data.suppliers[idx] = { ...this._data.suppliers[idx], ...updates }; this._save(); eventBus.emit(EVENTS.DATA_CHANGED); return true; } return false; }
    deleteSupplier(id) { this._data.suppliers = this._data.suppliers.filter(s => s.id !== id); this._data.transactions = this._data.transactions.filter(t => t.supplierId !== id); this._save(); eventBus.emit(EVENTS.SUPPLIER_DELETED); eventBus.emit(EVENTS.DATA_CHANGED); return true; }

    addTransaction(t) { this._data.transactions.unshift({ ...t }); this._save(); eventBus.emit(EVENTS.TRANSACTION_CREATED); eventBus.emit(EVENTS.DATA_CHANGED); return t; }
    addLog(l) { this._data.logs.unshift({ ...l }); if (this._data.logs.length > 500) this._data.logs = this._data.logs.slice(0, 500); this._save(); }
    addCategory(c) { this._data.categories.push(c); this._save(); eventBus.emit(EVENTS.DATA_CHANGED); }
    deleteCategory(c) { this._data.categories = this._data.categories.filter(cat => cat !== c); this._save(); eventBus.emit(EVENTS.DATA_CHANGED); }
    addUnit(u) { this._data.units.push(u); this._save(); eventBus.emit(EVENTS.DATA_CHANGED); }
    deleteUnit(u) { this._data.units = this._data.units.filter(unit => unit !== u); this._save(); eventBus.emit(EVENTS.DATA_CHANGED); }
    addUser(u) { this._data.users.push({ ...u }); this._save(); eventBus.emit(EVENTS.DATA_CHANGED); }
    deleteUser(id) { this._data.users = this._data.users.filter(u => u.id !== id); this._save(); eventBus.emit(EVENTS.DATA_CHANGED); }
    updateUser(id, updates) { const idx = this._data.users.findIndex(u => u.id === id); if (idx !== -1) { this._data.users[idx] = { ...this._data.users[idx], ...updates }; this._save(); eventBus.emit(EVENTS.DATA_CHANGED); return true; } return false; }

    load(initialData) {
        if (initialData) this._data = { ...this._data, ...initialData };
        if (!this._data.projects) this._data.projects = [];
        if (!this._data.suppliers) this._data.suppliers = [];
        if (!this._data.logs) this._data.logs = [];
        if (!this._data.transactions) this._data.transactions = [];
        if (!this._data.materials) this._data.materials = [];
        if (!this._data.users || this._data.users.length === 0) this._data.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
        if (this._data.projects.length === 0) { this._data.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS)); this._data.nextPid = 4; }
        if (this._data.suppliers.length === 0) { this._data.suppliers = JSON.parse(JSON.stringify(DEFAULT_SUPPLIERS)); this._data.nextSid = 4; }
        if (this._data.materials.length === 0) { this._data.materials = JSON.parse(JSON.stringify(DEFAULT_MATERIALS)); this._data.nextMid = 5; }
        this._save();
    }

    _save() { storage.save(this._data); }
}

export const appState = new State();