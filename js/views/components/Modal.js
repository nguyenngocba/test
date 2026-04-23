export class Modal {
    static show(options) {
        const existing = document.querySelector('.modal-overlay');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-hd"><span class="modal-title">${options.title || ''}</span><button class="xbtn" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
                <div class="modal-bd">${options.content || ''}</div>
                <div class="modal-ft"><button class="btn-cancel">${options.cancelText || 'Hủy'}</button><button class="primary btn-confirm">${options.confirmText || 'Xác nhận'}</button></div>
            </div>
        `;
        
        document.getElementById('modal-area')?.appendChild(overlay);
        
        const confirmBtn = overlay.querySelector('.btn-confirm');
        const cancelBtn = overlay.querySelector('.btn-cancel');
        const close = () => overlay.remove();
        
        if (confirmBtn) confirmBtn.onclick = () => { if (options.onConfirm) options.onConfirm(); close(); };
        if (cancelBtn) cancelBtn.onclick = () => { if (options.onCancel) options.onCancel(); close(); };
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
    }
}