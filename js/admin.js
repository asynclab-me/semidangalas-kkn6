/* Mading Digital RT 003 / RW 002
 * Admin frontend for the Google Apps Script Web App.
 */
(() => {
  'use strict';

  const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbwxXe6GzAb2vTgmjrRCmyTFrwq9JnSi-L3IWYVYXU2OENRbFH84iE2Ex6golr1fEb9DSA/exec';
  const API_URL_KEY = 'mading_rt003_api_url';
  const SESSION_KEY = 'mading_rt003_admin_key';

  const $ = (selector) => document.querySelector(selector);
  const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  let state = { announcements: [], schedules: [], finance: [] };

  function getApiUrl() {
    return (localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL || '').trim().replace(/\/+$/, '');
  }

  function getAdminKey() {
    return sessionStorage.getItem(SESSION_KEY) || '';
  }

  function showToast(message, type = 'info') {
    const wrap = $('#toast-wrap');
    if (!wrap) return;
    const classes = type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : type === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : 'border-slate-200 bg-white text-slate-900';
    const el = document.createElement('div');
    el.className = `toast mb-3 rounded-2xl border p-4 ${classes}`;
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[char]);
  }

  function formatDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value || '-';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(d);
  }

  function formatTime(value) {
    return value ? `${value} WIB` : '';
  }

  async function request(action, payload = null) {
    const url = getApiUrl();
    if (!url) throw new Error('URL Google Apps Script belum dikonfigurasi.');

    if (action === 'bootstrap') {
      const response = await fetch(`${url}?action=bootstrap`, { method: 'GET', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      return data.data;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, key: getAdminKey(), payload })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  function renderAnnouncements() {
    const list = $('#admin-announcement-list');
    $('#announcement-total').textContent = `${state.announcements.length} item`;

    if (!state.announcements.length) {
      list.innerHTML = '<div class="p-8 text-center text-slate-500">Belum ada pengumuman.</div>';
      return;
    }

    list.innerHTML = state.announcements.map((item) => `
      <div class="p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">${escapeHtml(item.category || 'Umum')}</span>
            ${item.priority === 'high' ? '<span class="px-2 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">Penting</span>' : ''}
          </div>
          <h3 class="font-black mt-2">${escapeHtml(item.title)}</h3>
          <p class="text-sm text-slate-600 mt-1 whitespace-pre-line">${escapeHtml(item.content)}</p>
          <p class="text-xs text-slate-400 mt-2">${escapeHtml(formatDate(item.date || item.created_at))}</p>
        </div>
        <button data-delete-announcement="${escapeHtml(item.id)}" class="shrink-0 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 font-semibold hover:bg-rose-50">Hapus</button>
      </div>
    `).join('');
  }

  function renderSchedules() {
    const list = $('#admin-schedule-list');
    $('#schedule-total').textContent = `${state.schedules.length} item`;

    if (!state.schedules.length) {
      list.innerHTML = '<div class="p-8 text-center text-slate-500">Belum ada agenda kegiatan.</div>';
      return;
    }

    list.innerHTML = state.schedules.map((item) => `
      <div class="p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">${escapeHtml(item.type || 'Kegiatan')}</span>
          </div>
          <h3 class="font-black mt-2">${escapeHtml(item.title)}</h3>
          <p class="text-sm text-slate-600 mt-1">🗓️ ${escapeHtml(formatDate(item.date))} ${item.time ? `· ⏰ ${escapeHtml(formatTime(item.time))}` : ''}</p>
          <p class="text-sm text-slate-500 mt-0.5">📍 ${escapeHtml(item.location || 'Lokasi menyusul')}</p>
          ${item.description ? `<p class="text-sm text-slate-600 mt-2">${escapeHtml(item.description)}</p>` : ''}
        </div>
        <button data-delete-schedule="${escapeHtml(item.id)}" class="shrink-0 px-3 py-2 rounded-xl border border-rose-200 text-rose-700 font-semibold hover:bg-rose-50">Hapus</button>
      </div>
    `).join('');
  }

  function renderFinance() {
    const table = $('#admin-finance-table');
    $('#finance-total').textContent = `${state.finance.length} transaksi`;

    if (!state.finance.length) {
      table.innerHTML = '<tr><td colspan="5" class="px-5 py-8 text-center text-slate-500">Belum ada transaksi.</td></tr>';
      return;
    }

    table.innerHTML = state.finance.map((item) => {
      const positive = item.type !== 'expense';
      return `
        <tr class="border-t border-slate-100">
          <td class="px-5 py-4 text-slate-500">${escapeHtml(formatDate(item.date))}</td>
          <td class="px-5 py-4 font-semibold">${escapeHtml(item.description)}</td>
          <td class="px-5 py-4">${positive ? '<span class="text-emerald-700 font-semibold">Pemasukan</span>' : '<span class="text-rose-700 font-semibold">Pengeluaran</span>'}</td>
          <td class="px-5 py-4 text-right font-bold">${escapeHtml(rupiah.format(Number(item.amount) || 0))}</td>
          <td class="px-5 py-4 text-right">
            <button data-delete-finance="${escapeHtml(item.id)}" class="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 font-semibold hover:bg-rose-50">Hapus</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function render() {
    renderAnnouncements();
    renderSchedules();
    renderFinance();
    $('#admin-status').textContent = `Terhubung · ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`;
  }

  async function refresh() {
    try {
      const data = await request('bootstrap');
      state = {
        announcements: Array.isArray(data.announcements) ? data.announcements : [],
        schedules: Array.isArray(data.schedules) ? data.schedules : [],
        finance: Array.isArray(data.finance) ? data.finance : []
      };
      render();
    } catch (error) {
      showToast(`Gagal memuat data: ${error.message}`, 'error');
    }
  }

  function showLogin(message = '') {
    $('#login-card').classList.remove('hidden');
    $('#admin-app').classList.add('hidden');
    if (message) {
      $('#login-message').textContent = message;
      $('#login-message').className = 'text-sm mt-4 text-rose-700';
      $('#login-message').classList.remove('hidden');
    }
  }

  async function login() {
    const key = $('#admin-key').value.trim();
    if (!key) {
      showLogin('Kunci admin wajib diisi.');
      return;
    }

    sessionStorage.setItem(SESSION_KEY, key);
    try {
      await request('bootstrap');
      $('#login-card').classList.add('hidden');
      $('#admin-app').classList.remove('hidden');
      $('#login-message').classList.add('hidden');
      await refresh();
      showToast('Login berhasil.', 'success');
    } catch (error) {
      sessionStorage.removeItem(SESSION_KEY);
      showLogin(`Login gagal: ${error.message}`);
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    $('#admin-key').value = '';
    showLogin();
    showToast('Anda sudah keluar.', 'info');
  }

  async function handleAnnouncementSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      title: String(formData.get('title') || '').trim(),
      content: String(formData.get('content') || '').trim(),
      category: String(formData.get('category') || 'Umum').trim(),
      priority: String(formData.get('priority') || 'normal').trim()
    };

    if (!payload.title || !payload.content) return;

    try {
      await request('addAnnouncement', payload);
      form.reset();
      showToast('Pengumuman berhasil dipublikasikan.', 'success');
      await refresh();
    } catch (error) {
      showToast(`Gagal menyimpan pengumuman: ${error.message}`, 'error');
    }
  }

  async function handleScheduleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      title: String(formData.get('title') || '').trim(),
      date: String(formData.get('date') || '').trim(),
      time: String(formData.get('time') || '').trim(),
      location: String(formData.get('location') || '').trim(),
      type: String(formData.get('type') || 'Kegiatan').trim(),
      description: String(formData.get('description') || '').trim()
    };

    if (!payload.title || !payload.date) return;

    try {
      await request('addSchedule', payload);
      form.reset();
      showToast('Agenda kegiatan berhasil disimpan.', 'success');
      await refresh();
    } catch (error) {
      showToast(`Gagal menyimpan agenda: ${error.message}`, 'error');
    }
  }

  async function handleFinanceSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      date: String(formData.get('date') || '').trim(),
      type: String(formData.get('type') || '').trim(),
      description: String(formData.get('description') || '').trim(),
      amount: Number(formData.get('amount') || 0),
      category: String(formData.get('category') || 'Kas RT').trim(),
      note: String(formData.get('note') || '').trim()
    };

    if (!payload.date || !payload.description || payload.amount < 0) return;

    try {
      await request('addFinance', payload);
      form.reset();
      $('#finance-form [name="category"]').value = 'Kas RT';
      showToast('Transaksi kas berhasil disimpan.', 'success');
      await refresh();
    } catch (error) {
      showToast(`Gagal menyimpan transaksi: ${error.message}`, 'error');
    }
  }

  async function deleteItem(action, id, label) {
    if (!id) return;
    if (!window.confirm(`Hapus ${label} ini? Tindakan tidak dapat dibatalkan.`)) return;

    try {
      await request(action, { id });
      showToast(`${label} berhasil dihapus.`, 'success');
      await refresh();
    } catch (error) {
      showToast(`Gagal menghapus ${label}: ${error.message}`, 'error');
    }
  }

  function setupConnectionPanel() {
    const panel = $('#connection-panel');
    $('#api-url').value = getApiUrl();

    $('#connection-toggle').addEventListener('click', () => panel.classList.toggle('hidden'));
    $('#save-api-btn').addEventListener('click', () => {
      const value = $('#api-url').value.trim().replace(/\/+$/, '');
      if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(value)) {
        showToast('Masukkan URL Web App Google Apps Script yang berakhiran /exec.', 'error');
        return;
      }
      localStorage.setItem(API_URL_KEY, value);
      showToast('URL API tersimpan di browser ini.', 'success');
    });

    $('#clear-api-btn').addEventListener('click', () => {
      localStorage.removeItem(API_URL_KEY);
      $('#api-url').value = DEFAULT_API_URL;
      showToast('URL API lokal dihapus.', 'info');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#login-btn').addEventListener('click', login);
    $('#admin-key').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') login();
    });
    $('#logout-btn').addEventListener('click', logout);
    $('#refresh-btn').addEventListener('click', refresh);
    $('#announcement-form').addEventListener('submit', handleAnnouncementSubmit);
    $('#schedule-form').addEventListener('submit', handleScheduleSubmit);
    $('#finance-form').addEventListener('submit', handleFinanceSubmit);

    $('#admin-announcement-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-delete-announcement]');
      if (button) deleteItem('deleteAnnouncement', button.dataset.deleteAnnouncement, 'pengumuman');
    });

    $('#admin-schedule-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-delete-schedule]');
      if (button) deleteItem('deleteSchedule', button.dataset.deleteSchedule, 'agenda');
    });

    $('#admin-finance-table').addEventListener('click', (event) => {
      const button = event.target.closest('[data-delete-finance]');
      if (button) deleteItem('deleteFinance', button.dataset.deleteFinance, 'transaksi');
    });

    setupConnectionPanel();

    const savedKey = getAdminKey();
    if (savedKey) {
      request('bootstrap')
        .then(() => {
          $('#login-card').classList.add('hidden');
          $('#admin-app').classList.remove('hidden');
          refresh();
        })
        .catch(() => {
          sessionStorage.removeItem(SESSION_KEY);
          showLogin();
        });
    }
  });
})();
