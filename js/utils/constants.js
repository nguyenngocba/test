export const DEFAULT_CATEGORIES = [
    'Dầm thép', 'Tấm thép', 'Thép hộp', 'Thép góc', 
    'Vật tư tiêu hao', 'Bu lông - Ốc vít', 'Ống thép', 'Thép hình'
];

export const DEFAULT_UNITS = ['tấn', 'kg', 'cái', 'mét', 'thùng', 'tấm', 'cuộn'];

export const DEFAULT_USERS = [
    { 
        id: 'u1', 
        name: 'Admin System', 
        username: 'admin', 
        password: 'admin123', 
        role: 'admin', 
        permissions: { 
            canCreateMaterial: true, canDeleteMaterial: true, canEditMaterial: true,
            canImport: true, canExport: true, canDeleteProject: true,
            canAccessSettings: true, canManageSupplier: true 
        } 
    },
    { 
        id: 'u2', 
        name: 'Nhân viên kho', 
        username: 'staff', 
        password: 'staff123', 
        role: 'user', 
        permissions: { 
            canCreateMaterial: false, canDeleteMaterial: false, canEditMaterial: false,
            canImport: true, canExport: true, canDeleteProject: false,
            canAccessSettings: false, canManageSupplier: false 
        } 
    }
];

export const DEFAULT_PROJECTS = [
    { id: 'P001', name: 'Nhà kho A', budget: 50000, spent: 0 },
    { id: 'P002', name: 'Mái nhà xưởng B', budget: 35000, spent: 0 },
    { id: 'P003', name: 'Khung văn phòng C', budget: 28000, spent: 0 }
];

export const DEFAULT_SUPPLIERS = [
    { id: 'S001', name: 'Thép Việt Đức', phone: '0243 123 456', email: 'contact@thepvietduc.com', address: 'Hà Nội' },
    { id: 'S002', name: 'Hòa Phát Group', phone: '0243 789 012', email: 'sales@hoaphat.com.vn', address: 'Hưng Yên' },
    { id: 'S003', name: 'Thép Pomina', phone: '0283 456 789', email: 'info@pomina.com', address: 'Bà Rịa - Vũng Tàu' }
];

export const DEFAULT_MATERIALS = [
    { id: 'M001', name: 'Dầm H 200x200', cat: 'Dầm thép', unit: 'tấn', qty: 18.5, cost: 850, low: 5, note: '' },
    { id: 'M002', name: 'Tôn dày 10mm', cat: 'Tấm thép', unit: 'tấn', qty: 22.0, cost: 760, low: 6, note: '' },
    { id: 'M003', name: 'Que hàn E7018', cat: 'Vật tư tiêu hao', unit: 'thùng', qty: 40, cost: 12, low: 15, note: '' },
    { id: 'M004', name: 'Bu lông M20', cat: 'Bu lông - Ốc vít', unit: 'cái', qty: 850, cost: 0.45, low: 200, note: '' }
];