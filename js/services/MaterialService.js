import { appState } from '../core/state.js';
import { logService } from './LogService.js';
import { formatMoney } from '../utils/formatters.js';

class MaterialService {
    getAllMaterials() { return [...appState.materials]; }
    getMaterialById(id) { return appState.materials.find(m => m.id === id); }
    
    createMaterial(data) {
        if (!data.name?.trim()) return { success: false, errors: ['Tên vật tư không được trống'] };
        const newId = `M${String(appState._data.nextMid++).padStart(3, '0')}`;
        const newMat = {
            id: newId, name: data.name.trim(), cat: data.category, unit: data.unit,
            qty: Number(data.quantity) || 0, cost: Number(data.cost) || 0,
            low: Number(data.lowStock) || 5, note: data.note || ''
        };
        appState.addMaterial(newMat);
        logService.addLog('Thêm vật tư', `${newMat.name} - SL: ${newMat.qty} - Giá: ${formatMoney(newMat.cost)}`);
        return { success: true, data: newMat };
    }
    
    updateMaterial(id, updates) {
        appState.updateMaterial(id, updates);
        logService.addLog('Sửa vật tư', `Đã cập nhật vật tư ${id}`);
        return { success: true };
    }
    
    deleteMaterial(id) {
        const mat = this.getMaterialById(id);
        const related = appState.transactions.filter(t => t.mid === id);
        if (related.length && !confirm(`Vật tư này có ${related.length} giao dịch. Xóa sẽ mất dữ liệu. Tiếp tục?`)) return { success: false, cancelled: true };
        appState.deleteMaterial(id);
        logService.addLog('Xóa vật tư', `${mat?.name} (${id})`);
        return { success: true };
    }
}

export const materialService = new MaterialService();