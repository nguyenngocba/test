import { state, saveState, addLog, formatMoney, escapeHtml, showModal, closeModal, genSid, supplierById, hasPermission } from './state.js';

// ========== SỬA FILTER DÙNG BIẾN CỤC BỘ ==========
let supplierSearchKeyword = '';

function getFilteredSuppliers() {
    if (!supplierSearchKeyword) return [...state.data.suppliers];
    const kw = supplierSearchKeyword.toLowerCase();
    return state.data.suppliers.filter(s => 
        s.name.toLowerCase().includes(kw) || 
        s.id.toLowerCase().includes(kw) ||
        (s.phone && s.phone.includes(kw))
    );
}

function renderSupplierSearchBar() {
    return `
        <div class="card" style="margin-bottom: 16px;">
            <div class="sec-title">🔍 TÌM KIẾM NHÀ CUNG CẤP</div>
            <div style="display: flex; gap: 10px;">
                <input type="text" id="sup-search" placeholder="Tên, mã hoặc số điện thoại..." 
                       value="${escapeHtml(supplierSearchKeyword)}" style="flex: 1;">
                <button id="sup-clear-search" class="sm">✖️ Xóa</button>
            </div>
        </div>
    `;
}

function bindSupplierSearchEvents() {
    const searchInput = document.getElementById('sup-search');
    const clearBtn = document.getElementById('sup-clear-search');
    
    const handleSearch = () => {
        supplierSearchKeyword = searchInput?.value || '';
        if (window.render) window.render();
        setTimeout(() => bindSupplierSearchEvents(), 50);
    };
    
    if (searchInput) searchInput.oninput = handleSearch;
    if (clearBtn) clearBtn.onclick = () => {
        supplierSearchKeyword = '';
        if (window.render) window.render();
        setTimeout(() => bindSupplierSearchEvents(), 50);
    };
}

// ========== SỬA LẠI HÀM renderSuppliers ==========
export function renderSuppliers() {
  const filtered = getFilteredSuppliers();
  
  return renderSupplierSearchBar() + `<div class="card"><div class="sec-title">🏭 DANH SÁCH NHÀ CUNG CẤP (${filtered.length})</div>
    <div class="grid2" style="grid-template-columns:repeat(auto-fill, minmax(350px,1fr))">
      ${filtered.map(s => {
        const purchaseTxns = state.data.transactions.filter(t => t.type === 'purchase' && t.supplierId === s.id);
        const totalSpent = purchaseTxns.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        return `<div class="supplier-card">
          <div style="display:flex;justify-content:space-between;align-items:center"><strong>${escapeHtml(s.name)}</strong> <span class="tag">${s.id}</span></div>
          <div class="metric-sub">📞 ${s.phone || 'Chưa có'}</div>
          <div class="metric-sub">✉️ ${s.email || 'Chưa có'}</div>
          <div class="metric-sub">📍 ${s.address || 'Chưa có'}</div>
          <div class="metric-sub" style="color:var(--success-text);margin-top:8px">💰 Tổng chi: ${formatMoney(totalSpent)}</div>
          <div style="margin-top:8px;display:flex;gap:8px">
            <button class="sm" onclick="openSupplierModal(${JSON.stringify(s).replace(/"/g, '&quot;')})">✏️ Sửa</button>
            <button class="sm danger-btn" onclick="deleteSupplier('${s.id}')">🗑️ Xóa</button>
            <button class="sm" onclick="viewSupplierHistory('${s.id}')">📜 Lịch sử</button>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div id="supplier-history-modal" style="display:none"></div>
  </div>`;
  
  // Gán sự kiện tìm kiếm sau khi render
  setTimeout(() => bindSupplierSearchEvents(), 50);
}

// Các hàm khác giữ nguyên
export function openSupplierModal(supplier = null) {
  if (!hasPermission('canManageSupplier')) { alert('Bạn không có quyền quản lý nhà cung cấp'); return; }
  const isEdit = !!supplier;
  showModal(`<div class="modal-hd"><span class="modal-title">${isEdit ? '✏️ Sửa nhà cung cấp' : '➕ Thêm nhà cung cấp mới'}</span><button class="xbtn" onclick="closeModal()">✕</button></div>
    <div class="modal-bd">
      <div class="form-group"><label class="form-label">Tên nhà cung cấp *</label><input id="sup-name" value="${supplier ? escapeHtml(supplier.name) : ''}" placeholder="VD: Công ty Thép ABC"></div>
      <div class="form-group"><label class="form-label">Số điện thoại</label><input id="sup-phone" value="${supplier ? escapeHtml(supplier.phone || '') : ''}" placeholder="VD: 0912 345 678"></div>
      <div class="form-group"><label class="form-label">Email</label><input id="sup-email" value="${supplier ? escapeHtml(supplier.email || '') : ''}" placeholder="VD: contact@thepabc.com"></div>
      <div class="form-group"><label class="form-label">Địa chỉ</label><input id="sup-address" value="${supplier ? escapeHtml(supplier.address || '') : ''}" placeholder="VD: Hà Nội"></div>
    </div>
    <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="${isEdit ? `updateSupplier('${supplier.id}')` : 'saveSupplier()'}">${isEdit ? 'Cập nhật' : 'Lưu'}</button></div>`);
}

export function saveSupplier() {
  const name = document.getElementById('sup-name')?.value.trim();
  if (!name) return alert('Vui lòng nhập tên nhà cung cấp');
  const newSupplier = {
    id: genSid(),
    name: name,
    phone: document.getElementById('sup-phone')?.value || '',
    email: document.getElementById('sup-email')?.value || '',
    address: document.getElementById('sup-address')?.value || ''
  };
  state.data.suppliers.push(newSupplier);
  addLog('Thêm nhà cung cấp', `Đã thêm nhà cung cấp: ${name} (${newSupplier.id})`);
  saveState(); closeModal(); if(window.render) window.render();
}

export function updateSupplier(sid) {
  const supplier = supplierById(sid);
  if (!supplier) return;
  const name = document.getElementById('sup-name')?.value.trim();
  if (!name) return alert('Vui lòng nhập tên nhà cung cấp');
  supplier.name = name;
  supplier.phone = document.getElementById('sup-phone')?.value || '';
  supplier.email = document.getElementById('sup-email')?.value || '';
  supplier.address = document.getElementById('sup-address')?.value || '';
  addLog('Cập nhật nhà cung cấp', `Đã cập nhật thông tin nhà cung cấp: ${name} (${sid})`);
  saveState(); closeModal(); if(window.render) window.render();
}

export function deleteSupplier(sid) {
  if (!hasPermission('canManageSupplier')) { alert('Bạn không có quyền xóa nhà cung cấp'); return; }
  const supplier = supplierById(sid);
  if (!supplier) return;
  const relatedTxns = state.data.transactions.filter(t => t.supplierId === sid);
  if (relatedTxns.length > 0) {
    if (!confirm(`⚠️ Nhà cung cấp "${supplier.name}" đã có ${relatedTxns.length} giao dịch nhập hàng.\nXóa sẽ XÓA LUÔN các giao dịch này.\nBạn có chắc chắn?`)) return;
  } else {
    if (!confirm(`Xóa nhà cung cấp "${supplier.name}"?`)) return;
  }
  state.data.suppliers = state.data.suppliers.filter(s => s.id !== sid);
  state.data.transactions = state.data.transactions.filter(t => t.supplierId !== sid);
  addLog('Xóa nhà cung cấp', `Đã xóa nhà cung cấp: ${supplier.name} (${sid})`);
  saveState(); if(window.render) window.render();
}

// Giữ lại các hàm filter cũ để tương thích
export function filterSuppliers() {}
export function clearSupplierSearch() {}

export function viewSupplierHistory(sid) {
  const supplier = supplierById(sid);
  const purchaseTxns = state.data.transactions.filter(t => t.type === 'purchase' && t.supplierId === sid).sort((a,b) => new Date(b.date) - new Date(a.date));
  const totalSpent = purchaseTxns.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
  
  showModal(`<div class="modal-hd"><span class="modal-title">📜 Lịch sử nhập hàng - ${escapeHtml(supplier?.name)}</span><button class="xbtn" onclick="closeModal()">✕</button></div>
    <div class="modal-bd">
      <div class="metric-card" style="margin-bottom:16px"><div class="metric-label">Tổng chi</div><div class="metric-val" style="font-size:20px">${formatMoney(totalSpent)}</div></div>
      <div class="tbl-wrap"><table style="min-width:500px"><thead><tr><th>Ngày</th><th>Vật tư</th><th>SL</th><th>Đơn giá</th><th>VAT</th><th>Thành tiền</th></tr></thead>
      <tbody>${purchaseTxns.map(t => {
        const mat = state.data.materials.find(m => m.id === t.mid);
        return `<tr>
          <td>${t.date}</td>
          <td>${mat?.name || 'N/A'}</td>
          <td>${t.qty} ${mat?.unit || ''}</td>
          <td>${formatMoney(t.unitPrice)}</td>
          <td>${t.vatRate || 0}%</td>
          <td class="text-warning">${formatMoney(t.totalAmount || 0)}</td>
        </tr>`;
      }).join('') || '<tr><td colspan="6">Chưa có giao dịch nào</td></tr>'}</tbody></table></div>
      ${purchaseTxns.filter(t => t.invoiceImage).length > 0 ? `<div class="sec-title" style="margin-top:16px">📎 Hóa đơn đính kèm</div>
      ${purchaseTxns.filter(t => t.invoiceImage).map(t => `<div><a href="${t.invoiceImage}" target="_blank">📄 Xem hóa đơn ngày ${t.date}</a></div>`).join('')}` : ''}
    </div>
    <div class="modal-ft"><button onclick="closeModal()">Đóng</button></div>`);
}