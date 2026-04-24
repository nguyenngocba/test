import { state, saveState, loadState, applyTheme, hasPermission, addLog, formatMoney, escapeHtml, showModal, closeModal, genMid, genTid, genPid, genSid, matById, projectById, supplierById } from './modules/state.js';
import { renderLogin, login, logout, switchPane, renderSidebar, renderTopbar, getPaneTitle } from './modules/auth.js';
import { renderEntry, openMatModal, editMaterial, updateMaterial, deleteMaterial, saveMat } from './modules/materials.js';
import { renderProjects, openProjectModal, saveProject, deleteProject, filterProjects, clearProjectSearch } from './modules/projects.js';
import { renderSuppliers, openSupplierModal, saveSupplier, updateSupplier, deleteSupplier, filterSuppliers, clearSupplierSearch, viewSupplierHistory } from './modules/suppliers.js';
import { openPurchaseModal, savePurchase, openTxnModal, saveExport, calculatePurchaseTotal, calculateExportTotal } from './modules/transactions.js';
import { renderLogs } from './modules/logs.js';
import { renderDashboard, renderCharts, renderProjectCharts } from './modules/charts.js';
import { renderSettings, addCategory, addUnit, toggleTheme, addUser, deleteUser, changePassword, toggleUserPermission } from './modules/settings.js';
import { exportToExcel } from './modules/export.js';

// Make functions global for inline onclick handlers
window.login = login;
window.logout = logout;
window.switchPane = switchPane;
window.openMatModal = openMatModal;
window.editMaterial = editMaterial;
window.updateMaterial = updateMaterial;
window.deleteMaterial = deleteMaterial;
window.saveMat = saveMat;
window.openProjectModal = openProjectModal;
window.saveProject = saveProject;
window.deleteProject = deleteProject;
window.filterProjects = filterProjects;
window.clearProjectSearch = clearProjectSearch;
window.openSupplierModal = openSupplierModal;
window.saveSupplier = saveSupplier;
window.updateSupplier = updateSupplier;
window.deleteSupplier = deleteSupplier;
window.filterSuppliers = filterSuppliers;
window.clearSupplierSearch = clearSupplierSearch;
window.viewSupplierHistory = viewSupplierHistory;
window.openPurchaseModal = openPurchaseModal;
window.savePurchase = savePurchase;
window.openTxnModal = openTxnModal;
window.saveExport = saveExport;
window.calculatePurchaseTotal = calculatePurchaseTotal;
window.calculateExportTotal = calculateExportTotal;
window.addCategory = addCategory;
window.addUnit = addUnit;
window.toggleTheme = toggleTheme;
window.addUser = addUser;
window.deleteUser = deleteUser;
window.changePassword = changePassword;
window.toggleUserPermission = toggleUserPermission;
window.exportToExcel = exportToExcel;
window.closeModal = closeModal;

// Expose state and utils for debugging
window.debug = { state, saveState, addLog };

// Initialize
loadState();

// Kiểm tra XLSX sau khi load
setTimeout(() => {
    if (typeof XLSX !== 'undefined') {
        console.log('✅ Thư viện XLSX đã sẵn sàng');
    } else {
        console.warn('⚠️ Thư viện XLSX chưa được tải, export Excel sẽ không hoạt động');
    }
}, 1000);

window.render = () => {
    const root = document.getElementById('root');
    if (!state.currentUser) {
        root.innerHTML = renderLogin();
        return;
    }
    root.innerHTML = `<div style="display:flex;height:100vh;overflow:hidden">
        ${renderSidebar()}
        <div class="main-content">
            ${renderTopbar()}
            <div class="pane ${state.currentPane === 'entry' ? 'active' : ''}" id="pane-entry">${renderEntry()}</div>
            <div class="pane ${state.currentPane === 'dashboard' ? 'active' : ''}" id="pane-dashboard">${renderDashboard()}</div>
            <div class="pane ${state.currentPane === 'projects' ? 'active' : ''}" id="pane-projects">${renderProjects()}</div>
            <div class="pane ${state.currentPane === 'suppliers' ? 'active' : ''}" id="pane-suppliers">${renderSuppliers()}</div>
            <div class="pane ${state.currentPane === 'logs' ? 'active' : ''}" id="pane-logs">${renderLogs()}</div>
            <div class="pane ${state.currentPane === 'settings' ? 'active' : ''}" id="pane-settings">${renderSettings()}</div>
            <div id="modal-area"></div>
        </div>
    </div>`;
    if (state.currentPane === 'dashboard') setTimeout(renderCharts, 50);
    if (state.currentPane === 'projects') setTimeout(renderProjectCharts, 50);
};

window.render();