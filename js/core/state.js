import { eventBus, EVENTS } from './eventBus.js';
import { storage } from './storage.js';
import { DEFAULT_CATEGORIES, DEFAULT_UNITS, DEFAULT_USERS, DEFAULT_PROJECTS, DEFAULT_SUPPLIERS, DEFAULT_MATERIALS } from '../utils/constants.js';

class State {
    constructor() {
        this._data = {
            materials: [],
            transactions: [],
            projects: [],
            suppliers: [],
            logs: [],
            categories: [...DEFAULT_CATEGORIES],
            units: [...DEFAULT_UNITS],
            nextMid: 1,
            nextTid: 1,
            nextPid: 1,
            nextSid: 1,
            nextLogId: 1,
            users: []
        };
        this._currentUser = null;
        this._currentPane = 'entry';
        this._filters = { projectSearch: '', supplierSearch: '', materialSearch: '' };
    }

    // Getters
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

    // Setters with side effects
    setCurrentUser(user) {
        this._currentUser = user ? { ...user } : null;
        this._save();
    }

    setCurrentPane(pane) {
        this._currentPane = pane;
    }

    setFilter(filterName, value) {
        this._filters[filterName] = value;
        eventBus.emit(EVENTS.DATA_CHANGED);
    }

    // Data mutations
    setMaterials(materials) {
        this._data.materials = [...materials];
        this._save();
        eventBus.emit(EVENTS.MATERIAL_UPDATED, { materials: this._data.materials });
    }

    addMaterial(material) {
        this._data.materials.push({ ...material });
        this._save();
        eventBus.emit(EVENTS.MATERIAL_ADDED, { material });
        eventBus.emit(EVENTS.DATA_CHANGED);
        return material;
    }

    updateMaterial(id, updates) {
        const index = this._data.materials.findIndex(m => m.id === id);
        if (index !== -1) {
            this._data.materials[index] = { ...this._data.materials[index], ...updates };
            this._save();
            eventBus.emit(EVENTS.MATERIAL_UPDATED, { material: this._data.materials[index] });
            eventBus.emit(EVENTS.DATA_CHANGED);
            return true;
        }
        return false;
    }

    deleteMaterial(id) {
        const deleted = this._data.materials.find(m => m.id === id);
        this._data.materials = this._data.materials.filter(m => m.id !== id);
        this._data.transactions = this._data.transactions.filter(t => t.mid !== id);
        this._save();
        eventBus.emit(EVENTS.MATERIAL_DELETED, { material: deleted });
        eventBus.emit(EVENTS.DATA_CHANGED);
        return !!deleted;
    }

    setProjects(projects) {
        this._data.projects = [...projects];
        this._save();
        eventBus.emit(EVENTS.PROJECT_UPDATED);
        eventBus.emit(EVENTS.DATA_CHANGED);
    }

    addProject(project) {
        this._data.projects.push({ ...project });
        this._save();
        eventBus.emit(EVENTS.PROJECT_ADDED, { project });
        eventBus.emit(EVENTS.DATA_CHANGED);
        return project;
    }

    updateProject(id, updates) {
        const index = this._data.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            this._data.projects[index] = { ...this._data.projects[index], ...updates };
            this._save();
            eventBus.emit(EVENTS.PROJECT_UPDATED);
            eventBus.emit(EVENTS.DATA_CHANGED);
            return true;
        }
        return false;
    }

    deleteProject(id) {
        const deleted = this._data.projects.find(p => p.id === id);
        this._data.projects = this._data.projects.filter(p => p.id !== id);
        this._data.transactions = this._data.transactions.filter(t => t.projectId !== id);
        this._save();
        eventBus.emit(EVENTS.PROJECT_DELETED, { project: deleted });
        eventBus.emit(EVENTS.DATA_CHANGED);
        return !!deleted;
    }

    setSuppliers(suppliers) {
        this._data.suppliers = [...suppliers];
        this._save();
        eventBus.emit(EVENTS.SUPPLIER_UPDATED);
        eventBus.emit(EVENTS.DATA_CHANGED);
    }

    addSupplier(supplier) {
        this._data.suppliers.push({ ...supplier });
        this._save();
        eventBus.emit(EVENTS.SUPPLIER_ADDED, { supplier });
        eventBus.emit(EVENTS.DATA_CHANGED);
        return supplier;
    }

    updateSupplier(id, updates) {
        const index = this._data.suppliers.findIndex(s => s.id === id);
        if (index !== -1) {
            this._data.suppliers[index] = { ...this._data.suppliers[index], ...updates };
            this._save();
            eventBus.emit(EVENTS.SUPPLIER_UPDATED);
            eventBus.emit(EVENTS.DATA_CHANGED);
            return true;
        }
        return false;
    }

    deleteSupplier(id) {
        const deleted = this._data.suppliers.find(s => s.id === id);
        this._data.suppliers = this._data.suppliers.filter(s => s.id !== id);
        this._data.transactions = this._data.transactions.filter(t => t.supplierId !== id);
        this._save();
        eventBus.emit(EVENTS.SUPPLIER_DELETED, { supplier: deleted });
        eventBus.emit(EVENTS.DATA_CHANGED);
        return !!deleted;
    }

    addTransaction(transaction) {
        this._data.transactions.unshift({ ...transaction });
        this._save();
        eventBus.emit(EVENTS.TRANSACTION_CREATED, { transaction });
        eventBus.emit(EVENTS.DATA_CHANGED);
        return transaction;
    }

    addLog(log) {
        this._data.logs.unshift({ ...log });
        if (this._data.logs.length > 500) this._data.logs = this._data.logs.slice(0, 500);
        this._save();
    }

    addCategory(category) {
        this._data.categories.push(category);
        this._save();
        eventBus.emit(EVENTS.DATA_CHANGED);
    }

    deleteCategory(category) {
        this._data.categories = this._data.categories.filter(c => c !== category);
        this._save();
        eventBus.emit(EVENTS.DATA_CHANGED);
    }

    addUnit(unit) {
        this._data.units.push(unit);
        this._save();
        eventBus.emit(EVENTS.DATA_CHANGED);
    }

    deleteUnit(unit) {
        this._data.units = this._data.units.filter(u => u !== unit);
        this._save();
        eventBus.emit(EVENTS.DATA_CHANGED);
    }

    addUser(user) {
        this._data.users.push({ ...user });
        this._save();
        eventBus.emit(EVENTS.DATA_CHANGED);
    }

    deleteUser(userId) {
        this._data.users = this._data.users.filter(u => u.id !== userId);
        this._save();
        eventBus.emit(EVENTS.DATA_CHANGED);
    }

    updateUser(userId, updates) {
        const index = this._data.users.findIndex(u => u.id === userId);
        if (index !== -1) {
            this._data.users[index] = { ...this._data.users[index], ...updates };
            this._save();
            eventBus.emit(EVENTS.DATA_CHANGED);
            return true;
        }
        return false;
    }

    load(initialData) {
        if (initialData) {
            this._data = { ...this._data, ...initialData };
        }
        
        // Ensure arrays exist
        if (!this._data.projects) this._data.projects = [];
        if (!this._data.suppliers) this._data.suppliers = [];
        if (!this._data.logs) this._data.logs = [];
        if (!this._data.transactions) this._data.transactions = [];
        if (!this._data.materials) this._data.materials = [];
        if (!this._data.users || this._data.users.length === 0) {
            this._data.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
        }
        
        // Seed default data if empty
        if (this._data.projects.length === 0) {
            this._data.projects = JSON.parse(JSON.stringify(DEFAULT_PROJECTS));
            this._data.nextPid = 4;
        }
        if (this._data.suppliers.length === 0) {
            this._data.suppliers = JSON.parse(JSON.stringify(DEFAULT_SUPPLIERS));
            this._data.nextSid = 4;
        }
        if (this._data.materials.length === 0) {
            this._data.materials = JSON.parse(JSON.stringify(DEFAULT_MATERIALS));
            this._data.nextMid = 5;
        }
        
        this._save();
    }

    _save() {
        const toSave = {
            materials: this._data.materials,
            transactions: this._data.transactions,
            projects: this._data.projects,
            suppliers: this._data.suppliers,
            logs: this._data.logs,
            categories: this._data.categories,
            units: this._data.units,
            nextMid: this._data.nextMid,
            nextTid: this._data.nextTid,
            nextPid: this._data.nextPid,
            nextSid: this._data.nextSid,
            nextLogId: this._data.nextLogId,
            users: this._data.users
        };
        storage.save(toSave);
    }
}

export const appState = new State();