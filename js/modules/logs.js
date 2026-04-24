import { state, escapeHtml } from './state.js';

export function renderLogs() {
    const logs = state.logs || [];
    
    return `
        <div class="card">
            <div class="sec-title">📋 NHẬT KÝ HỆ THỐNG</div>
            <div style="max-height: 500px; overflow-y: auto">
                ${logs.slice(0, 100).map(log => `
                    <div class="log-entry">
                        <span class="log-time">[${log.time}]</span>
                        <span style="color:var(--warn)">👤 ${escapeHtml(log.user)}</span>
                        <span>${escapeHtml(log.action)}</span>
                        ${log.detail ? `<span style="color:var(--muted)"> - ${escapeHtml(log.detail)}</span>` : ''}
                    </div>
                `).join('')}
                ${logs.length === 0 ? '<div class="log-entry">Chưa có hoạt động nào</div>' : ''}
            </div>
        </div>
    `;
}