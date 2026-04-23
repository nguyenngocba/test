import { appState } from '../../core/state.js';
import { escapeHtml } from '../../utils/formatters.js';

class LogsPage {
    render() {
        const logs = appState.logs.slice(0, 200);
        
        const logEntries = logs.map(log => `
            <div class="log-entry">
                <span class="log-time">[${log.timeStr}]</span>
                <span class="log-user">👤 ${escapeHtml(log.userName)}</span>
                <span class="log-action">${escapeHtml(log.action)}</span>
                ${log.details ? `<span class="metric-sub">📝 ${escapeHtml(log.details)}</span>` : ''}
            </div>
        `).join('');

        return `
            <div class="card">
                <div class="sec-title">📋 NHẬT KÝ HỆ THỐNG</div>
                <div class="tbl-wrap" style="max-height:70vh;overflow-y:auto">
                    ${logEntries || '<div class="log-entry">Chưa có hoạt động nào được ghi nhận</div>'}
                </div>
            </div>
        `;
    }
}

export const logsPage = new LogsPage();