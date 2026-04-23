export class Table {
    static render(data, columns, options = {}) {
        if (!data || data.length === 0) {
            return `<div class="empty-table">${options.emptyMessage || 'Không có dữ liệu'}</div>`;
        }

        const tableClass = options.className || 'tbl-wrap';
        const showHeader = options.showHeader !== false;
        
        return `
            <div class="${tableClass}">
                <table${options.style ? ` style="${options.style}"` : ''}>
                    ${showHeader ? `
                        <thead>
                            <tr>
                                ${columns.map(col => `
                                    <th style="${col.width ? `width:${col.width}` : ''}">${col.label}</th>
                                `).join('')}
                            </tr>
                        </thead>
                    ` : ''}
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${columns.map(col => `
                                    <td>
                                        ${col.render 
                                            ? col.render(row[col.key], row) 
                                            : (row[col.key] !== undefined ? row[col.key] : '—')
                                        }
                                    </td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    static renderSimple(data, headers) {
        if (!data || data.length === 0) return '<div>Không có dữ liệu</div>';
        
        return `
            <div class="tbl-wrap">
                <table>
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${row.map(cell => `<td>${cell}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
}