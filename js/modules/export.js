import { state, addLog, formatMoney } from './state.js';

export function exportToExcel(type) {
  if (type === 'materials') {
    const data = state.data.materials.map(m => ({
      'Mã': m.id, 
      'Tên vật tư': m.name, 
      'Loại': m.cat, 
      'Đơn vị': m.unit,
      'Tồn kho': m.qty, 
      'Đơn giá (VNĐ)': m.cost, 
      'Trạng thái': m.qty <= m.low ? 'Sắp hết' : 'Bình thường',
      'Ghi chú': m.note || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách vật tư');
    XLSX.writeFile(wb, `danh_sach_vat_tu_${new Date().toISOString().split('T')[0]}.xlsx`);
    addLog('Export Excel', `Xuất danh sách vật tư ra Excel`);
  } else if (type === 'projects') {
    const data = state.data.projects.map(p => {
      const txns = state.data.transactions.filter(t => t.projectId === p.id && t.type === 'usage');
      const totalCost = txns.reduce((s, t) => s + (t.totalAmount || 0), 0);
      return {
        'Mã': p.id, 
        'Tên công trình': p.name, 
        'Ngân sách (VNĐ)': p.budget,
        'Đã chi (VNĐ)': totalCost, 
        'Còn lại (VNĐ)': p.budget - totalCost,
        '% sử dụng': p.budget > 0 ? ((totalCost / p.budget) * 100).toFixed(1) : 0,
        'Số lần xuất': txns.length
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách công trình');
    XLSX.writeFile(wb, `danh_sach_cong_trinh_${new Date().toISOString().split('T')[0]}.xlsx`);
    addLog('Export Excel', `Xuất danh sách công trình ra Excel`);
  } else if (type === 'suppliers') {
    const data = state.data.suppliers.map(s => {
      const purchases = state.data.transactions.filter(t => t.type === 'purchase' && t.supplierId === s.id);
      const totalSpent = purchases.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      return {
        'Mã': s.id, 
        'Tên nhà cung cấp': s.name, 
        'SĐT': s.phone || '',
        'Email': s.email || '', 
        'Địa chỉ': s.address || '',
        'Tổng chi (VNĐ)': totalSpent, 
        'Số lần nhập': purchases.length
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách nhà cung cấp');
    XLSX.writeFile(wb, `danh_sach_nha_cung_cap_${new Date().toISOString().split('T')[0]}.xlsx`);
    addLog('Export Excel', `Xuất danh sách nhà cung cấp ra Excel`);
  }
}