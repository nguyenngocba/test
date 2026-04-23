import { appState } from '../../core/state.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { supplierService } from '../../services/SupplierService.js';
import { materialService } from '../../services/MaterialService.js';
import { formatMoney, escapeHtml } from '../../utils/formatters.js';
import { Modal } from '../components/Modal.js';

class SuppliersPage {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        eventBus.on(EVENTS.SUPPLIER_ADDED, () => this.rerender());
        eventBus.on(EVENTS.SUPPLIER_UPDATED, () => this.rerender());
        eventBus.on(EVENTS.SUPPLIER_DELETED, () => this.rerender());
        eventBus.on(EVENTS.TRANSACTION_CREATED, () => this.rerender());
    }

    rerender() {
        if (appState.getCurrentPane() === 'suppliers') {
            const container = document.querySelector('#pane-suppliers');
            if (container) {
                container.innerHTML = this.render();
            }
        }
    }

    render() {
        const searchTerm = appState.filters.supplierSearch?.toLowerCase() || '';
        const suppliers = supplierService.getAllSuppliers()
            .filter(s => s.name.toLowerCase().includes(searchTerm));
        
        const supplierCards = suppliers.map(s => {
            const stats = supplierService.getSupplierStats(s.id);
            return `
                <div class="supplier-card">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <strong>${escapeHtml(s.name)}</strong> 
                        <span class="tag">${s.id}</span>
                    </div>
                    <div class="metric-sub">📞 ${s.phone || 'Chưa có'}</div>
                    <div class="metric-sub">✉️ ${s.email || 'Chưa có'}</div>
                    <div class="metric-sub">📍 ${s.address || 'Chưa có'}</div>
                    <div class="metric-sub" style="color:var(--success-text);margin-top:8px">
                        💰 Tổng chi: ${formatMoney(stats?.totalSpent || 0)}
                    </div>
                    <div style="margin-top:8px;display:flex;gap:8px">
                        <button class="sm" onclick="window.suppliersPage.edit('${s.id}')">✏️ Sửa</button>
                        <button class="sm danger-btn" onclick="window.suppliersPage.delete('${s.id}')">🗑️ Xóa</button>
                        <button class="sm" onclick="window.suppliersPage.viewHistory('${s.id}')">📜 Lịch sử</button>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="card">
                <div class="sec-title">🏭 DANH SÁCH NHÀ CUNG CẤP</div>
                <div class="search-box">
                    <input type="text" id="supplier-search" placeholder="🔍 Tìm kiếm nhà cung cấp..." 
                           value="${escapeHtml(appState.filters.supplierSearch || '')}" 
                           onkeyup="window.suppliersPage.filter()">
                    <button class="sm" onclick="window.suppliersPage.clearSearch()">✖️ Xóa</button>
                </div>
                <div class="grid2" style="grid-template-columns:repeat(auto-fill, minmax(350px,1fr))">
                    ${supplierCards}
                </div>
            </div>
        `;
    }

    filter() {
        const searchInput = document.getElementById('supplier-search');
        if (searchInput) {
            appState.setFilter('supplierSearch', searchInput.value);
            this.rerender();
        }
    }

    clearSearch() {
        appState.setFilter('supplierSearch', '');
        this.rerender();
    }

    showAddModal() {
        const formHtml = `
            <div class="form-group">
                <label class="form-label">Tên nhà cung cấp *</label>
                <input id="sup-name" placeholder="VD: Công ty Thép ABC">
            </div>
            <div class="form-group">
                <label class="form-label">Số điện thoại</label>
                <input id="sup-phone" placeholder="VD: 0912 345 678">
            </div>
            <div class="form-group">
                <label class="form-label">Email</label>
                <input id="sup-email" placeholder="VD: contact@thepabc.com">
            </div>
            <div class="form-group">
                <label class="form-label">Địa chỉ</label>
                <input id="sup-address" placeholder="VD: Hà Nội">
            </div>
        `;

        Modal.show({
            title: '➕ Thêm nhà cung cấp mới',
            content: formHtml,
            onConfirm: () => {
                const data = {
                    name: document.getElementById('sup-name')?.value.trim(),
                    phone: document.getElementById('sup-phone')?.value,
                    email: document.getElementById('sup-email')?.value,
                    address: document.getElementById('sup-address')?.value
                };
                if (!data.name) return alert('Vui lòng nhập tên nhà cung cấp');
                
                const result = supplierService.createSupplier(data);
                if (!result.success) {
                    alert(result.errors?.join('\n'));
                }
            }
        });
    }

    edit(id) {
        const supplier = supplierService.getSupplierById(id);
        if (!supplier) return;

        const formHtml = `
            <div class="form-group">
                <label class="form-label">Tên nhà cung cấp *</label>
                <input id="edit-name" value="${escapeHtml(supplier.name)}">
            </div>
            <div class="form-group">
                <label class="form-label">Số điện thoại</label>
                <input id="edit-phone" value="${escapeHtml(supplier.phone || '')}">
            </div>
            <div class="form-group">
                <label class="form-label">Email</label>
                <input id="edit-email" value="${escapeHtml(supplier.email || '')}">
            </div>
            <div class="form-group">
                <label class="form-label">Địa chỉ</label>
                <input id="edit-address" value="${escapeHtml(supplier.address || '')}">
            </div>
        `;

        Modal.show({
            title: '✏️ Sửa nhà cung cấp',
            content: formHtml,
            onConfirm: () => {
                const updates = {
                    name: document.getElementById('edit-name')?.value,
                    phone: document.getElementById('edit-phone')?.value,
                    email: document.getElementById('edit-email')?.value,
                    address: document.getElementById('edit-address')?.value
                };
                if (!updates.name) return alert('Vui lòng nhập tên nhà cung cấp');
                
                const result = supplierService.updateSupplier(id, updates);
                if (!result.success) {
                    alert(result.errors?.join('\n'));
                }
            }
        });
    }

    async delete(id) {
        const result = supplierService.deleteSupplier(id);
        if (!result.success && !result.cancelled) {
            alert(result.error);
        }
    }

    viewHistory(id) {
        const stats = supplierService.getSupplierStats(id);
        if (!stats) return;

        const purchases = stats.items;
        const purchasesHtml = purchases.map(p => `
            <tr>
                <td>${p.date}</td>
                <td>${escapeHtml(p.material)}</td>
                <td>${p.qty} ${p.unit}</td>
                <td>${formatMoney(p.unitPrice)}</td>
                <td>${p.vatRate || 0}%</td>
                <td class="text-warning">${formatMoney(p.totalAmount)}</td>
            </tr>
        `).join('') || '<tr><td colspan="6">Chưa có giao dịch nào</td></tr>';

        const invoiceImages = purchases.filter(p => p.invoiceImage).map(p => `
            <div><a href="${p.invoiceImage}" target="_blank">📄 Xem hóa đơn ngày ${p.date}</a></div>
        `).join('');

        const modalContent = `
            <div class="metric-card" style="margin-bottom:16px">
                <div class="metric-label">Tổng chi</div>
                <div class="metric-val" style="font-size:20px">${formatMoney(stats.totalSpent)}</div>
            </div>
            <div class="tbl-wrap">
                <table style="min-width:500px">
                    <thead><tr><th>Ngày</th><th>Vật tư</th><th>SL</th><th>Đơn giá</th><th>VAT</th><th>Thành tiền</th></tr></thead>
                    <tbody>${purchasesHtml}</tbody>
                </table>
            </div>
            ${invoiceImages ? `<div class="sec-title" style="margin-top:16px">📎 Hóa đơn đính kèm</div>${invoiceImages}` : ''}
        `;

        Modal.show({
            title: `📜 Lịch sử nhập hàng - ${escapeHtml(stats.supplier.name)}`,
            content: modalContent,
            confirmText: 'Đóng',
            onConfirm: () => {}
        });
    }
}

export const suppliersPage = new SuppliersPage();

// Global handlers
window.suppliersPage = suppliersPage;
window.openSupplierModal = () => suppliersPage.showAddModal();