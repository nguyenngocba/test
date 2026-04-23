export class Material {
    constructor(data) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.cat = data.cat || '';
        this.unit = data.unit || '';
        this.qty = data.qty || 0;
        this.cost = data.cost || 0;
        this.low = data.low || 5;
        this.note = data.note || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    get totalValue() {
        return this.qty * this.cost;
    }

    get isLowStock() {
        return this.qty <= this.low;
    }

    get status() {
        return this.isLowStock ? 'Sắp hết' : 'Bình thường';
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            cat: this.cat,
            unit: this.unit,
            qty: this.qty,
            cost: this.cost,
            low: this.low,
            note: this.note,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    static validate(data) {
        const errors = [];
        if (!data.name || data.name.trim() === '') {
            errors.push('Tên vật tư không được để trống');
        }
        if (data.cost !== undefined && (isNaN(data.cost) || data.cost < 0)) {
            errors.push('Đơn giá phải là số không âm');
        }
        if (data.qty !== undefined && (isNaN(data.qty) || data.qty < 0)) {
            errors.push('Số lượng phải là số không âm');
        }
        return errors;
    }
}