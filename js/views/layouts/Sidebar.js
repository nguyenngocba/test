import { appState } from '../../core/eventBus.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { escapeHtml } from '../../utils/formatters.js';

export const Sidebar = {
    render() {
        const user = appState.getCurrentUser();
        const currentPane = appState.getCurrentPane();
        const navs = [
            { id: 'entry', icon: '📦', label: 'Quản lý kho' },
            { id: 'dashboard', icon: '📊', label: 'Thống kê' },
            { id: 'projects', icon: '🏗️', label: 'Công trình' },
            { id: 'suppliers', icon: '🏭', label: 'Nhà cung cấp' },
            { id: 'logs', icon: '📋', label: 'Nhật ký' }
        ];
        if (user?.role === 'admin') navs.push({ id: 'settings', icon: '⚙️', label: 'Cài đặt' });
        
        return `
            <div class="sidebar">
                <div class="sidebar-logo">🏭 STEEL/TRACK</div>
                <div class="sidebar-user"><div class="uname">${escapeHtml(user?.name)}</div><div class="urole">${user?.role === 'admin' ? 'Admin' : 'Nhân viên'}</div></div>
                ${navs.map(n => `<div class="nav-item ${currentPane === n.id ? 'active' : ''}" onclick="window.sidebarNavigate('${n.id}')"><span>${n.icon}</span><span>${n.label}</span></div>`).join('')}
                <div class="sidebar-bottom"><button onclick="window.handleLogout()" style="width:100%">🚪 Đăng xuất</button></div>
            </div>
        `;
    }
};

window.sidebarNavigate = (pane) => eventBus.emit(EVENTS.PANE_CHANGED, pane);
window.handleLogout = () => eventBus.emit(EVENTS.LOGOUT);