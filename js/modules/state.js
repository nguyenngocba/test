// State quản lý dữ liệu
export let state = {
    currentUser: null,
    currentPane: 'entry',
    materials: [],
    projects: [],
    suppliers: [],
    transactions: [],
    logs: [],
    categories: ['Dầm thép', 'Tấm thép', 'Thép hộp', 'Thép góc', 'Bu lông', 'Que hàn', 'Ống thép'],
    units: ['tấn', 'kg', 'cái', 'mét', 'thùng', 'bộ'],
    nextId: { material: 1, project: 1, supplier: 1, transaction: 1 },
    // THÊM FILTERS CHO TÌM KIẾM
    filters: {
        material: { keyword: '', category: '', minStock: '', maxStock: '' },
        project: { keyword: '' },
        supplier: { keyword: '' }
    }
};

// Lưu dữ liệu vào localStorage
export function saveData() {
    localStorage.setItem('steeltrack_data', JSON.stringify({
        materials: state.materials,
        projects: state.projects,
        suppliers: state.suppliers,
        transactions: state.transactions,
        logs: state.logs,
        nextId: state.nextId
    }));
}

// Tải dữ liệu từ localStorage
export function loadData() {
    const saved = localStorage.getItem('steeltrack_data');
    if (saved) {
        const data = JSON.parse(saved);
        state.materials = data.materials || [];
        state.projects = data.projects || [];
        state.suppliers = data.suppliers || [];
        state.transactions = data.transactions || [];
        state.logs = data.logs || [];
        state.nextId = data.nextId || { material: 1, project: 1, supplier: 1, transaction: 1 };
    }
    
    // Dữ liệu mặc định nếu chưa có
    if (state.materials.length === 0) {
        state.materials = [
            { id: 'M001', name: 'Dầm H 200x200', cat: 'Dầm thép', unit: 'tấn', qty: 18.5, cost: 850000, low: 5 },
            { id: 'M002', name: 'Tôn dày 10mm', cat: 'Tấm thép', unit: 'tấn', qty: 22, cost: 760000, low: 6 },
            { id: 'M003', name: 'Que hàn E7018', cat: 'Que hàn', unit: 'thùng', qty: 40, cost: 12000, low: 15 },
            { id: 'M004', name: 'Bu lông M20', cat: 'Bu lông', unit: 'cái', qty: 850, cost: 450, low: 200 }
        ];
        state.nextId.material = 5;
    }
    
    if (state.projects.length === 0) {
        state.projects = [
            { id: 'P001', name: 'Nhà kho A', budget: 50000000, spent: 0 },
            { id: 'P002', name: 'Mái nhà xưởng B', budget: 35000000, spent: 0 },
            { id: 'P003', name: 'Khung văn phòng C', budget: 28000000, spent: 0 }
        ];
        state.nextId.project = 4;
    }
    
    if (state.suppliers.length === 0) {
        state.suppliers = [
            { id: 'S001', name: 'Thép Việt Đức', phone: '0243 123 456', address: 'Hà Nội' },
            { id: 'S002', name: 'Hòa Phát Group', phone: '0243 789 012', address: 'Hưng Yên' },
            { id: 'S003', name: 'Thép Pomina', phone: '0283 456 789', address: 'Bà Rịa' }
        ];
        state.nextId.supplier = 4;
    }
    
    saveData();
}

// Thêm log
export function addLog(action, detail) {
    const user = state.currentUser;
    state.logs.unshift({
        time: new Date().toLocaleString('vi-VN'),
        user: user?.name || 'System',
        action: action,
        detail: detail || ''
    });
    if (state.logs.length > 300) state.logs.pop();
    saveData();
}

// Format tiền tệ
export function formatMoney(v) {
    if (v === undefined || v === null) return '0₫';
    return v.toLocaleString('vi-VN') + '₫';
}

// Escape HTML
export function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== THÊM CÁC HÀM FILTER ==========
export function setMaterialFilter(key, value) {
    state.filters.material[key] = value;
}

export function setProjectFilter(keyword) {
    state.filters.project.keyword = keyword;
}

export function setSupplierFilter(keyword) {
    state.filters.supplier.keyword = keyword;
}

export function clearMaterialFilters() {
    state.filters.material = { keyword: '', category: '', minStock: '', maxStock: '' };
}