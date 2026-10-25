/* Portal Informasi Warga RT 003 / RW 002 Desa Semidang Alas
 * Client-Side JavaScript for Public Portal
 */
(() => {
  'use strict';

  // Sesuai konfigurasi deployment final, salin Web App URL GAS Anda ke sini:
  const DEFAULT_API_URL = 'https://script.google.com/macros/s/AKfycbyKajpK_rDY6vETogHZWFahwjYQ5z_b-fOW6xO2NZ-_6fhXhSSmvSJB6eISP7pkZIKGvA/exec'; 
  const STORAGE_KEY = 'mading_rt003_api_url';

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
    el.className = `toast mb-3 rounded-2xl border p-4 shadow-lg ${color}`;
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
    el.className = `mt-0.5 text-base font-bold ${tone === 'error' ? 'text-rose-600' : 'text-emerald-700'}`;
  }

  async function apiGet() {
    const url = getApiUrl();
    if (!url) {
      return { announcements: [], schedules: [], finance: [] };
    }

    const response = await fetch(`${url}?action=bootstrap`, {
      method: 'GET',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error || 'Terjadi kesalahan sistem.');
    return payload.data;
  }

  function renderAnnouncements(items) {
    const list = $('#announcement-list');
    const label = $('#announcement-count-label');
    if (!list) return;
    label.textContent = `${items.length} Pengumuman Aktif`;

    if (!items.length) {
      list.innerHTML = `
        <div class="md:col-span-2 lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-10 text-center shadow-soft">
          <div class="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">📢</div>
          <h3 class="font-bold text-slate-800">Belum Ada Pengumuman</h3>
          <p class="text-xs text-slate-500 mt-1">Belum ada pengumuman yang dipublikasikan oleh Pengurus RT 003 / RW 002.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = items.slice(0, 9).map((item) => {
      const priorityClass = item.priority === 'high'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-sky-50 text-sky-700 border-sky-200';

      return `
        <article class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-soft card-hover flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-3 mb-3">
              <span class="inline-flex px-3 py-1 rounded-full border text-xs font-bold ${priorityClass}">
                ${escapeHtml(item.priority === 'high' ? 'PENTING' : item.category || 'Umum')}
              </span>
              <time class="text-xs font-medium text-slate-400">${escapeHtml(formatDate(item.date || item.created_at))}</time>
            </div>
            <h3 class="text-lg font-black text-slate-900 leading-snug">${escapeHtml(item.title)}</h3>
            <p class="text-sm text-slate-600 leading-relaxed mt-2.5 whitespace-pre-line">${escapeHtml(item.content)}</p>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderSchedules(items) {
    const list = $('#schedule-list');
    if (!list) return;

    if (!items.length) {
      list.innerHTML = `
        <div class="bg-white border border-slate-200/80 rounded-3xl p-10 text-center shadow-soft">
          <div class="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl font-bold">🗓️</div>
          <h3 class="font-bold text-slate-800">Belum Ada Jadwal Kegiatan</h3>
          <p class="text-xs text-slate-500 mt-1">Saat ini belum ada agenda kegiatan atau jadwal ronda malam mendatang.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = items.slice(0, 12).map((item) => `
      <article class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-soft card-hover flex flex-col sm:flex-row gap-5 sm:items-center">
        <div class="min-w-[120px] rounded-2xl bg-teal-50/80 border border-teal-100 p-3.5 text-center shrink-0">
          <p class="text-xs font-bold uppercase tracking-wider text-teal-700">${escapeHtml(item.type || 'Kegiatan')}</p>
          <p class="text-sm font-black text-teal-950 mt-1">${escapeHtml(formatDate(item.date))}</p>
          <p class="text-xs font-semibold text-teal-700 mt-0.5">${escapeHtml(formatTime(item.time))}</p>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-black text-slate-900">${escapeHtml(item.title)}</h3>
          <p class="text-xs font-semibold text-slate-500 mt-1">📍 ${escapeHtml(item.location || 'Lokasi menyusul')}</p>
          ${item.description ? `<p class="text-sm text-slate-600 mt-2 leading-relaxed">${escapeHtml(item.description)}</p>` : ''}
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
      table.innerHTML = `
        <tr>
          <td colspan="4" class="px-5 py-10 text-center text-slate-500">
            Belum ada catatan transaksi keuangan yang dipublikasikan.
          </td>
        </tr>
      `;
      return;
    }

    table.innerHTML = items.slice(0, 15).map((item) => {
      const amount = Number(item.amount) || 0;
      const positive = item.type !== 'expense';
      return `
        <tr class="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
          <td class="px-5 py-4 text-slate-500 font-medium">${escapeHtml(formatDate(item.date))}</td>
          <td class="px-5 py-4 font-bold text-slate-800">${escapeHtml(item.description)}</td>
          <td class="px-5 py-4 text-slate-500 font-medium">${escapeHtml(item.category || 'Kas RT')}</td>
          <td class="px-5 py-4 text-right font-black ${positive ? 'text-emerald-700' : 'text-rose-700'}">
            ${positive ? '+' : '-'}${escapeHtml(rupiah.format(amount))}
          </td>
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
    $('#last-updated').textContent = `Terakhir diperbarui: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}`;
  }

  async function load() {
    try {
      const data = await apiGet();
      render(data);
      setStatus('Aktif Terhubung', 'normal');
    } catch (error) {
      setStatus('Gangguan Koneksi Sistem', 'error');
      render({ announcements: [], schedules: [], finance: [] });
      showToast('Gagal memuat informasi terbaru dari server.', 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#year').textContent = new Date().getFullYear();
    load();
  });
})();
