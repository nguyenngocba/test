import { state, saveState, addLog, formatMoney, escapeHtml, showModal, closeModal, genMid, matById, hasPermission } from './state.js';

// ========== FILTER VẬT TƯ ==========
let materialFilters = { keyword: '', category: '', minStock: '', maxStock: '' };
let materialListContainer = null;

function getFilteredMaterials() {
    let result = [...state.data.materials];
    const f = materialFilters;
    
    if (f.keyword) {
        const kw = f.keyword.toLowerCase();
        result = result.filter(m => m.name.toLowerCase().includes(kw) || m.id.toLowerCase().includes(kw));
    }
    if (f.category && f.category !== 'all') {
        result = result.filter(m => m.cat === f.category);
    }
    if (f.minStock !== '' && f.minStock !== null && f.minStock !== undefined) {
        const min = Number(f.minStock);
        if (!isNaN(min)) result = result.filter(m => m.qty >= min);
    }
    if (f.maxStock !== '' && f.maxStock !== null && f.maxStock !== undefined) {
        const max = Number(f.maxStock);
        if (!isNaN(max)) result = result.filter(m => m.qty <= max);
    }
    return result;
}

function updateMaterialList() {
    if (!materialListContainer) return;
    const filtered = getFilteredMaterials();
    
    if (filtered.length === 0) {
        materialListContainer.innerHTML = '<div class="metric-sub">📭 Không tìm thấy vật tư phù hợp</div>';
        return;
    }
    
    materialListContainer.innerHTML = `
        <div class="tbl-wrap"><table style="min-width:900px"><thead><tr><th>Mã</th><th>Tên vật tư</th><th>Loại</th><th>ĐVT</th><th>Tồn kho</th><th>Đơn giá gốc</th><th>TT</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
        <tbody>${filtered.map(m => `<tr>
            <td style="font-family:mono">${m.id}</td>
            <td><strong>${escapeHtml(m.name)}</strong></td>
            <td>${m.cat}</td>
            <td>${m.unit}</td>
            <td style="font-weight:500">${m.qty.toLocaleString()}</td>
            <td>${formatMoney(m.cost)}</td>
            <td><span class="badge ${m.qty <= m.low ? 'b-low' : 'b-ok'}">${m.qty <= m.low ? '⚠️ Sắp hết' : '✅ OK'}</span></td>
            <td style="max-width:150px;white-space:normal;word-break:break-word">${escapeHtml(m.note || '—')}</td>
            <td>
                ${hasPermission('canEditMaterial') ? `<button class="sm" onclick="editMaterial('${m.id}')">✏️ Sửa</button>` : ''}
                ${hasPermission('canDeleteMaterial') ? `<button class="sm danger-btn" onclick="deleteMaterial('${m.id}')">🗑️ Xóa</button>` : ''}
            </td>
        </tr>`).join('')}</tbody></table></div>
    `;
}

function renderMaterialSearchBar() {
    const categories = ['all', ...state.data.categories];
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
                <button id="mat-clear-filters" class="sm">🗑️ Xóa</button>
            </div>
        </div>
    `;
}

function bindMaterialSearchEvents() {
    const keywordInput = document.getElementById('mat-search-keyword');
    const categorySelect = document.getElementById('mat-search-category');
    const minInput = document.getElementById('mat-search-min');
    const maxInput = document.getElementById('mat-search-max');
    const clearBtn = document.getElementById('mat-clear-filters');
    
    const updateFilters = () => {
        materialFilters.keyword = keywordInput?.value || '';
        materialFilters.category = categorySelect?.value || '';
        materialFilters.minStock = minInput?.value || '';
        materialFilters.maxStock = maxInput?.value || '';
        updateMaterialList(); // Chỉ cập nhật danh sách, không render lại toàn bộ
    };
    
    if (keywordInput) keywordInput.oninput = updateFilters;
    if (categorySelect) categorySelect.onchange = updateFilters;
    if (minInput) minInput.oninput = updateFilters;
    if (maxInput) maxInput.oninput = updateFilters;
    if (clearBtn) clearBtn.onclick = () => {
        materialFilters = { keyword: '', category: '', minStock: '', maxStock: '' };
        if (keywordInput) keywordInput.value = '';
        if (categorySelect) categorySelect.value = 'all';
        if (minInput) minInput.value = '';
        if (maxInput) maxInput.value = '';
        updateMaterialList();
    };
}

// ========== RENDER CHÍNH ==========
export function renderEntry() {
  if (state.data.materials.length === 0) return `<div class="card">📭 Chưa có vật tư nào. Hãy thêm mới.</div>`;
  
  const filtered = getFilteredMaterials();
  const result = renderMaterialSearchBar() + `<div class="card">
    <div class="sec-title">📋 DANH SÁCH VẬT TƯ TỒN KHO (${filtered.length} sản phẩm)</div>
    <div id="material-list-container">${filtered.length === 0 ? '<div class="metric-sub">📭 Không tìm thấy vật tư phù hợp</div>' : `
        <div class="tbl-wrap"><table style="min-width:900px"><thead><tr><th>Mã</th><th>Tên vật tư</th><th>Loại</th><th>ĐVT</th><th>Tồn kho</th><th>Đơn giá gốc</th><th>TT</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
        <tbody>${filtered.map(m => `<tr>
            <td style="font-family:mono">${m.id}</td>
            <td><strong>${escapeHtml(m.name)}</strong></td>
            <td>${m.cat}</td>
            <td>${m.unit}</td>
            <td style="font-weight:500">${m.qty.toLocaleString()}</td>
            <td>${formatMoney(m.cost)}</td>
            <td><span class="badge ${m.qty <= m.low ? 'b-low' : 'b-ok'}">${m.qty <= m.low ? '⚠️ Sắp hết' : '✅ OK'}</span></td>
            <td style="max-width:150px;white-space:normal;word-break:break-word">${escapeHtml(m.note || '—')}</td>
            <td>
                ${hasPermission('canEditMaterial') ? `<button class="sm" onclick="editMaterial('${m.id}')">✏️ Sửa</button>` : ''}
                ${hasPermission('canDeleteMaterial') ? `<button class="sm danger-btn" onclick="deleteMaterial('${m.id}')">🗑️ Xóa</button>` : ''}
            </td>
        </tr>`).join('')}</tbody></table></div>
    `}</div>
  </div>`;
  
  setTimeout(() => {
      bindMaterialSearchEvents();
      materialListContainer = document.getElementById('material-list-container');
  }, 50);
  return result;
}

// Các hàm khác giữ nguyên
export function openMatModal() {
  if (!hasPermission('canCreateMaterial')) { alert('Bạn không có quyền thêm vật tư'); return; }
  showModal(`<div class="modal-hd"><span class="modal-title">➕ Thêm vật tư mới</span><button class="xbtn" onclick="closeModal()">✕</button></div>
    <div class="modal-bd"><div class="form-grid2">
      <div class="form-group form-full"><label class="form-label">Tên vật tư *</label><input id="mn-name" placeholder="VD: Thép tấm 12mm"></div>
      <div class="form-group"><label class="form-label">Danh mục</label><select id="mn-cat">${state.data.categories.map(c => `<option>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Đơn vị tính</label><select id="mn-unit">${state.data.units.map(u => `<option>${u}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Số lượng nhập đầu</label><input id="mn-qty" type="number" value="0" step="any"></div>
      <div class="form-group"><label class="form-label">Đơn giá (VNĐ)</label><input id="mn-cost" type="number" value="0"></div>
      <div class="form-group"><label class="form-label">Ngưỡng cảnh báo tồn</label><input id="mn-low" type="number" value="5"></div>
      <div class="form-group form-full"><label class="form-label">Ghi chú</label><textarea id="mn-note" rows="2" placeholder="Ghi chú thêm về vật tư..."></textarea></div>
    </div></div>
    <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="saveMat()">Lưu vật tư</button></div>`);
}

export function saveMat() {
  const name = document.getElementById('mn-name')?.value.trim();
  if(!name) return alert('Vui lòng nhập tên vật tư');
  const newMat = {
    id: genMid(), name, cat: document.getElementById('mn-cat').value,
    unit: document.getElementById('mn-unit').value,
    qty: parseFloat(document.getElementById('mn-qty').value) || 0,
    cost: parseFloat(document.getElementById('mn-cost').value) || 0,
    low: parseFloat(document.getElementById('mn-low').value) || 5,
    note: document.getElementById('mn-note')?.value || ''
  };
  state.data.materials.push(newMat);
  addLog('Thêm vật tư', `Đã thêm vật tư: ${name} (${newMat.id}) - SL: ${newMat.qty} ${newMat.unit} - Giá: ${formatMoney(newMat.cost)}`);
  saveState(); closeModal(); 
  if (window.render) window.render();
}

export function editMaterial(mid) {
  if (!hasPermission('canEditMaterial')) { alert('Bạn không có quyền sửa vật tư'); return; }
  const mat = matById(mid);
  if (!mat) return;
  showModal(`<div class="modal-hd"><span class="modal-title">✏️ Sửa vật tư</span><button class="xbtn" onclick="closeModal()">✕</button></div>
    <div class="modal-bd"><div class="form-grid2">
      <div class="form-group form-full"><label class="form-label">Tên vật tư *</label><input id="mn-name" value="${escapeHtml(mat.name)}" placeholder="VD: Thép tấm 12mm"></div>
      <div class="form-group"><label class="form-label">Danh mục</label><select id="mn-cat">${state.data.categories.map(c => `<option ${mat.cat === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Đơn vị tính</label><select id="mn-unit">${state.data.units.map(u => `<option ${mat.unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Đơn giá (VNĐ)</label><input id="mn-cost" type="number" value="${mat.cost}"></div>
      <div class="form-group"><label class="form-label">Ngưỡng cảnh báo tồn</label><input id="mn-low" type="number" value="${mat.low}"></div>
      <div class="form-group form-full"><label class="form-label">Ghi chú</label><textarea id="mn-note" rows="2">${escapeHtml(mat.note || '')}</textarea></div>
    </div></div>
    <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="updateMaterial('${mid}')">Cập nhật</button></div>`);
}

export function updateMaterial(mid) {
  const mat = matById(mid);
  if (!mat) return;
  const name = document.getElementById('mn-name')?.value.trim();
  if (!name) return alert('Vui lòng nhập tên vật tư');
  mat.name = name;
  mat.cat = document.getElementById('mn-cat').value;
  mat.unit = document.getElementById('mn-unit').value;
  mat.cost = parseFloat(document.getElementById('mn-cost').value) || 0;
  mat.low = parseFloat(document.getElementById('mn-low').value) || 5;
  mat.note = document.getElementById('mn-note')?.value || '';
  addLog('Sửa vật tư', `Đã cập nhật vật tư: ${name} (${mid})`);
  saveState(); closeModal(); if(window.render) window.render();
}

export function deleteMaterial(mid) {
  if (!hasPermission('canDeleteMaterial')) { alert('Bạn không có quyền xóa vật tư'); return; }
  const mat = matById(mid);
  if (!confirm(`⚠️ Xóa vật tư "${mat?.name}" sẽ xóa toàn bộ lịch sử nhập/xuất liên quan. Tiếp tục?`)) return;
  state.data.materials = state.data.materials.filter(m => m.id !== mid);
  state.data.transactions = state.data.transactions.filter(t => t.mid !== mid);
  addLog('Xóa vật tư', `Đã xóa vật tư: ${mat?.name} (${mid})`);
  saveState(); if(window.render) window.render();
}