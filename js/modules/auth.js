import { state, addLog, formatMoney, escapeHtml } from './state.js';

export function getCurrentUser() {
    return state.currentUser;
}

export function setCurrentUser(user) {
    state.currentUser = user;
}

export function switchPane(pane) {
    state.currentPane = pane;
    if (window.renderApp) window.renderApp();
}

export function renderLogin() {
    const users = [
        { id: 'u1', name: 'Admin', role: 'admin' },
        { id: 'u2', name: 'Nhân viên kho', role: 'user' }
    ];
    
    return `
        <div class="login-wrap">
            <div class="login-card">
                <div style="font-size:20px;font-weight:700;color:var(--accent);margin-bottom:8px">🏭 STEEL/TRACK PRO</div>
                <div style="font-size:13px;color:var(--muted);margin-bottom:28px">Quản lý kho & Công trình</div>
                ${users.map(u => `
                    <div class="user-pill" onclick="login('${u.id}')">
                        <div class="avatar">${u.name[0]}</div>
                        <div>
                            <div style="font-weight:500">${escapeHtml(u.name)}</div>
                            <div class="tag">${u.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

export function renderSidebar() {
    const user = state.currentUser;
    const currentPane = state.currentPane;
    
    const navItems = [
        { id: 'entry', icon: '📦', label: 'Quản lý kho' },
        { id: 'dashboard', icon: '📊', label: 'Thống kê' },
        { id: 'projects', icon: '🏗️', label: 'Công trình' },
        { id: 'suppliers', icon: '🏭', label: 'Nhà cung cấp' },
        { id: 'logs', icon: '📋', label: 'Nhật ký' }
    ];
    
    return `
        <div class="sidebar">
            <div class="sidebar-logo">🏭 STEEL/TRACK</div>
            <div class="sidebar-user">
                <div class="uname">${escapeHtml(user?.name)}</div>
                <div class="urole">${user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên kho'}</div>
            </div>
            ${navItems.map(item => `
                <div class="nav-item ${currentPane === item.id ? 'active' : ''}" onclick="switchPane('${item.id}')">
                    <span>${item.icon}</span>
                    <span>${item.label}</span>
                </div>
            `).join('')}
            <div class="sidebar-bottom">
                <button onclick="logout()" style="width:100%">🚪 Đăng xuất</button>
            </div>
        </div>
    `;
}

export function renderTopbar() {
    const currentPane = state.currentPane;
    const titles = {
        entry: '📦 Quản lý kho',
        dashboard: '📊 Thống kê',
        projects: '🏗️ Công trình',
        suppliers: '🏭 Nhà cung cấp',
        logs: '📋 Nhật ký'
    };
    
    let buttons = '';
    if (currentPane === 'entry') {
        buttons = `
            <button onclick="showAddMaterialModal()">+ Thêm vật tư</button>
            <button class="primary" onclick="showImportModal()">📥 Nhập kho</button>
            <button onclick="showExportModal()">📤 Xuất kho</button>
            <button onclick="exportToExcel('materials')">📎 Export</button>
        `;
    } else if (currentPane === 'projects') {
        buttons = `
            <button class="primary" onclick="showAddProjectModal()">+ Công trình</button>
            <button onclick="exportToExcel('projects')">📎 Export</button>
        `;
    } else if (currentPane === 'suppliers') {
        buttons = `
            <button class="primary" onclick="showAddSupplierModal()">+ Nhà cung cấp</button>
            <button onclick="exportToExcel('suppliers')">📎 Export</button>
        `;
    }
    
    return `
        <div class="topbar">
            <span class="topbar-title">${titles[currentPane] || ''}</span>
            <div style="display:flex;gap:8px">${buttons}</div>
        </div>
    `;
}

export function showModal(title, content, onConfirm) {
    const modalArea = document.getElementById('modal-area');
    if (!modalArea) return;
    
    modalArea.innerHTML = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-hd">
                    <span class="modal-title">${title}</span>
                    <button class="xbtn" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-bd">${content}</div>
                <div class="modal-ft">
                    <button onclick="this.closest('.modal-overlay').remove()">Hủy</button>
                    <button class="primary" id="modal-confirm">Xác nhận</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modal-confirm').onclick = () => {
        onConfirm();
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) overlay.remove();
    };
}

export function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();
}