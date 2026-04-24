import { state, saveState, addLog, formatMoney, escapeHtml, showModal, closeModal, genPid, projectById, hasPermission } from './state.js';

// ========== FILTER CÔNG TRÌNH ==========
let projectSearchKeyword = '';

function getFilteredProjects() {
    if (!projectSearchKeyword) return [...state.data.projects];
    const kw = projectSearchKeyword.toLowerCase();
    return state.data.projects.filter(p => p.name.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw));
}

function renderProjectSearchBar() {
    return `
        <div class="card" style="margin-bottom: 16px;">
            <div class="sec-title">🔍 TÌM KIẾM CÔNG TRÌNH</div>
            <div style="display: flex; gap: 10px;">
                <input type="text" id="proj-search" placeholder="Tên hoặc mã công trình..." 
                       value="${escapeHtml(projectSearchKeyword)}" style="flex: 1;">
                <button id="proj-clear-search" class="sm">✖️ Xóa</button>
            </div>
        </div>
    `;
}

function bindProjectSearchEvents() {
    const searchInput = document.getElementById('proj-search');
    const clearBtn = document.getElementById('proj-clear-search');
    
    const handleSearch = () => {
        projectSearchKeyword = searchInput?.value || '';
        if (window.render) window.render();
        setTimeout(() => bindProjectSearchEvents(), 50);
    };
    
    if (searchInput) searchInput.oninput = handleSearch;
    if (clearBtn) clearBtn.onclick = () => {
        projectSearchKeyword = '';
        if (window.render) window.render();
        setTimeout(() => bindProjectSearchEvents(), 50);
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
    return { ...p, totalCost, items, percent };
  });
  
  const result = renderProjectSearchBar() + `<div class="card">
    <div class="sec-title">🏗️ DANH SÁCH CÔNG TRÌNH (${filtered.length})</div>
    <div class="grid2" style="grid-template-columns:repeat(auto-fit, minmax(320px,1fr));gap:16px;margin-bottom:24px">
      ${projectStats.map(p => `<div class="metric-card">
        <div style="display:flex;justify-content:space-between;align-items:center"><div class="metric-label">🏗️ ${escapeHtml(p.name)}</div><div class="tag">${p.items} lượt xuất</div></div>
        <div class="metric-val" style="font-size:20px;margin:8px 0">${formatMoney(p.totalCost)}</div>
        <div class="metric-sub">💰 Ngân sách: ${formatMoney(p.budget)}</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, p.percent)}%;background:${p.percent > 90 ? '#A32D2D' : '#378ADD'}"></div></div>
        <div class="metric-sub" style="margin-top:6px">${p.percent.toFixed(1)}% ngân sách đã sử dụng</div>
        ${hasPermission('canDeleteProject') ? `<button class="sm danger-btn" style="margin-top:12px" onclick="deleteProject('${p.id}')">🗑️ Xóa công trình</button>` : ''}
      </div>`).join('')}
    </div>
    <div class="sec-title">📊 CHI PHÍ THEO CÔNG TRÌNH</div><div style="height:260px"><canvas id="ch-project-cost"></canvas></div>
    <div class="sec-title" style="margin-top:20px">📜 LỊCH SỬ XUẤT KHO THEO CÔNG TRÌNH</div>
    <div class="tbl-wrap"><table style="min-width:700px"><thead><tr><th>Công trình</th><th>Vật tư</th><th>Số lượng</th><th>Đơn giá</th><th>Tổng giá trị</th><th>Ngày xuất</th></tr></thead>
    <tbody>${state.data.transactions.filter(t => t.type === 'usage' && t.projectId && (!projectSearchKeyword || projectById(t.projectId)?.name.toLowerCase().includes(projectSearchKeyword.toLowerCase()))).sort((a,b)=>new Date(b.date) - new Date(a.date)).map(t => {
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
  </div>`;
  
  setTimeout(() => bindProjectSearchEvents(), 50);
  return result;
}

// Các hàm khác giữ nguyên
export function openProjectModal() {
  if (!hasPermission('canCreateMaterial')) { alert('Bạn không có quyền thêm công trình'); return; }
  showModal(`<div class="modal-hd"><span class="modal-title">🏗️ Thêm công trình mới</span><button class="xbtn" onclick="closeModal()">✕</button></div>
    <div class="modal-bd"><div class="form-group"><label class="form-label">Tên công trình</label><input id="proj-name" placeholder="VD: Cầu vượt X"></div>
    <div class="form-group"><label class="form-label">Ngân sách dự kiến (VNĐ)</label><input id="proj-budget" type="number" value="0"></div></div>
    <div class="modal-ft"><button onclick="closeModal()">Hủy</button><button class="primary" onclick="saveProject()">Tạo công trình</button></div>`);
}

export function saveProject() {
  const name = document.getElementById('proj-name')?.value.trim();
  if(!name) return alert('Nhập tên công trình');
  const newProj = {
    id: genPid(), name, budget: parseFloat(document.getElementById('proj-budget').value) || 0, spent: 0
  };
  state.data.projects.push(newProj);
  addLog('Thêm công trình', `Đã thêm công trình: ${name} (${newProj.id}) - Ngân sách: ${formatMoney(newProj.budget)}`);
  saveState(); closeModal(); if(window.render) window.render();
}

export function deleteProject(pid) {
  if (!hasPermission('canDeleteProject')) { alert('Bạn không có quyền xóa công trình'); return; }
  const project = projectById(pid);
  if (!project) return;
  const relatedTxns = state.data.transactions.filter(t => t.projectId === pid && t.type === 'usage');
  if (relatedTxns.length > 0) {
    if (!confirm(`⚠️ Công trình "${project.name}" đã có ${relatedTxns.length} giao dịch xuất vật tư.\nXóa công trình sẽ XÓA LUÔN các giao dịch này.\nBạn có chắc chắn?`)) return;
  } else {
    if (!confirm(`Xóa công trình "${project.name}"?`)) return;
  }
  state.data.projects = state.data.projects.filter(p => p.id !== pid);
  state.data.transactions = state.data.transactions.filter(t => t.projectId !== pid);
  addLog('Xóa công trình', `Đã xóa công trình: ${project.name} (${pid})`);
  saveState(); if(window.render) window.render();
}

// Hàm giữ để tương thích
export function filterProjects() {}
export function clearProjectSearch() {}