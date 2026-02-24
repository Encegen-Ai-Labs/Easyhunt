export const API_BASE = import.meta.env.VITE_API_BASE || "";

export const endpoints = {

  // --- AUTH ---
  login: `${API_BASE}/login`,
  forgotPassword: `${API_BASE}/forgot-password`,
  resetPassword: `${API_BASE}/reset-password`,

  // --- UPLOAD & SEARCH ---
  upload: `${API_BASE}/upload`,
  search: `${API_BASE}/search`,


  // --- SELECTED ENTRIES (old single-row system) ---
  saveSelected: `${API_BASE}/api/save_selected`,
  selectedRows: `${API_BASE}/api/selected_rows`,
  removeSelected: `${API_BASE}/api/remove_selected`,
  removeSelectedGroup: `${API_BASE}/api/remove_selected_group`,
    stats: `${API_BASE}/dashboard/stats`,
  // --- EXPORTING ---
  exportExcel: `${API_BASE}/export/selected/excel`,
  exportWord: `${API_BASE}/export/selected/word`,

  // --- PROFILE ---
  profile: `${API_BASE}/profile`,
  updateProfile: `${API_BASE}/profile/update`,

  // --- ADMIN ---
  adminUsers: `${API_BASE}/admin/users`,
  adminCreateUser: `${API_BASE}/admin/create_user`,
  adminSetStatus: `${API_BASE}/admin/set_status`,
  adminSetExpiry: `${API_BASE}/admin/set_expiry`,
  adminUpdateUser: `${API_BASE}/admin/update_user`,
  adminDeleteUser: `${API_BASE}/admin/delete_user`,
  
  // --- TABLES LIST ---
  tables: `${API_BASE}/tables`,
};
