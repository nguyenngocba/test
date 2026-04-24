import { state, saveData, addLog, formatMoney, escapeHtml, setProjectFilter } from './state.js';
import { showModal } from './auth.js';

export function getProjects() {
    return state.projects;
}

// ========== THÊM HÀM LỌC CÔNG TRÌNH ==========
export function getFilteredProjects() {
    const keyword = state.filters.project.keyword || '';
    if (!keyword) return [...state.projects];
    
    const kw = keyword.toLowerCase();
    return state.projects.filter(p => 
        p.name.toLowerCase().includes(kw) || 
        p.id.toLowerCase().includes(kw)
    );
}

export function addProject(data) {
    const newId = `P${String(state.nextId.project++).padStart(3, '0')}`;
    const newProj = {
        id: newId,
        name: data.name,
        budget: Number(data.budget) || 0,
        spent: 0
    };
    state.projects.push(newProj);
    addLog('Thêm công trình', `${newProj.name} - Ngân sách: ${formatMoney(newProj.budget)}`);
    saveData();
    if (window.renderApp) window.renderApp();
    return newProj;
}

export function deleteProject(id) {
    const proj = state.projects.find(p => p.id === id);
    if (!proj) return false;
    
    const relatedTx = state.transactions.filter(t => t.projectId === id);
    if (relatedTx.length > 0) {
        if (!confirm(`Công trình này có ${relatedTx.length} giao dịch. Xóa sẽ mất dữ liệu. Tiếp tục?`)) {
            return false;
        }
        state.transactions = state.transactions.filter(t => t.projectId !== id);
    }
    
    state.projects = state.projects.filter(p => p.id !== id);
    addLog('Xóa công trình', `${proj.name}`);
    saveData();
    if (window.renderApp) window.renderApp();
    return true;
}

// ========== SỬA LẠI RENDER CÓ TÌM KIẾM ==========
export function renderProjects() {
    const filtered = getFilteredProjects();
    const keyword = state.filters.project.keyword || '';
    
    if (state.projects.length === 0) {
        return '<div class="card">📭 Chưa có công trình nào</div>';
    }
    
    return `
        <div class="card">
            <div class="sec-title">🔍 TÌM KIẾM CÔNG TRÌNH</div>
            <div class="search-box">
                <input type="text" id="project-search" placeholder="🔍 Tìm theo tên hoặc mã công trình..." 
                       value="${escapeHtml(keyword)}" style="flex:1">
                <button id="clear-project-search" class="sm">✖️ Xóa</button>
            </div>
        </div>
        
        <div class="card">
            <div class="sec-title">🏗️ DANH SÁCH CÔNG TRÌNH (${filtered.length})</div>
            ${filtered.length === 0 ? '<div class="metric-sub">📭 Không tìm thấy công trình phù hợp</div>' : `
                <div class="tbl-wrap">
                    <table style="min-width:700px">
                        <thead>
                            <tr><th>Mã</th><th>Tên công trình</th><th>Ngân sách</th><th>Đã chi</th><th>Còn lại</th><th>%</th><th>Thao tác</th></tr>
                        </thead>
                        <tbody>
                            ${filtered.map(p => {
                                const spent = state.transactions.filter(t => t.projectId === p.id).reduce((s, t) => s + (t.total || 0), 0);
                                const percent = p.budget > 0 ? (spent / p.budget) * 100 : 0;
                                return `
                                    <tr>
                                        <td>${p.id}</td>
                                        <td><strong>${escapeHtml(p.name)}</strong></td>
                                        <td>${formatMoney(p.budget)}</td>
                                        <td>${formatMoney(spent)}</td>
                                        <td>${formatMoney(p.budget - spent)}</td>
                                        <td>
                                            <div style="width:80px;background:var(--surface2);border-radius:10px;overflow:hidden">
                                                <div style="width:${Math.min(100, percent)}%;height:6px;background:var(--accent)"></div>
                                            </div>
                                            ${percent.toFixed(0)}%
                                        </td>
                                        <td><button class="sm danger" onclick="deleteProject('${p.id}')">🗑️ Xóa</button></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

// ========== BIND SỰ KIỆN TÌM KIẾM ==========
export function bindProjectSearchEvents() {
    const searchInput = document.getElementById('project-search');
    const clearBtn = document.getElementById('clear-project-search');
    
    const updateSearch = () => {
        setProjectFilter(searchInput?.value || '');
        if (window.renderApp) window.renderApp();
        setTimeout(() => bindProjectSearchEvents(), 50);
    };
    
    if (searchInput) searchInput.oninput = updateSearch;
    if (clearBtn) clearBtn.onclick = () => {
        setProjectFilter('');
        if (window.renderApp) window.renderApp();
        setTimeout(() => bindProjectSearchEvents(), 50);
    };
}

export function showAddProjectModal() {
    showModal('🏗️ Thêm công trình mới', `
        <div class="form-group">
            <label>Tên công trình</label>
            <input id="proj-name" placeholder="VD: Cầu vượt X">
        </div>
        <div class="form-group">
            <label>Ngân sách (VNĐ)</label>
            <input id="proj-budget" type="number" value="0">
        </div>
    `, () => {
        addProject({
            name: document.getElementById('proj-name').value,
            budget: document.getElementById('proj-budget').value
        });
    });
}