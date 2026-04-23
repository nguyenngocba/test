export class Table {
    static render(data, columns) {
        if (!data?.length) return '<div>Không có dữ liệu</div>';
        return `
            <div class="tbl-wrap">
                <table>
                    <thead><tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
                    <tbody>${data.map(row => `<tr>${columns.map(c => `<td>${c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}</td>`).join('')}</tr>`).join('')}</tbody>
                <table>
            </div>
        `;
    }
}