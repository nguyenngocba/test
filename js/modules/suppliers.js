export class Supplier {
    constructor(data) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.phone = data.phone || '';
        this.email = data.email || '';
        this.address = data.address || '';
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            phone: this.phone,
            email: this.email,
            address: this.address,
            createdAt: this.createdAt
        };
    }

    static validate(data) {
        const errors = [];
        if (!data.name || data.name.trim() === '') {
            errors.push('Tên nhà cung cấp không được để trống');
        }
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errors.push('Email không hợp lệ');
        }
        return errors;
    }
}