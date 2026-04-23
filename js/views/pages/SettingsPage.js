import { appState } from '../../core/state.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { logService } from '../../services/LogService.js';
import { escapeHtml } from '../../utils/formatters.js';
import { Modal } from '../components/Modal.js';
import { Table } from '../components/Table.js';

class SettingsPage {
    constructor() {
        eventBus.on(EVENTS.DATA_CHANGED, () => this.rerender());
    }
    
    rerender() { if (appState.getCurrentPane() === 'settings') { const c = document.querySelector('#pane-settings'); if (c) c.innerHTML = this.render(); } }
    
    render() {
        if (!appState.getCurrentUser()?.role === 'admin') return '<div class="card">🔒 Không có quyền</div>';
        return `
            <div class="card">
                <div class="sec-title">👥 QUẢN LÝ NGƯỜI DÙNG</div>
                <button class="sm primary" style="margin-bottom:16px" onclick="window.settingsPage.addUser()">+ Thêm người dùng</button>
                <div class="tbl-wrap"><table style="min-width:600px"><thead><tr><th>Tên</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Thao tác</th></tr></thead>
                <tbody>${appState.users.map(u => `
                    <tr>
                        <td><strong>${escapeHtml(u.name)}</strong>${u.id === appState.getCurrentUser()?.id ? ' <span class="tag">Bạn</span>' : ''}</td>
                        <td>${u.username}</td>
                        <td><span class="tag">${u.role === 'admin' ? 'Admin' : 'Nhân viên'}</span></td>
                        <td><button class="sm" onclick="window.settingsPage.changePassword('${u.id}')">🔑 Đổi MK</button>
                            ${u.id !== appState.getCurrentUser()?.id ? `<button class="sm danger-btn" onclick="window.settingsPage.deleteUser('${u.id}')">🗑️</button>` : ''}
                        </td>
                    </tr>`).join('')}</tbody></table></div>
                
                <div style="margin-top:24px"><div class="sec-title">📂 DANH MỤC</div>
                    <div><div class="sec-title">Loại vật tư</div>${appState.categories.map(c => `<div class="setting-item"><span>📌 ${escapeHtml(c)}</span><button class="sm danger-btn" onclick="window.settingsPage.deleteCategory('${c}')">Xóa</button></div>`).join('')}
                    <div style="margin-top:12px"><input id="newCat" placeholder="Loại mới"><button class="sm primary" onclick="window.settingsPage.addCategory()">+ Thêm</button></div></div>
                    <div style="margin-top:16px"><div class="sec-title">Đơn vị tính</div>${appState.units.map(u => `<div class="setting-item"><span>📏 ${escapeHtml(u)}</span><button class="sm danger-btn" onclick="window.settingsPage.deleteUnit('${u}')">Xóa</button></div>`).join('')}
                    <div style="margin-top:12px"><input id="newUnit" placeholder="Đơn vị mới"><button class="sm primary" onclick="window.settingsPage.addUnit()">+ Thêm</button></div></div>
                </div>
                
                <div style="margin-top:24px"><div class="sec-title">🌓 GIAO DIỆN</div>
                    <div class="setting-item"><span>Chế độ màu</span><button class="sm" onclick="window.settingsPage.toggleTheme()">${appState.theme === 'dark' ? '☀️ Chuyển sáng' : '🌙 Chuyển tối'}</button></div>
                </div>
            </div>
        `;
    }
    
    addUser() {
        const name = prompt('Tên người dùng:');
        if (!name) return;
        const username = prompt('Tên đăng nhập:');
        if (!username) return;
        const password = prompt('Mật khẩu:');
        if (!password) return;
        const isAdmin = confirm('Phân quyền Admin?');
        appState.addUser({
            id: `u${Date.now()}`, name, username, password, role: isAdmin ? 'admin' : 'user'
        });
        logService.addLog('Thêm người dùng', `${name} (${username})`);
    }
    
    deleteUser(id) {
        const user = appState.users.find(u => u.id === id);
        if (user?.id === appState.getCurrentUser()?.id) return alert('Không thể xóa chính mình');
        if (confirm(`Xóa ${user?.name}?`)) appState.deleteUser(id);
    }
    
    changePassword(id) {
        const user = appState.users.find(u => u.id === id);
        const newPass = prompt(`Mật khẩu mới cho ${user?.name}:`);
        if (newPass) appState.updateUser(id, { password: newPass });
    }
    
    addCategory() { const inp = document.getElementById('newCat'); if (inp?.value.trim()) appState.addCategory(inp.value.trim()); }
    deleteCategory(cat) { if (confirm(`Xóa "${cat}"?`)) appState.deleteCategory(cat); }
    addUnit() { const inp = document.getElementById('newUnit'); if (inp?.value.trim()) appState.addUnit(inp.value.trim()); }
    deleteUnit(unit) { if (confirm(`Xóa "${unit}"?`)) appState.deleteUnit(unit); }
    toggleTheme() {
        appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', appState.theme === 'light' ? 'light' : '');
        localStorage.setItem('steel_theme', appState.theme);
        this.rerender();
    }
}

export const settingsPage = new SettingsPage();
window.settingsPage = settingsPage;