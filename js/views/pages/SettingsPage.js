import { appState } from '../../core/state.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { logService } from '../../services/LogService.js';
import { formatMoney, escapeHtml } from '../../utils/formatters.js';
import { Modal } from '../components/Modal.js';
import { Table } from '../components/Table.js';

class SettingsPage {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        eventBus.on(EVENTS.DATA_CHANGED, () => this.rerender());
    }

    rerender() {
        if (appState.getCurrentPane() === 'settings') {
            const container = document.querySelector('#pane-settings');
            if (container) {
                container.innerHTML = this.render();
            }
        }
    }

    render() {
        const currentUser = appState.getCurrentUser();
        const isAdmin = currentUser?.role === 'admin';
        
        if (!isAdmin) {
            return '<div class="card">🔒 Bạn không có quyền truy cập khu vực này.</div>';
        }

        // User management table
        const userColumns = [
            { key: 'name', label: 'Tên', render: (val, row) => `${escapeHtml(val)}${row.id === currentUser?.id ? ' <span class="tag">Bạn</span>' : ''}` },
            { key: 'username', label: 'Tên đăng nhập' },
            { key: 'role', label: 'Vai trò', render: (val) => `<span class="tag">${val === 'admin' ? 'Admin' : 'Nhân viên'}</span>` },
            { 
                key: 'permissions', 
                label: 'Quyền', 
                render: (_, row) => {
                    if (row.role === 'admin') return '🔓 Toàn quyền';
                    return `
                        <div><input type="checkbox" ${row.permissions?.canImport ? 'checked' : ''} onchange="window.settingsPage.togglePermission('${row.id}', 'canImport')"> 📥 Nhập kho</div>
                        <div><input type="checkbox" ${row.permissions?.canExport ? 'checked' : ''} onchange="window.settingsPage.togglePermission('${row.id}', 'canExport')"> 📤 Xuất kho</div>
                        <div><input type="checkbox" ${row.permissions?.canCreateMaterial ? 'checked' : ''} onchange="window.settingsPage.togglePermission('${row.id}', 'canCreateMaterial')"> ➕ Thêm vật tư</div>
                        <div><input type="checkbox" ${row.permissions?.canEditMaterial ? 'checked' : ''} onchange="window.settingsPage.togglePermission('${row.id}', 'canEditMaterial')"> ✏️ Sửa vật tư</div>
                        <div><input type="checkbox" ${row.permissions?.canDeleteMaterial ? 'checked' : ''} onchange="window.settingsPage.togglePermission('${row.id}', 'canDeleteMaterial')"> 🗑️ Xóa vật tư</div>
                        <div><input type="checkbox" ${row.permissions?.canDeleteProject ? 'checked' : ''} onchange="window.settingsPage.togglePermission('${row.id}', 'canDeleteProject')"> 🏗️ Xóa công trình</div>
                        <div><input type="checkbox" ${row.permissions?.canManageSupplier ? 'checked' : ''} onchange="window.settingsPage.togglePermission('${row.id}', 'canManageSupplier')"> 🏭 QL Nhà cung cấp</div>
                    `;
                }
            },
            {
                key: 'actions',
                label: 'Thao tác',
                render: (_, row) => `
                    <button class="sm" onclick="window.settingsPage.changePassword('${row.id}')">🔑 Đổi MK</button>
                    ${row.id !== currentUser?.id ? `<button class="sm danger-btn" onclick="window.settingsPage.deleteUser('${row.id}')">🗑️</button>` : ''}
                `
            }
        ];

        // Categories list
        const categoryItems = appState.categories.map(c => `
            <div class="setting-item">
                <span>📌 ${escapeHtml(c)}</span>
                <button class="sm danger-btn" onclick="window.settingsPage.deleteCategory('${c}')">Xóa</button>
            </div>
        `).join('');

        // Units list
        const unitItems = appState.units.map(u => `
            <div class="setting-item">
                <span>📏 ${escapeHtml(u)}</span>
                <button class="sm danger-btn" onclick="window.settingsPage.deleteUnit('${u}')">Xóa</button>
            </div>
        `).join('');

        return `
            <div class="card">
                <div class="sec-title">👥 QUẢN LÝ NGƯỜI DÙNG</div>
                <button class="sm primary" style="margin-bottom:16px" onclick="window.settingsPage.addUser()">+ Thêm người dùng mới</button>
                ${Table.render(appState.users, userColumns)}
                
                <div style="margin-top:24px">
                    <div class="sec-title">📂 QUẢN LÝ DANH MỤC</div>
                    <div style="margin-bottom:16px">
                        <div class="sec-title">Loại vật tư</div>
                        ${categoryItems}
                        <div style="margin-top:12px;display:flex;gap:8px">
                            <input id="newCat" placeholder="Nhập loại mới" style="flex:1">
                            <button class="sm primary" onclick="window.settingsPage.addCategory()">+ Thêm</button>
                        </div>
                    </div>
                    <div style="margin-bottom:16px">
                        <div class="sec-title">Đơn vị tính</div>
                        ${unitItems}
                        <div style="margin-top:12px;display:flex;gap:8px">
                            <input id="newUnit" placeholder="Nhập đơn vị mới" style="flex:1">
                            <button class="sm primary" onclick="window.settingsPage.addUnit()">+ Thêm</button>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top:24px">
                    <div class="sec-title">🌓 GIAO DIỆN</div>
                    <div class="setting-item">
                        <span>Chế độ màu</span>
                        <button class="sm" onclick="window.settingsPage.toggleTheme()">
                            ${appState.theme === 'dark' ? '☀️ Chuyển sáng' : '🌙 Chuyển tối'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // User management
    addUser() {
        const name = prompt('Nhập tên người dùng:');
        if (!name) return;
        const username = prompt('Nhập tên đăng nhập:');
        if (!username) return;
        const password = prompt('Nhập mật khẩu:');
        if (!password) return;
        const isAdmin = confirm('Phân quyền Admin? (OK = Admin, Cancel = Nhân viên)');
        
        const newUser = {
            id: `u${Date.now()}`,
            name: name,
            username: username,
            password: password,
            role: isAdmin ? 'admin' : 'user',
            permissions: isAdmin ? {
                canCreateMaterial: true, canDeleteMaterial: true, canEditMaterial: true,
                canImport: true, canExport: true, canDeleteProject: true,
                canAccessSettings: true, canManageSupplier: true
            } : {
                canCreateMaterial: false, canDeleteMaterial: false, canEditMaterial: false,
                canImport: true, canExport: true, canDeleteProject: false,
                canAccessSettings: false, canManageSupplier: false
            }
        };
        
        appState.addUser(newUser);
        logService.addLog('Thêm người dùng', `Đã thêm người dùng: ${name} (${username})`);
        this.rerender();
    }

    deleteUser(userId) {
        const user = appState.users.find(u => u.id === userId);
        if (!user) return;
        if (user.id === appState.getCurrentUser()?.id) {
            alert('Bạn không thể tự xóa chính mình!');
            return;
        }
        if (confirm(`Xóa người dùng "${user.name}"?`)) {
            appState.deleteUser(userId);
            logService.addLog('Xóa người dùng', `Đã xóa người dùng: ${user.name}`);
            this.rerender();
        }
    }

    changePassword(userId) {
        const user = appState.users.find(u => u.id === userId);
        if (!user) return;
        const newPass = prompt(`Nhập mật khẩu mới cho ${user.name}:`);
        if (newPass && newPass.trim()) {
            appState.updateUser(userId, { password: newPass.trim() });
            logService.addLog('Đổi mật khẩu', `Đã đổi mật khẩu cho người dùng: ${user.name}`);
            alert('Đổi mật khẩu thành công!');
        }
    }

    togglePermission(userId, perm) {
        const user = appState.users.find(u => u.id === userId);
        if (!user || user.role === 'admin') {
            alert('Không thể thay đổi quyền của Admin');
            return;
        }
        const newValue = !user.permissions[perm];
        appState.updateUser(userId, { permissions: { ...user.permissions, [perm]: newValue } });
        logService.addLog('Thay đổi quyền', `Đã thay đổi quyền ${perm} cho ${user.name} -> ${newValue ? 'BẬT' : 'TẮT'}`);
        this.rerender();
    }

    // Category management
    addCategory() {
        const input = document.getElementById('newCat');
        if (input && input.value.trim()) {
            appState.addCategory(input.value.trim());
            logService.addLog('Thêm danh mục', `Đã thêm danh mục: ${input.value.trim()}`);
            input.value = '';
            this.rerender();
        }
    }

    deleteCategory(category) {
        if (confirm(`Xóa danh mục "${category}"?`)) {
            appState.deleteCategory(category);
            logService.addLog('Xóa danh mục', `Đã xóa danh mục: ${category}`);
            this.rerender();
        }
    }

    // Unit management
    addUnit() {
        const input = document.getElementById('newUnit');
        if (input && input.value.trim()) {
            appState.addUnit(input.value.trim());
            logService.addLog('Thêm đơn vị', `Đã thêm đơn vị: ${input.value.trim()}`);
            input.value = '';
            this.rerender();
        }
    }

    deleteUnit(unit) {
        if (confirm(`Xóa đơn vị "${unit}"?`)) {
            appState.deleteUnit(unit);
            logService.addLog('Xóa đơn vị', `Đã xóa đơn vị: ${unit}`);
            this.rerender();
        }
    }

    // Theme
    toggleTheme() {
        const newTheme = appState.theme === 'dark' ? 'light' : 'dark';
        appState.theme = newTheme;
        document.documentElement.setAttribute('data-theme', newTheme === 'light' ? 'light' : '');
        localStorage.setItem('steel_theme', newTheme);
        this.rerender();
    }
}

export const settingsPage = new SettingsPage();

// Global handlers
window.settingsPage = settingsPage;