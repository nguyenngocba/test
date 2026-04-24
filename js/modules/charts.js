import { state, formatMoney } from './state.js';

let stockChart = null;
let projectChart = null;
let supplierChart = null;

export function renderDashboard() {
  const totalVal = state.data.materials.reduce((s, m) => s + (m.qty * m.cost), 0);
  const totalProjectCost = state.data.transactions.filter(t => t.type === 'usage').reduce((s, t) => s + (t.totalAmount || 0), 0);
  const totalPurchaseCost = state.data.transactions.filter(t => t.type === 'purchase').reduce((s, t) => s + (t.totalAmount || 0), 0);
  const supplierStats = state.data.suppliers.map(s => ({
    name: s.name,
    total: state.data.transactions.filter(t => t.type === 'purchase' && t.supplierId === s.id).reduce((sum, t) => sum + (t.totalAmount || 0), 0)
  })).filter(s => s.total > 0).sort((a,b) => b.total - a.total);
  
  return `<div class="grid4">
    <div class="metric-card"><div class="metric-label">💰 Giá trị tồn kho</div><div class="metric-val">${formatMoney(totalVal)}</div><div class="metric-sub">Theo giá gốc</div></div>
    <div class="metric-card"><div class="metric-label">📦 Số mặt hàng</div><div class="metric-val">${state.data.materials.length}</div><div class="metric-sub">Đang quản lý</div></div>
    <div class="metric-card"><div class="metric-label">🏗️ Chi phí công trình</div><div class="metric-val">${formatMoney(totalProjectCost)}</div><div class="metric-sub">Vật tư đã xuất</div></div>
    <div class="metric-card"><div class="metric-label">📥 Tổng nhập kho</div><div class="metric-val">${formatMoney(totalPurchaseCost)}</div><div class="metric-sub">Bao gồm VAT</div></div>
  </div>
  <div class="grid2" style="margin-bottom:18px">
    <div class="card"><div class="sec-title">📈 BIỂU ĐỒ TỒN KHO</div><div style="height:250px"><canvas id="ch-stock"></canvas></div></div>
    <div class="card"><div class="sec-title">🏭 NHẬP HÀNG THEO NHÀ CUNG CẤP</div>
      ${supplierStats.length > 0 ? `<div style="height:250px"><canvas id="ch-supplier"></canvas></div>` : '<div class="metric-sub">Chưa có dữ liệu nhập hàng từ nhà cung cấp</div>'}
    </div>
  </div>`;
}

export function renderCharts() {
  const ctx = document.getElementById('ch-stock');
  if (!ctx) return;
  if (stockChart) stockChart.destroy();
  if (state.data.materials.length === 0) return;
  stockChart = new Chart(ctx, { 
    type: 'bar', 
    data: { 
      labels: state.data.materials.map(m => m.name), 
      datasets: [{ label: 'Số lượng tồn', data: state.data.materials.map(m => m.qty), backgroundColor: '#378ADD', borderRadius: 6 }] 
    }, 
    options: { maintainAspectRatio: false, plugins: { legend: { position: 'top' } } } 
  });
  
  const supplierCtx = document.getElementById('ch-supplier');
  if (supplierCtx) {
    if (supplierChart) supplierChart.destroy();
    const supplierStats = state.data.suppliers.map(s => ({
      name: s.name,
      total: state.data.transactions.filter(t => t.type === 'purchase' && t.supplierId === s.id).reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    })).filter(s => s.total > 0);
    if (supplierStats.length > 0) {
      supplierChart = new Chart(supplierCtx, { 
        type: 'bar', 
        data: { 
          labels: supplierStats.map(s => s.name), 
          datasets: [{ label: 'Giá trị nhập hàng (VNĐ)', data: supplierStats.map(s => s.total), backgroundColor: '#97C459', borderRadius: 6 }] 
        }, 
        options: { maintainAspectRatio: false } 
      });
    }
  }
}

export function renderProjectCharts() {
  const ctx = document.getElementById('ch-project-cost');
  if (!ctx) return;
  if (projectChart) projectChart.destroy();
  const searchTerm = state.filters.projectSearch?.toLowerCase() || '';
  const filteredProjects = state.data.projects.filter(p => p.name.toLowerCase().includes(searchTerm));
  const labels = filteredProjects.map(p => p.name);
  const data = filteredProjects.map(p => 
    state.data.transactions.filter(t => t.projectId === p.id && t.type === 'usage').reduce((s, t) => s + (t.totalAmount || 0), 0)
  );
  if (labels.length > 0) {
    projectChart = new Chart(ctx, { 
      type: 'bar', 
      data: { 
        labels, 
        datasets: [{ label: 'Chi phí đã sử dụng (VNĐ)', data, backgroundColor: '#378ADD', borderRadius: 6 }] 
      }, 
      options: { maintainAspectRatio: false, responsive: true } 
    });
  }
}