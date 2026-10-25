/* Mading Digital RT 003 / RW 002
 * Public frontend: data loading from Google Apps Script Web App.
 *
 * Configure GAS URL in one of two ways:
 * 1) Set DEFAULT_API_URL below for a fixed deployment.
 * 2) Save a URL from the admin page; the URL is stored in localStorage.
 */
(() => {
  'use strict';

  const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbwxXe6GzAb2vTgmjrRCmyTFrwq9JnSi-L3IWYVYXU2OENRbFH84iE2Ex6golr1fEb9DSA/exec';
  const STORAGE_KEY = 'mading_rt003_api_url';

  const demoData = {
    announcements: [
      {
        id: 'demo-a1',
        title: 'Gotong royong lingkungan',
        content: 'Warga dimohon hadir pada hari Minggu pukul 07.00 WIB. Membawa alat kebersihan seperlunya.',
        category: 'Kebersihan',
        priority: 'high',
        date: new Date().toISOString()
      },
      {
        id: 'demo-a2',
        title: 'Pembayaran iuran bulanan',
        content: 'Iuran warga dapat disampaikan kepada pengurus RT sesuai jadwal yang telah disepakati bersama.',
        category: 'Umum',
        priority: 'normal',
        date: new Date().toISOString()
      }
    ],
    schedules: [
      {
        id: 'demo-s1',
        title: 'Ronda malam',
        date: new Date().toISOString().slice(0, 10),
        time: '22:00',
        location: 'Pos ronda RT 003',
        type: 'Keamanan',
        description: 'Jadwal ronda malam sesuai pembagian kelompok warga.'
      }
    ],
    finance: []
  };

  const $ = (selector) => document.querySelector(selector);
  const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  function getApiUrl() {
    return (localStorage.getItem(STORAGE_KEY) || DEFAULT_API_URL || '').trim().replace(/\/+$/, '');
  }

  function showToast(message, type = 'info') {
    const wrap = $('#toast-wrap');
    if (!wrap) return;
    const color = type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : type === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : 'border-slate-200 bg-white text-slate-900';
    const el = document.createElement('div');
    el.className = `toast mb-3 rounded-2xl border p-4 ${color}`;
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 4200);
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

  function setStatus(text, tone = 'normal') {
    const el = $('#api-status');
    if (!el) return;
    el.textContent = text;
    el.className = `mt-1 text-lg font-bold ${tone === 'error' ? 'text-rose-700' : tone === 'demo' ? 'text-amber-700' : 'text-slate-900'}`;
  }

  async function apiGet() {
    const url = getApiUrl();
    if (!url) return { ...demoData, _mode: 'demo' };

    const response = await fetch(`${url}?action=bootstrap`, {
      method: 'GET',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`GAS HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || 'API mengembalikan kesalahan.');
    return payload.data;
  }

  function renderAnnouncements(items) {
    const list = $('#announcement-list');
    const label = $('#announcement-count-label');
    if (!list) return;
    label.textContent = `${items.length} pengumuman`;

    if (!items.length) {
      list.innerHTML = '<div class="md:col-span-2 lg:col-span-3 bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-500">Belum ada pengumuman.</div>';
      return;
    }

    list.innerHTML = items.slice(0, 9).map((item) => {
      const priorityClass = item.priority === 'high'
        ? 'bg-rose-50 text-rose-700 border-rose-100'
        : 'bg-sky-50 text-sky-700 border-sky-100';

      return `
        <article class="bg-white border border-slate-200 rounded-2xl p-5 shadow-soft card-hover">
          <div class="flex items-start justify-between gap-3">
            <span class="inline-flex px-2.5 py-1 rounded-full border text-xs font-semibold ${priorityClass}">
              ${escapeHtml(item.priority === 'high' ? 'Penting' : item.category || 'Umum')}
            </span>
            <time class="text-xs text-slate-400">${escapeHtml(formatDate(item.date || item.created_at))}</time>
          </div>
          <h3 class="text-lg font-black mt-4">${escapeHtml(item.title)}</h3>
          <p class="text-sm text-slate-600 leading-6 mt-2 whitespace-pre-line">${escapeHtml(item.content)}</p>
        </article>
      `;
    }).join('');
  }

  function renderSchedules(items) {
    const list = $('#schedule-list');
    if (!list) return;

    if (!items.length) {
      list.innerHTML = '<div class="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-500">Belum ada agenda kegiatan.</div>';
      return;
    }

    list.innerHTML = items.slice(0, 12).map((item) => `
      <article class="bg-white border border-slate-200 rounded-2xl p-5 shadow-soft card-hover flex flex-col sm:flex-row gap-5 sm:items-center">
        <div class="min-w-[100px] rounded-2xl bg-teal-50 border border-teal-100 px-4 py-3 text-center">
          <p class="text-xs font-semibold text-teal-700">${escapeHtml(item.type || 'Kegiatan')}</p>
          <p class="text-sm font-black text-teal-900 mt-1">${escapeHtml(formatDate(item.date))}</p>
          <p class="text-xs text-teal-700 mt-1">${escapeHtml(formatTime(item.time))}</p>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-black">${escapeHtml(item.title)}</h3>
          <p class="text-sm text-slate-500 mt-1">${escapeHtml(item.location || 'Lokasi menyusul')}</p>
          <p class="text-sm text-slate-600 mt-2 leading-6">${escapeHtml(item.description || '')}</p>
        </div>
      </article>
    `).join('');
  }

  function renderFinance(items) {
    let income = 0;
    let expense = 0;
    items.forEach((item) => {
      const amount = Number(item.amount) || 0;
      if (item.type === 'expense') expense += amount;
      else income += amount;
    });

    $('#finance-income').textContent = rupiah.format(income);
    $('#finance-expense').textContent = rupiah.format(expense);
    $('#finance-balance').textContent = rupiah.format(income - expense);

    const table = $('#finance-table');
    if (!table) return;
    if (!items.length) {
      table.innerHTML = '<tr><td colspan="4" class="px-5 py-8 text-center text-slate-500">Belum ada transaksi yang dipublikasikan.</td></tr>';
      return;
    }

    table.innerHTML = items.slice(0, 15).map((item) => {
      const amount = Number(item.amount) || 0;
      const positive = item.type !== 'expense';
      return `
        <tr class="border-t border-slate-100">
          <td class="px-5 py-4 text-slate-500">${escapeHtml(formatDate(item.date))}</td>
          <td class="px-5 py-4 font-semibold text-slate-800">${escapeHtml(item.description)}</td>
          <td class="px-5 py-4 text-slate-500">${escapeHtml(item.category || 'Kas RT')}</td>
          <td class="px-5 py-4 text-right font-bold ${positive ? 'text-emerald-700' : 'text-rose-700'}">${positive ? '+' : '-'}${escapeHtml(rupiah.format(amount))}</td>
        </tr>
      `;
    }).join('');
  }

  function render(data) {
    const announcements = Array.isArray(data.announcements) ? data.announcements : [];
    const schedules = Array.isArray(data.schedules) ? data.schedules : [];
    const finance = Array.isArray(data.finance) ? data.finance : [];

    renderAnnouncements(announcements);
    renderSchedules(schedules);
    renderFinance(finance);

    $('#stat-announcements').textContent = announcements.length;
    $('#stat-schedules').textContent = schedules.length;
    $('#stat-finance').textContent = finance.length;
    $('#last-updated').textContent = `Diperbarui ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`;
  }

  async function load() {
    try {
      const apiUrl = getApiUrl();
      const data = await apiGet();
      render(data);
      if (apiUrl) {
        setStatus('Terhubung ke Google Apps Script', 'normal');
      } else {
        setStatus('Mode demo lokal', 'demo');
        showToast('API GAS belum dikonfigurasi. Menampilkan data demo.', 'info');
      }
    } catch (error) {
      setStatus('Koneksi API gagal', 'error');
      render(demoData);
      showToast(`Gagal mengambil data dari API: ${error.message}`, 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#year').textContent = new Date().getFullYear();
    load();
  });
})();
