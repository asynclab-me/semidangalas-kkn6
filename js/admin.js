/* Portal Informasi Warga RT 003 / RW 002 Desa Semidang Alas
 * Client-Side JavaScript for Admin Panel
 */
(() => {
  'use strict';

  // Pastikan URL Web App GAS Anda sudah benar di sini:
  const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbyKajpK_rDY6vETogHZWFahwjYQ5z_b-fOW6xO2NZ-_6fhXhSSmvSJB6eISP7pkZIKGvA/exec'; 
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
    el.className = `toast mb-3 rounded-2xl border p-4 shadow-lg ${classes}`;
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
    if (!url) throw new Error('Sistem backend belum dikonfigurasi.');

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
    $('#announcement-total').textContent = `${state.announcements.length} Item`;

    if (!state.announcements.length) {
      list.innerHTML = '<div class="p-8 text-center text-slate-500 font-medium">Belum ada pengumuman yang tersimpan.</div>';
      return;
    }

    list.innerHTML = state.announcements.map((item) => `
      <div class="p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">${escapeHtml(item.category || 'Umum')}</span>
            ${item.priority === 'high' ? '<span class="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">PENTING</span>' : ''}
          </div>
          <h3 class="font-black text-slate-900 text-base mt-2">${escapeHtml(item.title)}</h3>
          <p class="text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">${escapeHtml(item.content)}</p>
          <p class="text-xs text-slate-400 mt-2 font-medium">Dipublikasikan: ${escapeHtml(formatDate(item.date || item.created_at))}</p>
        </div>
        <button data-delete-announcement="${escapeHtml(item.id)}" class="shrink-0 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 font-bold hover:bg-rose-50 text-xs transition-colors">Hapus Pengumuman</button>
      </div>
    `).join('');
  }

  function renderSchedules() {
    const list = $('#admin-schedule-list');
    $('#schedule-total').textContent = `${state.schedules.length} Item`;

    if (!state.schedules.length) {
      list.innerHTML = '<div class="p-8 text-center text-slate-500 font-medium">Belum ada agenda atau jadwal ronda tersimpan.</div>';
      return;
    }

    list.innerHTML = state.schedules.map((item) => `
      <div class="p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">${escapeHtml(item.type || 'Kegiatan')}</span>
          </div>
          <h3 class="font-black text-slate-900 text-base mt-2">${escapeHtml(item.title)}</h3>
          <p class="text-sm font-semibold text-slate-700 mt-1">🗓️ ${escapeHtml(formatDate(item.date))} ${item.time ? `· ⏰ ${escapeHtml(formatTime(item.time))}` : ''}</p>
          <p class="text-xs text-slate-500 mt-1 font-medium">📍 ${escapeHtml(item.location || 'Lokasi menyusul')}</p>
          ${item.description ? `<p class="text-sm text-slate-600 mt-2 leading-relaxed">${escapeHtml(item.description)}</p>` : ''}
        </div>
        <button data-delete-schedule="${escapeHtml(item.id)}" class="shrink-0 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 font-bold hover:bg-rose-50 text-xs transition-colors">Hapus Agenda</button>
      </div>
    `).join('');
  }

  function renderFinance() {
    const table = $('#admin-finance-table');
    $('#finance-total').textContent = `${state.finance.length} Transaksi`;

    if (!state.finance.length) {
      table.innerHTML = '<tr><td colspan="5" class="px-5 py-8 text-center text-slate-500 font-medium">Belum ada data transaksi keuangan tersimpan.</td></tr>';
      return;
    }

    table.innerHTML = state.finance.map((item) => {
      const positive = item.type !== 'expense';
      return `
        <tr class="border-t border-slate-100">
          <td class="px-5 py-4 text-slate-500 font-medium">${escapeHtml(formatDate(item.date))}</td>
          <td class="px-5 py-4 font-bold text-slate-800">${escapeHtml(item.description)}</td>
          <td class="px-5 py-4">${positive ? '<span class="text-emerald-700 font-bold">Pemasukan</span>' : '<span class="text-rose-700 font-bold">Pengeluaran</span>'}</td>
          <td class="px-5 py-4 text-right font-black">${escapeHtml(rupiah.format(Number(item.amount) || 0))}</td>
          <td class="px-5 py-4 text-right">
            <button data-delete-finance="${escapeHtml(item.id)}" class="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 font-bold hover:bg-rose-50 text-xs transition-colors">Hapus</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function render() {
    renderAnnouncements();
    renderSchedules();
    renderFinance();
    $('#admin-status').textContent = `Terhubung dengan Pusat Sistem Data · ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`;
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
      showToast(`Gagal memperbarui data: ${error.message}`, 'error');
    }
  }

  function showLogin(message = '') {
    $('#login-card').classList.remove('hidden');
    $('#admin-app').classList.add('hidden');
    if (message) {
      $('#login-message').textContent = message;
      $('#login-message').className = 'text-sm mt-4 text-center font-bold text-rose-700';
      $('#login-message').classList.remove('hidden');
    }
  }

  async function login() {
    const key = $('#admin-key').value.trim();
    if (!key) {
      showLogin('Silakan masukkan kata sandi pengurus terlebih dahulu.');
      return;
    }

    sessionStorage.setItem(SESSION_KEY, key);
    try {
      // Menggunakan request POST 'verifyKey' agar password wajib divalidasi ketat oleh backend
      await request('verifyKey');
      $('#login-card').classList.add('hidden');
      $('#admin-app').classList.remove('hidden');
      $('#login-message').classList.add('hidden');
      await refresh();
      showToast('Berhasil masuk ke panel pengurus.', 'success');
    } catch (error) {
      sessionStorage.removeItem(SESSION_KEY);
      showLogin(`Kata sandi pengurus tidak sesuai.`);
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    $('#admin-key').value = '';
    showLogin();
    showToast('Anda telah keluar dari panel pengurus.', 'info');
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
      showToast('Pengumuman berhasil dipublikasikan!', 'success');
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
      showToast('Agenda kegiatan berhasil disimpan!', 'success');
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
      showToast('Transaksi kas berhasil dicatat!', 'success');
      await refresh();
    } catch (error) {
      showToast(`Gagal menyimpan transaksi: ${error.message}`, 'error');
    }
  }

  async function deleteItem(action, id, label) {
    if (!id) return;
    if (!window.confirm(`Konfirmasi: Apakah Anda yakin ingin menghapus ${label} ini?`)) return;

    try {
      await request(action, { id });
      showToast(`${label} berhasil dihapus.`, 'success');
      await refresh();
    } catch (error) {
      showToast(`Gagal menghapus ${label}: ${error.message}`, 'error');
    }
  }

  // Admin Tab Switcher Logic
  function setupAdminTabs() {
    const tabs = [
      { btn: $('#tab-btn-announcement'), content: $('#tab-content-announcement') },
      { btn: $('#tab-btn-schedule'), content: $('#tab-content-schedule') },
      { btn: $('#tab-btn-finance'), content: $('#tab-content-finance') }
    ];

    tabs.forEach(({ btn, content }) => {
      if (!btn) return;
      btn.addEventListener('click', () => {
        tabs.forEach(t => {
          if (t.btn && t.content) {
            t.btn.classList.remove('border-sky-600', 'text-sky-600');
            t.btn.classList.add('border-transparent', 'text-slate-500');
            t.content.classList.add('hidden');
          }
        });
        btn.classList.remove('border-transparent', 'text-slate-500');
        btn.classList.add('border-sky-600', 'text-sky-600');
        content.classList.remove('hidden');
      });
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

    setupAdminTabs();

    const savedKey = getAdminKey();
    if (savedKey) {
      request('verifyKey')
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
