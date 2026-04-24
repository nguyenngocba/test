import { state, saveState, addLog, formatMoney, escapeHtml, applyTheme, hasPermission, isAdmin } from './state.js';

export function renderSettings() {
  if (!hasPermission('canAccessSettings')) return '<div class="card">🔒 Bạn không có quyền truy cập khu vực này.</div>';
  return `<div class="card"><div class="sec-title">👥 QUẢN LÝ NGƯỜI DÙNG</div>
    <button class="sm primary" style="margin-bottom:16px" onclick="addUser()">+ Thêm người dùng mới</button>
    <div class="tbl-wrap"><table style="min-width:800px"><thead><tr><th>Tên</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Quyền</th><th>Thao tác</th></tr></thead>
    <tbody>${state.data.users.map(u => `<tr>
      <td><strong>${escapeHtml(u.name)}</strong>${u.id === state.currentUser.id ? ' <span class="tag">Bạn</span>' : ''}</td>
      <td>${u.username}</td>
      <td><span class="tag">${u.role === 'admin' ? 'Admin' : 'Nhân viên'}</span></td>
      <td style="font-size:11px">
        ${u.role !== 'admin' ? `
          <div><input type="checkbox" ${u.permissions.canImport ? 'checked' : ''} onchange="toggleUserPermission('${u.id}', 'canImport')"> 📥 Nhập kho</div>
          <div><input type="checkbox" ${u.permissions.canExport ? 'checked' : ''} onchange="toggleUserPermission('${u.id}', 'canExport')"> 📤 Xuất kho</div>
          <div><input type="checkbox" ${u.permissions.canCreateMaterial ? 'checked' : ''} onchange="toggleUserPermission('${u.id}', 'canCreateMaterial')"> ➕ Thêm vật tư</div>
          <div><input type="checkbox" ${u.permissions.canEditMaterial ? 'checked' : ''} onchange="toggleUserPermission('${u.id}', 'canEditMaterial')"> ✏️ Sửa vật tư</div>
          <div><input type="checkbox" ${u.permissions.canDeleteMaterial ? 'checked' : ''} onchange="toggleUserPermission('${u.id}', 'canDeleteMaterial')"> 🗑️ Xóa vật tư</div>
          <div><input type="checkbox" ${u.permissions.canDeleteProject ? 'checked' : ''} onchange="toggleUserPermission('${u.id}', 'canDeleteProject')"> 🏗️ Xóa công trình</div>
          <div><input type="checkbox" ${u.permissions.canManageSupplier ? 'checked' : ''} onchange="toggleUserPermission('${u.id}', 'canManageSupplier')"> 🏭 QL Nhà cung cấp</div>
        ` : '🔓 Toàn quyền'}
      </td>
      <td><button class="sm" onclick="changePassword('${u.id}')">🔑 Đổi MK</button> ${u.id !== state.currentUser.id ? `<button class="sm danger-btn" onclick="deleteUser('${u.id}')">🗑️</button>` : ''}</td>
    </tr>`).join('')}</tbody></table></div>
    
    <div style="margin-top:24px"><div class="sec-title">📂 QUẢN LÝ DANH MỤC</div>
      <div style="margin-bottom:16px"><div class="sec-title">Loại vật tư</div>${state.data.categories.map(c => `<div class="setting-item"><span>📌 ${escapeHtml(c)}</span><button class="sm danger-btn" onclick="deleteCategory('${c}')">Xóa</button></div>`).join('')}
        <div style="margin-top:12px;display:flex;gap:8px"><input id="newCat" placeholder="Nhập loại mới" style="flex:1"><button class="sm primary" onclick="addCategory()">+ Thêm</button></div>
      </div>
      <div style="margin-bottom:16px"><div class="sec-title">Đơn vị tính</div>${state.data.units.map(u => `<div class="setting-item"><span>📏 ${escapeHtml(u)}</span><button class="sm danger-btn" onclick="deleteUnit('${u}')">Xóa</button></div>`).join('')}
        <div style="margin-top:12px;display:flex;gap:8px"><input id="newUnit" placeholder="Nhập đơn vị mới" style="flex:1"><button class="sm primary" onclick="addUnit()">+ Thêm</button></div>
      </div>
    </div>
    
    <div style="margin-top:24px"><div class="sec-title">🌓 GIAO DIỆN</div>
      <div class="setting-item"><span>Chế độ màu</span><button class="sm" onclick="toggleTheme()">${state.theme === 'dark' ? '☀️ Chuyển sáng' : '🌙 Chuyển tối'}</button></div>
    </div>
  </div>`;
}

export function addCategory() { 
  const inp = document.getElementById('newCat'); 
  if(inp.value.trim()){ 
    state.data.categories.push(inp.value.trim()); 
    addLog('Thêm danh mục', `Đã thêm danh mục: ${inp.value.trim()}`); 
    saveState(); 
    if(window.render) window.render(); 
  } 
}

export function addUnit() { 
  const inp = document.getElementById('newUnit'); 
  if(inp.value.trim()){ 
    state.data.units.push(inp.value.trim()); 
    addLog('Thêm đơn vị', `Đã thêm đơn vị: ${inp.value.trim()}`); 
    saveState(); 
    if(window.render) window.render(); 
  } 
}

export function toggleTheme() { 
  applyTheme(state.theme === 'dark' ? 'light' : 'dark'); 
  if(window.render) window.render(); 
}

export function addUser() {
  if (!isAdmin()) return;
  const name = prompt('Nhập tên người dùng:');
  if (!name) return;
  const username = prompt('Nhập tên đăng nhập:');
  if (!username) return;
  const password = prompt('Nhập mật khẩu:');
  if (!password) return;
  const role = confirm('Phân quyền Admin? (OK = Admin, Cancel = Nhân viên)') ? 'admin' : 'user';
  const newUser = {
    id: `u${Date.now()}`,
    name: name,
    username: username,
    password: password,
    role: role,
    permissions: role === 'admin' ? 
      { canCreateMaterial: true, canDeleteMaterial: true, canEditMaterial: true, canImport: true, canExport: true, canDeleteProject: true, canAccessSettings: true, canManageSupplier: true } :
      { canCreateMaterial: false, canDeleteMaterial: false, canEditMaterial: false, canImport: true, canExport: true, canDeleteProject: false, canAccessSettings: false, canManageSupplier: false }
  };
  state.data.users.push(newUser);
  addLog('Thêm người dùng', `Đã thêm người dùng: ${name} (${username}) - Vai trò: ${role === 'admin' ? 'Admin' : 'Nhân viên'}`);
  saveState();
  if(window.render) window.render();
}

export function deleteUser(userId) {
  if (!isAdmin()) return;
  const user = state.data.users.find(u => u.id === userId);
  if (!user) return;
  if (user.id === state.currentUser.id) {
    alert('Bạn không thể tự xóa chính mình!');
    return;
  }
  if (confirm(`Xóa người dùng "${user.name}"?`)) {
    state.data.users = state.data.users.filter(u => u.id !== userId);
    addLog('Xóa người dùng', `Đã xóa người dùng: ${user.name} (${user.username})`);
    saveState();
    if(window.render) window.render();
  }
}

export function changePassword(userId) {
  if (!isAdmin()) return;
  const user = state.data.users.find(u => u.id === userId);
  if (!user) return;
  const newPass = prompt(`Nhập mật khẩu mới cho ${user.name}:`);
  if (newPass && newPass.trim()) {
    user.password = newPass.trim();
    addLog('Đổi mật khẩu', `Đã đổi mật khẩu cho người dùng: ${user.name}`);
    saveState();
    alert('Đổi mật khẩu thành công!');
    if(window.render) window.render();
  }
}

export function toggleUserPermission(userId, perm) {
  if (!isAdmin()) return;
  const user = state.data.users.find(u => u.id === userId);
  if (!user || user.role === 'admin') {
    alert('Không thể thay đổi quyền của Admin');
    return;
  }
  user.permissions[perm] = !user.permissions[perm];
  addLog('Thay đổi quyền', `Đã thay đổi quyền ${perm} cho ${user.name} -> ${user.permissions[perm] ? 'BẬT' : 'TẮT'}`);
  saveState();
  if(window.render) window.render();
}

export function deleteCategory(cat) { 
  if(!isAdmin()) return;
  if(confirm(`Xóa danh mục "${cat}"?`)){ 
    state.data.categories = state.data.categories.filter(c => c !== cat); 
    addLog('Xóa danh mục', `Đã xóa danh mục: ${cat}`);
    saveState(); 
    if(window.render) window.render(); 
  } 
}

export function deleteUnit(unit) { 
  if(!isAdmin()) return;
  if(confirm(`Xóa đơn vị "${unit}"?`)){ 
    state.data.units = state.data.units.filter(u => u !== unit); 
    addLog('Xóa đơn vị', `Đã xóa đơn vị: ${unit}`);
    saveState(); 
    if(window.render) window.render(); 
  } 
}