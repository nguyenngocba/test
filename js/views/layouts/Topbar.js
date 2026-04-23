import { appState } from '../../core/state.js';
import { exportService } from '../../services/ExportService.js';
import { transactionService } from '../../services/TransactionService.js';

export const Topbar = {
    render() {
        const currentPane = appState.getCurrentPane();
        const titles = {
            entry: 'Quản lý tồn kho',
            dashboard: 'Bảng điều khiển trung tâm',
            projects: 'Quản lý công trình',
            suppliers: 'Quản lý nhà cung cấp',
            logs: 'Nhật ký hệ thống',
            settings: 'Cấu hình hệ thống'
        };
        
        let buttons = '';
        
        if (currentPane === 'entry') {
            buttons = `
                <button class="sm" onclick="window.materialsPage?.showAddModal()">+ Thêm vật tư</button>
                <button class="sm primary" onclick="window.openPurchaseModal()">📥 Nhập kho</button>
                <button class="sm" onclick="window.openTxnModal('usage')">📤 Xuất kho</button>
                <button class="sm" onclick="window.exportToExcel('materials')">📎 Export Excel</button>
            `;
        } else if (currentPane === 'projects') {
            buttons = `
                <button class="sm primary" onclick="window.projectsPage?.showAddModal()">+ Công trình mới</button>
                <button class="sm" onclick="window.exportToExcel('projects')">📎 Export Excel</button>
            `;
        } else if (currentPane === 'suppliers') {
            buttons = `
                <button class="sm primary" onclick="window.suppliersPage?.showAddModal()">+ Nhà cung cấp mới</button>
                <button class="sm" onclick="window.exportToExcel('suppliers')">📎 Export Excel</button>
            `;
        }
        
        return `
            <div class="topbar">
                <span class="topbar-title">${titles[currentPane] || ''}</span>
                ${buttons}
            </div>
        `;
    }
};

// Global export handler
window.exportToExcel = (type) => {
    exportService.exportToExcel(type);
};