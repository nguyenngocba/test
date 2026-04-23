import { appState } from '../core/state.js';
import { logService } from './LogService.js';
import { formatMoney } from '../utils/formatters.js';
import { Supplier } from '../models/Supplier.js';

class SupplierService {
    getAllSuppliers(filters = {}) {
        let suppliers = appState.suppliers;
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            suppliers = suppliers.filter(s => 
                s.name.toLowerCase().includes(searchLower) ||
                s.id.toLowerCase().includes(searchLower) ||
                (s.phone && s.phone.includes(filters.search))
            );
        }
        
        return suppliers.map(s => new Supplier(s));
    }

    getSupplierById(id) {
        const supplier = appState.suppliers.find(s => s.id === id);
        return supplier ? new Supplier(supplier) : null;
    }

    getSupplierStats(id) {
        const supplier = this.getSupplierById(id);
        if (!supplier) return null;
        
        const purchases = appState.transactions.filter(t => t.supplierId === id && t.type === 'purchase');
        const totalSpent = purchases.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        const items = purchases.map(t => {
            const material = appState.materials.find(m => m.id === t.mid);
            return {
                material: material?.name || 'N/A',
                qty: t.qty,
                unit: material?.unit || '',
                unitPrice: t.unitPrice,
                totalAmount: t.totalAmount,
                date: t.date,
                vatRate: t.vatRate,
                invoiceImage: t.invoiceImage
            };
        });
        
        return {
            supplier,
            totalSpent,
            purchaseCount: purchases.length,
            items
        };
    }

    getAllSuppliersStats() {
        return this.getAllSuppliers().map(s => this.getSupplierStats(s.id));
    }

    createSupplier(data) {
        const errors = Supplier.validate(data);
        if (errors.length > 0) {
            return { success: false, errors };
        }

        const nextId = appState._data.nextSid || 1;
        const newId = `S${String(nextId).padStart(3, '0')}`;
        appState._data.nextSid = nextId + 1;

        const newSupplier = new Supplier({
            id: newId,
            name: data.name.trim(),
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || ''
        });

        appState.addSupplier(newSupplier.toJSON());
        
        logService.addLog('Thêm nhà cung cấp', 
            `Đã thêm nhà cung cấp: ${newSupplier.name} (${newSupplier.id})`
        );
        
        return { success: true, data: newSupplier };
    }

    updateSupplier(id, updates) {
        const existing = this.getSupplierById(id);
        if (!existing) {
            return { success: false, error: 'Không tìm thấy nhà cung cấp' };
        }

        const updatedData = {
            ...existing.toJSON(),
            ...updates,
            updatedAt: new Date().toISOString()
        };

        const errors = Supplier.validate(updatedData);
        if (errors.length > 0) {
            return { success: false, errors };
        }

        const success = appState.updateSupplier(id, updatedData);
        
        if (success) {
            logService.addLog('Sửa nhà cung cấp', `Đã cập nhật nhà cung cấp: ${existing.name} (${id})`);
        }
        
        return { success };
    }

    deleteSupplier(id) {
        const supplier = this.getSupplierById(id);
        if (!supplier) {
            return { success: false, error: 'Không tìm thấy nhà cung cấp' };
        }

        const relatedTransactions = appState.transactions.filter(t => t.supplierId === id);
        if (relatedTransactions.length > 0) {
            const confirm = window.confirm(
                `⚠️ Nhà cung cấp "${supplier.name}" đã có ${relatedTransactions.length} giao dịch nhập hàng.\n` +
                `Xóa sẽ xóa luôn các giao dịch này. Tiếp tục?`
            );
            if (!confirm) return { success: false, cancelled: true };
        }

        appState.deleteSupplier(id);
        logService.addLog('Xóa nhà cung cấp', `Đã xóa nhà cung cấp: ${supplier.name} (${id})`);
        
        return { success: true };
    }

    getTotalPurchaseCost() {
        return appState.transactions
            .filter(t => t.type === 'purchase')
            .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    }

    getTopSuppliers(limit = 5) {
        const stats = this.getAllSuppliersStats()
            .filter(s => s.totalSpent > 0)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, limit);
        return stats;
    }
}

export const supplierService = new SupplierService();