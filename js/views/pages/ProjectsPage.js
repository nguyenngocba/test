import { appState } from '../../core/state.js';
import { eventBus, EVENTS } from '../../core/eventBus.js';
import { projectService } from '../../services/ProjectService.js';
import { materialService } from '../../services/MaterialService.js';
import { formatMoney, escapeHtml } from '../../utils/formatters.js';
import { Modal } from '../components/Modal.js';
import { Table } from '../components/Table.js';
import { Chart } from '../components/Chart.js';

class ProjectsPage {
    constructor() {
        this.chart = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        eventBus.on(EVENTS.PROJECT_ADDED, () => this.rerender());
        eventBus.on(EVENTS.PROJECT_UPDATED, () => this.rerender());
        eventBus.on(EVENTS.PROJECT_DELETED, () => this.rerender());
        eventBus.on(EVENTS.TRANSACTION_CREATED, () => this.rerender());
        eventBus.on(EVENTS.DATA_CHANGED, () => this.rerender());
    }

    rerender() {
        if (appState.getCurrentPane() === 'projects') {
            const container = document.querySelector('#pane-projects');
            if (container) {
                container.innerHTML = this.render();
                this.renderChart();
            }
        }
    }

    render() {
        const searchTerm = appState.filters.projectSearch?.toLowerCase() || '';
        const stats = projectService.getAllProjectsStats()
            .filter(s => s.project.name.toLowerCase().includes(searchTerm));
        
        const projectCards = stats.map(s => `
            <div class="metric-card">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div class="metric-label">🏗️ ${escapeHtml(s.project.name)}</div>
                    <div class="tag">${s.transactionCount} lượt xuất</div>
                </div>
                <div class="metric-val" style="font-size:20px;margin:8px 0">${formatMoney(s.totalSpent)}</div>
                <div class="metric-sub">💰 Ngân sách: ${formatMoney(s.project.budget)}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width:${Math.min(100, s.percentUsed)}%;background:${s.percentUsed > 90 ? '#A32D2D' : '#378ADD'}"></div>
                </div>
                <div class="metric-sub" style="margin-top:6px">${s.percentUsed.toFixed(1)}% ngân sách đã sử dụng</div>
                <button class="sm danger-btn" style="margin-top:12px" onclick="window.projectsPage.delete('${s.project.id}')">🗑️ Xóa công trình</button>
            </div>
        `).join('');

        // Transaction history
        const transactions = appState.transactions
            .filter(t => t.type === 'usage')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 50);

        const historyRows = transactions.map(t => {
            const material = materialService.getMaterialById(t.mid);
            const project = projectService.getProjectById(t.projectId);
            return `
                <tr>
                    <td><strong>${escapeHtml(project?.name || 'N/A')}</strong></td>
                    <td>${escapeHtml(material?.name || 'N/A')}</td>
                    <td>${t.qty} ${material?.unit || ''}</td>
                    <td>${formatMoney(t.unitPrice)}</td>
                    <td class="text-warning">${formatMoney(t.totalAmount)}</td>
                    <td>${t.date}</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="6">📭 Chưa có dữ liệu xuất kho</td></tr>';

        return `
            <div class="card">
                <div class="sec-title">🏗️ DANH SÁCH CÔNG TRÌNH</div>
                <div class="search-box">
                    <input type="text" id="project-search" placeholder="🔍 Tìm kiếm công trình..." 
                           value="${escapeHtml(appState.filters.projectSearch || '')}" 
                           onkeyup="window.projectsPage.filter()">
                    <button class="sm" onclick="window.projectsPage.clearSearch()">✖️ Xóa</button>
                </div>
                <div class="grid2" style="grid-template-columns:repeat(auto-fit, minmax(320px,1fr));gap:16px;margin-bottom:24px">
                    ${projectCards}
                </div>
                <div class="sec-title">📊 CHI PHÍ THEO CÔNG TRÌNH</div>
                <div style="height:260px"><canvas id="ch-project-cost"></canvas></div>
                <div class="sec-title" style="margin-top:20px">📜 LỊCH SỬ XUẤT KHO</div>
                <div class="tbl-wrap">
                    <table style="min-width:700px">
                        <thead><tr><th>Công trình</th><th>Vật tư</th><th>Số lượng</th><th>Đơn giá</th><th>Tổng giá trị</th><th>Ngày xuất</th></tr></thead>
                        <tbody>${historyRows}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    onShow() {
        this.renderChart();
    }

    renderChart() {
        const ctx = document.getElementById('ch-project-cost');
        if (!ctx) return;
        
        if (this.chart) this.chart.destroy();
        
        const searchTerm = appState.filters.projectSearch?.toLowerCase() || '';
        const stats = projectService.getAllProjectsStats()
            .filter(s => s.project.name.toLowerCase().includes(searchTerm));
        
        if (stats.length === 0) return;
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stats.map(s => s.project.name),
                datasets: [{
                    label: 'Chi phí đã sử dụng (VNĐ)',
                    data: stats.map(s => s.totalSpent),
                    backgroundColor: '#378ADD',
                    borderRadius: 6
                }]
            },
            options: { maintainAspectRatio: false, responsive: true }
        });
    }

    filter() {
        const searchInput = document.getElementById('project-search');
        if (searchInput) {
            appState.setFilter('projectSearch', searchInput.value);
            this.rerender();
        }
    }

    clearSearch() {
        appState.setFilter('projectSearch', '');
        this.rerender();
    }

    showAddModal() {
        const formHtml = `
            <div class="form-group">
                <label class="form-label">Tên công trình</label>
                <input id="proj-name" placeholder="VD: Cầu vượt X">
            </div>
            <div class="form-group">
                <label class="form-label">Ngân sách dự kiến (VNĐ)</label>
                <input id="proj-budget" type="number" value="0">
            </div>
        `;

        Modal.show({
            title: '🏗️ Thêm công trình mới',
            content: formHtml,
            onConfirm: () => {
                const name = document.getElementById('proj-name')?.value.trim();
                const budget = document.getElementById('proj-budget')?.value;
                if (!name) return alert('Nhập tên công trình');
                
                const result = projectService.createProject({ name, budget });
                if (!result.success) {
                    alert(result.errors?.join('\n'));
                }
            }
        });
    }

    async delete(id) {
        const result = projectService.deleteProject(id);
        if (!result.success && !result.cancelled) {
            alert(result.error);
        }
    }
}

export const projectsPage = new ProjectsPage();

// Global handlers
window.projectsPage = projectsPage;
window.openProjectModal = () => projectsPage.showAddModal();