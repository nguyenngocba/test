import { appState } from '../../core/state.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { escapeHtml } from '../../utils/formatters.js';

export const Sidebar = {
    render() {
        const currentUser = appState.getCurrentUser();
        const currentPane = appState.getCurrentPane();
        const hasAccessSettings = currentUser?.role === 'admin';
        
        const navItems = [
            { id: 'entry', icon: '📦', label: 'Quản lý kho' },
            { id: 'dashboard', icon: '📊', label: 'Thống kê' },
            { id: 'projects', icon: '🏗️', label: 'Công trình' },
            { id: 'suppliers', icon: '🏭', label: 'Nhà cung cấp' },
            { id: 'logs', icon: '📋', label: 'Nhật ký' }
        ];
        
        if (hasAccessSettings) {
            navItems.push({ id: 'settings', icon: '⚙️', label: 'Cài đặt' });
        }
        
        const navHtml = navItems.map(item => `
            <div class="nav-item ${currentPane === item.id ? 'active' : ''}" onclick="window.sidebarNavigate('${item.id}')">
                <span class="nav-icon">${item.icon}</span>
                <span>${item.label}</span>
            </div>
        `).join('');
        
        return `
            <div class="sidebar">
                <div class="sidebar-logo">🏭 STEEL/TRACK</div>
                <div class="sidebar-user">
                    <div class="uname">${escapeHtml(currentUser?.name || '')}</div>
                    <div class="urole">${currentUser?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên kho'}</div>
                </div>
                ${navHtml}
                <div class="sidebar-bottom">
                    <button onclick="window.handleLogout()" style="width:100%">🚪 Đăng xuất</button>
                </div>
            </div>
        `;
    }
};

// Global handlers
window.sidebarNavigate = (pane) => {
    eventBus.emit(EVENTS.PANE_CHANGED, pane);
};

window.handleLogout = () => {
    eventBus.emit(EVENTS.LOGOUT);
};