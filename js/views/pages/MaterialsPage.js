import { appState } from '../../core/state.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { materialService } from '../../services/MaterialService.js';
import { formatMoney, escapeHtml } from '../../utils/formatters.js';
import { Modal } from '../components/Modal.js';
import { Table } from '../components/Table.js';

class MaterialsPage {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        eventBus.on(EVENTS.MATERIAL_ADDED, () => this.rerender());
        eventBus.on(EVENTS.MATERIAL_UPDATED, () => this.rerender());
        eventBus.on(EVENTS.MATERIAL_DELETED, () => this.rerender());
        eventBus.on(EVENTS.TRANSACTION_CREATED, () => this.rerender());
    }

    rerender() {
        if (appState.getCurrentPane() === 'entry') {
            const container = document.querySelector('#pane-entry');
            if (container) {
                container.innerHTML = this.render();
            }
        }
    }

    render() {
        const materials = materialService.getAllMaterials();
        
        if (materials.length === 0) {
            return `<div class="card">📭 Chưa có vật tư nào. Hãy thêm mới.</div>`;
        }

        const columns = [
            { key: 'id', label: 'Mã', width: '80px' },
            { key: 'name', label: 'Tên vật tư', render: (val) => `<strong>${escapeHtml(val)}</strong>` },
            { key: 'cat', label: 'Loại' },
            { key: 'unit', label: 'ĐVT', width: '80px' },
            { key: 'qty', label: 'Tồn kho', render: (val) => val.toLocaleString() },
            { key: 'cost', label: 'Đơn giá', render: (val) => formatMoney(val) },
            { 
                key: 'status', 
                label: 'TT', 
                render: (_, row) => {
                    const isLow = row.qty <= row.low;
                    return `<span class="badge ${isLow ? 'b-low' : 'b-ok'}">${isLow ? '⚠️ Sắp hết' : '✅ OK'}</span>`;
                }
            },
            { key: 'note', label: 'Ghi chú', render: (val) => escapeHtml(val) || '—' },
            {
                key: 'actions',
                label: 'Thao tác',
                render: (_, row) => `
                    <button class="sm" onclick="window.materialsPage.edit('${row.id}')">✏️ Sửa</button>
                    <button class="sm danger-btn" onclick="window.materialsPage.delete('${row.id}')">🗑️ Xóa</button>
                `
            }
        ];

        return `
            <div class="card">
                <div class="sec-title">📋 DANH SÁCH VẬT TƯ TỒN KHO</div>
                ${Table.render(materials.map(m => ({ ...m })), columns)}
            </div>
        `;
    }

    async edit(id) {
        const material = materialService.getMaterialById(id);
        if (!material) return;

        const categories = appState.categories.map(c => 
            `<option ${material.cat === c ? 'selected' : ''}>${c}</option>`
        ).join('');
        
        const units = appState.units.map(u => 
            `<option ${material.unit === u ? 'selected' : ''}>${u}</option>`
        ).join('');

        const formHtml = `
            <div class="form-grid2">
                <div class="form-group form-full">
                    <label class="form-label">Tên vật tư *</label>
                    <input id="edit-name" value="${escapeHtml(material.name)}">
                </div>
                <div class="form-group">
                    <label class="form-label">Danh mục</label>
                    <select id="edit-cat">${categories}</select>
                </div>
                <div class="form-group">
                    <label class="form-label">Đơn vị</label>
                    <select id="edit-unit">${units}</select>
                </div>
                <div class="form-group">
                    <label class="form-label">Đơn giá (VNĐ)</label>
                    <input id="edit-cost" type="number" value="${material.cost}">
                </div>
                <div class="form-group">
                    <label class="form-label">Ngưỡng tồn</label>
                    <input id="edit-low" type="number" value="${material.low}">
                </div>
                <div class="form-group form-full">
                    <label class="form-label">Ghi chú</label>
                    <textarea id="edit-note" rows="2">${escapeHtml(material.note || '')}</textarea>
                </div>
            </div>
        `;

        Modal.show({
            title: '✏️ Sửa vật tư',
            content: formHtml,
            onConfirm: () => {
                const updates = {
                    name: document.getElementById('edit-name').value,
                    cat: document.getElementById('edit-cat').value,
                    unit: document.getElementById('edit-unit').value,
                    cost: parseFloat(document.getElementById('edit-cost').value),
                    low: parseFloat(document.getElementById('edit-low').value),
                    note: document.getElementById('edit-note').value
                };
                const result = materialService.updateMaterial(id, updates);
                if (!result.success) {
                    alert(result.error || result.errors?.join('\n'));
                }
            }
        });
    }

    async delete(id) {
        const result = materialService.deleteMaterial(id);
        if (!result.success && !result.cancelled) {
            alert(result.error);
        }
    }

    showAddModal() {
        const categories = appState.categories.map(c => `<option>${c}</option>`).join('');
        const units = appState.units.map(u => `<option>${u}</option>`).join('');

        const formHtml = `
            <div class="form-grid2">
                <div class="form-group form-full">
                    <label class="form-label">Tên vật tư *</label>
                    <input id="add-name" placeholder="VD: Thép tấm 12mm">
                </div>
                <div class="form-group">
                    <label class="form-label">Danh mục</label>
                    <select id="add-cat">${categories}</select>
                </div>
                <div class="form-group">
                    <label class="form-label">Đơn vị</label>
                    <select id="add-unit">${units}</select>
                </div>
                <div class="form-group">
                    <label class="form-label">Số lượng đầu</label>
                    <input id="add-qty" type="number" value="0" step="any">
                </div>
                <div class="form-group">
                    <label class="form-label">Đơn giá (VNĐ)</label>
                    <input id="add-cost" type="number" value="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Ngưỡng tồn</label>
                    <input id="add-low" type="number" value="5">
                </div>
                <div class="form-group form-full">
                    <label class="form-label">Ghi chú</label>
                    <textarea id="add-note" rows="2" placeholder="Ghi chú thêm..."></textarea>
                </div>
            </div>
        `;

        Modal.show({
            title: '➕ Thêm vật tư mới',
            content: formHtml,
            onConfirm: () => {
                const data = {
                    name: document.getElementById('add-name').value,
                    category: document.getElementById('add-cat').value,
                    unit: document.getElementById('add-unit').value,
                    quantity: document.getElementById('add-qty').value,
                    cost: document.getElementById('add-cost').value,
                    lowStock: document.getElementById('add-low').value,
                    note: document.getElementById('add-note').value
                };
                const result = materialService.createMaterial(data);
                if (!result.success) {
                    alert(result.errors?.join('\n') || 'Có lỗi xảy ra');
                }
            }
        });
    }
}

export const materialsPage = new MaterialsPage();

// Global handlers
window.materialsPage = materialsPage;
window.openMatModal = () => materialsPage.showAddModal();