import { state, saveState, addLog, formatMoney, escapeHtml, showModal, closeModal, genPid, projectById, hasPermission } from './state.js';
import { handleIntegerInput, getRawInteger, setFormattedValue } from './utils.js';

// ========== FILTER CÔNG TRÌNH NÂNG CAO ==========
let projectFilters = { keyword: '', budgetMin: '', budgetMax: '', status: '' };
let projectListContainer = null;

function getFilteredProjects() {
    let result = [...state.data.projects];
    const f = projectFilters;
    
    // Lọc theo từ khóa (tên hoặc mã)
    if (f.keyword) {
        const kw = f.keyword.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw));
    }
    
    // Lọc theo ngân sách tối thiểu
    if (f.budgetMin !== '' && f.budgetMin !== null && f.budgetMin !== undefined) {
        const min = Number(f.budgetMin);
        if (!isNaN(min)) result = result.filter(p => p.budget >= min);
    }
    
    // Lọc theo ngân sách tối đa
    if (f.budgetMax !== '' && f.budgetMax !== null && f.budgetMax !== undefined) {
        const max = Number(f.budgetMax);
        if (!isNaN(max)) result = result.filter(p => p.budget <= max);
    }
    
    // Lọc theo trạng thái (còn ngân sách / hết ngân sách / quá ngân sách)
    if (f.status !== '' && f.status !== 'all') {
        result = result.filter(p => {
            const spent = state.data.transactions.filter(t => t.projectId === p.id && t.type === 'usage').reduce((s, t) => s + (t.totalAmount || 0), 0);
            const remaining = p.budget - spent;
            if (f.status === 'has_budget') return remaining > 0;
            if (f.status === 'out_of_budget') return remaining <= 0;
            if (f.status === 'over_budget') return spent > p.budget;
            return true;
        });
    }
    
    return result;
}

function updateProjectList() {
    if (!projectListContainer) return;
    const filtered = getFilteredProjects();
    
    const projectStats = filtered.map(p => {
        const txnList = state.data.transactions.filter(t => t.projectId === p.id && t.type === 'usage');
        const totalCost = txnList.reduce((s, t) => s + (t.totalAmount || 0), 0);
        const items = txnList.length;
        const percent = p.budget > 0 ? (totalCost / p.budget) * 100 : 0;
        const remaining = p.budget - totalCost;
        return { ...p, totalCost, items, percent, remaining };
    });
    
    if (filtered.length === 0) {
        projectListContainer.innerHTML = '<div class="metric-sub">📭 Không tìm thấy công trình phù hợp</div><div style="height:260px"><canvas id="ch-project-cost"></canvas></div>';
        return;
    }
    
    projectListContainer.innerHTML = `
        <div class="grid2" style="grid-template-columns:repeat(auto-fit, minmax(320px,1fr));gap:16px;margin-bottom:24px">
            ${projectStats.map(p => `<div class="metric-card">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div class="metric-label">🏗️ ${escapeHtml(p.name)}</div>
                    <div class="tag">${p.items} lượt xuất</div>
                </div>
                <div class="metric-val" style="font-size:20px;margin:8px 0">${formatMoney(p.totalCost)}</div>
                <div class="metric-sub">💰 Ngân sách: ${formatMoney(p.budget)}</div>
                <div class="metric-sub">📊 Còn lại: ${formatMoney(p.remaining)}</div>
                <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, p.percent)}%;background:${p.percent > 90 ? '#A32D2D' : '#378ADD'}"></div></div>
                <div class="metric-sub" style="margin-top:6px">${p.percent.toFixed(1)}% ngân sách đã sử dụng</div>
                ${hasPermission('canDeleteProject') ? `<button class="sm danger-btn" style="margin-top:12px" onclick="deleteProject('${p.id}')">🗑️ Xóa công trình</button>` : ''}
            </div>`).join('')}
        </div>
        <div class="sec-title">📊 CHI PHÍ THEO CÔNG TRÌNH</div><div style="height:260px"><canvas id="ch-project-cost"></canvas></div>
        <div class="sec-title" style="margin-top:20px">📜 LỊCH SỬ XUẤT KHO THEO CÔNG TRÌNH</div>
        <div class="tbl-wrap"><table style="min-width:700px"><thead><tr><th>Công trình</th><th>Vật tư</th><th>Số lượng</th><th>Đơn giá</th><th>Tổng giá trị</th><th>Ngày xuất</th></tr></thead>
        <tbody>${state.data.transactions.filter(t => t.type === 'usage' && t.projectId).sort((a,b)=>new Date(b.date) - new Date(a.date)).map(t => {
            const mat = state.data.materials.find(m => m.id === t.mid);
            const proj = projectById(t.projectId);
            if (!proj) return '';
            // Kiểm tra nếu công trình có trong kết quả lọc
            const isInFilter = filtered.some(p => p.id === proj.id);
            if (!isInFilter && projectFilters.keyword) return '';
            return `<tr>
                <td><strong>${proj?.name || 'N/A'}</strong></td>
                <td>${mat?.name || 'N/A'}</td>
                <td>${t.qty} ${mat?.unit || ''}</td>
                <td>${formatMoney(t.unitPrice || mat?.cost || 0)}</td>
                <td class="text-warning">${formatMoney(t.totalAmount || 0)}</td>
                <td>${t.date}</td>
            </tr>`;
        }).filter(row => row !== '').join('') || '<tr><td colspan="6">📭 Chưa có dữ liệu xuất kho cho công trình nào</td></tr>'}</tbody><td></div>
    `;
    
    // Vẽ lại biểu đồ
    setTimeout(() => {
        const ctx = document.getElementById('ch-project-cost');
        if (ctx && window.Chart) {
            if (window.projectChart) window.projectChart.destroy();
            if (projectStats.length > 0) {
                window.projectChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: projectStats.map(p => p.name),
                        datasets: [{ label: 'Chi phí đã sử dụng (VNĐ)', data: projectStats.map(p => p.totalCost), backgroundColor: '#378ADD', borderRadius: 6 }]
                    },
                    options: { maintainAspectRatio: false, responsive: true }
                });
            }
        }
    }, 100);
}

function renderProjectSearchBar() {
    const statusOptions = [
        { value: '', label: '📂 Tất cả' },
        { value: 'has_budget', label: '💰 Còn ngân sách' },
        { value: 'out_of_budget', label: '⚠️ Hết ngân sách' },
        { value: 'over_budget', label: '🔥 Quá ngân sách' }
    ];
    
    return `
        <div class="card" style="margin-bottom: 16px;">
            <div class="sec-title">🔍 TÌM KIẾM NÂNG CAO - CÔNG TRÌNH</div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                <input type="text" id="proj-search-keyword" placeholder="Tên hoặc mã công trình..." 
                       value="${escapeHtml(projectFilters.keyword)}" style="flex: 2; min-width: 180px;">
                <input type="number" id="proj-search-budget-min" placeholder="Ngân sách ≥" 
                       value="${projectFilters.budgetMin || ''}" style="width: 120px;">
                <input type="number" id="proj-search-budget-max" placeholder="Ngân sách ≤" 
                       value="${projectFilters.budgetMax || ''}" style="width: 120px;">
                <select id="proj-search-status" style="width: 140px;">
                    ${statusOptions.map(opt => `<option value="${opt.value}" ${projectFilters.status === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
                <button id="proj-clear-filters" class="sm">🗑️ Xóa bộ lọc</button>
            </div>
        </div>
    `;
}

function bindProjectSearchEvents() {
    const keywordInput = document.getElementById('proj-search-keyword');
    const budgetMinInput = document.getElementById('proj-search-budget-min');
    const budgetMaxInput = document.getElementById('proj-search-budget-max');
    const statusSelect = document.getElementById('proj-search-status');
    const clearBtn = document.getElementById('proj-clear-filters');
    
    const updateFilters = () => {
        projectFilters.keyword = keywordInput?.value || '';
        projectFilters.budgetMin = budgetMinInput?.value || '';
        projectFilters.budgetMax = budgetMaxInput?.value || '';
        projectFilters.status = statusSelect?.value || '';
        updateProjectList();
    };
    
    if (keywordInput) keywordInput.oninput = updateFilters;
    if (budgetMinInput) budgetMinInput.oninput = updateFilters;
    if (budgetMaxInput) budgetMaxInput.oninput = updateFilters;
    if (statusSelect) statusSelect.onchange = updateFilters;
    if (clearBtn) clearBtn.onclick = () => {
        projectFilters = { keyword: '', budgetMin: '', budgetMax: '', status: '' };
        if (keywordInput) keywordInput.value = '';
        if (budgetMinInput) budgetMinInput.value = '';
        if (budgetMaxInput) budgetMaxInput.value = '';
        if (statusSelect) statusSelect.value = '';
        updateProjectList();
    };
}

// ========== RENDER CHÍNH ==========
export function renderProjects() {
  const filtered = getFilteredProjects();
  
  const projectStats = filtered.map(p => {
    const txnList = state.data.transactions.filter(t => t.projectId === p.id && t.type === 'usage');
    const totalCost = txnList.reduce((s, t) => s + (t.totalAmount || 0), 0);
    const items = txnList.length;
    const percent = p.budget > 0 ? (totalCost / p.budget) * 100 : 0;
    const remaining = p.budget - totalCost;
    return { ...p, totalCost, items, percent, remaining };
  });
  
  const result = renderProjectSearchBar() + `<div class="card">
    <div class="sec-title">🏗️ DANH SÁCH CÔNG TRÌNH (${filtered.length})</div>
    <div id="project-list-container">
        <div class="grid2" style="grid-template-columns:repeat(auto-fit, minmax(320px,1fr));gap:16px;margin-bottom:24px">
            ${projectStats.map(p => `<div class="metric-card">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div class="metric-label">🏗️ ${escapeHtml(p.name)}</div>
                    <div class="tag">${p.items} lượt xuất</div>
                </div>
                <div class="metric-val" style="font-size:20px;margin:8px 0">${formatMoney(p.totalCost)}</div>
                <div class="metric-sub">💰 Ngân sách: ${formatMoney(p.budget)}</div>
                <div class="metric-sub">📊 Còn lại: ${formatMoney(p.remaining)}</div>
                <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, p.percent)}%;background:${p.percent > 90 ? '#A32D2D' : '#378ADD'}"></div></div>
                <div class="metric-sub" style="margin-top:6px">${p.percent.toFixed(1)}% ngân sách đã sử dụng</div>
                ${hasPermission('canDeleteProject') ? `<button class="sm danger-btn" style="margin-top:12px" onclick="deleteProject('${p.id}')">🗑️ Xóa công trình</button>` : ''}
            </div>`).join('')}
        </div>
        <div class="sec-title">📊 CHI PHÍ THEO CÔNG TRÌNH</div><div style="height:260px"><canvas id="ch-project-cost"></canvas></div>
        <div class="sec-title" style="margin-top:20px">📜 LỊCH SỬ XUẤT KHO THEO CÔNG TRÌNH</div>
        <div class="tbl-wrap"><table style="min-width:700px"><thead><tr><th>Công trình</th><th>Vật tư</th><th>Số lượng</th><th>Đơn giá</th><th>Tổng giá trị</th><th>Ngày xuất</th></tr></thead>
        <tbody>${state.data.transactions.filter(t => t.type === 'usage' && t.projectId).sort((a,b)=>new Date(b.date) - new Date(a.date)).map(t => {
            const mat = state.data.materials.find(m => m.id === t.mid);
            const proj = projectById(t.projectId);
            return `<tr>
                <td><strong>${proj?.name || 'N/A'}</strong></td>
                <td>${mat?.name || 'N/A'}</td>
                <td>${t.qty} ${mat?.unit || ''}</td>
                <td>${formatMoney(t.unitPrice || mat?.cost || 0)}</td>
                <td class="text-warning">${formatMoney(t.totalAmount || 0)}</td>
                <td>${t.date}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="6">📭 Chưa có dữ liệu xuất kho cho công trình nào</td></tr>'}</tbody></table></div>
    </div>
  </div>`;
  
  setTimeout(() => {
      bindProjectSearchEvents();
      projectListContainer = document.getElementById('project-list-container');
      // Vẽ biểu đồ
      const ctx = document.getElementById('ch-project-cost');
      if (ctx && window.Chart) {
          if (window.projectChart) window.projectChart.destroy();
          if (projectStats.length > 0) {
              window.projectChart = new Chart(ctx, {
                  type: 'bar',
                  data: {
                      labels: projectStats.map(p => p.name),
                      datasets: [{ label: 'Chi phí đã sử dụng (VNĐ)', data: projectStats.map(p => p.totalCost), backgroundColor: '#378ADD', borderRadius: 6 }]
                  },
                  options: { maintainAspectRatio: false, responsive: true }
              });
          }
      }
  }, 50);
  return result;
}

// Các hàm khác giữ nguyên
// ========== THÊM CÔNG TRÌNH ==========
export function openProjectModal() {
  if (!hasPermission('canCreateMaterial')) { alert('Bạn không có quyền thêm công trình'); return; }
  showModal(`<div class="modal-hd"><span class="modal-title">🏗️ Thêm công trình mới</span><button class="xbtn" onclick="closeModal()">✕</button></div>
    <div class="modal-bd">
      <div class="form-group"><label class="form-label">Tên công trình</label><input id="proj-name" placeholder="VD: Cầu vượt X"></div>
      <div class="form-group"><label class="form-label">Ngân sách dự kiến (VNĐ)</label><input type="text" id="proj-budget" value="0" style="text-align: right;"></div>
    </div>
    <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="saveProject()">Tạo công trình</button></div>`);
  
  setTimeout(() => {
      const budgetInput = document.getElementById('proj-budget');
      if (budgetInput) budgetInput.addEventListener('input', handleIntegerInput);
  }, 100);
}

export function saveProject() {
  const name = document.getElementById('proj-name')?.value.trim();
  if(!name) return alert('Nhập tên công trình');
  
  const budgetInput = document.getElementById('proj-budget');
  const budget = parseInt(budgetInput?.value.replace(/[^0-9]/g, '')) || 0;
  
  const newProj = {
    id: genPid(), name, budget: budget, spent: 0
  };
  state.data.projects.push(newProj);
  addLog('Thêm công trình', `Đã thêm công trình: ${name} (${newProj.id}) - Ngân sách: ${formatMoney(newProj.budget)}`);
  saveState(); closeModal(); if(window.render) window.render();
}
export function filterProjects() {}
export function clearProjectSearch() {}