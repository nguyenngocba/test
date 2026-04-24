import { state, saveData, addLog, formatMoney, escapeHtml } from './state.js';
import { showModal } from './auth.js';

export function getSuppliers() {
    return state.suppliers;
}

export function addSupplier(data) {
    const newId = `S${String(state.nextId.supplier++).padStart(3, '0')}`;
    const newSup = {
        id: newId,
        name: data.name,
        phone: data.phone || '',
        address: data.address || ''
    };
    state.suppliers.push(newSup);
    addLog('Thêm nhà cung cấp', `${newSup.name}`);
    saveData();
    if (window.renderApp) window.renderApp();
    return newSup;
}

export function deleteSupplier(id) {
    const sup = state.suppliers.find(s => s.id === id);
    if (!sup) return false;
    
    const relatedTx = state.transactions.filter(t => t.supplierId === id);
    if (relatedTx.length > 0) {
        if (!confirm(`Nhà cung cấp này có ${relatedTx.length} giao dịch. Xóa sẽ mất dữ liệu. Tiếp tục?`)) {
            return false;
        }
        state.transactions = state.transactions.filter(t => t.supplierId !== id);
    }
    
    state.suppliers = state.suppliers.filter(s => s.id !== id);
    addLog('Xóa nhà cung cấp', `${sup.name}`);
    saveData();
    if (window.renderApp) window.renderApp();
    return true;
}

export function renderSuppliers() {
    if (state.suppliers.length === 0) {
        return '<div class="card">📭 Chưa có nhà cung cấp nào</div>';
    }
    
    return `
        <div class="card">
            <div class="sec-title">🏭 DANH SÁCH NHÀ CUNG CẤP</div>
            <div class="tbl-wrap">
                <table style="min-width:600px">
                    <thead>
                        <tr><th>Mã</th><th>Tên</th><th>Số điện thoại</th><th>Địa chỉ</th><th>Tổng nhập</th><th>Thao tác</th></tr>
                    </thead>
                    <tbody>
                        ${state.suppliers.map(s => {
                            const total = state.transactions.filter(t => t.supplierId === s.id).reduce((sum, t) => sum + (t.total || 0), 0);
                            return `
                                <tr>
                                    <td>${s.id}</td>
                                    <td><strong>${escapeHtml(s.name)}</strong></td>
                                    <td>${s.phone || '—'}</td>
                                    <td>${s.address || '—'}</td>
                                    <td>${formatMoney(total)}</td>
                                    <td><button class="sm danger" onclick="deleteSupplier('${s.id}')">🗑️ Xóa</button></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

export function showAddSupplierModal() {
    showModal('🏭 Thêm nhà cung cấp mới', `
        <div class="form-group">
            <label>Tên nhà cung cấp *</label>
            <input id="sup-name" placeholder="VD: Công ty Thép ABC">
        </div>
        <div class="form-group">
            <label>Số điện thoại</label>
            <input id="sup-phone" placeholder="VD: 0912 345 678">
        </div>
        <div class="form-group">
            <label>Địa chỉ</label>
            <input id="sup-address" placeholder="VD: Hà Nội">
        </div>
    `, () => {
        addSupplier({
            name: document.getElementById('sup-name').value,
            phone: document.getElementById('sup-phone').value,
            address: document.getElementById('sup-address').value
        });
    });
}