import { appState } from '../core/state.js';
import { logService } from './LogService.js';
import { materialService } from './MaterialService.js';
import { projectService } from './ProjectService.js';
import { supplierService } from './SupplierService.js';
import { formatMoney } from '../utils/formatters.js';
import { Transaction } from '../models/Transaction.js';

class TransactionService {
    getAllTransactions(filters = {}) {
        let transactions = [...appState.transactions];
        
        if (filters.type) {
            transactions = transactions.filter(t => t.type === filters.type);
        }
        
        if (filters.startDate) {
            transactions = transactions.filter(t => t.date >= filters.startDate);
        }
        
        if (filters.endDate) {
            transactions = transactions.filter(t => t.date <= filters.endDate);
        }
        
        if (filters.materialId) {
            transactions = transactions.filter(t => t.mid === filters.materialId);
        }
        
        if (filters.projectId) {
            transactions = transactions.filter(t => t.projectId === filters.projectId);
        }
        
        if (filters.supplierId) {
            transactions = transactions.filter(t => t.supplierId === filters.supplierId);
        }
        
        return transactions.map(t => new Transaction(t));
    }

    getTransactionById(id) {
        const transaction = appState.transactions.find(t => t.id === id);
        return transaction ? new Transaction(transaction) : null;
    }

    createPurchaseTransaction(data) {
        const material = materialService.getMaterialById(data.materialId);
        if (!material) {
            return { success: false, error: 'Không tìm thấy vật tư' };
        }

        const supplier = supplierService.getSupplierById(data.supplierId);
        if (!supplier) {
            return { success: false, error: 'Không tìm thấy nhà cung cấp' };
        }

        const qty = Number(data.qty);
        const unitPrice = Number(data.unitPrice);
        const vatRate = Number(data.vatRate) || 0;
        
        if (qty <= 0) return { success: false, error: 'Số lượng không hợp lệ' };
        if (unitPrice <= 0) return { success: false, error: 'Đơn giá không hợp lệ' };

        const subtotal = qty * unitPrice;
        const vatAmount = subtotal * vatRate / 100;
        const totalAmount = subtotal + vatAmount;

        // Update stock
        material.qty += qty;
        appState.updateMaterial(material.id, { qty: material.qty });

        const nextId = appState._data.nextTid || 1;
        const newId = `T${String(nextId).padStart(3, '0')}`;
        appState._data.nextTid = nextId + 1;

        const transaction = new Transaction({
            id: newId,
            mid: material.id,
            type: 'purchase',
            qty: qty,
            unitPrice: unitPrice,
            totalAmount: totalAmount,
            date: new Date().toISOString().split('T')[0],
            note: data.note || '',
            supplierId: supplier.id,
            vatRate: vatRate,
            subtotal: subtotal,
            vatAmount: vatAmount,
            invoiceImage: data.invoiceImage || null
        });

        appState.addTransaction(transaction.toJSON());
        
        logService.addLog('Nhập kho', 
            `${material.name} - SL: ${qty} ${material.unit} - Giá nhập: ${formatMoney(unitPrice)} - VAT: ${vatRate}% - Tổng: ${formatMoney(totalAmount)} - Nhà cung cấp: ${supplier.name}`
        );
        
        return { success: true, data: transaction };
    }

    createUsageTransaction(data) {
        const material = materialService.getMaterialById(data.materialId);
        if (!material) {
            return { success: false, error: 'Không tìm thấy vật tư' };
        }

        const project = projectService.getProjectById(data.projectId);
        if (!project) {
            return { success: false, error: 'Không tìm thấy công trình' };
        }

        const qty = Number(data.qty);
        if (qty <= 0) return { success: false, error: 'Số lượng không hợp lệ' };
        
        if (material.qty < qty) {
            return { success: false, error: `Không đủ tồn kho! Còn ${material.qty} ${material.unit}` };
        }

        const totalAmount = qty * material.cost;

        // Update stock
        material.qty -= qty;
        appState.updateMaterial(material.id, { qty: material.qty });

        // Update project spent
        project.spent += totalAmount;
        appState.updateProject(project.id, { spent: project.spent });

        const nextId = appState._data.nextTid || 1;
        const newId = `T${String(nextId).padStart(3, '0')}`;
        appState._data.nextTid = nextId + 1;

        const transaction = new Transaction({
            id: newId,
            mid: material.id,
            type: 'usage',
            qty: qty,
            unitPrice: material.cost,
            totalAmount: totalAmount,
            date: new Date().toISOString().split('T')[0],
            note: data.note || '',
            projectId: project.id
        });

        appState.addTransaction(transaction.toJSON());
        
        logService.addLog('Xuất kho', 
            `${material.name} - SL: ${qty} ${material.unit} - Công trình: ${project.name} - Thành tiền: ${formatMoney(totalAmount)}`
        );
        
        return { success: true, data: transaction };
    }

    deleteTransaction(id) {
        const transaction = this.getTransactionById(id);
        if (!transaction) {
            return { success: false, error: 'Không tìm thấy giao dịch' };
        }

        // Reverse the transaction effect
        const material = materialService.getMaterialById(transaction.mid);
        if (material) {
            if (transaction.isPurchase) {
                material.qty -= transaction.qty;
                appState.updateMaterial(material.id, { qty: material.qty });
            } else if (transaction.isUsage) {
                material.qty += transaction.qty;
                appState.updateMaterial(material.id, { qty: material.qty });
                
                if (transaction.projectId) {
                    const project = projectService.getProjectById(transaction.projectId);
                    if (project) {
                        project.spent -= transaction.totalAmount;
                        appState.updateProject(project.id, { spent: project.spent });
                    }
                }
            }
        }

        // Remove transaction
        const index = appState._data.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            appState._data.transactions.splice(index, 1);
            appState._save();
        }
        
        logService.addLog('Xóa giao dịch', `Đã xóa giao dịch: ${transaction.id}`);
        
        return { success: true };
    }

    getMonthlyStats(year, month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
        
        const purchases = this.getAllTransactions({ type: 'purchase', startDate, endDate });
        const usages = this.getAllTransactions({ type: 'usage', startDate, endDate });
        
        return {
            month,
            year,
            totalPurchase: purchases.reduce((sum, t) => sum + t.totalAmount, 0),
            totalUsage: usages.reduce((sum, t) => sum + t.totalAmount, 0),
            purchaseCount: purchases.length,
            usageCount: usages.length
        };
    }
}

export const transactionService = new TransactionService();