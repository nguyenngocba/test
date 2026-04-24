import { state, addLog, escapeHtml } from './state.js';

// ========== CÁC HÀM HIỆN CÓ ==========
export function renderLogin() {
  return `<div class="login-wrap"><div class="login-card">
    <div style="font-family:var(--mono);font-size:20px;font-weight:600;color:var(--accent);margin-bottom:8px">🏭 STEEL/TRACK PRO</div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:28px">Quản lý kho & Công trình & Nhà cung cấp</div>
    ${state.data.users.map(u => `<div class="user-pill" onclick="login('${u.id}')">
        <div class="avatar">${u.name[0]}</div><div><div style="font-weight:500">${escapeHtml(u.name)}</div><div class="tag">${u.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</div></div>
    </div>`).join('')}
  </div></div>`;
}

export function login(uid) { 
  state.currentUser = state.data.users.find(u => u.id === uid); 
  addLog('Đăng nhập', `Đăng nhập thành công`);
  state.currentPane = 'entry'; 
  if (window.render) window.render();
}

export function logout() { 
  addLog('Đăng xuất', `Đăng xuất khỏi hệ thống`);
  state.currentUser = null; 
  if (window.render) window.render();
}

export function switchPane(pane) { 
  state.currentPane = pane; 
  if (window.render) window.render();
}

export function renderSidebar() {
  const hasAccessSettings = state.currentUser?.permissions?.canAccessSettings || state.currentUser?.role === 'admin';
  return `<div class="sidebar">
    <div class="sidebar-logo">🏭 STEEL/TRACK</div>
    <div class="sidebar-user"><div class="uname">${escapeHtml(state.currentUser.name)}</div><div class="urole">${state.currentUser.role === 'admin' ? 'Quản trị viên' : 'Nhân viên kho'}</div></div>
    <div class="nav-item ${state.currentPane === 'entry' ? 'active' : ''}" onclick="switchPane('entry')">📦 Quản lý kho</div>
    <div class="nav-item ${state.currentPane === 'dashboard' ? 'active' : ''}" onclick="switchPane('dashboard')">📊 Thống kê</div>
    <div class="nav-item ${state.currentPane === 'projects' ? 'active' : ''}" onclick="switchPane('projects')">🏗️ Công trình</div>
    <div class="nav-item ${state.currentPane === 'suppliers' ? 'active' : ''}" onclick="switchPane('suppliers')">🏭 Nhà cung cấp</div>
    <div class="nav-item ${state.currentPane === 'logs' ? 'active' : ''}" onclick="switchPane('logs')">📋 Nhật ký</div>
    ${hasAccessSettings ? `<div class="nav-item ${state.currentPane === 'settings' ? 'active' : ''}" onclick="switchPane('settings')">⚙️ Cài đặt</div>` : ''}
    <div class="sidebar-bottom"><button onclick="logout()" style="width:100%">🚪 Đăng xuất</button></div>
  </div>`;
}

export function renderTopbar() {
  let btns = '';
  const hasPermission = (perm) => state.currentUser?.permissions?.[perm] === true || state.currentUser?.role === 'admin';
  
  if (state.currentPane === 'entry') {
    btns = `${hasPermission('canCreateMaterial') ? `<button class="sm" onclick="openMatModal()">+ Thêm vật tư</button>` : ''}
            ${hasPermission('canImport') ? `<button class="sm primary" onclick="openPurchaseModal()">📥 Nhập kho</button>` : ''}
            ${hasPermission('canExport') ? `<button class="sm" onclick="openTxnModal('usage')">📤 Xuất kho</button>` : ''}
            <button class="sm" onclick="exportToExcel('materials')">📎 Export Excel</button>`;
  }
  if (state.currentPane === 'projects' && hasPermission('canCreateMaterial')) {
    btns = `<button class="sm primary" onclick="openProjectModal()">+ Công trình mới</button>
            <button class="sm" onclick="exportToExcel('projects')">📎 Export Excel</button>`;
  }
  if (state.currentPane === 'suppliers' && hasPermission('canManageSupplier')) {
    btns = `<button class="sm primary" onclick="openSupplierModal()">+ Nhà cung cấp mới</button>
            <button class="sm" onclick="exportToExcel('suppliers')">📎 Export Excel</button>`;
  }
  return `<div class="topbar"><span class="topbar-title">${getPaneTitle()}</span>${btns}</div>`;
}

export function getPaneTitle() {
  const titles = { entry: 'Quản lý tồn kho', dashboard: 'Bảng điều khiển trung tâm', projects: 'Quản lý công trình', suppliers: 'Quản lý nhà cung cấp', logs: 'Nhật ký hệ thống', settings: 'Cấu hình hệ thống' };
  return titles[state.currentPane] || '';
}

// ========== THÊM CÁC HÀM FORMAT TIỀN KHI NHẬP ==========

// Format số hiển thị có dấu phân cách hàng nghìn
export function formatNumberWithCommas(value) {
    if (value === undefined || value === null || value === '') return '';
    const numStr = value.toString().replace(/[^0-9.-]/g, '');
    const num = parseFloat(numStr);
    if (isNaN(num)) return '';
    return num.toLocaleString('vi-VN');
}

// Chuyển chuỗi có dấu phân cách thành số
export function unformatNumber(value) {
    if (!value) return 0;
    const numStr = value.toString().replace(/[^0-9.-]/g, '');
    return parseFloat(numStr) || 0;
}

// Xử lý sự kiện input cho ô số tiền (vừa nhập vừa format)
export function handleMoneyInput(event) {
    const input = event.target;
    const rawValue = input.value.replace(/[^0-9]/g, '');
    const number = parseInt(rawValue) || 0;
    const formatted = number.toLocaleString('vi-VN');
    input.value = formatted;
    input.setSelectionRange(input.value.length, input.value.length);
}

// Lấy giá trị số từ ô input đã format
export function getMoneyValue(inputElement) {
    if (!inputElement) return 0;
    const raw = inputElement.value.replace(/[^0-9]/g, '');
    return parseInt(raw) || 0;
}

// Format tiền cho value của input (dùng khi set giá trị)
export function setMoneyInputValue(inputElement, value) {
    if (!inputElement) return;
    const num = Number(value) || 0;
    inputElement.value = num.toLocaleString('vi-VN');
}

// Format số lượng (có thể có số thập phân)
export function formatQuantityWithCommas(value) {
    if (value === undefined || value === null || value === '') return '';
    const parts = value.toString().split('.');
    const integerPart = parseInt(parts[0]) || 0;
    const formattedInteger = integerPart.toLocaleString('vi-VN');
    if (parts.length > 1 && parts[1]) {
        return formattedInteger + '.' + parts[1];
    }
    return formattedInteger;
}

// Xử lý sự kiện input cho số lượng (có thể có số thập phân)
export function handleQuantityInput(event) {
    const input = event.target;
    let value = input.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[0]) {
        const integerPart = parseInt(parts[0]) || 0;
        const formattedInteger = integerPart.toLocaleString('vi-VN');
        if (parts.length > 1 && parts[1]) {
            input.value = formattedInteger + '.' + parts[1];
        } else {
            input.value = formattedInteger;
        }
    } else {
        input.value = value;
    }
    input.setSelectionRange(input.value.length, input.value.length);
}