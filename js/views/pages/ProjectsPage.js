import { appState } from '../../core/state.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { projectService } from '../../services/ProjectService.js';
import { formatMoney, escapeHtml } from '../../utils/formatters.js';
import { Modal } from '../components/Modal.js';

class ProjectsPage {
    constructor() {
        eventBus.on(EVENTS.PROJECT_ADDED, () => this.rerender());
        eventBus.on(EVENTS.PROJECT_DELETED, () => this.rerender());
        eventBus.on(EVENTS.TRANSACTION_CREATED, () => this.rerender());
        this.chart = null;
    }
    
    rerender() { if (appState.getCurrentPane() === 'projects') { const c = document.querySelector('#pane-projects'); if (c) c.innerHTML = this.render(); this.renderChart(); } }
    
    render() {
        const search = appState.filters.projectSearch?.toLowerCase() || '';
        const filtered = appState.projects.filter(p => p.name.toLowerCase().includes(search));
        const stats = filtered.map(p => {
            const txns = appState.transactions.filter(t => t.projectId === p.id && t.type === 'usage');
            const spent = txns.reduce((s,t) => s + (t.totalAmount || 0), 0);
            const percent = p.budget > 0 ? (spent / p.budget) * 100 : 0;
            return { ...p, spent, percent, txns: txns.length };
        });
        
        return `
            <div class="card">
                <div class="sec-title">🏗️ CÔNG TRÌNH</div>
                <div class="search-box"><input type="text" id="project-search" placeholder="Tìm kiếm..." value="${escapeHtml(search)}" onkeyup="window.projectsPage.filter()"><button class="sm" onclick="window.projectsPage.clearSearch()">Xóa</button></div>
                <div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
                    ${stats.map(p => `
                        <div class="metric-card">
                            <div><strong>${escapeHtml(p.name)}</strong> <span class="tag">${p.txns} lượt</span></div>
                            <div class="metric-val" style="font-size:18px">${formatMoney(p.spent)}</div>
                            <div class="metric-sub">Ngân sách: ${formatMoney(p.budget)}</div>
                            <div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, p.percent)}%"></div></div>
                            <div class="metric-sub">${p.percent.toFixed(1)}% đã dùng</div>
                            <button class="sm danger-btn" style="margin-top:8px" onclick="window.projectsPage.delete('${p.id}')">🗑️ Xóa</button>
                        </div>
                    `).join('')}
                </div>
                <div class="sec-title">📊 BIỂU ĐỒ CHI PHÍ</div>
                <canvas id="ch-project-cost" style="height:260px"></canvas>
            </div>
        `;
    }
    
    renderChart() {
        const ctx = document.getElementById('ch-project-cost');
        if (!ctx) return;
        if (this.chart) this.chart.destroy();
        const search = appState.filters.projectSearch?.toLowerCase() || '';
        const filtered = appState.projects.filter(p => p.name.toLowerCase().includes(search));
        const data = filtered.map(p => appState.transactions.filter(t => t.projectId === p.id && t.type === 'usage').reduce((s,t) => s + (t.totalAmount || 0), 0));
        if (filtered.length) {
            this.chart = new Chart(ctx, { type: 'bar', data: { labels: filtered.map(p => p.name), datasets: [{ label: 'Chi phí (VNĐ)', data, backgroundColor: '#378ADD' }] }, options: { maintainAspectRatio: true } });
        }
    }
    
    filter() { appState.setFilter('projectSearch', document.getElementById('project-search')?.value || ''); this.rerender(); }
    clearSearch() { appState.setFilter('projectSearch', ''); this.rerender(); }
    
    showAddModal() {
        Modal.show({
            title: '🏗️ Thêm công trình',
            content: `<div class="form-group"><label>Tên công trình</label><input id="proj-name"></div><div class="form-group"><label>Ngân sách</label><input id="proj-budget" type="number" value="0"></div>`,
            onConfirm: () => projectService.createProject({ name: document.getElementById('proj-name')?.value, budget: document.getElementById('proj-budget')?.value })
        });
    }
    
    delete(id) { projectService.deleteProject(id); }
}

export const projectsPage = new ProjectsPage();
window.projectsPage = projectsPage;
window.openProjectModal = () => projectsPage.showAddModal();