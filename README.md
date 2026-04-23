# SteelTrack Pro - Hệ thống quản lý kho thép

## Mô tả
Hệ thống quản lý kho thép chuyên nghiệp với các tính năng:
- Quản lý vật tư (thêm, sửa, xóa, tìm kiếm)
- Quản lý nhập/xuất kho (có VAT, ảnh hóa đơn)
- Quản lý công trình và theo dõi chi phí
- Quản lý nhà cung cấp và lịch sử mua hàng
- Phân quyền người dùng (Admin/Nhân viên)
- Nhật ký hệ thống
- Xuất báo cáo Excel
- Biểu đồ thống kê

## Công nghệ sử dụng
- HTML5, CSS3 (Grid, Flexbox)
- JavaScript ES6 Modules
- Chart.js cho biểu đồ
- SheetJS (XLSX) cho xuất Excel
- LocalStorage cho lưu trữ dữ liệu

## Cấu trúc thư mục
steeltrack/
├── index.html
├── css/
│ └── style.css
├── js/
│ ├── main.js
│ ├── core/ # Core modules (app, state, eventBus, router, storage)
│ ├── models/ # Data models (Material, Project, Supplier, Transaction)
│ ├── services/ # Business logic services
│ ├── views/ # UI components (pages, layouts, components)
│ └── utils/ # Utilities (formatters, constants)
└── README.md