export class Modal {
    constructor(options = {}) {
        this.title = options.title || '';
        this.content = options.content || '';
        this.onConfirm = options.onConfirm || null;
        this.onCancel = options.onCancel || null;
        this.confirmText = options.confirmText || 'Xác nhận';
        this.cancelText = options.cancelText || 'Hủy';
        this.element = null;
    }

    open() {
        this.element = document.createElement('div');
        this.element.className = 'modal-overlay';
        this.element.innerHTML = `
            <div class="modal">
                <div class="modal-hd">
                    <span class="modal-title">${this.title}</span>
                    <button class="xbtn" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-bd">
                    ${this.content}
                </div>
                <div class="modal-ft">
                    <button class="btn-cancel">${this.cancelText}</button>
                    <button class="primary btn-confirm">${this.confirmText}</button>
                </div>
            </div>
        `;
        
        const modalArea = document.getElementById('modal-area');
        if (modalArea) {
            modalArea.innerHTML = '';
            modalArea.appendChild(this.element);
        }
        
        // Bind events
        const confirmBtn = this.element.querySelector('.btn-confirm');
        const cancelBtn = this.element.querySelector('.btn-cancel');
        const closeBtn = this.element.querySelector('.xbtn');
        
        if (confirmBtn) confirmBtn.onclick = () => this.confirm();
        if (cancelBtn) cancelBtn.onclick = () => this.cancel();
        if (closeBtn) closeBtn.onclick = () => this.cancel();
        
        // Click outside to close
        this.element.onclick = (e) => {
            if (e.target === this.element) this.cancel();
        };
    }

    confirm() {
        if (this.onConfirm) this.onConfirm();
        this.close();
    }

    cancel() {
        if (this.onCancel) this.onCancel();
        this.close();
    }

    close() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    static show(options) {
        const modal = new Modal(options);
        modal.open();
        return modal;
    }

    static closeAll() {
        const modalArea = document.getElementById('modal-area');
        if (modalArea) modalArea.innerHTML = '';
    }
}