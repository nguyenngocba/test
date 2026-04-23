export function formatMoney(v) { return (v || 0).toLocaleString('vi-VN') + ' ₫'; }
export function escapeHtml(s) { if (!s) return ''; return s.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])); }
export function formatDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('vi-VN'); }