import { state, saveData, addLog, formatMoney, escapeHtml, setSupplierFilter } from './state.js';
import { showModal } from './auth.js';

export function getSuppliers() {
    return state.suppliers;
}

export function getFilteredSuppliers() {
    const keyword = state.filters.supplier.keyword || '';
    if (!keyword) return [...state.suppliers];
    
    const kw = keyword.toLowerCase();
    return state.suppliers.filter(s => 
        s.name.toLowerCase().includes(kw) || 
        s.id.toLowerCase().includes(kw) ||
        (s.phone && s.phone.includes(kw))
    );
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
    const filtered = getFilteredSuppliers();
    const keyword = state.filters.supplier.keyword || '';
    
    if (state.suppliers.length === 0) {
        return '<div class="card">📭 Chưa có nhà cung cấp nào</div>';
    }
    
    return `
        <div class="card">
            <div class="sec-title">🔍 TÌM KIẾM NHÀ CUNG CẤP</div>
            <div class="search-box">
                <input type="text" id="supplier-search" placeholder="🔍 Tìm theo tên, mã hoặc số điện thoại..." 
                       value="${escapeHtml(keyword)}" style="flex:1">
                <button id="clear-supplier-search" class="sm">✖️ Xóa</button>
            </div>
        </div>
        
        <div class="card">
            <div class="sec-title">🏭 DANH SÁCH NHÀ CUNG CẤP (${filtered.length})</div>
            ${filtered.length === 0 ? '<div class="metric-sub">📭 Không tìm thấy nhà cung cấp phù hợp</div>' : `
                <div class="tbl-wrap">
                    <table style="min-width:600px">
                        <thead>
                            <tr><th>Mã</th><th>Tên</th><th>Số điện thoại</th><th>Địa chỉ</th><th>Tổng nhập</th><th>Thao tác</th></tr>
                        </thead>
                        <tbody>
                            ${filtered.map(s => {
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
            `}
        </div>
    `;
}

export function bindSupplierSearchEvents() {
    const searchInput = document.getElementById('supplier-search');
    const clearBtn = document.getElementById('clear-supplier-search');
    
    const updateSearch = () => {
        setSupplierFilter(searchInput?.value || '');
        if (window.renderApp) window.renderApp();
        setTimeout(() => bindSupplierSearchEvents(), 50);
    };
    
    if (searchInput) searchInput.oninput = updateSearch;
    if (clearBtn) clearBtn.onclick = () => {
        setSupplierFilter('');
        if (window.renderApp) window.renderApp();
        setTimeout(() => bindSupplierSearchEvents(), 50);
    };
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