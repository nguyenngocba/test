import { appState } from '../../core/state.js';
import { materialService } from '../../services/MaterialService.js';
import { projectService } from '../../services/ProjectService.js';
import { supplierService } from '../../services/SupplierService.js';
import { formatMoney } from '../../utils/formatters.js';
import { Chart } from '../components/Chart.js';

class DashboardPage {
    constructor() {
        this.charts = {};
    }

    render() {
        const totalInventory = materialService.getTotalInventoryValue();
        const totalProjectCost = projectService.getTotalProjectCost();
        const totalPurchaseCost = supplierService.getTotalPurchaseCost();
        const materialCount = appState.materials.length;
        
        const topSuppliers = supplierService.getTopSuppliers(5);
        
        return `
            <div class="grid4">
                <div class="metric-card">
                    <div class="metric-label">💰 Giá trị tồn kho</div>
                    <div class="metric-val">${formatMoney(totalInventory)}</div>
                    <div class="metric-sub">Theo giá gốc</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">📦 Số mặt hàng</div>
                    <div class="metric-val">${materialCount}</div>
                    <div class="metric-sub">Đang quản lý</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">🏗️ Chi phí công trình</div>
                    <div class="metric-val">${formatMoney(totalProjectCost)}</div>
                    <div class="metric-sub">Vật tư đã xuất</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">📥 Tổng nhập kho</div>
                    <div class="metric-val">${formatMoney(totalPurchaseCost)}</div>
                    <div class="metric-sub">Bao gồm VAT</div>
                </div>
            </div>
            <div class="grid2" style="margin-bottom:18px">
                <div class="card">
                    <div class="sec-title">📈 BIỂU ĐỒ TỒN KHO</div>
                    <div style="height:250px"><canvas id="ch-stock"></canvas></div>
                </div>
                <div class="card">
                    <div class="sec-title">🏭 NHẬP HÀNG THEO NHÀ CUNG CẤP</div>
                    ${topSuppliers.length > 0 
                        ? `<div style="height:250px"><canvas id="ch-supplier"></canvas></div>` 
                        : '<div class="metric-sub">Chưa có dữ liệu nhập hàng từ nhà cung cấp</div>'}
                </div>
            </div>
        `;
    }

    onShow() {
        this.renderStockChart();
        this.renderSupplierChart();
    }

    renderStockChart() {
        const ctx = document.getElementById('ch-stock');
        if (!ctx) return;
        
        const materials = materialService.getAllMaterials();
        if (materials.length === 0) return;
        
        this.charts.stock = new Chart(ctx, {
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
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } }
            }
        });
    }

    renderSupplierChart() {
        const ctx = document.getElementById('ch-supplier');
        if (!ctx) return;
        
        const topSuppliers = supplierService.getTopSuppliers(5);
        if (topSuppliers.length === 0) return;
        
        this.charts.supplier = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topSuppliers.map(s => s.supplier.name),
                datasets: [{
                    label: 'Giá trị nhập hàng (VNĐ)',
                    data: topSuppliers.map(s => s.totalSpent),
                    backgroundColor: '#97C459',
                    borderRadius: 6
                }]
            },
            options: { maintainAspectRatio: false }
        });
    }
}

export const dashboardPage = new DashboardPage();