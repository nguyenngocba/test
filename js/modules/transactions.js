import { state, saveData, addLog, formatMoney } from './state.js';
import { showModal } from './auth.js';
import { getMaterials } from './materials.js';
import { getProjects } from './projects.js';
import { getSuppliers } from './suppliers.js';

export function getTransactions() {
    return state.transactions;
}

// ==================== NHẬP KHO ====================
export function importMaterial(data) {
    const materials = getMaterials();
    const mat = materials.find(m => m.id === data.materialId);
    if (!mat) return { success: false, error: 'Không tìm thấy vật tư' };
    
    const qty = Number(data.qty);
    const price = Number(data.price);
    if (qty <= 0 || price <= 0) {
        return { success: false, error: 'Số lượng hoặc đơn giá không hợp lệ' };
    }
    
    const vat = Number(data.vat) || 0;
    const subtotal = qty * price;
    const vatAmount = subtotal * vat / 100;
    const total = subtotal + vatAmount;
    
    // Cập nhật tồn kho
    mat.qty += qty;
    
    const newId = `T${String(state.nextId.transaction++).padStart(3, '0')}`;
    state.transactions.unshift({
        id: newId,
        type: 'import',
        materialId: mat.id,
        materialName: mat.name,
        qty: qty,
        price: price,
        vat: vat,
        total: total,
        supplierId: data.supplierId,
        date: new Date().toISOString().split('T')[0],
        note: data.note || ''
    });
    
    addLog('Nhập kho', `${mat.name} - SL: ${qty} - ${formatMoney(total)}`);
    saveData();
    if (window.renderApp) window.renderApp();
    return { success: true };
}

// ==================== XUẤT KHO ====================
export function exportMaterial(data) {
    const materials = getMaterials();
    const mat = materials.find(m => m.id === data.materialId);
    if (!mat) return { success: false, error: 'Không tìm thấy vật tư' };
    
    const qty = Number(data.qty);
    if (qty <= 0) return { success: false, error: 'Số lượng không hợp lệ' };
    if (mat.qty < qty) {
        return { success: false, error: `Không đủ tồn kho! Còn ${mat.qty}` };
    }
    
    const total = qty * mat.cost;
    
    // Cập nhật tồn kho
    mat.qty -= qty;
    
    // Cập nhật chi phí công trình
    const projects = getProjects();
    const proj = projects.find(p => p.id === data.projectId);
    if (proj) {
        proj.spent = (proj.spent || 0) + total;
    }
    
    const newId = `T${String(state.nextId.transaction++).padStart(3, '0')}`;
    state.transactions.unshift({
        id: newId,
        type: 'export',
        materialId: mat.id,
        materialName: mat.name,
        qty: qty,
        price: mat.cost,
        total: total,
        projectId: data.projectId,
        projectName: proj?.name,
        date: new Date().toISOString().split('T')[0],
        note: data.note || ''
    });
    
    addLog('Xuất kho', `${mat.name} - SL: ${qty} - ${formatMoney(total)} - CT: ${proj?.name}`);
    saveData();
    if (window.renderApp) window.renderApp();
    return { success: true };
}

// ==================== HIỂN THỊ MODAL NHẬP KHO ====================
export function showImportModal() {
    const suppliers = getSuppliers();
    if (suppliers.length === 0) {
        alert('❌ Chưa có nhà cung cấp. Vui lòng thêm nhà cung cấp trước.');
        return;
    }
    
    const materials = getMaterials();
    if (materials.length === 0) {
        alert('❌ Chưa có vật tư. Vui lòng thêm vật tư trước.');
        return;
    }
    
    const supplierOptions = suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    const materialOptions = materials.map(m => `<option value="${m.id}">${m.name} (Tồn: ${m.qty})</option>`).join('');
    
    const modalContent = `
        <div class="form-group">
            <label>🏭 NHÀ CUNG CẤP</label>
            <select id="import-supplier" class="full-width">${supplierOptions}</select>
        </div>
        <div class="form-group">
            <label>📦 VẬT TƯ</label>
            <select id="import-material" class="full-width">${materialOptions}</select>
        </div>
        <div class="form-group">
            <label>🔢 SỐ LƯỢNG</label>
            <input type="number" id="import-qty" class="full-width" value="1" min="0.1" step="0.1">
        </div>
        <div class="form-group">
            <label>💰 ĐƠN GIÁ NHẬP (VNĐ)</label>
            <input type="number" id="import-price" class="full-width" placeholder="Nhập giá thực tế" min="0" step="1000">
        </div>
        <div class="form-group">
            <label>🧾 THUẾ VAT (%)</label>
            <input type="number" id="import-vat" class="full-width" value="10" min="0" max="100" step="0.5">
        </div>
        <div class="form-group">
            <label>📝 GHI CHÚ</label>
            <input type="text" id="import-note" class="full-width" placeholder="Mã hóa đơn, số chứng từ...">
        </div>
        <div class="metric-card" style="margin-top: 15px; background: var(--accent-bg);">
            <div class="metric-sub">💰 THÀNH TIỀN TRƯỚC VAT</div>
            <div class="metric-val" style="font-size: 18px;" id="preview-subtotal">0₫</div>
            <div class="metric-sub" style="margin-top: 8px;">🧾 TIỀN VAT</div>
            <div class="metric-val" style="font-size: 18px;" id="preview-vat">0₫</div>
            <div class="metric-sub" style="margin-top: 8px;">💵 TỔNG THANH TOÁN</div>
            <div class="metric-val" style="font-size: 22px; color: var(--success);" id="preview-total">0₫</div>
        </div>
    `;
    
    showModal('📥 NHẬP KHO', modalContent, () => {
        const supplierId = document.getElementById('import-supplier')?.value;
        const materialId = document.getElementById('import-material')?.value;
        const qty = parseFloat(document.getElementById('import-qty')?.value);
        const price = parseFloat(document.getElementById('import-price')?.value);
        const vat = parseFloat(document.getElementById('import-vat')?.value);
        const note = document.getElementById('import-note')?.value || '';
        
        const result = importMaterial({
            supplierId: supplierId,
            materialId: materialId,
            qty: qty,
            price: price,
            vat: vat,
            note: note
        });
        
        if (!result.success) {
            alert('❌ ' + result.error);
        }
    });
    
    // Gán sự kiện tính toán sau khi modal được render
    setTimeout(() => {
        const qtyInput = document.getElementById('import-qty');
        const priceInput = document.getElementById('import-price');
        const vatInput = document.getElementById('import-vat');
        const materialSelect = document.getElementById('import-material');
        const materials = getMaterials();
        
        // Hàm cập nhật preview
        const updatePreview = () => {
            const qty = parseFloat(qtyInput?.value) || 0;
            let price = parseFloat(priceInput?.value) || 0;
            const vat = parseFloat(vatInput?.value) || 0;
            
            // Nếu chưa nhập giá, lấy giá từ vật tư
            if (price === 0 && materialSelect?.value) {
                const mat = materials.find(m => m.id === materialSelect.value);
                if (mat && priceInput) {
                    price = mat.cost;
                    priceInput.value = price;
                }
            }
            
            const subtotal = qty * price;
            const vatAmount = subtotal * vat / 100;
            const total = subtotal + vatAmount;
            
            const subtotalEl = document.getElementById('preview-subtotal');
            const vatEl = document.getElementById('preview-vat');
            const totalEl = document.getElementById('preview-total');
            
            if (subtotalEl) subtotalEl.innerText = formatMoney(subtotal);
            if (vatEl) vatEl.innerText = formatMoney(vatAmount);
            if (totalEl) totalEl.innerText = formatMoney(total);
        };
        
        // Gán sự kiện
        if (qtyInput) qtyInput.addEventListener('input', updatePreview);
        if (priceInput) priceInput.addEventListener('input', updatePreview);
        if (vatInput) vatInput.addEventListener('input', updatePreview);
        if (materialSelect) {
            materialSelect.addEventListener('change', () => {
                const mat = materials.find(m => m.id === materialSelect.value);
                if (mat && priceInput && !priceInput.value) {
                    priceInput.value = mat.cost;
                }
                updatePreview();
            });
        }
        
        // Cập nhật lần đầu
        updatePreview();
    }, 100);
}

// ==================== HIỂN THỊ MODAL XUẤT KHO ====================
export function showExportModal() {
    const projects = getProjects();
    if (projects.length === 0) {
        alert('❌ Chưa có công trình. Vui lòng thêm công trình trước.');
        return;
    }
    
    const materials = getMaterials();
    if (materials.length === 0) {
        alert('❌ Chưa có vật tư. Vui lòng thêm vật tư trước.');
        return;
    }
    
    const projectOptions = projects.map(p => `<option value="${p.id}">${p.name} (Ngân sách: ${formatMoney(p.budget)})</option>`).join('');
    const materialOptions = materials.map(m => `<option value="${m.id}">${m.name} (Tồn: ${m.qty} - Đơn giá: ${formatMoney(m.cost)})</option>`).join('');
    
    const modalContent = `
        <div class="form-group">
            <label>🏗️ CÔNG TRÌNH</label>
            <select id="export-project" class="full-width">${projectOptions}</select>
        </div>
        <div class="form-group">
            <label>📦 VẬT TƯ</label>
            <select id="export-material" class="full-width">${materialOptions}</select>
        </div>
        <div class="form-group">
            <label>🔢 SỐ LƯỢNG XUẤT</label>
            <input type="number" id="export-qty" class="full-width" value="1" min="0.1" step="0.1">
        </div>
        <div class="form-group">
            <label>📝 GHI CHÚ</label>
            <input type="text" id="export-note" class="full-width" placeholder="Lý do xuất, vị trí sử dụng...">
        </div>
        <div class="metric-card" style="margin-top: 15px; background: var(--accent-bg);">
            <div class="metric-sub">💰 THÀNH TIỀN XUẤT KHO</div>
            <div class="metric-val" style="font-size: 22px; color: var(--warn);" id="preview-total">0₫</div>
        </div>
    `;
    
    showModal('📤 XUẤT KHO', modalContent, () => {
        const projectId = document.getElementById('export-project')?.value;
        const materialId = document.getElementById('export-material')?.value;
        const qty = parseFloat(document.getElementById('export-qty')?.value);
        const note = document.getElementById('export-note')?.value || '';
        
        const result = exportMaterial({
            projectId: projectId,
            materialId: materialId,
            qty: qty,
            note: note
        });
        
        if (!result.success) {
            alert('❌ ' + result.error);
        }
    });
    
    // Gán sự kiện tính toán sau khi modal được render
    setTimeout(() => {
        const qtyInput = document.getElementById('export-qty');
        const materialSelect = document.getElementById('export-material');
        const materials = getMaterials();
        
        const updatePreview = () => {
            const qty = parseFloat(qtyInput?.value) || 0;
            const mid = materialSelect?.value;
            const mat = materials.find(m => m.id === mid);
            const total = (mat?.cost || 0) * qty;
            const totalEl = document.getElementById('preview-total');
            if (totalEl) totalEl.innerText = formatMoney(total);
        };
        
        if (qtyInput) qtyInput.addEventListener('input', updatePreview);
        if (materialSelect) materialSelect.addEventListener('change', updatePreview);
        
        updatePreview();
    }, 100);
}

// ==================== LỊCH SỬ GIAO DỊCH ====================
export function renderTransactionHistory() {
    const transactions = state.transactions.slice(0, 50);
    
    if (transactions.length === 0) {
        return '<div class="metric-sub">📭 Chưa có giao dịch nào</div>';
    }
    
    return `
        <div class="tbl-wrap">
            <table style="min-width: 700px;">
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Loại</th>
                        <th>Vật tư</th>
                        <th>Số lượng</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                        <th>Đối tác</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(t => {
                        const mat = getMaterials().find(m => m.id === t.materialId);
                        const supplier = getSuppliers().find(s => s.id === t.supplierId);
                        const project = getProjects().find(p => p.id === t.projectId);
                        const partner = t.type === 'import' ? supplier?.name : project?.name;
                        return `
                            <tr>
                                <td>${t.date}</td>
                                <td><span class="badge ${t.type === 'import' ? 'ok' : 'low'}">${t.type === 'import' ? '📥 Nhập' : '📤 Xuất'}</span></td>
                                <td><strong>${t.materialName}</strong></td>
                                <td>${t.qty} ${mat?.unit || ''}</td>
                                <td>${formatMoney(t.price || t.price)}</td>
                                <td style="color: ${t.type === 'import' ? 'var(--success)' : 'var(--warn)'}">${formatMoney(t.total)}</td>
                                <td>${partner || '—'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ==================== THỐNG KÊ NHANH ====================
export function getTransactionStats() {
    const transactions = state.transactions;
    const totalImport = transactions.filter(t => t.type === 'import').reduce((s, t) => s + t.total, 0);
    const totalExport = transactions.filter(t => t.type === 'export').reduce((s, t) => s + t.total, 0);
    const importCount = transactions.filter(t => t.type === 'import').length;
    const exportCount = transactions.filter(t => t.type === 'export').length;
    
    return {
        totalImport,
        totalExport,
        importCount,
        exportCount,
        balance: totalImport - totalExport
    };
}

// ==================== XÓA GIAO DỊCH (nếu cần) ====================
export function deleteTransaction(id) {
    const txn = state.transactions.find(t => t.id === id);
    if (!txn) return { success: false, error: 'Không tìm thấy giao dịch' };
    
    if (!confirm(`Xóa giao dịch ${txn.type === 'import' ? 'nhập' : 'xuất'} kho này?`)) {
        return { success: false, cancelled: true };
    }
    
    // Hoàn tác ảnh hưởng của giao dịch
    const materials = getMaterials();
    const mat = materials.find(m => m.id === txn.materialId);
    
    if (mat) {
        if (txn.type === 'import') {
            mat.qty -= txn.qty;
        } else if (txn.type === 'export') {
            mat.qty += txn.qty;
            
            // Hoàn tác chi phí công trình
            if (txn.projectId) {
                const projects = getProjects();
                const proj = projects.find(p => p.id === txn.projectId);
                if (proj) {
                    proj.spent = (proj.spent || 0) - txn.total;
                }
            }
        }
    }
    
    // Xóa giao dịch
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveData();
    addLog('Xóa giao dịch', `${txn.type === 'import' ? 'Nhập' : 'Xuất'} kho ${txn.materialName} - SL: ${txn.qty}`);
    
    if (window.renderApp) window.renderApp();
    return { success: true };
}

// Bind events cho modal (để tránh lỗi khi gọi từ app.js)
export function bindImportEvents() {
    // Events sẽ được bind trong modal khi mở
}

export function bindExportEvents() {
    // Events sẽ được bind trong modal khi mở
}