import { appState } from '../core/state.js';
import { eventBus, EVENTS } from '../core/eventBus.js';
import { logService } from './LogService.js';
import { formatMoney } from '../utils/formatters.js';
import { Material } from '../models/Material.js';

class MaterialService {
    getAllMaterials(filters = {}) {
        let materials = appState.materials;
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            materials = materials.filter(m => 
                m.name.toLowerCase().includes(searchLower) ||
                m.id.toLowerCase().includes(searchLower)
            );
        }
        
        if (filters.category) {
            materials = materials.filter(m => m.cat === filters.category);
        }
        
        return materials.map(m => new Material(m));
    }

    getMaterialById(id) {
        const material = appState.materials.find(m => m.id === id);
        return material ? new Material(material) : null;
    }

    createMaterial(data) {
        const errors = Material.validate(data);
        if (errors.length > 0) {
            return { success: false, errors };
        }

        const nextId = appState._data.nextMid || 1;
        const newId = `M${String(nextId).padStart(3, '0')}`;
        appState._data.nextMid = nextId + 1;

        const newMaterial = new Material({
            id: newId,
            name: data.name.trim(),
            cat: data.category,
            unit: data.unit,
            qty: Number(data.quantity) || 0,
            cost: Number(data.cost) || 0,
            low: Number(data.lowStock) || 5,
            note: data.note || ''
        });

        appState.addMaterial(newMaterial.toJSON());
        
        logService.addLog('Thêm vật tư', 
            `Đã thêm vật tư: ${newMaterial.name} (${newMaterial.id}) - SL: ${newMaterial.qty} ${newMaterial.unit} - Giá: ${formatMoney(newMaterial.cost)}`
        );
        
        return { success: true, data: newMaterial };
    }

    updateMaterial(id, updates) {
        const existing = this.getMaterialById(id);
        if (!existing) {
            return { success: false, error: 'Không tìm thấy vật tư' };
        }

        const updatedData = {
            ...existing.toJSON(),
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Validate before update
        const errors = Material.validate(updatedData);
        if (errors.length > 0) {
            return { success: false, errors };
        }

        const success = appState.updateMaterial(id, updatedData);
        
        if (success) {
            logService.addLog('Sửa vật tư', `Đã cập nhật vật tư: ${existing.name} (${id})`);
        }
        
        return { success };
    }

    deleteMaterial(id) {
        const material = this.getMaterialById(id);
        if (!material) {
            return { success: false, error: 'Không tìm thấy vật tư' };
        }

        const relatedTransactions = appState.transactions.filter(t => t.mid === id);
        if (relatedTransactions.length > 0) {
            const confirm = window.confirm(
                `⚠️ Vật tư "${material.name}" đã có ${relatedTransactions.length} giao dịch.\n` +
                `Xóa sẽ xóa luôn các giao dịch này. Tiếp tục?`
            );
            if (!confirm) return { success: false, cancelled: true };
        }

        appState.deleteMaterial(id);
        logService.addLog('Xóa vật tư', `Đã xóa vật tư: ${material.name} (${id})`);
        
        return { success: true };
    }

    getTotalInventoryValue() {
        return appState.materials.reduce((sum, m) => sum + (m.qty * m.cost), 0);
    }

    getLowStockItems() {
        return appState.materials.filter(m => m.qty <= m.low).map(m => new Material(m));
    }

    getInventoryByCategory() {
        const result = {};
        appState.materials.forEach(m => {
            if (!result[m.cat]) {
                result[m.cat] = { totalQty: 0, totalValue: 0, items: [] };
            }
            result[m.cat].totalQty += m.qty;
            result[m.cat].totalValue += m.qty * m.cost;
            result[m.cat].items.push(m);
        });
        return result;
    }
}

export const materialService = new MaterialService();