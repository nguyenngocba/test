import { appState } from '../../core/state.js';
import { exportService } from '../../services/ExportService.js';

export const Topbar = {
    render() {
        const pane = appState.getCurrentPane();
        const titles = { entry: 'Quản lý kho', dashboard: 'Thống kê', projects: 'Công trình', suppliers: 'Nhà cung cấp', logs: 'Nhật ký', settings: 'Cài đặt' };
        let btns = '';
        if (pane === 'entry') {
            btns = `<button class="sm" onclick="window.openMatModal()">+ Thêm vật tư</button>
                    <button class="sm primary" onclick="window.openPurchaseModal()">📥 Nhập kho</button>
                    <button class="sm" onclick="window.openTxnModal()">📤 Xuất kho</button>
                    <button class="sm" onclick="window.exportToExcel('materials')">📎 Export</button>`;
        } else if (pane === 'projects') {
            btns = `<button class="sm primary" onclick="window.openProjectModal()">+ Công trình</button>
                    <button class="sm" onclick="window.exportToExcel('projects')">📎 Export</button>`;
        } else if (pane === 'suppliers') {
            btns = `<button class="sm primary" onclick="window.openSupplierModal()">+ NCC</button>
                    <button class="sm" onclick="window.exportToExcel('suppliers')">📎 Export</button>`;
        }
        return `<div class="topbar"><span class="topbar-title">${titles[pane] || ''}</span><div style="display:flex;gap:8px">${btns}</div></div>`;
    }
};

window.exportToExcel = (type) => exportService.exportToExcel(type);