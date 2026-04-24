import { state, addLog, formatMoney } from './state.js';
import { getMaterials } from './materials.js';
import { getProjects } from './projects.js';
import { getSuppliers } from './suppliers.js';

export function exportToExcel(type) {
    if (typeof XLSX === 'undefined') {
        alert('Đang tải thư viện Excel, thử lại sau 2 giây');
        return;
    }
    
    let data = [];
    let filename = '';
    
    if (type === 'materials') {
        const materials = getMaterials();
        data = materials.map(m => ({
            'Mã': m.id,
            'Tên vật tư': m.name,
            'Loại': m.cat,
            'Đơn vị': m.unit,
            'Tồn kho': m.qty,
            'Đơn giá (VNĐ)': m.cost,
            'Giá trị tồn (VNĐ)': m.qty * m.cost,
            'Trạng thái': m.qty <= m.low ? 'Sắp hết' : 'Bình thường'
        }));
        filename = `danh_sach_vat_tu_${new Date().toISOString().split('T')[0]}.xlsx`;
        addLog('Export Excel', `Xuất danh sách vật tư - ${data.length} dòng`);
    } else if (type === 'projects') {
        const projects = getProjects();
        data = projects.map(p => {
            const spent = state.transactions.filter(t => t.projectId === p.id).reduce((s, t) => s + (t.total || 0), 0);
            return {
                'Mã': p.id,
                'Tên công trình': p.name,
                'Ngân sách (VNĐ)': p.budget,
                'Đã chi (VNĐ)': spent,
                'Còn lại (VNĐ)': p.budget - spent,
                '% sử dụng': p.budget > 0 ? ((spent / p.budget) * 100).toFixed(1) : 0
            };
        });
        filename = `danh_sach_cong_trinh_${new Date().toISOString().split('T')[0]}.xlsx`;
        addLog('Export Excel', `Xuất danh sách công trình - ${data.length} dòng`);
    } else if (type === 'suppliers') {
        const suppliers = getSuppliers();
        data = suppliers.map(s => {
            const total = state.transactions.filter(t => t.supplierId === s.id).reduce((sum, t) => sum + (t.total || 0), 0);
            return {
                'Mã': s.id,
                'Tên nhà cung cấp': s.name,
                'Số điện thoại': s.phone || '',
                'Địa chỉ': s.address || '',
                'Tổng nhập (VNĐ)': total,
                'Số lần nhập': state.transactions.filter(t => t.supplierId === s.id).length
            };
        });
        filename = `danh_sach_nha_cung_cap_${new Date().toISOString().split('T')[0]}.xlsx`;
        addLog('Export Excel', `Xuất danh sách nhà cung cấp - ${data.length} dòng`);
    }
    
    if (data.length === 0) {
        alert('Không có dữ liệu để xuất!');
        return;
    }
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename);
    
    alert(`✅ Xuất file thành công!\n📁 ${filename}\n📊 ${data.length} dòng dữ liệu`);
}