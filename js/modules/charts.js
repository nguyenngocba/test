import { state, formatMoney } from './state.js';
import { getMaterials } from './materials.js';
import { getTransactions } from './transactions.js';

export function renderDashboard() {
    const materials = getMaterials();
    const transactions = getTransactions();
    const totalValue = materials.reduce((s, m) => s + m.qty * m.cost, 0);
    const totalImport = transactions.filter(t => t.type === 'import').reduce((s, t) => s + t.total, 0);
    const totalExport = transactions.filter(t => t.type === 'export').reduce((s, t) => s + t.total, 0);
    
    return `
        <div class="grid4">
            <div class="metric-card">
                <div class="metric-label">💰 Giá trị tồn kho</div>
                <div class="metric-val">${formatMoney(totalValue)}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">📦 Số mặt hàng</div>
                <div class="metric-val">${materials.length}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">📥 Tổng nhập</div>
                <div class="metric-val">${formatMoney(totalImport)}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">📤 Tổng xuất</div>
                <div class="metric-val">${formatMoney(totalExport)}</div>
            </div>
        </div>
        <div class="card">
            <div class="sec-title">📈 BIỂU ĐỒ TỒN KHO</div>
            <canvas id="stockChart" style="height:250px"></canvas>
        </div>
    `;
}

export function renderDashboardChart() {
    const ctx = document.getElementById('stockChart');
    if (!ctx) return;
    
    const materials = getMaterials();
    if (materials.length === 0) return;
    
    // Hủy chart cũ nếu có
    if (window.stockChartInstance) {
        window.stockChartInstance.destroy();
    }
    
    window.stockChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: materials.map(m => m.name),
            datasets: [{
                label: 'Số lượng tồn',
                data: materials.map(m => m.qty),
                backgroundColor: '#378ADD',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}