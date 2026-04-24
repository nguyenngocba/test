// Utility functions - re-export từ state để tiện sử dụng
import { formatMoney, escapeHtml, addLog, saveData, loadData } from './state.js';

export { formatMoney, escapeHtml, addLog, saveData, loadData };

// Format ngày tháng
export function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

// Format số lượng
export function formatQuantity(qty, unit) {
    if (qty === undefined || qty === null) return '0';
    const formatted = qty.toLocaleString('vi-VN');
    return unit ? `${formatted} ${unit}` : formatted;
}

// Debounce cho tìm kiếm (tránh gọi render quá nhiều)
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Validate email
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone number
export function isValidPhone(phone) {
    const re = /^[0-9]{10,11}$/;
    return re.test(phone);
}

// Lấy thống kê nhanh
export function getQuickStats() {
    const materials = window.state?.materials || [];
    const transactions = window.state?.transactions || [];
    
    return {
        totalMaterials: materials.length,
        totalValue: materials.reduce((s, m) => s + m.qty * m.cost, 0),
        totalImport: transactions.filter(t => t.type === 'import').reduce((s, t) => s + t.total, 0),
        totalExport: transactions.filter(t => t.type === 'export').reduce((s, t) => s + t.total, 0),
        lowStockItems: materials.filter(m => m.qty <= m.low).length
    };
}