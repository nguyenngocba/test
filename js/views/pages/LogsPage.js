import { appState } from '../../core/state.js';
import { escapeHtml } from '../../utils/formatters.js';

class LogsPage {
    render() {
        return `
            <div class="card">
                <div class="sec-title">📋 NHẬT KÝ HỆ THỐNG</div>
                <div class="tbl-wrap" style="max-height:70vh;overflow-y:auto">
                    ${appState.logs.slice(0, 200).map(log => `
                        <div class="log-entry">
                            <span class="log-time">[${log.timeStr}]</span>
                            <span class="log-user">👤 ${escapeHtml(log.userName)}</span>
                            <span class="log-action">${escapeHtml(log.action)}</span>
                            ${log.details ? `<span class="metric-sub">📝 ${escapeHtml(log.details)}</span>` : ''}
                        </div>
                    `).join('') || '<div class="log-entry">Chưa có hoạt động</div>'}
                </div>
            </div>
        `;
    }
}

export const logsPage = new LogsPage();