import { appState } from '../core/state.js';
import { logService } from './LogService.js';
import { formatMoney } from '../utils/formatters.js';

class ExportService {
    exportToExcel(type) {
        if (typeof XLSX === 'undefined') { alert('Đang tải thư viện, thử lại sau'); return; }
        let data = [], filename = '';
        if (type === 'materials') {
            data = appState.materials.map(m => ({ 'Mã': m.id, 'Tên': m.name, 'Loại': m.cat, 'ĐVT': m.unit, 'Tồn': m.qty, 'Đơn giá': m.cost }));
            filename = `vat_tu_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (type === 'projects') {
            data = appState.projects.map(p => {
                const spent = appState.transactions.filter(t => t.projectId === p.id && t.type === 'usage').reduce((s, t) => s + (t.totalAmount || 0), 0);
                return { 'Mã': p.id, 'Tên': p.name, 'Ngân sách': p.budget, 'Đã chi': spent, 'Còn lại': p.budget - spent };
            });
            filename = `cong_trinh_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (type === 'suppliers') {
            data = appState.suppliers.map(s => {
                const spent = appState.transactions.filter(t => t.supplierId === s.id && t.type === 'purchase').reduce((s, t) => s + (t.totalAmount || 0), 0);
                return { 'Mã': s.id, 'Tên': s.name, 'SĐT': s.phone, 'Email': s.email, 'Địa chỉ': s.address, 'Tổng chi': spent };
            });
            filename = `nha_cung_cap_${new Date().toISOString().split('T')[0]}.xlsx`;
        }
        if (!data.length) { alert('Không có dữ liệu'); return; }
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        XLSX.writeFile(wb, filename);
        logService.addLog('Export Excel', `Xuất ${type} - ${data.length} dòng`);
        alert(`✅ Xuất file thành công: ${filename}`);
    }
}

export const exportService = new ExportService();