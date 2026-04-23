import { appState } from '../core/state.js';
import { eventBus, EVENTS } from '../core/eventBus.js';
import { logService } from './LogService.js';
import { materialService } from './MaterialService.js';
import { projectService } from './ProjectService.js';
import { supplierService } from './SupplierService.js';
import { formatMoney } from '../utils/formatters.js';

class ExportService {
    exportToExcel(type) {
        try {
            eventBus.emit(EVENTS.EXPORT_START, { type });
            
            if (typeof XLSX === 'undefined') {
                throw new Error('Thư viện XLSX chưa được tải!');
            }

            let data = [];
            let filename = '';
            let sheetName = '';

            if (type === 'materials') {
                data = materialService.getAllMaterials().map(m => ({
                    'Mã': m.id,
                    'Tên vật tư': m.name,
                    'Loại': m.cat,
                    'Đơn vị': m.unit,
                    'Tồn kho': m.qty,
                    'Đơn giá (VNĐ)': m.cost,
                    'Giá trị tồn (VNĐ)': m.totalValue,
                    'Trạng thái': m.status,
                    'Ngưỡng cảnh báo': m.low,
                    'Ghi chú': m.note || ''
                }));
                filename = `danh_sach_vat_tu_${new Date().toISOString().split('T')[0]}.xlsx`;
                sheetName = 'Danh sách vật tư';
                logService.addLog('Export Excel', `Xuất danh sách vật tư ra Excel - ${data.length} mặt hàng`);
            } 
            else if (type === 'projects') {
                const stats = projectService.getAllProjectsStats();
                data = stats.map(s => ({
                    'Mã': s.project.id,
                    'Tên công trình': s.project.name,
                    'Ngân sách (VNĐ)': s.project.budget,
                    'Đã chi (VNĐ)': s.totalSpent,
                    'Còn lại (VNĐ)': s.remaining,
                    '% sử dụng': s.percentUsed.toFixed(1),
                    'Số lần xuất': s.transactionCount,
                    'Chi tiết vật tư': s.items.map(i => `${i.material}: ${i.qty} ${i.unit}`).join('; ')
                }));
                filename = `danh_sach_cong_trinh_${new Date().toISOString().split('T')[0]}.xlsx`;
                sheetName = 'Danh sách công trình';
                logService.addLog('Export Excel', `Xuất danh sách công trình ra Excel - ${data.length} công trình`);
            } 
            else if (type === 'suppliers') {
                const stats = supplierService.getAllSuppliersStats();
                data = stats.map(s => ({
                    'Mã': s.supplier.id,
                    'Tên nhà cung cấp': s.supplier.name,
                    'SĐT': s.supplier.phone || '',
                    'Email': s.supplier.email || '',
                    'Địa chỉ': s.supplier.address || '',
                    'Tổng chi (VNĐ)': s.totalSpent,
                    'Số lần nhập': s.purchaseCount,
                    'Chi tiết nhập hàng': s.items.map(i => `${i.date}: ${i.material} - ${i.qty} - ${formatMoney(i.totalAmount)}`).join('; ')
                }));
                filename = `danh_sach_nha_cung_cap_${new Date().toISOString().split('T')[0]}.xlsx`;
                sheetName = 'Danh sách nhà cung cấp';
                logService.addLog('Export Excel', `Xuất danh sách nhà cung cấp ra Excel - ${data.length} nhà cung cấp`);
            }

            if (data.length === 0) {
                alert('Không có dữ liệu để xuất!');
                eventBus.emit(EVENTS.EXPORT_COMPLETE, { success: false, message: 'No data' });
                return;
            }

            const ws = XLSX.utils.json_to_sheet(data);
            
            // Auto-size columns
            const colWidths = [];
            for (let key in data[0]) {
                let maxLen = key.length;
                data.forEach(row => {
                    const val = row[key]?.toString() || '';
                    maxLen = Math.max(maxLen, val.length);
                });
                colWidths.push({ wch: Math.min(maxLen + 2, 50) });
            }
            ws['!cols'] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            XLSX.writeFile(wb, filename);
            
            alert(`✅ Xuất file thành công!\n📁 Tên file: ${filename}\n📊 Số dòng: ${data.length}`);
            eventBus.emit(EVENTS.EXPORT_COMPLETE, { success: true, filename, count: data.length });
            
        } catch (error) {
            console.error('Export error:', error);
            alert('❌ Có lỗi xảy ra khi xuất Excel: ' + error.message);
            eventBus.emit(EVENTS.EXPORT_COMPLETE, { success: false, error: error.message });
        }
    }
}

export const exportService = new ExportService();