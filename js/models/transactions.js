export class Transaction {
    constructor(data) {
        this.id = data.id || '';
        this.mid = data.mid || '';
        this.type = data.type || 'purchase'; // 'purchase' or 'usage'
        this.qty = data.qty || 0;
        this.unitPrice = data.unitPrice || 0;
        this.totalAmount = data.totalAmount || 0;
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.note = data.note || '';
        this.projectId = data.projectId || null;
        this.supplierId = data.supplierId || null;
        this.vatRate = data.vatRate || 0;
        this.subtotal = data.subtotal || 0;
        this.vatAmount = data.vatAmount || 0;
        this.invoiceImage = data.invoiceImage || null;
    }

    get isPurchase() {
        return this.type === 'purchase';
    }

    get isUsage() {
        return this.type === 'usage';
    }

    toJSON() {
        return {
            id: this.id,
            mid: this.mid,
            type: this.type,
            qty: this.qty,
            unitPrice: this.unitPrice,
            totalAmount: this.totalAmount,
            date: this.date,
            note: this.note,
            projectId: this.projectId,
            supplierId: this.supplierId,
            vatRate: this.vatRate,
            subtotal: this.subtotal,
            vatAmount: this.vatAmount,
            invoiceImage: this.invoiceImage
        };
    }
}