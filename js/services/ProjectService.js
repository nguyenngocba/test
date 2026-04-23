import { appState } from '../core/state.js';
import { logService } from './LogService.js';
import { formatMoney } from '../utils/formatters.js';
import { Project } from '../models/Project.js';

class ProjectService {
    getAllProjects(filters = {}) {
        let projects = appState.projects;
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            projects = projects.filter(p => 
                p.name.toLowerCase().includes(searchLower) ||
                p.id.toLowerCase().includes(searchLower)
            );
        }
        
        return projects.map(p => new Project(p));
    }

    getProjectById(id) {
        const project = appState.projects.find(p => p.id === id);
        return project ? new Project(project) : null;
    }

    getProjectStats(id) {
        const project = this.getProjectById(id);
        if (!project) return null;
        
        const txns = appState.transactions.filter(t => t.projectId === id && t.type === 'usage');
        const totalSpent = txns.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
        const items = txns.map(t => {
            const material = appState.materials.find(m => m.id === t.mid);
            return {
                material: material?.name || 'N/A',
                qty: t.qty,
                unit: material?.unit || '',
                cost: t.totalAmount,
                date: t.date
            };
        });
        
        return {
            project,
            totalSpent,
            remaining: project.budget - totalSpent,
            percentUsed: project.budget > 0 ? (totalSpent / project.budget) * 100 : 0,
            transactionCount: txns.length,
            items
        };
    }

    getAllProjectsStats() {
        return this.getAllProjects().map(p => this.getProjectStats(p.id));
    }

    createProject(data) {
        const errors = Project.validate(data);
        if (errors.length > 0) {
            return { success: false, errors };
        }

        const nextId = appState._data.nextPid || 1;
        const newId = `P${String(nextId).padStart(3, '0')}`;
        appState._data.nextPid = nextId + 1;

        const newProject = new Project({
            id: newId,
            name: data.name.trim(),
            budget: Number(data.budget) || 0,
            spent: 0
        });

        appState.addProject(newProject.toJSON());
        
        logService.addLog('Thêm công trình', 
            `Đã thêm công trình: ${newProject.name} (${newProject.id}) - Ngân sách: ${formatMoney(newProject.budget)}`
        );
        
        return { success: true, data: newProject };
    }

    updateProject(id, updates) {
        const existing = this.getProjectById(id);
        if (!existing) {
            return { success: false, error: 'Không tìm thấy công trình' };
        }

        const updatedData = {
            ...existing.toJSON(),
            ...updates,
            updatedAt: new Date().toISOString()
        };

        const errors = Project.validate(updatedData);
        if (errors.length > 0) {
            return { success: false, errors };
        }

        const success = appState.updateProject(id, updatedData);
        
        if (success) {
            logService.addLog('Sửa công trình', `Đã cập nhật công trình: ${existing.name} (${id})`);
        }
        
        return { success };
    }

    deleteProject(id) {
        const project = this.getProjectById(id);
        if (!project) {
            return { success: false, error: 'Không tìm thấy công trình' };
        }

        const relatedTransactions = appState.transactions.filter(t => t.projectId === id && t.type === 'usage');
        if (relatedTransactions.length > 0) {
            const confirm = window.confirm(
                `⚠️ Công trình "${project.name}" đã có ${relatedTransactions.length} giao dịch xuất vật tư.\n` +
                `Xóa sẽ xóa luôn các giao dịch này. Tiếp tục?`
            );
            if (!confirm) return { success: false, cancelled: true };
        }

        appState.deleteProject(id);
        logService.addLog('Xóa công trình', `Đã xóa công trình: ${project.name} (${id})`);
        
        return { success: true };
    }

    getTotalProjectCost() {
        return appState.transactions
            .filter(t => t.type === 'usage')
            .reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    }
}

export const projectService = new ProjectService();