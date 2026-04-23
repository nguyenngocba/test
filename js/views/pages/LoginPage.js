import { eventBus, EVENTS } from '../../core/eventBus.js';
import { appState } from '../../core/state.js';
import { escapeHtml } from '../../utils/formatters.js';

class LoginPage {
    render() {
        const users = appState.users;
        
        return `
            <div class="login-wrap">
                <div class="login-card">
                    <div style="font-family:var(--mono);font-size:20px;font-weight:600;color:var(--accent);margin-bottom:8px">
                        🏭 STEEL/TRACK PRO
                    </div>
                    <div style="font-size:13px;color:var(--muted);margin-bottom:28px">
                        Quản lý kho & Công trình & Nhà cung cấp
                    </div>
                    ${users.map(u => `
                        <div class="user-pill" onclick="window.handleLogin('${u.id}')">
                            <div class="avatar">${escapeHtml(u.name[0])}</div>
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
}

// Global handler for login
window.handleLogin = (userId) => {
    const user = appState.users.find(u => u.id === userId);
    if (user) {
        eventBus.emit(EVENTS.LOGIN, user);
    }
};

export const loginPage = new LoginPage();