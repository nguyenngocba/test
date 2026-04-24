import { state, saveData, addLog, formatMoney, escapeHtml } from './state.js';
import { showModal } from './auth.js';

export function renderSettings() {
    const currentUser = state.currentUser;
    const isAdmin = currentUser?.role === 'admin';
    
    if (!isAdmin) {
        return '<div class="card">🔒 Bạn không có quyền truy cập khu vực này.</div>';
    }
    
    return `
        <div class="card">
            <div class="sec-title">👥 QUẢN LÝ NGƯỜI DÙNG</div>
            <button class="sm primary" style="margin-bottom:16px" onclick="showAddUserModal()">+ Thêm người dùng</button>
            <div class="tbl-wrap">
                <table style="min-width:500px">
                    <thead><tr><th>Tên</th><th>Vai trò</th><th>Thao tác</th></tr></thead>
                    <tbody>
                        <tr><td>Admin</td><td><span class="tag">Quản trị viên</span></td><td>—</td></tr>
                        <tr><td>Nhân viên kho</td><td><span class="tag">Nhân viên</span></td><td><button class="sm" onclick="alert("Tính năng đang phát triển")">🔑 Đổi mật khẩu</button></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="card">
            <div class="sec-title">📂 QUẢN LÝ DANH MỤC</div>
            <div style="margin-bottom:20px">
                <div class="sec-title">Loại vật tư</div>
                <div id="categories-list">
                    ${state.categories.map(c => `
                        <div class="setting-item">
                            <span>📌 ${escapeHtml(c)}</span>
                            <button class="sm danger" onclick="deleteCategory('${c}')">Xóa</button>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top:12px; display:flex; gap:8px">
                    <input type="text" id="new-category" placeholder="Tên loại mới" style="flex:1">
                    <button class="sm primary" onclick="addCategory()">+ Thêm</button>
                </div>
            </div>
            
            <div>
                <div class="sec-title">Đơn vị tính</div>
                <div id="units-list">
                    ${state.units.map(u => `
                        <div class="setting-item">
                            <span>📏 ${escapeHtml(u)}</span>
                            <button class="sm danger" onclick="deleteUnit('${u}')">Xóa</button>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top:12px; display:flex; gap:8px">
                    <input type="text" id="new-unit" placeholder="Đơn vị mới" style="flex:1">
                    <button class="sm primary" onclick="addUnit()">+ Thêm</button>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="sec-title">🌓 GIAO DIỆN</div>
            <div class="setting-item">
                <span>Chế độ màu</span>
                <button class="sm" onclick="toggleTheme()">
                    ${document.documentElement.getAttribute('data-theme') === 'light' ? '🌙 Chuyển tối' : '☀️ Chuyển sáng'}
                </button>
            </div>
        </div>
    `;
}

export function addCategory() {
    const input = document.getElementById('new-category');
    const newCat = input?.value.trim();
    if (newCat && !state.categories.includes(newCat)) {
        state.categories.push(newCat);
        saveData();
        addLog('Thêm danh mục', newCat);
        if (window.renderApp) window.renderApp();
    }
    if (input) input.value = '';
}

export function deleteCategory(cat) {
    if (confirm(`Xóa danh mục "${cat}"?`)) {
        state.categories = state.categories.filter(c => c !== cat);
        saveData();
        addLog('Xóa danh mục', cat);
        if (window.renderApp) window.renderApp();
    }
}

export function addUnit() {
    const input = document.getElementById('new-unit');
    const newUnit = input?.value.trim();
    if (newUnit && !state.units.includes(newUnit)) {
        state.units.push(newUnit);
        saveData();
        addLog('Thêm đơn vị', newUnit);
        if (window.renderApp) window.renderApp();
    }
    if (input) input.value = '';
}

export function deleteUnit(unit) {
    if (confirm(`Xóa đơn vị "${unit}"?`)) {
        state.units = state.units.filter(u => u !== unit);
        saveData();
        addLog('Xóa đơn vị', unit);
        if (window.renderApp) window.renderApp();
    }
}

export function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? '' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('steel_theme', newTheme === 'light' ? 'light' : 'dark');
    if (window.renderApp) window.renderApp();
}

// Khởi tạo theme từ localStorage
export function initTheme() {
    const savedTheme = localStorage.getItem('steel_theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

// Global functions
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.addUnit = addUnit;
window.deleteUnit = deleteUnit;
window.toggleTheme = toggleTheme;