import { state, saveData, addLog, formatMoney, escapeHtml } from './state.js';
import { showModal } from './auth.js';

export function getMaterials() {
    return state.materials;
}

// ========== TÌM KIẾM NÂNG CAO ==========
let materialFilters = { keyword: '', category: '', minStock: '', maxStock: '' };

export function getFilteredMaterials() {
    let result = [...state.materials];
    
    if (materialFilters.keyword) {
        const kw = materialFilters.keyword.toLowerCase();
        result = result.filter(m => 
            m.name.toLowerCase().includes(kw) || 
            m.id.toLowerCase().includes(kw)
        );
    }
    
    if (materialFilters.category && materialFilters.category !== 'all') {
        result = result.filter(m => m.cat === materialFilters.category);
    }
    
    if (materialFilters.minStock !== '' && materialFilters.minStock !== null) {
        const min = Number(materialFilters.minStock);
        if (!isNaN(min)) result = result.filter(m => m.qty >= min);
    }
    
    if (materialFilters.maxStock !== '' && materialFilters.maxStock !== null) {
        const max = Number(materialFilters.maxStock);
        if (!isNaN(max)) result = result.filter(m => m.qty <= max);
    }
    
    return result;
}

export function updateMaterialFilters(key, value) {
    materialFilters[key] = value;
    if (window.renderApp) window.renderApp();
}

export function clearMaterialFilters() {
    materialFilters = { keyword: '', category: '', minStock: '', maxStock: '' };
    if (window.renderApp) window.renderApp();
}

export function renderMaterialSearchBar() {
    const categories = ['all', ...state.categories];
    return `
        <div class="card" style="margin-bottom: 16px;">
            <div class="sec-title">🔍 TÌM KIẾM VẬT TƯ</div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                <input type="text" id="mat-search-keyword" placeholder="Tên hoặc mã..." 
                       value="${escapeHtml(materialFilters.keyword)}" style="flex: 2; min-width: 150px;">
                <select id="mat-search-category" style="flex: 1; min-width: 120px;">
                    ${categories.map(c => `<option value="${c}" ${materialFilters.category === c ? 'selected' : ''}>${c === 'all' ? '📂 Tất cả' : c}</option>`).join('')}
                </select>
                <input type="number" id="mat-search-min" placeholder="Tồn ≥" 
                       value="${materialFilters.minStock || ''}" style="width: 100px;">
                <input type="number" id="mat-search-max" placeholder="Tồn ≤" 
                       value="${materialFilters.maxStock || ''}" style="width: 100px;">
                <button id="mat-clear-filters" class="sm" style="white-space: nowrap;">🗑️ Xóa</button>
            </div>
        </div>
    `;
}

export function bindMaterialSearchEvents() {
    const keywordInput = document.getElementById('mat-search-keyword');
    const categorySelect = document.getElementById('mat-search-category');
    const minInput = document.getElementById('mat-search-min');
    const maxInput = document.getElementById('mat-search-max');
    const clearBtn = document.getElementById('mat-clear-filters');
    
    const handleFilter = () => {
        materialFilters.keyword = keywordInput?.value || '';
        materialFilters.category = categorySelect?.value || '';
        materialFilters.minStock = minInput?.value || '';
        materialFilters.maxStock = maxInput?.value || '';
        if (window.renderApp) window.renderApp();
        setTimeout(() => bindMaterialSearchEvents(), 50);
    };
    
    if (keywordInput) keywordInput.oninput = handleFilter;
    if (categorySelect) categorySelect.onchange = handleFilter;
    if (minInput) minInput.oninput = handleFilter;
    if (maxInput) maxInput.oninput = handleFilter;
    if (clearBtn) clearBtn.onclick = () => {
        clearMaterialFilters();
        setTimeout(() => bindMaterialSearchEvents(), 50);
    };
}

// ========== CÁC HÀM XỬ LÝ CHÍNH ==========
export function addMaterial(data) {
    const newId = `M${String(state.nextId.material++).padStart(3, '0')}`;
    const newMat = {
        id: newId,
        name: data.name,
        cat: data.cat,
        unit: data.unit,
        qty: Number(data.qty) || 0,
        cost: Number(data.cost) || 0,
        low: Number(data.low) || 5
    };
    state.materials.push(newMat);
    addLog('Thêm vật tư', `${newMat.name} - SL: ${newMat.qty} - Giá: ${formatMoney(newMat.cost)}`);
    saveData();
    if (window.renderApp) window.renderApp();
    return newMat;
}

export function updateMaterial(id, updates) {
    const idx = state.materials.findIndex(m => m.id === id);
    if (idx !== -1) {
        state.materials[idx] = { ...state.materials[idx], ...updates };
        addLog('Sửa vật tư', `${state.materials[idx].name}`);
        saveData();
        if (window.renderApp) window.renderApp();
        return true;
    }
    return false;
}

export function deleteMaterial(id) {
    const mat = state.materials.find(m => m.id === id);
    if (!mat) return false;
    
    const relatedTx = state.transactions.filter(t => t.materialId === id);
    if (relatedTx.length > 0) {
        if (!confirm(`Vật tư này có ${relatedTx.length} giao dịch. Xóa sẽ mất dữ liệu. Tiếp tục?`)) {
            return false;
        }
    }
    
    state.materials = state.materials.filter(m => m.id !== id);
    addLog('Xóa vật tư', `${mat.name}`);
    saveData();
    if (window.renderApp) window.renderApp();
    return true;
}

// ========== RENDER DANH SÁCH ==========
export function renderMaterials() {
    const filtered = getFilteredMaterials();
    
    if (state.materials.length === 0) {
        return '<div class="card">📭 Chưa có vật tư nào. Hãy thêm mới.</div>';
    }
    
    return renderMaterialSearchBar() + `
        <div class="card">
            <div class="sec-title">📋 DANH SÁCH VẬT TƯ TỒN KHO (${filtered.length} sản phẩm)</div>
            ${filtered.length === 0 ? '<div class="metric-sub">📭 Không tìm thấy vật tư phù hợp</div>' : `
                <div class="tbl-wrap">
                    <table style="min-width:800px">
                        <thead>
                            <tr><th>Mã</th><th>Tên</th><th>Loại</th><th>ĐVT</th><th>Tồn</th><th>Đơn giá</th><th>TT</th><th>Thao tác</th></tr>
                        </thead>
                        <tbody>
                            ${filtered.map(m => `
                                <tr>
                                    <td>${m.id}</td>
                                    <td><strong>${escapeHtml(m.name)}</strong></td>
                                    <td>${m.cat}</td>
                                    <td>${m.unit}</td>
                                    <td>${m.qty}</td>
                                    <td>${formatMoney(m.cost)}</td>
                                    <td><span class="badge ${m.qty <= m.low ? 'low' : 'ok'}">${m.qty <= m.low ? '⚠️ Sắp hết' : '✅ OK'}</span></td>
                                    <td>
                                        <button class="sm" onclick="editMaterial('${m.id}')">✏️ Sửa</button>
                                        <button class="sm danger" onclick="deleteMaterial('${m.id}')">🗑️ Xóa</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

// ========== MODAL ==========
export function showAddMaterialModal() {
    const categories = state.categories.map(c => `<option>${c}</option>`).join('');
    const units = state.units.map(u => `<option>${u}</option>`).join('');
    
    showModal('➕ Thêm vật tư mới', `
        <div class="form-grid2">
            <div class="form-group form-full">
                <label>Tên vật tư *</label>
                <input id="mat-name" placeholder="VD: Thép tấm 12mm">
            </div>
            <div class="form-group">
                <label>Danh mục</label>
                <select id="mat-cat">${categories}</select>
            </div>
            <div class="form-group">
                <label>Đơn vị tính</label>
                <select id="mat-unit">${units}</select>
            </div>
            <div class="form-group">
                <label>Số lượng</label>
                <input id="mat-qty" type="number" value="0">
            </div>
            <div class="form-group">
                <label>Đơn giá (VNĐ)</label>
                <input id="mat-cost" type="number" value="0">
            </div>
            <div class="form-group">
                <label>Ngưỡng tồn kho</label>
                <input id="mat-low" type="number" value="5">
            </div>
        </div>
    `, () => {
        addMaterial({
            name: document.getElementById('mat-name').value,
            cat: document.getElementById('mat-cat').value,
            unit: document.getElementById('mat-unit').value,
            qty: document.getElementById('mat-qty').value,
            cost: document.getElementById('mat-cost').value,
            low: document.getElementById('mat-low').value
        });
    });
}

export function editMaterial(id) {
    const mat = state.materials.find(m => m.id === id);
    if (!mat) return;
    
    const categories = state.categories.map(c => `<option ${mat.cat === c ? 'selected' : ''}>${c}</option>`).join('');
    const units = state.units.map(u => `<option ${mat.unit === u ? 'selected' : ''}>${u}</option>`).join('');
    
    showModal('✏️ Sửa vật tư', `
        <div class="form-grid2">
            <div class="form-group form-full">
                <label>Tên vật tư</label>
                <input id="edit-name" value="${escapeHtml(mat.name)}">
            </div>
            <div class="form-group">
                <label>Danh mục</label>
                <select id="edit-cat">${categories}</select>
            </div>
            <div class="form-group">
                <label>Đơn vị</label>
                <select id="edit-unit">${units}</select>
            </div>
            <div class="form-group">
                <label>Đơn giá (VNĐ)</label>
                <input id="edit-cost" type="number" value="${mat.cost}">
            </div>
            <div class="form-group">
                <label>Ngưỡng tồn</label>
                <input id="edit-low" type="number" value="${mat.low}">
            </div>
        </div>
    `, () => {
        updateMaterial(id, {
            name: document.getElementById('edit-name').value,
            cat: document.getElementById('edit-cat').value,
            unit: document.getElementById('edit-unit').value,
            cost: Number(document.getElementById('edit-cost').value),
            low: Number(document.getElementById('edit-low').value)
        });
    });
}