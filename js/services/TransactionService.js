import { appState } from '../core/state.js';
import { logService } from './LogService.js';
import { formatMoney } from '../utils/formatters.js';

class TransactionService {
    createPurchaseTransaction(data) {
        const mat = appState.materials.find(m => m.id === data.materialId);
        if (!mat) return { success: false, error: 'Không tìm thấy vật tư' };
        const qty = Number(data.qty);
        const price = Number(data.unitPrice);
        if (qty <= 0 || price <= 0) return { success: false, error: 'Số lượng hoặc đơn giá không hợp lệ' };
        
        const subtotal = qty * price;
        const vat = (data.vatRate || 0);
        const total = subtotal * (1 + vat / 100);
        
        mat.qty += qty;
        appState.updateMaterial(mat.id, { qty: mat.qty });
        
        const newId = `T${String(appState._data.nextTid++).padStart(3, '0')}`;
        appState.addTransaction({
            id: newId, mid: mat.id, type: 'purchase', qty, unitPrice: price,
            totalAmount: total, date: new Date().toISOString().split('T')[0],
            note: data.note || '', supplierId: data.supplierId, vatRate: vat
        });
        
        const sup = appState.suppliers.find(s => s.id === data.supplierId);
        logService.addLog('Nhập kho', `${mat.name} - SL: ${qty} - ${formatMoney(total)} - NCC: ${sup?.name}`);
        return { success: true };
    }
    
    createUsageTransaction(data) {
        const mat = appState.materials.find(m => m.id === data.materialId);
        if (!mat) return { success: false, error: 'Không tìm thấy vật tư' };
        const qty = Number(data.qty);
        if (qty <= 0) return { success: false, error: 'Số lượng không hợp lệ' };
        if (mat.qty < qty) return { success: false, error: `Không đủ tồn! Còn ${mat.qty}` };
        
        const total = qty * mat.cost;
        mat.qty -= qty;
        appState.updateMaterial(mat.id, { qty: mat.qty });
        
        const proj = appState.projects.find(p => p.id === data.projectId);
        if (proj) {
            proj.spent = (proj.spent || 0) + total;
            appState.updateProject(proj.id, { spent: proj.spent });
        }
        
        const newId = `T${String(appState._data.nextTid++).padStart(3, '0')}`;
        appState.addTransaction({
            id: newId, mid: mat.id, type: 'usage', qty, unitPrice: mat.cost,
            totalAmount: total, date: new Date().toISOString().split('T')[0],
            note: data.note || '', projectId: data.projectId
        });
        
        logService.addLog('Xuất kho', `${mat.name} - SL: ${qty} - ${formatMoney(total)} - CT: ${proj?.name}`);
        return { success: true };
    }
}

export const transactionService = new TransactionService();