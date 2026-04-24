import { state, loadData, addLog, formatMoney } from './modules/state.js';
import { renderLogin, renderSidebar, renderTopbar, switchPane, setCurrentUser, getCurrentUser } from './modules/auth.js';
import { renderMaterials, addMaterial, updateMaterial, deleteMaterial, getMaterials, bindMaterialSearchEvents } from './modules/materials.js';
import { renderProjects, addProject, deleteProject, getProjects, bindProjectSearchEvents } from './modules/projects.js';
import { renderSuppliers, addSupplier, deleteSupplier, getSuppliers, bindSupplierSearchEvents } from './modules/suppliers.js';
import { importMaterial, exportMaterial, getTransactions, bindImportEvents, bindExportEvents } from './modules/transactions.js';
import { renderLogs } from './modules/logs.js';
import { renderDashboard } from './modules/charts.js';
import { exportToExcel } from './modules/export.js';

// Khởi tạo dữ liệu
loadData();

// Hàm render chính
function render() {
    const root = document.getElementById('root');
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        root.innerHTML = renderLogin();
        return;
    }
    
    const currentPane = state.currentPane;
    
    root.innerHTML = `
        <div style="display:flex">
            ${renderSidebar()}
            <div class="main-content">
                ${renderTopbar()}
                <div id="pane-entry" class="pane ${currentPane === 'entry' ? 'active' : ''}">${renderMaterials()}</div>
                <div id="pane-dashboard" class="pane ${currentPane === 'dashboard' ? 'active' : ''}">${renderDashboard()}</div>
                <div id="pane-projects" class="pane ${currentPane === 'projects' ? 'active' : ''}">${renderProjects()}</div>
                <div id="pane-suppliers" class="pane ${currentPane === 'suppliers' ? 'active' : ''}">${renderSuppliers()}</div>
                <div id="pane-logs" class="pane ${currentPane === 'logs' ? 'active' : ''}">${renderLogs()}</div>
            </div>
        </div>
        <div id="modal-area"></div>
    `;
    
    // Bind sự kiện tìm kiếm sau khi render
    if (currentPane === 'entry') {
        setTimeout(() => bindMaterialSearchEvents(), 50);
    } else if (currentPane === 'projects') {
        setTimeout(() => bindProjectSearchEvents(), 50);
    } else if (currentPane === 'suppliers') {
        setTimeout(() => bindSupplierSearchEvents(), 50);
    }
    
    // Bind sự kiện cho modal import/export
    bindImportEvents();
    bindExportEvents();
    
    // Vẽ biểu đồ nếu đang ở dashboard
    if (currentPane === 'dashboard') {
        setTimeout(() => {
            import('./modules/charts.js').then(m => m.renderDashboardChart());
        }, 100);
    }
}

// Global functions cho inline onclick
window.switchPane = switchPane;
window.addMaterial = addMaterial;
window.updateMaterial = updateMaterial;
window.deleteMaterial = deleteMaterial;
window.addProject = addProject;
window.deleteProject = deleteProject;
window.addSupplier = addSupplier;
window.deleteSupplier = deleteSupplier;
window.importMaterial = importMaterial;
window.exportMaterial = exportMaterial;
window.exportToExcel = exportToExcel;

// Export các hàm modal
window.showAddMaterialModal = () => import('./modules/materials.js').then(m => m.showAddMaterialModal());
window.showImportModal = () => import('./modules/transactions.js').then(t => t.showImportModal());
window.showExportModal = () => import('./modules/transactions.js').then(t => t.showExportModal());
window.showAddProjectModal = () => import('./modules/projects.js').then(p => p.showAddProjectModal());
window.showAddSupplierModal = () => import('./modules/suppliers.js').then(s => s.showAddSupplierModal());
window.editMaterial = (id) => import('./modules/materials.js').then(m => m.editMaterial(id));

// Đăng nhập/đăng xuất
window.login = (userId) => {
    const users = [
        { id: 'u1', name: 'Admin', role: 'admin' },
        { id: 'u2', name: 'Nhân viên kho', role: 'user' }
    ];
    const user = users.find(u => u.id === userId);
    if (user) {
        setCurrentUser(user);
        addLog('Đăng nhập', `${user.name}`);
        render();
    }
};

window.logout = () => {
    addLog('Đăng xuất', getCurrentUser()?.name);
    setCurrentUser(null);
    render();
};

// Gán render toàn cục
window.renderApp = render;

// Khởi chạy
render();