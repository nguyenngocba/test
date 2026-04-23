import { appState } from '../../core/state.js';
import { formatMoney } from '../../utils/formatters.js';

class DashboardPage {
    constructor() { this.charts = {}; }
    
    render() {
        const totalVal = appState.materials.reduce((s, m) => s + (m.qty * m.cost), 0);
        const totalUsage = appState.transactions.filter(t => t.type === 'usage').reduce((s, t) => s + (t.totalAmount || 0), 0);
        const totalPurchase = appState.transactions.filter(t => t.type === 'purchase').reduce((s, t) => s + (t.totalAmount || 0), 0);
        
        const supplierStats = appState.suppliers.map(s => ({
            name: s.name,
            total: appState.transactions.filter(t => t.type === 'purchase' && t.supplierId === s.id).reduce((sum, t) => sum + (t.totalAmount || 0), 0)
        })).filter(s => s.total > 0);
        
        return `
            <div class="grid4">
                <div class="metric-card"><div class="metric-label">💰 Giá trị tồn kho</div><div class="metric-val">${formatMoney(totalVal)}</div></div>
                <div class="metric-card"><div class="metric-label">📦 Số mặt hàng</div><div class="metric-val">${appState.materials.length}</div></div>
                <div class="metric-card"><div class="metric-label">🏗️ Chi phí công trình</div><div class="metric-val">${formatMoney(totalUsage)}</div></div>
                <div class="metric-card"><div class="metric-label">📥 Tổng nhập kho</div><div class="metric-val">${formatMoney(totalPurchase)}</div></div>
            </div>
            <div class="grid2">
                <div class="card"><div class="sec-title">📈 BIỂU ĐỒ TỒN KHO</div><canvas id="ch-stock" style="height:250px"></canvas></div>
                <div class="card"><div class="sec-title">🏭 NHẬP HÀNG THEO NCC</div>
                    ${supplierStats.length > 0 ? `<canvas id="ch-supplier" style="height:250px"></canvas>` : '<div class="metric-sub">Chưa có dữ liệu</div>'}
                </div>
            </div>
        `;
    }
    
    onShow() {
        const ctx = document.getElementById('ch-stock');
        if (ctx && appState.materials.length) {
            if (this.charts.stock) this.charts.stock.destroy();
            this.charts.stock = new Chart(ctx, { type: 'bar', data: { labels: appState.materials.map(m => m.name), datasets: [{ label: 'Tồn kho', data: appState.materials.map(m => m.qty), backgroundColor: '#378ADD' }] }, options: { maintainAspectRatio: true } });
        }
        const supCtx = document.getElementById('ch-supplier');
        if (supCtx) {
            const stats = appState.suppliers.map(s => ({ name: s.name, total: appState.transactions.filter(t => t.type === 'purchase' && t.supplierId === s.id).reduce((sum, t) => sum + (t.totalAmount || 0), 0) })).filter(s => s.total > 0);
            if (stats.length) {
                if (this.charts.supplier) this.charts.supplier.destroy();
                this.charts.supplier = new Chart(supCtx, { type: 'bar', data: { labels: stats.map(s => s.name), datasets: [{ label: 'Nhập hàng (VNĐ)', data: stats.map(s => s.total), backgroundColor: '#97C459' }] }, options: { maintainAspectRatio: true } });
            }
        }
    }
}

export const dashboardPage = new DashboardPage();