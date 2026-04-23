export class Project {
    constructor(data) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.budget = data.budget || 0;
        this.spent = data.spent || 0;
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    get remaining() {
        return this.budget - this.spent;
    }

    get percentUsed() {
        return this.budget > 0 ? (this.spent / this.budget) * 100 : 0;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            budget: this.budget,
            spent: this.spent,
            createdAt: this.createdAt
        };
    }

    static validate(data) {
        const errors = [];
        if (!data.name || data.name.trim() === '') {
            errors.push('Tên công trình không được để trống');
        }
        if (data.budget !== undefined && (isNaN(data.budget) || data.budget < 0)) {
            errors.push('Ngân sách phải là số không âm');
        }
        return errors;
    }
}