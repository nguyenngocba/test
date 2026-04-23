import { appState } from '../core/state.js';
import { logService } from './LogService.js';
import { formatMoney } from '../utils/formatters.js';

class ProjectService {
    getAllProjects() { return [...appState.projects]; }
    getProjectById(id) { return appState.projects.find(p => p.id === id); }
    
    createProject(data) {
        if (!data.name?.trim()) return { success: false, errors: ['Tên công trình không được trống'] };
        const newId = `P${String(appState._data.nextPid++).padStart(3, '0')}`;
        const newProj = { id: newId, name: data.name.trim(), budget: Number(data.budget) || 0, spent: 0 };
        appState.addProject(newProj);
        logService.addLog('Thêm công trình', `${newProj.name} - Ngân sách: ${formatMoney(newProj.budget)}`);
        return { success: true, data: newProj };
    }
    
    deleteProject(id) {
        const proj = this.getProjectById(id);
        const related = appState.transactions.filter(t => t.projectId === id && t.type === 'usage');
        if (related.length && !confirm(`Công trình có ${related.length} giao dịch. Xóa sẽ mất dữ liệu. Tiếp tục?`)) return { success: false, cancelled: true };
        appState.deleteProject(id);
        logService.addLog('Xóa công trình', `${proj?.name} (${id})`);
        return { success: true };
    }
}

export const projectService = new ProjectService();