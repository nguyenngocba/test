import { appState } from '../core/state.js';
import { logService } from './LogService.js';

class SupplierService {
    getAllSuppliers() { return [...appState.suppliers]; }
    getSupplierById(id) { return appState.suppliers.find(s => s.id === id); }
    
    createSupplier(data) {
        if (!data.name?.trim()) return { success: false, errors: ['Tên nhà cung cấp không được trống'] };
        const newId = `S${String(appState._data.nextSid++).padStart(3, '0')}`;
        const newSup = { id: newId, name: data.name.trim(), phone: data.phone || '', email: data.email || '', address: data.address || '' };
        appState.addSupplier(newSup);
        logService.addLog('Thêm nhà cung cấp', `${newSup.name}`);
        return { success: true, data: newSup };
    }
    
    deleteSupplier(id) {
        const sup = this.getSupplierById(id);
        const related = appState.transactions.filter(t => t.supplierId === id);
        if (related.length && !confirm(`Nhà cung cấp có ${related.length} giao dịch. Xóa sẽ mất dữ liệu. Tiếp tục?`)) return { success: false, cancelled: true };
        appState.deleteSupplier(id);
        logService.addLog('Xóa nhà cung cấp', `${sup?.name} (${id})`);
        return { success: true };
    }
}

export const supplierService = new SupplierService();