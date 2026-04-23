import { appState } from '../../core/state.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { supplierService } from '../../services/SupplierService.js';
import { formatMoney, escapeHtml } from '../../utils/formatters.js';
import { Modal } from '../components/Modal.js';

class SuppliersPage {
    constructor() {
        eventBus.on(EVENTS.SUPPLIER_ADDED, () => this.rerender());
        eventBus.on(EVENTS.SUPPLIER_DELETED, () => this.rerender());
        eventBus.on(EVENTS.TRANSACTION_CREATED, () => this.rerender());
    }
    
    rerender() { if (appState.getCurrentPane() === 'suppliers') { const c = document.querySelector('#pane-suppliers'); if (c) c.innerHTML = this.render(); } }
    
    render() {
        const search = appState.filters.supplierSearch?.toLowerCase() || '';
        const filtered = appState.suppliers.filter(s => s.name.toLowerCase().includes(search));
        
        return `
            <div class="card">
                <div class="sec-title">🏭 NHÀ CUNG CẤP</div>
                <div class="search-box"><input type="text" id="supplier-search" placeholder="Tìm kiếm..." value="${escapeHtml(search)}" onkeyup="window.suppliersPage.filter()"><button class="sm" onclick="window.suppliersPage.clearSearch()">Xóa</button></div>
                <div class="grid2" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">
                    ${filtered.map(s => {
                        const purchases = appState.transactions.filter(t => t.supplierId === s.id && t.type === 'purchase');
                        const spent = purchases.reduce((sum,t) => sum + (t.totalAmount || 0), 0);
                        return `
                            <div class="supplier-card">
                                <div><strong>${escapeHtml(s.name)}</strong> <span class="tag">${s.id}</span></div>
                                <div class="metric-sub">📞 ${s.phone || '—'}</div>
                                <div class="metric-sub">✉️ ${s.email || '—'}</div>
                                <div class="metric-sub">📍 ${s.address || '—'}</div>
                                <div class="metric-sub" style="color:var(--success)">💰 Tổng chi: ${formatMoney(spent)}</div>
                                <div style="margin-top:8px;display:flex;gap:8px">
                                    <button class="sm" onclick="window.suppliersPage.edit('${s.id}')">✏️ Sửa</button>
                                    <button class="sm danger-btn" onclick="window.suppliersPage.delete('${s.id}')">🗑️ Xóa</button>
                                    <button class="sm" onclick="window.suppliersPage.viewHistory('${s.id}')">📜 Lịch sử</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    filter() { appState.setFilter('supplierSearch', document.getElementById('supplier-search')?.value || ''); this.rerender(); }
    clearSearch() { appState.setFilter('supplierSearch', ''); this.rerender(); }
    
    showAddModal() {
        Modal.show({
            title: '➕ Thêm nhà cung cấp',
            content: `<div class="form-group"><label>Tên *</label><input id="sup-name"></div>
                <div class="form-group"><label>SĐT</label><input id="sup-phone"></div>
                <div class="form-group"><label>Email</label><input id="sup-email"></div>
                <div class="form-group"><label>Địa chỉ</label><input id="sup-address"></div>`,
            onConfirm: () => supplierService.createSupplier({
                name: document.getElementById('sup-name')?.value,
                phone: document.getElementById('sup-phone')?.value,
                email: document.getElementById('sup-email')?.value,
                address: document.getElementById('sup-address')?.value
            })
        });
    }
    
    edit(id) {
        const s = supplierService.getSupplierById(id);
        if (!s) return;
        Modal.show({
            title: '✏️ Sửa nhà cung cấp',
            content: `<div class="form-group"><label>Tên</label><input id="edit-name" value="${escapeHtml(s.name)}"></div>
                <div class="form-group"><label>SĐT</label><input id="edit-phone" value="${escapeHtml(s.phone || '')}"></div>
                <div class="form-group"><label>Email</label><input id="edit-email" value="${escapeHtml(s.email || '')}"></div>
                <div class="form-group"><label>Địa chỉ</label><input id="edit-address" value="${escapeHtml(s.address || '')}"></div>`,
            onConfirm: () => appState.updateSupplier(id, {
                name: document.getElementById('edit-name')?.value,
                phone: document.getElementById('edit-phone')?.value,
                email: document.getElementById('edit-email')?.value,
                address: document.getElementById('edit-address')?.value
            })
        });
    }
    
    delete(id) { supplierService.deleteSupplier(id); }
    
    viewHistory(id) {
        const s = supplierService.getSupplierById(id);
        const purchases = appState.transactions.filter(t => t.supplierId === id && t.type === 'purchase');
        const spent = purchases.reduce((sum,t) => sum + (t.totalAmount || 0), 0);
        const rows = purchases.map(t => {
            const mat = appState.materials.find(m => m.id === t.mid);
            return `<tr><td>${t.date}</td><td>${mat?.name || 'N/A'}</td><td>${t.qty}</td><td>${formatMoney(t.unitPrice)}</td><td>${t.vatRate || 0}%</td><td class="text-warning">${formatMoney(t.totalAmount)}</td></tr>`;
        }).join('');
        Modal.show({
            title: `📜 Lịch sử - ${escapeHtml(s?.name)}`,
            content: `<div class="metric-card"><div class="metric-label">Tổng chi</div><div class="metric-val" style="font-size:20px">${formatMoney(spent)}</div></div>
                <div class="tbl-wrap"><table style="min-width:500px"><thead><tr><th>Ngày</th><th>Vật tư</th><th>SL</th><th>Đơn giá</th><th>VAT</th><th>Thành tiền</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Chưa có giao dịch</td></tr>'}</tbody></table></div>`,
            confirmText: 'Đóng'
        });
    }
}

export const suppliersPage = new SuppliersPage();
window.suppliersPage = suppliersPage;
window.openSupplierModal = () => suppliersPage.showAddModal();