import { state, saveState, addLog, formatMoney, showModal, closeModal, genTid, matById, projectById, supplierById, hasPermission } from './state.js';
import { handleMoneyInput, handleQuantityInput, getMoneyValue, setMoneyInputValue } from './utils.js';
let currentInvoiceBase64 = null;

export function openPurchaseModal() {
  if (!hasPermission('canImport')) { alert('Bạn không có quyền nhập kho'); return; }
  if(state.data.materials.length === 0) return alert('Chưa có vật tư trong kho');
  if(state.data.suppliers.length === 0) return alert('Chưa có nhà cung cấp. Vào mục Nhà cung cấp để thêm.');
  
  const optsMat = state.data.materials.map(m => `<option value="${m.id}">${m.name} (Đơn giá gốc: ${formatMoney(m.cost)}/${m.unit})</option>`).join('');
  const optsSup = state.data.suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  
  showModal(`<div class="modal-hd"><span class="modal-title">📥 Nhập kho (Có VAT & Hóa đơn)</span><button class="xbtn" onclick="closeModal()">✕</button></div>
    <div class="modal-bd">
      <div class="form-group"><label class="form-label">🏭 Nhà cung cấp</label><select id="purchase-supplier">${optsSup}</select></div>
      <div class="form-group"><label class="form-label">📦 Vật tư</label><select id="purchase-mid">${optsMat}</select></div>
      <div class="form-group"><label class="form-label">🔢 Số lượng</label><input id="purchase-qty" type="number" value="1" step="any" oninput="calculatePurchaseTotal()"></div>
      <div class="form-group"><label class="form-label">💰 Đơn giá nhập (VNĐ)</label><input id="purchase-price" type="number" value="" placeholder="Nhập giá thực tế" oninput="calculatePurchaseTotal()"></div>
      <div class="form-group"><label class="form-label">🧾 Thuế VAT (%)</label><input id="purchase-vat" type="number" value="10" step="0.1" oninput="calculatePurchaseTotal()"></div>
      <div class="metric-card" style="margin-bottom:12px">
        <div class="metric-sub">💰 Thành tiền trước VAT: <strong id="preview-subtotal">0 VNĐ</strong></div>
        <div class="metric-sub">🧾 Tiền VAT: <strong id="preview-vat">0 VNĐ</strong></div>
        <div class="metric-val" style="font-size:18px">💵 Tổng thanh toán: <strong id="preview-total">0 VNĐ</strong></div>
      </div>
      <div class="form-group"><label class="form-label">📎 Ảnh hóa đơn (tùy chọn)</label><input type="file" id="purchase-invoice" accept="image/*" onchange="previewInvoiceImage()"></div>
      <div id="invoice-preview"></div>
      <div class="form-group"><label class="form-label">📝 Ghi chú</label><input id="purchase-note" placeholder="Mã hóa đơn, số chứng từ..."></div>
    </div>
    <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="savePurchase()">Xác nhận nhập kho</button></div>`);
  
  const midSelect = document.getElementById('purchase-mid');
  const updateDefaultPrice = () => {
    const mid = midSelect.value;
    const mat = matById(mid);
    if (mat && document.getElementById('purchase-price').value === '') {
      document.getElementById('purchase-price').value = mat.cost;
      calculatePurchaseTotal();
    }
  };
  midSelect.addEventListener('change', updateDefaultPrice);
  setTimeout(updateDefaultPrice, 50);
}

export function calculatePurchaseTotal() {
  const qty = parseFloat(document.getElementById('purchase-qty')?.value) || 0;
  const price = parseFloat(document.getElementById('purchase-price')?.value) || 0;
  const vatRate = parseFloat(document.getElementById('purchase-vat')?.value) || 0;
  
  const subtotal = qty * price;
  const vatAmount = subtotal * vatRate / 100;
  const total = subtotal + vatAmount;
  
  const subtotalEl = document.getElementById('preview-subtotal');
  const vatEl = document.getElementById('preview-vat');
  const totalEl = document.getElementById('preview-total');
  if (subtotalEl) subtotalEl.innerText = formatMoney(subtotal);
  if (vatEl) vatEl.innerText = formatMoney(vatAmount);
  if (totalEl) totalEl.innerText = formatMoney(total);
}

window.previewInvoiceImage = function() {
  const file = document.getElementById('purchase-invoice')?.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    currentInvoiceBase64 = e.target.result;
    const previewDiv = document.getElementById('invoice-preview');
    if (previewDiv) {
      previewDiv.innerHTML = `<img src="${currentInvoiceBase64}" class="invoice-img" onclick="window.open(this.src)"><br><button class="sm" onclick="clearInvoiceImage()">🗑️ Xóa ảnh</button>`;
    }
  };
  reader.readAsDataURL(file);
};

window.clearInvoiceImage = function() {
  currentInvoiceBase64 = null;
  const previewDiv = document.getElementById('invoice-preview');
  if (previewDiv) previewDiv.innerHTML = '';
  const fileInput = document.getElementById('purchase-invoice');
  if (fileInput) fileInput.value = '';
};

export function savePurchase() {
  const supplierId = document.getElementById('purchase-supplier')?.value;
  const mid = document.getElementById('purchase-mid')?.value;
  const qty = parseFloat(document.getElementById('purchase-qty')?.value);
  const unitPrice = parseFloat(document.getElementById('purchase-price')?.value);
  const vatRate = parseFloat(document.getElementById('purchase-vat')?.value) || 0;
  const note = document.getElementById('purchase-note')?.value || '';
  
  if (!supplierId) return alert('Chọn nhà cung cấp');
  if (!mid) return alert('Chọn vật tư');
  if (!qty || qty <= 0) return alert('Số lượng không hợp lệ');
  if (!unitPrice || unitPrice <= 0) return alert('Đơn giá nhập không hợp lệ');
  
  const mat = matById(mid);
  if (!mat) return alert('Không tìm thấy vật tư');
  
  const subtotal = qty * unitPrice;
  const vatAmount = subtotal * vatRate / 100;
  const totalAmount = subtotal + vatAmount;
  
  mat.qty += qty;
  
  const transaction = {
    id: genTid(),
    mid: mid,
    supplierId: supplierId,
    date: new Date().toISOString().split('T')[0],
    type: 'purchase',
    qty: qty,
    unitPrice: unitPrice,
    vatRate: vatRate,
    subtotal: subtotal,
    vatAmount: vatAmount,
    totalAmount: totalAmount,
    note: note,
    invoiceImage: currentInvoiceBase64 || null
  };
  
  state.data.transactions.unshift(transaction);
  
  const supplier = supplierById(supplierId);
  addLog('Nhập kho', `${mat.name} - SL: ${qty} ${mat.unit} - Giá nhập: ${formatMoney(unitPrice)} - VAT: ${vatRate}% - Tổng: ${formatMoney(totalAmount)} - Nhà cung cấp: ${supplier?.name}`);
  
  saveState(); 
  closeModal(); 
  currentInvoiceBase64 = null;
  if(window.render) window.render();
}

export function openTxnModal(type) {
  if(type === 'usage' && !hasPermission('canExport')) { alert('Bạn không có quyền xuất kho'); return; }
  if(state.data.materials.length === 0) return alert('Chưa có vật tư trong kho');
  if(type === 'usage' && state.data.projects.length === 0) return alert('Chưa có công trình nào. Hãy thêm công trình trước.');
  
  const optsMat = state.data.materials.map(m => `<option value="${m.id}">${m.name} (Tồn: ${m.qty} ${m.unit})</option>`).join('');
  const optsProj = state.data.projects.map(p => `<option value="${p.id}">${p.name} (Ngân sách: ${formatMoney(p.budget)})</option>`).join('');
  
  showModal(`<div class="modal-hd"><span class="modal-title">📤 Xuất kho cho công trình</span><button class="xbtn" onclick="closeModal()">✕</button></div>
    <div class="modal-bd">
      <div class="form-group"><label class="form-label">🏗️ Công trình thi công</label><select id="txn-project">${optsProj}</select></div>
      <div class="form-group"><label class="form-label">📦 Vật tư</label><select id="txn-mid">${optsMat}</select></div>
      <div class="form-group"><label class="form-label">🔢 Số lượng</label><input id="txn-qty" type="number" value="1" step="any" oninput="calculateExportTotal()"></div>
      <div class="metric-card" style="margin-top:8px"><div class="metric-sub">💰 Thành tiền dự kiến: <strong id="preview-export-total">0 VNĐ</strong></div></div>
      <div class="form-group"><label class="form-label">📝 Ghi chú</label><input id="txn-note" placeholder="Mô tả thêm"></div>
    </div>
    <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="saveExport()">Xác nhận xuất kho</button></div>`);
  
  const qtyInput = document.getElementById('txn-qty');
  const midSelect = document.getElementById('txn-mid');
  const updatePreview = () => {
    const mid = midSelect.value;
    const mat = matById(mid);
    const qty = parseFloat(qtyInput.value) || 0;
    const total = (mat?.cost || 0) * qty;
    const previewEl = document.getElementById('preview-export-total');
    if (previewEl) previewEl.innerText = formatMoney(total);
  };
  qtyInput.addEventListener('input', updatePreview);
  midSelect.addEventListener('change', updatePreview);
  setTimeout(updatePreview, 50);
}

export function calculateExportTotal() {
  const mid = document.getElementById('txn-mid')?.value;
  const mat = matById(mid);
  const qty = parseFloat(document.getElementById('txn-qty')?.value) || 0;
  const total = (mat?.cost || 0) * qty;
  const previewEl = document.getElementById('preview-export-total');
  if (previewEl) previewEl.innerText = formatMoney(total);
}

export function saveExport() {
  const projectId = document.getElementById('txn-project')?.value;
  const mid = document.getElementById('txn-mid')?.value;
  const qty = parseFloat(document.getElementById('txn-qty')?.value);
  const note = document.getElementById('txn-note')?.value || '';
  
  if (!projectId) return alert('Chọn công trình');
  if (!mid) return alert('Chọn vật tư');
  if (!qty || qty <= 0) return alert('Số lượng không hợp lệ');
  
  const mat = matById(mid);
  if (!mat) return alert('Không tìm thấy vật tư');
  if (mat.qty < qty) return alert(`Không đủ tồn kho! Hiện còn ${mat.qty} ${mat.unit}`);
  
  const totalAmount = qty * mat.cost;
  
  mat.qty -= qty;
  const project = projectById(projectId);
  if (project) project.spent = (project.spent || 0) + totalAmount;
  
  const transaction = {
    id: genTid(),
    mid: mid,
    projectId: projectId,
    date: new Date().toISOString().split('T')[0],
    type: 'usage',
    qty: qty,
    unitPrice: mat.cost,
    totalAmount: totalAmount,
    note: note
  };
  
  state.data.transactions.unshift(transaction);
  addLog('Xuất kho', `${mat.name} - SL: ${qty} ${mat.unit} - Công trình: ${project?.name} - Thành tiền: ${formatMoney(totalAmount)}`);
  
  saveState(); 
  closeModal(); 
  if(window.render) window.render();
}
// Thêm vào cuối file, trước export
window.previewInvoiceImage = function() {
    const file = document.getElementById('purchase-invoice')?.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        window.currentInvoiceBase64 = e.target.result;
        const previewDiv = document.getElementById('invoice-preview');
        if (previewDiv) {
            previewDiv.innerHTML = `<img src="${window.currentInvoiceBase64}" class="invoice-img" onclick="window.open(this.src)"><br><button class="sm" onclick="clearInvoiceImage()">🗑️ Xóa ảnh</button>`;
        }
    };
    reader.readAsDataURL(file);
};

window.clearInvoiceImage = function() {
    window.currentInvoiceBase64 = null;
    const previewDiv = document.getElementById('invoice-preview');
    if (previewDiv) previewDiv.innerHTML = '';
    const fileInput = document.getElementById('purchase-invoice');
    if (fileInput) fileInput.value = '';
};