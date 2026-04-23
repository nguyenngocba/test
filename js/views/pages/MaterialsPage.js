import { appState } from '../../core/state.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { materialService } from '../../services/MaterialService.js';
import { transactionService } from '../../services/TransactionService.js';
import { formatMoney, escapeHtml } from '../../utils/formatters.js';
import { Modal } from '../components/Modal.js';

class MaterialsPage {
    constructor() {
        eventBus.on(EVENTS.MATERIAL_ADDED, () => this.rerender());
        eventBus.on(EVENTS.MATERIAL_UPDATED, () => this.rerender());
        eventBus.on(EVENTS.MATERIAL_DELETED, () => this.rerender());
        eventBus.on(EVENTS.TRANSACTION_CREATED, () => this.rerender());
    }
    
    rerender() { if (appState.getCurrentPane() === 'entry') { const c = document.querySelector('#pane-entry'); if (c) c.innerHTML = this.render(); } }
    
    render() {
        if (!appState.materials.length) return '<div class="card">📭 Chưa có vật tư</div>';
        return `
            <div class="card">
                <div class="sec-title">📋 DANH SÁCH VẬT TƯ</div>
                <div class="tbl-wrap"><table style="min-width:800px"><thead><tr><th>Mã</th><th>Tên</th><th>Loại</th><th>ĐVT</th><th>Tồn</th><th>Đơn giá</th><th>TT</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
                <tbody>${appState.materials.map(m => `
                    <tr>
                        <td>${m.id}</td><td><strong>${escapeHtml(m.name)}</strong></td><td>${m.cat}</td><td>${m.unit}</td>
                        <td>${m.qty}</td><td>${formatMoney(m.cost)}</td>
                        <td><span class="badge ${m.qty <= m.low ? 'b-low' : 'b-ok'}">${m.qty <= m.low ? 'Sắp hết' : 'OK'}</span></td>
                        <td>${escapeHtml(m.note) || '—'}</td>
                        <td><button class="sm" onclick="window.materialsPage.edit('${m.id}')">✏️</button>
                            <button class="sm danger-btn" onclick="window.materialsPage.deleteItem('${m.id}')">🗑️</button>
                        </td>
                    </tr>`).join('')}</tbody></table></div>
            </div>
        `;
    }
    
    showAddModal() {
        Modal.show({
            title: '➕ Thêm vật tư',
            content: `<div class="form-grid2">
                <div class="form-group form-full"><label>Tên vật tư</label><input id="add-name"></div>
                <div class="form-group"><label>Danh mục</label><select id="add-cat">${appState.categories.map(c => `<option>${c}</option>`).join('')}</select></div>
                <div class="form-group"><label>Đơn vị</label><select id="add-unit">${appState.units.map(u => `<option>${u}</option>`).join('')}</select></div>
                <div class="form-group"><label>Số lượng</label><input id="add-qty" type="number" value="0"></div>
                <div class="form-group"><label>Đơn giá</label><input id="add-cost" type="number" value="0"></div>
                <div class="form-group"><label>Ngưỡng tồn</label><input id="add-low" type="number" value="5"></div>
                <div class="form-group form-full"><label>Ghi chú</label><textarea id="add-note" rows="2"></textarea></div>
            </div>`,
            onConfirm: () => {
                const result = materialService.createMaterial({
                    name: document.getElementById('add-name')?.value,
                    category: document.getElementById('add-cat')?.value,
                    unit: document.getElementById('add-unit')?.value,
                    quantity: document.getElementById('add-qty')?.value,
                    cost: document.getElementById('add-cost')?.value,
                    lowStock: document.getElementById('add-low')?.value,
                    note: document.getElementById('add-note')?.value
                });
                if (!result.success) alert(result.errors?.join('\n'));
            }
        });
    }
    
    edit(id) {
        const m = materialService.getMaterialById(id);
        if (!m) return;
        Modal.show({
            title: '✏️ Sửa vật tư',
            content: `<div class="form-grid2">
                <div class="form-group form-full"><label>Tên vật tư</label><input id="edit-name" value="${escapeHtml(m.name)}"></div>
                <div class="form-group"><label>Danh mục</label><select id="edit-cat">${appState.categories.map(c => `<option ${m.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
                <div class="form-group"><label>Đơn vị</label><select id="edit-unit">${appState.units.map(u => `<option ${m.unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
                <div class="form-group"><label>Đơn giá</label><input id="edit-cost" type="number" value="${m.cost}"></div>
                <div class="form-group"><label>Ngưỡng tồn</label><input id="edit-low" type="number" value="${m.low}"></div>
                <div class="form-group form-full"><label>Ghi chú</label><textarea id="edit-note" rows="2">${escapeHtml(m.note || '')}</textarea></div>
            </div>`,
            onConfirm: () => {
                materialService.updateMaterial(id, {
                    name: document.getElementById('edit-name')?.value,
                    cat: document.getElementById('edit-cat')?.value,
                    unit: document.getElementById('edit-unit')?.value,
                    cost: parseFloat(document.getElementById('edit-cost')?.value),
                    low: parseFloat(document.getElementById('edit-low')?.value),
                    note: document.getElementById('edit-note')?.value
                });
            }
        });
    }
    
    deleteItem(id) { if (confirm('Xóa vật tư này?')) materialService.deleteMaterial(id); }
    
    showPurchaseModal() {
        if (!appState.suppliers.length) return alert('Chưa có nhà cung cấp');
        if (!appState.materials.length) return alert('Chưa có vật tư');
        Modal.show({
            title: '📥 Nhập kho',
            content: `<div class="form-group"><label>Nhà cung cấp</label><select id="purchase-supplier">${appState.suppliers.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Vật tư</label><select id="purchase-mid">${appState.materials.map(m => `<option value="${m.id}">${escapeHtml(m.name)} (${m.qty} ${m.unit})</option>`).join('')}</select></div>
                <div class="form-group"><label>Số lượng</label><input id="purchase-qty" type="number" value="1"></div>
                <div class="form-group"><label>Đơn giá nhập</label><input id="purchase-price" type="number" placeholder="Giá nhập thực tế"></div>
                <div class="form-group"><label>VAT (%)</label><input id="purchase-vat" type="number" value="10"></div>
                <div class="metric-card"><div class="metric-sub">💰 Thành tiền: <strong id="preview-total">0₫</strong></div></div>
                <div class="form-group"><label>Ghi chú</label><input id="purchase-note"></div>`,
            onConfirm: () => {
                transactionService.createPurchaseTransaction({
                    supplierId: document.getElementById('purchase-supplier')?.value,
                    materialId: document.getElementById('purchase-mid')?.value,
                    qty: parseFloat(document.getElementById('purchase-qty')?.value),
                    unitPrice: parseFloat(document.getElementById('purchase-price')?.value),
                    vatRate: parseFloat(document.getElementById('purchase-vat')?.value),
                    note: document.getElementById('purchase-note')?.value
                });
            }
        });
        const updatePreview = () => {
            const mid = document.getElementById('purchase-mid')?.value;
            const mat = appState.materials.find(m => m.id === mid);
            const price = document.getElementById('purchase-price');
            if (mat && price && !price.value) price.value = mat.cost;
            const qty = parseFloat(document.getElementById('purchase-qty')?.value) || 0;
            const p = parseFloat(document.getElementById('purchase-price')?.value) || 0;
            const vat = parseFloat(document.getElementById('purchase-vat')?.value) || 0;
            const total = qty * p * (1 + vat / 100);
            const preview = document.getElementById('preview-total');
            if (preview) preview.innerText = formatMoney(total);
        };
        setTimeout(() => {
            const qty = document.getElementById('purchase-qty');
            const price = document.getElementById('purchase-price');
            const vat = document.getElementById('purchase-vat');
            if (qty) qty.oninput = updatePreview;
            if (price) price.oninput = updatePreview;
            if (vat) vat.oninput = updatePreview;
            updatePreview();
        }, 50);
    }
    
    showExportModal() {
        const mid = document.getElementById('txn-mid')?.value;
        const mat = appState.materials.find(m => m.id === mid);
        if (!mat) return;
        Modal.show({
            title: '📤 Xuất kho',
            content: `<div class="form-group"><label>Công trình</label><select id="txn-project">${appState.projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}</select></div>
                <div class="form-group"><label>Vật tư</label><select id="txn-mid">${appState.materials.map(m => `<option value="${m.id}">${escapeHtml(m.name)} (Tồn: ${m.qty})</option>`).join('')}</select></div>
                <div class="form-group"><label>Số lượng</label><input id="txn-qty" type="number" value="1"></div>
                <div class="metric-card"><div class="metric-sub">💰 Thành tiền: <strong id="preview-export">0₫</strong></div></div>
                <div class="form-group"><label>Ghi chú</label><input id="txn-note"></div>`,
            onConfirm: () => {
                transactionService.createUsageTransaction({
                    projectId: document.getElementById('txn-project')?.value,
                    materialId: document.getElementById('txn-mid')?.value,
                    qty: parseFloat(document.getElementById('txn-qty')?.value),
                    note: document.getElementById('txn-note')?.value
                });
            }
        });
        const update = () => {
            const mid = document.getElementById('txn-mid')?.value;
            const mat = appState.materials.find(m => m.id === mid);
            const qty = parseFloat(document.getElementById('txn-qty')?.value) || 0;
            const total = (mat?.cost || 0) * qty;
            const preview = document.getElementById('preview-export');
            if (preview) preview.innerText = formatMoney(total);
        };
        setTimeout(() => {
            const qty = document.getElementById('txn-qty');
            const mid = document.getElementById('txn-mid');
            if (qty) qty.oninput = update;
            if (mid) mid.onchange = update;
            update();
        }, 50);
    }
}

export const materialsPage = new MaterialsPage();
window.materialsPage = materialsPage;
window.openMatModal = () => materialsPage.showAddModal();
window.openPurchaseModal = () => materialsPage.showPurchaseModal();
window.openTxnModal = () => materialsPage.showExportModal();