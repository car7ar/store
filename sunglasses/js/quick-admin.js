function openAdmin() {
  try { localStorage.setItem('mycart_admin_logged', 'true'); } catch(e) {}
  isWholesale = true;
  try { localStorage.setItem('mycart_wholesale', 'true'); } catch(e) {}
  applyWholesale();
  document.getElementById('wholesaleBadge').style.display = 'inline-block';
  document.getElementById('adminOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
  adminRefreshAll();
  updateAdminFeeBadge();
  const loginItem = document.getElementById('loginNavItem');
  if (loginItem) {
    loginItem.innerHTML = '<i class="fa-solid fa-sliders"></i><span>لوحة تحكم</span>';
    loginItem.onclick = function() { document.getElementById('adminOverlay').classList.add('show'); document.body.style.overflow = 'hidden'; adminRefreshAll(); updateAdminFeeBadge(); };
  }
}

function updateAdminFeeBadge() {
  var el = document.getElementById('adminFeeBadge');
  if (!el) return;
  var info = getFeeInfo();
  if (info.plan === 'free') {
    if (info.accrued > 0) {
      el.innerHTML = '<i class="fa-solid fa-coins" style="margin-'+(document.dir==='rtl'?'l':'r')+'eft:3px"></i>'+info.accrued+' ₪';
      el.style.display = 'inline-block';
      el.style.background = info.accrued >= info.limit ? 'rgba(239,68,68,.15)' : 'rgba(245,158,11,.15)';
      el.style.color = info.accrued >= info.limit ? '#ef4444' : '#f59e0b';
    } else {
      el.style.display = 'none';
    }
  } else {
    el.innerHTML = '<i class="fa-solid fa-crown" style="margin-'+(document.dir==='rtl'?'l':'r')+'eft:3px"></i>VIP';
    el.style.display = 'inline-block';
    el.style.background = 'rgba(16,185,129,.12)';
    el.style.color = '#10b981';
  }
}

function closeAdmin() {
  document.getElementById('adminOverlay').classList.remove('show');
  document.body.style.overflow = '';
  document.getElementById('adminSidebar').classList.remove('open');
}

function toggleAdminSidebar() {
  document.getElementById('adminSidebar').classList.toggle('open');
}

function switchAdminTab(tab, subTab = '') {
  const tabMap = ['dashboard','orders','products','categories','addProduct','settings','banners','coupons','marketing','appearance','spinwheel','subscription'];
  const idx = tabMap.indexOf(tab);
  
  document.querySelectorAll('.admin-sidebar button').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.submenu-btn').forEach(b => b.classList.remove('active'));

  if (idx >= 0) {
    const mainBtn = Array.from(document.querySelectorAll('.admin-sidebar button')).find(b => {
      const oc = (b.getAttribute('onclick') || '');
      return oc.includes(`switchAdminTab('${tab}'`) || oc.includes(`'${tab}'`);
    });
    if (mainBtn) mainBtn.classList.add('active');
  }

  document.getElementById('admin-' + tab).classList.add('active');
  const titles = { dashboard:'الإحصائيات', orders:'الطلبات', products:'المنتجات', categories:'التصنيفات', addProduct:'إضافة منتج', settings:'الإعدادات', banners:'البانرات الإعلانية', coupons:'أكواد الخصم', marketing:'التسويق', appearance:'المظهر والتخطيط', spinwheel:'عجلة الحظ', subscription:'الاشتراك' };
  document.getElementById('adminPageTitle').textContent = titles[tab] || tab;

  if (tab === 'dashboard') adminRenderDashboard();
  if (tab === 'orders') adminRenderOrders();
  if (tab === 'products') adminRenderProducts();
  if (tab === 'categories') adminRenderCategories();
  if (tab === 'addProduct') adminLoadForm();
  if (tab === 'settings') adminLoadSettings();
  if (tab === 'appearance') adminRenderAppearance();
  if (tab === 'banners') adminRenderBanners();
  if (tab === 'coupons') adminRenderCoupons();
  if (tab === 'subscription') adminRenderSubscriptionTab();
  if (tab === 'spinwheel') adminRenderSpinWheel();
  
  if (tab === 'marketing') {
    adminRenderMarketing(subTab || 'seo');
    toggleAdminMktSubMenu(null, true);
    
    // Highlight the sub-menu button
    const targetSub = subTab || 'seo';
    document.querySelectorAll('.submenu-btn').forEach(btn => {
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${targetSub}'`)) {
        btn.classList.add('active');
      }
    });
  } else {
    // Hide marketing sub-menu when switching to other tabs
    const sub = document.getElementById('adminMktSubMenu');
    const chev = document.getElementById('adminMktChevron');
    if (sub) sub.style.display = 'none';
    if (chev) chev.style.transform = 'rotate(0deg)';
  }

  document.getElementById('adminSidebar').classList.remove('open');
}

function adminRefreshAll() {
  adminSettings = loadAdminSettings();
  WHOLESALE_CODE = adminSettings.wholesaleCode || 'ADMIN123';
  CURRENCY = adminSettings.currency || '₪';
  products = loadProducts();
  wishlist = JSON.parse(localStorage.getItem('mycart_wishlist')) || [];
  adminRenderDashboard();
  adminRenderOrders();
  adminRenderProducts();
  adminRenderCategories();
  adminUpdateCouponBadge();
  updateAdminFeeBadge();
}

function adminRenderDashboard() {
  const allOrders = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  const revenue = allOrders.reduce((s, o) => s + (o.total || 0), 0);
  const customers = new Set(allOrders.map(o => o.customer?.phone)).size;
  document.getElementById('admin-dashboard').innerHTML = `
    <div class="admin-stats">
      <div class="admin-stat"><i class="fa-solid fa-box"></i><div><span>${products.length}</span><p>المنتجات</p></div></div>
      <div class="admin-stat"><i class="fa-solid fa-receipt"></i><div><span>${allOrders.length}</span><p>الطلبات</p></div></div>
      <div class="admin-stat"><i class="fa-solid fa-money-bill"></i><div><span>${CURRENCY}${revenue.toFixed(2)}</span><p>الإيرادات</p></div></div>
      <div class="admin-stat"><i class="fa-solid fa-users"></i><div><span>${customers}</span><p>العملاء</p></div></div>
    </div>
    <div style="margin-top:16px">
      <h3 style="font-size:.9rem;font-weight:700;margin-bottom:8px">المبيعات اليومية (آخر 7 أيام)</h3>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:12px;overflow-x:auto">
        <canvas id="adminChart" height="180" style="width:100%;max-height:180px"></canvas>
      </div>
    </div>
    <div class="admin-section-title" style="margin-top:16px">آخر الطلبات</div>
    ${(() => {
      if (!allOrders.length) return '<div class="admin-empty"><i class="fa-solid fa-receipt"></i><p>لا يوجد طلبات</p></div>';
      var last = allOrders.slice(0, 5);
      return last.map(function(o, idx) {
        return '<div class="admin-order-card" onclick="adminShowOrderDetail('+idx+')" style="cursor:pointer"><div class="admin-order-header"><span class="oid">#'+String(o.id).slice(-6)+'</span><span class="odate">'+(o.date||'')+'</span><span class="ostatus '+(o._status==='done'?'done':'pending')+'">'+(o._status==='done'?'مكتمل':'جديد')+'</span></div><div class="admin-order-body"><div class="oinfo"><i class="fa-solid fa-user"></i> '+(o.customer?.name||'—')+' | '+(o.customer?.phone||'')+'</div><div class="ototal">'+CURRENCY+(o.total?.toFixed(2)||'0.00')+'</div></div></div>';
      }).join('');
    })()}
  `;
  // Render chart
  setTimeout(adminRenderChart, 50);
}

function adminRenderChart() {
  const canvas = document.getElementById('adminChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.max(rect.width, 300) * dpr;
  canvas.height = 180 * dpr;
  canvas.style.height = '180px';
  ctx.scale(dpr, dpr);
  const W = canvas.width / dpr;
  const H = 180;
  const orders = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('ar-SA').split('،')[0];
    const total = orders.filter(o => o.date && o.date.includes(dateStr)).reduce((s, o) => s + (o.total || 0), 0);
    days.push({ label: d.toLocaleDateString('ar-SA', { weekday:'short' }), value: total });
  }
  const max = Math.max(...days.map(d => d.value), 1);
  const barW = Math.min(36, (W - 60) / days.length - 6);
  const gap = 6;
  const startX = 36;
  const bottomY = H - 26;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = bottomY - (i / 4) * (H - 46);
    ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(W - 10, y); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.font = '9px Tajawal'; ctx.textAlign = 'right';
    ctx.fillText(`${CURRENCY}${Math.round(max * i / 4)}`, startX - 4, y + 3);
  }
  days.forEach((d, i) => {
    const x = startX + i * (barW + gap) + gap;
    const h = (d.value / max) * (H - 50);
    const y = bottomY - h;
    const grad = ctx.createLinearGradient(0, y, 0, bottomY);
    grad.addColorStop(0, '#ef4444'); grad.addColorStop(1, '#fca5a5');
    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barW, h, [4, 4, 0, 0]);
    else ctx.rect(x, y, barW, h);
    ctx.fill();
    ctx.fillStyle = '#64748b'; ctx.font = '9px Tajawal'; ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barW / 2, H - 6);
    if (d.value > 0) {
      ctx.fillStyle = '#1e293b'; ctx.font = 'bold 9px Tajawal';
      ctx.fillText(`${CURRENCY}${d.value}`, x + barW / 2, y - 4);
    }
  });
}

let quickAdminOrderSortDir = 'desc'; // 'desc' or 'asc'

function toggleQuickAdminOrderSortDir() {
  quickAdminOrderSortDir = quickAdminOrderSortDir === 'desc' ? 'asc' : 'desc';
  adminRenderOrders();
}

let quickAdminOrderFilterStatus = 'all';

const QUICK_ORDER_STATUSES = {
  pending: { label: 'جديد', color: '#f59e0b', bg: '#fef3c7', text: '#92400e', icon: 'fa-clock' },
  processing: { label: 'قيد التجهيز', color: '#3b82f6', bg: '#dbeafe', text: '#1e40af', icon: 'fa-gears' },
  shipped: { label: 'مشحون', color: '#8b5cf6', bg: '#ede9fe', text: '#5b21b6', icon: 'fa-truck-fast' },
  completed: { label: 'مستلم / مكتمل', color: '#10b981', bg: '#dcfce7', text: '#166534', icon: 'fa-circle-check' },
  returned: { label: 'مرتجع', color: '#ef4444', bg: '#fee2e2', text: '#991b1b', icon: 'fa-rotate-left' },
  cancelled: { label: 'ملغي', color: '#64748b', bg: '#f1f5f9', text: '#334155', icon: 'fa-ban' }
};

function setQuickAdminOrderFilterStatus(status) {
  quickAdminOrderFilterStatus = status;
  adminRenderOrders();
}

function updateQuickOrderStatusSelect(idx, newStatus) {
  const o = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  if (!o[idx]) return;
  o[idx]._status = newStatus;
  try { localStorage.setItem('mycart_orders', JSON.stringify(o)); } catch(e) { showToast('⚠️ مساحة التخزين ممتلئة', 'error'); }
  adminRenderOrders();
}

let quickAdminOrderSearchQuery = '';

function setQuickAdminOrderSearchQuery(q) {
  quickAdminOrderSearchQuery = q.trim().toLowerCase();
  adminRenderOrders();
}

function exportQuickOrdersCSV() {
  const orders = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  if (!orders.length) { showToast('⚠️ لا توجد طلبات لتصديرها', 'error'); return; }

  let csvContent = "\uFEFFرقم الطلب,التاريخ,اسم العميل,رقم الهاتف,المدينة,العنوان,المنتجات,المجموع,الحالة\n";

  orders.forEach(o => {
    const rawSt = o._status === 'done' ? 'completed' : (o._status || 'pending');
    const stLabel = (QUICK_ORDER_STATUSES[rawSt] || QUICK_ORDER_STATUSES.pending).label;
    const itemsStr = (o.items || []).map(i => `${i.name} (${i.qty})`).join(' - ').replace(/"/g, '""');
    const nameStr = (o.customer?.name || '').replace(/"/g, '""');
    const phoneStr = (o.customer?.phone || '').replace(/"/g, '""');
    const cityStr = (o.customer?.city || '').replace(/"/g, '""');
    const addrStr = (o.customer?.address || '').replace(/"/g, '""');
    
    csvContent += `"#${String(o.id).slice(-6)}","${o.date||''}","${nameStr}","${phoneStr}","${cityStr}","${addrStr}","${itemsStr}","${o.total?.toFixed(2)||'0'}","${stLabel}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `orders_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📥 تم تصدير ملف الطلبات بنجاح', 'success');
}

function adminRenderOrders() {
  const allOrders = JSON.parse(localStorage.getItem('mycart_orders')) || [];
  document.getElementById('adminOrderBadge').textContent = allOrders.length;

  const counts = {
    all: allOrders.length,
    pending: 0,
    processing: 0,
    shipped: 0,
    completed: 0,
    returned: 0,
    cancelled: 0
  };

  allOrders.forEach(o => {
    const st = o._status === 'done' ? 'completed' : (o._status || 'pending');
    if (counts[st] !== undefined) counts[st]++;
    else counts.pending++;
  });

  const filterTabsHtml = `
    <div style="display:flex;align-items:center;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px;-webkit-overflow-scrolling:touch">
      <button onclick="setQuickAdminOrderFilterStatus('all')" style="background:${quickAdminOrderFilterStatus==='all'?'#1e293b':'#f1f5f9'};color:${quickAdminOrderFilterStatus==='all'?'#fff':'#475569'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-layer-group"></i> الكل (${counts.all})</button>
      <button onclick="setQuickAdminOrderFilterStatus('pending')" style="background:${quickAdminOrderFilterStatus==='pending'?'#f59e0b':'#fef3c7'};color:${quickAdminOrderFilterStatus==='pending'?'#fff':'#92400e'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-clock"></i> جديد (${counts.pending})</button>
      <button onclick="setQuickAdminOrderFilterStatus('processing')" style="background:${quickAdminOrderFilterStatus==='processing'?'#3b82f6':'#dbeafe'};color:${quickAdminOrderFilterStatus==='processing'?'#fff':'#1e40af'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-gears"></i> التجهيز (${counts.processing})</button>
      <button onclick="setQuickAdminOrderFilterStatus('shipped')" style="background:${quickAdminOrderFilterStatus==='shipped'?'#8b5cf6':'#ede9fe'};color:${quickAdminOrderFilterStatus==='shipped'?'#fff':'#5b21b6'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-truck-fast"></i> المشحون (${counts.shipped})</button>
      <button onclick="setQuickAdminOrderFilterStatus('completed')" style="background:${quickAdminOrderFilterStatus==='completed'?'#10b981':'#dcfce7'};color:${quickAdminOrderFilterStatus==='completed'?'#fff':'#166534'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-circle-check"></i> المستلم (${counts.completed})</button>
      <button onclick="setQuickAdminOrderFilterStatus('returned')" style="background:${quickAdminOrderFilterStatus==='returned'?'#ef4444':'#fee2e2'};color:${quickAdminOrderFilterStatus==='returned'?'#fff':'#991b1b'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-rotate-left"></i> المرتجع (${counts.returned})</button>
      <button onclick="setQuickAdminOrderFilterStatus('cancelled')" style="background:${quickAdminOrderFilterStatus==='cancelled'?'#64748b':'#f1f5f9'};color:${quickAdminOrderFilterStatus==='cancelled'?'#fff':'#334155'};border:none;padding:6px 12px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-ban"></i> الملغي (${counts.cancelled})</button>
    </div>
  `;

  var sortedOrdersWithIdx = allOrders.map((o, idx) => ({ order: o, realIdx: idx }));
  sortedOrdersWithIdx.sort((a, b) => {
    const timeA = a.order.id || 0;
    const timeB = b.order.id || 0;
    return quickAdminOrderSortDir === 'desc' ? timeB - timeA : timeA - timeB;
  });

  if (quickAdminOrderFilterStatus !== 'all') {
    sortedOrdersWithIdx = sortedOrdersWithIdx.filter(item => {
      var st = item.order._status === 'done' ? 'completed' : (item.order._status || 'pending');
      return st === quickAdminOrderFilterStatus;
    });
  }

  if (quickAdminOrderSearchQuery) {
    sortedOrdersWithIdx = sortedOrdersWithIdx.filter(item => {
      const o = item.order;
      const idStr = String(o.id || '');
      const name = (o.customer?.name || '').toLowerCase();
      const phone = (o.customer?.phone || '').toLowerCase();
      const city = (o.customer?.city || '').toLowerCase();
      return idStr.includes(quickAdminOrderSearchQuery) || name.includes(quickAdminOrderSearchQuery) || phone.includes(quickAdminOrderSearchQuery) || city.includes(quickAdminOrderSearchQuery);
    });
  }

  var topBar = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div class="admin-section-title" style="margin:0">جميع الطلبات (${allOrders.length})</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button onclick="exportQuickOrdersCSV()" class="admin-btn admin-btn-secondary admin-btn-sm" style="padding:6px 12px;border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit;display:inline-flex;align-items:center;gap:6px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534">
          <i class="fa-solid fa-file-csv"></i> تصدير Excel
        </button>
        <button onclick="toggleQuickAdminOrderSortDir()" class="admin-btn admin-btn-secondary admin-btn-sm" style="padding:6px 12px;border-radius:8px;cursor:pointer;font-weight:700;font-family:inherit;display:inline-flex;align-items:center;gap:6px">
          <i class="fa-solid ${quickAdminOrderSortDir === 'desc' ? 'fa-arrow-down-wide-short' : 'fa-arrow-up-short-wide'}"></i>
          <span>${quickAdminOrderSortDir === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}</span>
        </button>
      </div>
    </div>

    <!-- Search Input Bar -->
    <div style="position:relative;margin-bottom:12px">
      <i class="fa-solid fa-magnifying-glass" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:.85rem"></i>
      <input type="text" placeholder="البحث برقم الطلب، اسم العميل، أو رقم الهاتف..." value="${quickAdminOrderSearchQuery}" oninput="setQuickAdminOrderSearchQuery(this.value)" style="width:100%;padding:9px 36px 9px 12px;border:1.5px solid var(--border);border-radius:10px;font-family:inherit;font-size:.85rem;outline:none;background:var(--card);color:var(--text)">
    </div>
  `;

  document.getElementById('admin-orders').innerHTML = topBar + filterTabsHtml + `
    ${sortedOrdersWithIdx.length ? sortedOrdersWithIdx.map((item) => {
      var o = item.order;
      var realIdx = item.realIdx;
      var rawSt = o._status === 'done' ? 'completed' : (o._status || 'pending');
      var currSt = QUICK_ORDER_STATUSES[rawSt] || QUICK_ORDER_STATUSES.pending;

      var statusChipsHtml = Object.keys(QUICK_ORDER_STATUSES).map(stKey => {
        var info = QUICK_ORDER_STATUSES[stKey];
        var isCurrent = rawSt === stKey;
        return `<button type="button" onclick="updateQuickOrderStatusSelect(${realIdx}, '${stKey}')" style="background:${isCurrent ? info.color : info.bg};color:${isCurrent ? '#fff' : info.text};border:1.5px solid ${info.color};padding:4px 10px;border-radius:999px;font-size:.72rem;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-family:inherit;transition:all .15s;box-shadow:${isCurrent ? '0 2px 8px '+info.color+'40' : 'none'}"><i class="fa-solid ${info.icon}"></i> ${info.label}</button>`;
      }).join('');

      return `
      <div class="admin-order-card" onclick="adminShowOrderDetail(${realIdx})" style="position:relative;padding-right:48px;cursor:pointer;margin-bottom:12px;border:1px solid var(--border);border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.04)">
        <div style="position:absolute;right:0;top:0;bottom:0;width:44px;background:${currSt.bg};border-radius:10px 0 0 10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:${currSt.text}"><i class="fa-solid ${currSt.icon}"></i></div>
        <div class="admin-order-header" style="padding:10px 14px 4px">
          <span class="oid" style="font-size:.95rem">#${String(o.id).slice(-6)}</span>
          <span class="odate">${o.date || ''}</span>
          <span class="ostatus" style="background:${currSt.bg};color:${currSt.text};display:inline-flex;align-items:center;gap:4px;font-size:.75rem"><i class="fa-solid ${currSt.icon}"></i> ${currSt.label}</span>
        </div>
        <div class="admin-order-body" style="padding:0 14px 12px">
          <div style="display:flex;flex-wrap:wrap;gap:2px 12px;font-size:.82rem;color:var(--text);margin-bottom:4px">
            <span><i class="fa-solid fa-user" style="width:14px;color:var(--accent)"></i> ${o.customer?.name || '—'}</span>
            <span><i class="fa-solid fa-phone" style="width:14px;color:var(--accent)"></i> ${o.customer?.phone || '—'}</span>
            <span><i class="fa-solid fa-location-dot" style="width:14px;color:var(--accent)"></i> ${o.customer?.city || ''} ${o.customer?.address || ''}</span>
          </div>
          <div class="oitems">${o.items?.map(it => `${it.name} × ${it.qty}`).join(' | ') || ''}</div>
          
          <!-- Status Chips Bar -->
          <div style="margin-top:10px;padding-top:8px;border-top:1px dashed var(--border)">
            <div style="font-size:.7rem;font-weight:800;color:var(--text-muted);margin-bottom:6px;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-arrows-rotate"></i> تغيير حالة الطلب:</div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center" onclick="event.stopPropagation()">
              ${statusChipsHtml}
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px">
            <div class="ototal" style="margin:0">${CURRENCY}${o.total?.toFixed(2) || '0.00'}</div>
            <div style="display:flex;gap:6px;align-items:center" onclick="event.stopPropagation()">
              <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminShowOrderDetail(${realIdx})" style="background:#f1f5f9;color:var(--text);padding:4px 8px;font-size:.75rem"><i class="fa-solid fa-pen-to-square"></i> التفاصيل</button>
              <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="adminDeleteOrder(${realIdx})" style="padding:4px 8px;font-size:.75rem"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('') : '<div class="admin-empty"><i class="fa-solid fa-filter"></i><p>لا توجد طلبات بهذه الحالة</p></div>'}
  `;
}

function adminDeleteOrder(idx) {
  showConfirmModal('هل أنت متأكد من حذف هذا الطلب؟', function() {
    const o = JSON.parse(localStorage.getItem('mycart_orders')) || [];
    o.splice(idx, 1);
    try { localStorage.setItem('mycart_orders', JSON.stringify(o)); } catch(e) {}
    adminRefreshAll();
  });
}

function exportProductsJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `products_export_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('📥 تم تصدير كافة المنتجات بنجاح!', 'success');
}

function triggerImportProducts() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          let count = 0;
          
          // Get existing categories
          const storedCats = localStorage.getItem('mycart_categories');
          let cats = [];
          if (storedCats) { try { cats = JSON.parse(storedCats); } catch(ex) {} }
          let catsModified = false;

          imported.forEach(p => {
            if (p.name && p.price !== undefined) {
              if (!p.id) p.id = Date.now() + Math.floor(Math.random() * 1000);
              if (!p.createdAt) p.createdAt = new Date().toLocaleDateString('ar-EG');
              products.unshift(p);
              count++;

              // Extract and add category or brand if missing
              const addCategoryIfMissing = (catName, isBrand) => {
                if (catName && typeof catName === 'string') {
                  const trimmed = catName.trim();
                  if (trimmed && !cats.some(c => c.name === trimmed)) {
                    cats.push({ name: trimmed, image: '', isBrand: isBrand, createdAt: new Date().toLocaleDateString('ar-EG') });
                    catsModified = true;
                  }
                }
              };

              if (p.category) {
                addCategoryIfMissing(p.category, false);
              }
              if (Array.isArray(p.categories)) {
                p.categories.forEach(c => addCategoryIfMissing(c, false));
              }
              if (p.brand) {
                addCategoryIfMissing(p.brand, true);
              }
            }
          });

          saveProductsToLS();
          
          if (catsModified) {
            try {
              localStorage.setItem('mycart_categories', JSON.stringify(cats));
              localStorage.setItem('mycart_admin_categories_sync', Date.now().toString());
            } catch(ex) {}
            if (typeof adminRenderCategories === 'function') adminRenderCategories();
            if (typeof renderCategories === 'function') renderCategories();
          }

          adminRenderProducts();
          showToast(`✅ تم استيراد ${count} منتج بنجاح!`, 'success');
        } else {
          showToast('⚠️ صيغة ملف JSON غير صحيحة', 'error');
        }
      } catch(err) {
        showToast('⚠️ خطأ في قراءة ملف JSON', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function adminRenderProducts() {
  const searchQ = (document.getElementById('adminProdSearch')?.value || '').trim().toLowerCase();
  const filtered = searchQ ? products.filter(p => p.name.toLowerCase().includes(searchQ)) : products;
  document.getElementById('admin-products').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div class="admin-section-title" style="margin:0">إدارة المنتجات (${filtered.length})</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="exportProductsJSON()" title="تصدير المنتجات كملف JSON"><i class="fa-solid fa-file-export"></i> تصدير JSON</button>
        <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="triggerImportProducts()" title="استيراد منتجات من ملف JSON"><i class="fa-solid fa-file-import"></i> استيراد JSON</button>
        <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="switchAdminTab('addProduct')"><i class="fa-solid fa-plus"></i> إضافة منتج جديد</button>
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:12px;align-items:center">
      <input type="checkbox" id="adminSelectAllCb" onchange="adminToggleSelectAll()" style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;flex-shrink:0" ${filtered.length && document.querySelectorAll('.admin-prod-cb:checked').length === filtered.length ? 'checked' : ''}>
      <input type="text" id="adminProdSearch" placeholder="🔍 بحث في المنتجات باسم المنتج..." value="${searchQ}" oninput="adminRenderProducts()" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:.85rem;font-family:inherit;outline:none">
      <button class="admin-btn admin-btn-danger admin-btn-sm" id="adminDelSelectedBtn" onclick="adminDeleteSelectedProducts()" style="display:${document.querySelectorAll('.admin-prod-cb:checked').length ? 'inline-flex' : 'none'};gap:4px"><i class="fa-solid fa-trash"></i> حذف المحدد</button>
    </div>
    ${filtered.length ? filtered.map((p, i) => {
      const realIdx = products.indexOf(p);
      const addedDate = p.createdAt || p.dateAdded || 'غير محدد';
      return `
      <div class="admin-prod-row" style="padding:10px 12px">
        <input type="checkbox" class="admin-prod-cb" data-idx="${realIdx}" onchange="adminToggleProdSelect()" style="width:16px;height:16px;accent-color:var(--accent);cursor:pointer;flex-shrink:0">
        <img src="${getProductImages(p)[0]}" alt="" style="width:44px;height:44px;border-radius:8px;object-fit:cover;border:1px solid var(--border)">
        <div class="admin-prod-info" style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <strong style="font-size:.88rem">${p.name}</strong>
            ${p.brand ? `<span style="font-weight:700;color:var(--accent);font-size:.7rem;background:rgba(239,68,68,.08);padding:1px 6px;border-radius:4px">[${p.brand}]</span>` : ''}
            ${p.featured ? `<span style="font-size:.65rem;background:#fef3c7;color:#d97706;padding:1px 6px;border-radius:4px;font-weight:800">⭐ مميز</span>` : ''}
            ${p.type === 'bundle' ? `<span style="font-size:.65rem;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;padding:1px 8px;border-radius:4px;font-weight:800"><i class="fa-solid fa-cubes"></i> بكج</span>` : ''}
          </div>
          <div style="font-size:.72rem;color:var(--text-muted);display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px">
            <span style="font-weight:800;color:var(--text)">${CURRENCY}${p.price}</span>
            <span>• التصنيف: ${getProductCats(p).join('، ') || 'عام'}</span>
            ${getProductDiscount(p) ? `<span style="color:#ef4444;font-weight:700"> خصم ${getProductDiscount(p)}%</span>` : ''}
            ${p.type === 'bundle' ? `<span style="color:#f59e0b;font-weight:700"><i class="fa-solid fa-boxes"></i> ${(p.bundleProducts||[]).length} منتجات</span>` : `<span><i class="fa-solid fa-box" style="margin-inline-end:2px"></i> ${p.stock !== undefined ? p.stock : 'غير محدود'}</span>`}
            <span style="margin-right:auto;color:#64748b;font-size:.68rem"><i class="fa-solid fa-calendar-days" style="margin-left:2px;color:#94a3b8"></i> تاريخ الإضافة: <strong>${addedDate}</strong></span>
          </div>
        </div>
        <div class="admin-prod-actions" style="display:flex;gap:4px">
          <a class="admin-btn admin-btn-secondary admin-btn-sm" href="#product/${p.id}" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;padding:5px 9px" title="مشاهدة" onclick="closeAdmin()"><i class="fa-solid fa-eye"></i></a>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminEditProduct(${realIdx})" title="تعديل"><i class="fa-solid fa-pen"></i></button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="adminDeleteProduct(${realIdx})" title="حذف"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `}).join('') : '<div class="admin-empty"><i class="fa-solid fa-box"></i><p>لا توجد منتجات مطابقة للبحث</p></div>'}
  `;
  if (searchQ) document.getElementById('adminProdSearch')?.focus();
}

function adminDeleteSelectedProducts() {
  const cbs = document.querySelectorAll('.admin-prod-cb:checked');
  if (!cbs.length) return;
  showConfirmModal(`هل أنت متأكد من حذف ${cbs.length} منتج؟`, function() {
    const indices = [...cbs].map(cb => parseInt(cb.dataset.idx)).sort((a,b) => b - a);
    indices.forEach(idx => products.splice(idx, 1));
    saveProductsToLS();
    adminRefreshAll();
  });
}

function toggleBrandIndicator(cb) {
  const indicator = document.getElementById('acBrandToggleIndicator');
  const thumb = document.getElementById('acBrandToggleThumb');
  if (!indicator || !thumb) return;
  if (cb.checked) {
    indicator.style.background = 'var(--accent)';
    thumb.style.right = '18px';
  } else {
    indicator.style.background = 'var(--border)';
    thumb.style.right = '2px';
  }
}

let adminEditingCatIdx = null;
let adminCatModalEl = null;

function adminCloseCatModal() {
  if (adminCatModalEl) { document.body.removeChild(adminCatModalEl); adminCatModalEl = null; }
  adminEditingCatIdx = null;
}

function showCategoryModal(editIdx) {
  adminCloseCatModal();
  const isEdit = editIdx !== undefined && editIdx !== null;
  let catData = { name: '', image: '', isBrand: false };
  if (isEdit) {
    const stored = localStorage.getItem('mycart_categories');
    let cats = [];
    if (stored) { try { cats = JSON.parse(stored); } catch(e) {} }
    const c = cats[editIdx];
    if (!c) return;
    catData = c;
    adminEditingCatIdx = editIdx;
  }
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:50000;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease';
  overlay.innerHTML = `
    <div style="background:var(--card);border-radius:20px;max-width:460px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 80px rgba(0,0,0,.35);animation:slideUp .3s cubic-bezier(.22,1,.36,1);padding:0">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 22px 0">
        <h3 style="font-size:1.05rem;font-weight:800;margin:0">${isEdit ? '✏️ تعديل التصنيف' : '➕ إضافة تصنيف جديد'}</h3>
        <button onclick="adminCloseCatModal()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted);padding:4px;line-height:1"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div style="padding:18px 22px 22px">
        <div style="margin-bottom:14px">
          <label style="font-weight:700;font-size:.8rem;display:block;margin-bottom:4px">اسم التصنيف</label>
          <input type="text" id="acName" placeholder="مثال: جوالات" value="${catData.name}" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;font-size:.9rem;outline:none;font-family:inherit;transition:.2s;box-sizing:border-box">
        </div>
        <div style="margin-bottom:14px">
          <label style="font-weight:700;font-size:.8rem;display:block;margin-bottom:4px">صورة التصنيف</label>
          <div style="display:flex;gap:10px;align-items:center">
            <input type="text" id="acImage" placeholder="رابط الصورة أو ارفع صورة" value="${catData.image}" style="flex:1;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;font-size:.9rem;outline:none;font-family:inherit;transition:.2s;box-sizing:border-box">
            <button style="padding:9px 14px;border:none;border-radius:10px;background:var(--bg);color:var(--text);cursor:pointer;font-size:1rem;border:1.5px solid var(--border);flex-shrink:0;font-family:inherit" onclick="document.getElementById('acImageFile').click()"><i class="fa-solid fa-upload"></i></button>
            <input type="file" id="acImageFile" accept="image/*" style="display:none" onchange="adminUploadCatImageModal(this)">
            <img id="acPreview" style="width:44px;height:44px;border-radius:10px;object-fit:cover;display:${catData.image ? 'block' : 'none'};border:2px solid var(--border);flex-shrink:0" src="${catData.image || ''}">
          </div>
        </div>
        <label style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--bg);border:1.5px solid var(--border);border-radius:12px;cursor:pointer;margin-bottom:6px;transition:.2s">
          <input type="checkbox" id="acIsBrand" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;flex-shrink:0" ${catData.isBrand ? 'checked' : ''} onchange="toggleBrandIndicator(this)">
          <div style="flex:1">
            <div style="font-weight:700;font-size:.8rem;color:var(--text)">🏷️ علامة تجارية</div>
            <div style="font-size:.7rem;color:var(--text-muted)">يظهر في فلتر الماركات بدلاً من تصنيف المنتجات</div>
          </div>
          <div id="acBrandToggleIndicator" style="width:36px;height:20px;border-radius:999px;background:${catData.isBrand ? 'var(--accent)' : 'var(--border)'};position:relative;transition:.3s;flex-shrink:0">
            <div id="acBrandToggleThumb" style="width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;right:${catData.isBrand ? '18px' : '2px'};transition:.3s;box-shadow:0 1px 3px rgba(0,0,0,.2)"></div>
          </div>
        </label>
        <div style="display:flex;gap:10px;margin-top:18px">
          <button onclick="adminSaveCategoryModal()" style="flex:1;padding:11px;border:none;border-radius:12px;background:var(--accent);color:#fff;font-weight:800;font-size:.9rem;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity .2s">${isEdit ? '<i class="fa-solid fa-pen"></i> تحديث التصنيف' : '<i class="fa-solid fa-plus"></i> إضافة تصنيف'}</button>
          <button onclick="adminCloseCatModal()" style="padding:11px 18px;border:1.5px solid var(--border);border-radius:12px;background:var(--card);color:var(--text-muted);font-weight:700;font-size:.85rem;cursor:pointer;font-family:inherit;transition:.2s">إلغاء</button>
        </div>
      </div>
    </div>
  `;
  overlay.onclick = function(e) { if (e.target === overlay) adminCloseCatModal(); };
  document.body.appendChild(overlay);
  adminCatModalEl = overlay;
  // Live preview on image input
  const imgInput = document.getElementById('acImage');
  if (imgInput) {
    imgInput.oninput = function() {
      const preview = document.getElementById('acPreview');
      if (this.value.trim()) { preview.src = this.value.trim(); preview.style.display = 'block'; }
      else preview.style.display = 'none';
    };
  }
}

async function adminUploadCatImageModal(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('⚠️ الصورة كبيرة جداً', 'error'); return; }
  const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
  showToast('🔄 جاري رفع الصورة...', 'info');
  const url = await uploadToImgbb(dataUrl);
  if (!url) return;
  document.getElementById('acImage').value = url;
  document.getElementById('acPreview').src = url;
  document.getElementById('acPreview').style.display = 'block';
}

function adminToggleCatForm() {
  const catTab = document.getElementById('admin-categories');
  if (!catTab || !catTab.classList.contains('active')) switchAdminTab('categories');
  showCategoryModal();
}

function adminRenderCategories() {
  document.getElementById('admin-categories').innerHTML = `
    <div class="admin-section-title">إدارة التصنيفات</div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
      <button class="admin-btn admin-btn-primary" onclick="adminToggleCatForm()" style="margin:0"><i class="fa-solid fa-plus"></i> إضافة تصنيف جديد</button>
      <input type="text" id="adminCatSearch" placeholder="بحث..." style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px;font-size:.8rem;font-family:inherit" oninput="adminRenderCategoriesListOnly()">
    </div>
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;padding:4px 8px;background:var(--card);border:1px solid var(--border);border-radius:6px;font-size:.75rem">
      <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-weight:700">
        <input type="checkbox" id="adminSelectAllCats" onchange="adminToggleSelectAllCats(this)" style="width:14px;height:14px"> تحديد الكل
      </label>
      <button id="adminBulkDeleteCatsBtn" class="admin-btn admin-btn-danger admin-btn-sm" onclick="adminBulkDeleteCategories()" style="display:none;margin-right:auto;font-size:.7rem;padding:2px 8px">
        <i class="fa-solid fa-trash"></i> حذف المحدد
      </button>
    </div>
    <div id="adminCategoriesList"></div>
  `;
  adminRenderCategoriesListOnly();
}

function adminRenderCategoriesListOnly() {
  const stored = localStorage.getItem('mycart_categories');
  let cats = [];
  if (stored) { 
    try { 
      cats = JSON.parse(stored); 
      let changed = false;
      cats.forEach(c => {
        if (!c.createdAt) {
          c.createdAt = new Date().toLocaleDateString('ar-EG');
          changed = true;
        }
      });
      if (changed) {
        try { localStorage.setItem('mycart_categories', JSON.stringify(cats)); } catch(e) {}
      }
    } catch(e) {} 
  }
  
  const query = (document.getElementById('adminCatSearch')?.value || '').trim().toLowerCase();
  const filtered = cats.map((c, originalIdx) => ({ ...c, originalIdx }))
                       .filter(c => c.name.toLowerCase().includes(query));

  const listContainer = document.getElementById('adminCategoriesList');
  if (!listContainer) return;

  if (!cats.length) {
    listContainer.innerHTML = '<div class="admin-empty"><i class="fa-solid fa-tags"></i><p>لا يوجد تصنيفات بعد</p></div>';
    return;
  }

  if (!filtered.length) {
    listContainer.innerHTML = '<div class="admin-empty"><i class="fa-solid fa-tags"></i><p>لا توجد نتائج مطابقة</p></div>';
    const selectAllBtn = document.getElementById('adminSelectAllCats');
    if (selectAllBtn) selectAllBtn.checked = false;
    const bulkBtn = document.getElementById('adminBulkDeleteCatsBtn');
    if (bulkBtn) bulkBtn.style.display = 'none';
    return;
  }

  listContainer.innerHTML = filtered.map(c => `
    <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--card);border:1px solid var(--border);border-radius:8px;margin-bottom:4px">
      <input type="checkbox" class="admin-cat-checkbox" data-name="${c.name}" onchange="adminUpdateBulkDeleteBtn()" style="width:16px;height:16px;cursor:pointer;margin:0">
      <img src="${c.image || 'https://placehold.co/48x48/e2e8f0/64748b?text=' + encodeURIComponent(c.name.slice(0,2))}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;background:#e2e8f0">
      <div style="flex:1">
        <strong style="font-size:.85rem">${c.name} ${c.isBrand ? '<span style="font-size:.65rem;background:rgba(239,68,68,0.05);color:var(--accent);border:1px solid var(--accent);padding:2px 8px;border-radius:6px;margin-inline-start:6px;font-weight:700;display:inline-flex;align-items:center;gap:3px"><i class="fa-solid fa-award"></i> ماركة</span>' : ''}</strong>
        <div style="display:flex;align-items:center;gap:12px;font-size:.72rem;color:var(--text-muted);margin-top:2px">
          <span>${products.filter(p => c.isBrand ? (p.brand === c.name) : getProductCats(p).includes(c.name)).length} منتج</span>
          <span style="display:inline-flex;align-items:center;gap:3px"><i class="fa-solid fa-calendar-days" style="font-size:.65rem;color:#94a3b8"></i> تاريخ الإضافة: <strong>${c.createdAt || 'غير محدد'}</strong></span>
        </div>
      </div>
      <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="showCategoryModal(${c.originalIdx})" style="font-size:.75rem"><i class="fa-solid fa-pen"></i></button>
      <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="adminDeleteCategory(${c.originalIdx})" style="font-size:.75rem"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('');

  adminUpdateSelectAllState();
}

function adminUpdateBulkDeleteBtn() {
  const checkboxes = document.querySelectorAll('.admin-cat-checkbox');
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  const bulkBtn = document.getElementById('adminBulkDeleteCatsBtn');
  if (bulkBtn) {
    bulkBtn.style.display = checkedCount > 0 ? 'inline-block' : 'none';
    bulkBtn.innerHTML = `<i class="fa-solid fa-trash"></i> حذف المحدد (${checkedCount})`;
  }
  const selectAllBtn = document.getElementById('adminSelectAllCats');
  if (selectAllBtn && checkboxes.length > 0) {
    selectAllBtn.checked = checkedCount === checkboxes.length;
  }
}

function adminUpdateSelectAllState() {
  const checkboxes = document.querySelectorAll('.admin-cat-checkbox');
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  const selectAllBtn = document.getElementById('adminSelectAllCats');
  if (selectAllBtn) {
    selectAllBtn.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
  }
  adminUpdateBulkDeleteBtn();
}

function adminToggleSelectAllCats(el) {
  const checkboxes = document.querySelectorAll('.admin-cat-checkbox');
  checkboxes.forEach(cb => cb.checked = el.checked);
  adminUpdateBulkDeleteBtn();
}

function adminBulkDeleteCategories() {
  const checkboxes = document.querySelectorAll('.admin-cat-checkbox:checked');
  const namesToDelete = Array.from(checkboxes).map(cb => cb.getAttribute('data-name'));
  if (!namesToDelete.length) return;
  
  showConfirmModal(`هل أنت متأكد من حذف ${namesToDelete.length} تصنيفات محددة؟`, function() {
    const stored = localStorage.getItem('mycart_categories');
    let cats = [];
    if (stored) { try { cats = JSON.parse(stored); } catch(e) {} }
    
    cats = cats.filter(c => !namesToDelete.includes(c.name));
    
    try { localStorage.setItem('mycart_categories', JSON.stringify(cats)); } catch(e) {}
    try { localStorage.setItem('mycart_admin_categories_sync', Date.now().toString()); } catch(e) {}
    
    const selectAllBtn = document.getElementById('adminSelectAllCats');
    if (selectAllBtn) selectAllBtn.checked = false;
    
    adminRenderCategories();
    renderCategories();
    showToast('✅ تم حذف التصنيفات المحددة', 'success');
  });
}

function adminSaveCategoryModal() {
  const name = document.getElementById('acName').value.trim();
  const image = document.getElementById('acImage').value.trim();
  const isBrand = document.getElementById('acIsBrand').checked;
  if (!name) { showToast('يرجى إدخال اسم التصنيف', 'error'); return; }
  const stored = localStorage.getItem('mycart_categories');
  let cats = [];
  if (stored) { try { cats = JSON.parse(stored); } catch(e) {} }

  if (adminEditingCatIdx !== null) {
    const existing = cats[adminEditingCatIdx];
    if (!existing) { adminCloseCatModal(); return; }
    if (name !== existing.name && cats.some((c, i) => i !== adminEditingCatIdx && c.name === name)) {
      showToast('هذا التصنيف موجود مسبقاً', 'error'); return;
    }
    cats[adminEditingCatIdx] = { 
      name, 
      image, 
      isBrand, 
      createdAt: existing.createdAt || new Date().toLocaleDateString('ar-EG') 
    };
    try { localStorage.setItem('mycart_categories', JSON.stringify(cats)); } catch(e) { showToast('⚠️ مساحة التخزين ممتلئة', 'error'); return; }
    try { localStorage.setItem('mycart_admin_categories_sync', Date.now().toString()); } catch(e) {}
    adminCloseCatModal();
    adminRenderCategories();
    renderCategories();
    showToast('✅ تم تحديث التصنيف', 'success');
    return;
  }

  if (cats.some(c => c.name === name)) { showToast('هذا التصنيف موجود مسبقاً', 'error'); return; }
  cats.unshift({ 
    name, 
    image, 
    isBrand, 
    createdAt: new Date().toLocaleDateString('ar-EG') 
  });
  try { localStorage.setItem('mycart_categories', JSON.stringify(cats)); } catch(e) { showToast('⚠️ مساحة التخزين ممتلئة', 'error'); return; }
  try { localStorage.setItem('mycart_admin_categories_sync', Date.now().toString()); } catch(e) {}
  adminCloseCatModal();
  adminRenderCategories();
  renderCategories();
  showToast('✅ تم إضافة التصنيف', 'success');
}

function showConfirmModal(msg, onConfirm) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:60000;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .2s ease';
  overlay.innerHTML = `
    <div style="background:var(--card);border-radius:20px;max-width:380px;width:100%;box-shadow:0 25px 80px rgba(0,0,0,.35);animation:slideUp .3s cubic-bezier(.22,1,.36,1);padding:28px 24px 22px;text-align:center">
      <div style="width:52px;height:52px;border-radius:50%;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.5rem;color:#ef4444"><i class="fa-solid fa-trash-can"></i></div>
      <h3 style="font-size:1rem;font-weight:800;margin:0 0 6px">تأكيد الحذف</h3>
      <p style="font-size:.85rem;color:var(--text-muted);margin:0 0 18px">${msg}</p>
      <div style="display:flex;gap:10px">
        <button id="confirmYesBtn" style="flex:1;padding:10px;border:none;border-radius:12px;background:#ef4444;color:#fff;font-weight:800;font-size:.85rem;cursor:pointer;font-family:inherit">نعم، احذف</button>
        <button id="confirmNoBtn" style="padding:10px 18px;border:1.5px solid var(--border);border-radius:12px;background:var(--card);color:var(--text-muted);font-weight:700;font-size:.85rem;cursor:pointer;font-family:inherit">إلغاء</button>
      </div>
    </div>
  `;
  overlay.onclick = function(e) { if (e.target === overlay) { document.body.removeChild(overlay); } };
  document.body.appendChild(overlay);
  document.getElementById('confirmYesBtn').onclick = function() { document.body.removeChild(overlay); onConfirm(); };
  document.getElementById('confirmNoBtn').onclick = function() { document.body.removeChild(overlay); };
}

function adminDeleteCategory(idx) {
  const stored = localStorage.getItem('mycart_categories');
  let cats = [];
  if (stored) { try { cats = JSON.parse(stored); } catch(e) {} }
  const c = cats[idx];
  if (!c) return;
  showConfirmModal(`هل أنت متأكد من حذف التصنيف <strong>"${c.name}"</strong>؟`, function() {
    cats.splice(idx, 1);
    try { localStorage.setItem('mycart_categories', JSON.stringify(cats)); } catch(e) {}
    try { localStorage.setItem('mycart_admin_categories_sync', Date.now().toString()); } catch(e) {}
    if (adminEditingCatIdx === idx) adminCloseCatModal();
    adminRenderCategories();
    renderCategories();
    showToast('✅ تم حذف التصنيف', 'success');
  });
}

function adminDeleteProduct(idx) {
  var pname = products[idx] ? products[idx].name : 'هذا المنتج';
  showConfirmModal('هل أنت متأكد من حذف المنتج <strong>"' + pname + '"</strong>؟', function() {
    products.splice(idx, 1);
    saveProductsToLS();
    adminRefreshAll();
  });
}

function adminRenderImageList(imgs) {
  const container = document.getElementById('apImageList');
  if (!container) return;
  if (!imgs || !imgs.length) {
    container.innerHTML = '<div style="font-size:.8rem;color:var(--text-muted)">لم يتم إضافة صور بعد</div>';
    return;
  }
  let html = `<div style="margin-bottom:10px;position:relative">
    <img src="${imgs[0]}" style="width:100%;height:130px;border-radius:10px;object-fit:cover;border:3px solid var(--accent);display:block;background:var(--card)">
    <div style="position:absolute;top:8px;right:8px;display:flex;gap:4px">
      <button type="button" onclick="adminRemoveImg(0)" style="width:28px;height:28px;border-radius:6px;border:none;background:rgba(239,68,68,0.9);color:#fff;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-trash-can"></i></button>
      <button type="button" onclick="adminMoveImg(0,1)" ${imgs.length === 1 ? 'disabled style="opacity:.3"' : ''} style="width:28px;height:28px;border-radius:6px;border:none;background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:.75rem;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-chevron-left"></i></button>
    </div>
    <div style="position:absolute;bottom:8px;right:8px;background:var(--card);padding:3px 10px;border-radius:6px;font-size:.7rem;font-weight:600;color:var(--accent);box-shadow:0 2px 8px rgba(0,0,0,0.12)">★ ${imgs[0].startsWith('data:') ? 'الصورة الرئيسية' : 'الصورة الرئيسية'}</div>
  </div>`;
  if (imgs.length > 1) {
    html += '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    for (let i = 1; i < imgs.length; i++) {
      html += `<div style="position:relative;width:70px">
        <img src="${imgs[i]}" onclick="adminSetPrimaryImg(${i})" style="width:100%;height:58px;border-radius:8px;object-fit:cover;cursor:pointer;border:2px solid var(--border);display:block">
        <div style="display:flex;gap:2px;margin-top:2px;justify-content:center">
          <button type="button" onclick="adminMoveImg(${i},-1)" style="width:20px;height:20px;border-radius:4px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:.5rem;display:flex;align-items:center;justify-content:center;font-family:inherit"><i class="fa-solid fa-chevron-right"></i></button>
          <button type="button" onclick="adminSetPrimaryImg(${i})" style="width:20px;height:20px;border-radius:4px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:.5rem;display:flex;align-items:center;justify-content:center;font-family:inherit" title="تعيين كأساسية"><i class="fa-solid fa-star"></i></button>
          <button type="button" onclick="adminMoveImg(${i},1)" ${i === imgs.length - 1 ? 'disabled style="opacity:.3"' : ''} style="width:20px;height:20px;border-radius:4px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:.5rem;display:flex;align-items:center;justify-content:center;font-family:inherit"><i class="fa-solid fa-chevron-left"></i></button>
          <button type="button" onclick="adminRemoveImg(${i})" style="width:20px;height:20px;border-radius:4px;border:1px solid #ef4444;background:#fef2f2;color:#ef4444;cursor:pointer;font-size:.5rem;display:flex;align-items:center;justify-content:center;font-family:inherit"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>`;
    }
    html += '</div>';
  }
  container.innerHTML = html;
}

function adminAddOption() {
  const container = document.getElementById('apOptions');
  const div = document.createElement('div');
  div.className = 'option-card';
  div.innerHTML = `<div class="option-header">
    <input type="text" class="optName" placeholder="اسم الخيار">
    <select class="optType" onchange="optTypeChange(this)">
      <option value="text">🎨 نص</option>
      <option value="color">🎨 لون</option>
      <option value="image">🖼️ صورة</option>
    </select>
    <button type="button" onclick="adminRemoveOption(this)"><i class="fa-solid fa-trash-can"></i></button>
  </div>
  <div class="optValues">
    <button type="button" onclick="adminAddOptValue(this)" style="padding:4px 10px;border:1px dashed var(--border);border-radius:6px;background:none;cursor:pointer;color:var(--text-muted);font-size:.7rem;font-family:inherit"><i class="fa-solid fa-plus"></i> إضافة اختيار</button>
  </div>`;
  container.appendChild(div);
}

function adminAddOptValue(btn) {
  const container = btn.closest('.optValues');
  const type = container.closest('.option-card').querySelector('.optType').value;
  const div = document.createElement('div');
  div.className = 'opt-value';
  div.innerHTML = `<input type="text" class="optV" placeholder="اختيار">
    <label>+<input type="number" class="optPrice" step="0.01" value="0"></label>
    ${type==='color'?`<input type="color" class="optExtra" value="#000000">`:type==='image'?`<img class="optExtra" src="" onclick="this.nextElementSibling.click()"><input type="file" accept="image/*" style="display:none" onchange="optImgUpload(this)">`:`<input type="hidden" class="optExtra" value="">`}
    <label><i class="fa-solid fa-box"></i><input type="number" class="optStock" value=""></label>
    <button type="button" class="del-opt" onclick="this.closest('.opt-value').remove()"><i class="fa-solid fa-xmark"></i></button>`;
  btn.before(div);
}

function adminResetForm() {
  adminEditingId = null;
  adminLoadForm();
}

function adminLoadSettings() {
  const s = loadAdminSettings();
  const logo = localStorage.getItem('mycart_logo');
  const mode = s.logoDisplayMode || 'both';
  document.getElementById('admin-settings').innerHTML = `
    <div class="admin-section-title">الإعدادات المعروضة</div>
    <div class="admin-settings-grid">
      <div class="admin-card">
        <h4><i class="fa-solid fa-store"></i> معلومات الهيدر والشعار</h4>
        <div class="admin-form-group"><label>اسم المتجر</label><input type="text" id="asName" value="${s.storeName || 'متجري'}"></div>
        <div class="admin-form-group"><label>وصف المتجر (Tagline)</label><input type="text" id="asTagline" value="${s.tagline || 'اختر منتجك المفضل'}"></div>
        <div class="admin-form-group"><label>طريقة عرض الهيدر والشعار</label>
          <select id="asLogoMode" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem">
            <option value="both" ${mode==='both'?'selected':''}>إظهار الشعار + اسم المتجر والوصف</option>
            <option value="logo_only" ${mode==='logo_only'?'selected':''}>إظهار الشعار فقط</option>
            <option value="text_only" ${mode==='text_only'?'selected':''}>إظهار اسم المتجر والوصف فقط (إخفاء الشعار)</option>
            <option value="none" ${mode==='none'?'selected':''}>إخفاء الشعار والاسم والوصف بالكامل</option>
          </select>
        </div>
        <div class="admin-form-group"><label>صورة الشعار</label>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <img class="admin-preview-img" id="asLogo" src="${logo || ''}" style="${logo ? 'display:block;max-width:180px;max-height:60px;width:auto;height:auto;border-radius:10px;object-fit:contain' : 'display:none'}">
            <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminUploadLogo()"><i class="fa-solid fa-upload"></i> تغيير</button>
            <button class="admin-btn admin-btn-danger admin-btn-sm" id="asRemoveLogoBtn" onclick="adminRemoveLogo()" style="${logo ? 'display:inline-block' : 'display:none'}"><i class="fa-solid fa-trash"></i> إزالة</button>
          </div>
        </div>
        <div class="admin-form-group"><label>أيقونة التبويب (Favicon)</label>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <img class="admin-preview-img" id="asFavicon" src="${s.favicon || localStorage.getItem('mycart_favicon') || ''}" style="${(s.favicon || localStorage.getItem('mycart_favicon')) ? 'display:block;max-width:32px;max-height:32px;width:32px;height:32px;border-radius:4px;object-fit:contain' : 'display:none'}">
            <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminUploadFavicon()"><i class="fa-solid fa-upload"></i> تغيير الأيقونة</button>
            <button class="admin-btn admin-btn-danger admin-btn-sm" id="asRemoveFaviconBtn" onclick="adminRemoveFavicon()" style="${(s.favicon || localStorage.getItem('mycart_favicon')) ? 'display:inline-block' : 'display:none'}"><i class="fa-solid fa-trash"></i> إزالة</button>
          </div>
        </div>
      </div>
      <div class="admin-card">
        <h4><i class="fa-solid fa-sliders"></i> إعدادات المتجر العامة</h4>
        <div class="admin-form-group"><label>كود الجملة</label><input type="text" id="asWCode" value="${s.wholesaleCode || 'ADMIN123'}"></div>
        <div class="admin-form-group"><label>العملة</label><input type="text" id="asCurrency" value="${s.currency || '₪'}" maxlength="5"></div>
        <div class="admin-form-group"><label>الموقع</label>
          <select id="asLang" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem">
            <option value="ar" ${(s.lang||'ar')==='ar'?'selected':''}>🇸🇦 العربية</option>
            <option value="en" ${s.lang==='en'?'selected':''}>🇬🇧 English</option>
          </select>
        </div>
        <div class="admin-form-group"><label>اللون الأساسي</label><div style="display:flex;gap:8px;align-items:center"><input type="color" id="asAccent" value="${s.accentColor || '#ef4444'}" oninput="document.getElementById('asAccentVal').textContent=this.value" style="width:44px;height:40px;border:none;border-radius:6px;cursor:pointer;padding:0;background:none"><span style="font-size:.75rem;color:var(--text-muted)" id="asAccentVal">${s.accentColor || '#ef4444'}</span></div></div>
        <div class="admin-form-group"><label>خلفية الهيدر</label>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminUploadBg()"><i class="fa-solid fa-image"></i> تغيير الخلفية</button>
            <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="adminRemoveBg()"><i class="fa-solid fa-trash"></i> إزالة</button>
          </div>
        </div>
      </div>
      <div class="admin-card">
        <h4><i class="fa-solid fa-truck"></i> مناطق التوصيل</h4>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <input type="text" id="asZoneName" placeholder="اسم المنطقة" style="flex:1;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem">
          <input type="number" id="asZonePrice" placeholder="السعر" min="0" step="0.5" style="width:80px;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem">
          <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="adminAddZone()" style="padding:8px 14px;font-size:.8rem"><i class="fa-solid fa-plus"></i></button>
        </div>
        <div id="adminZonesList">${renderAdminZones()}</div>
      </div>
      <div class="admin-card">
        <h4><i class="fa-solid fa-database"></i> البيانات</h4>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="adminExport()"><i class="fa-solid fa-file-export"></i> تصدير</button>
          <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="document.getElementById('adminImportFile').click()"><i class="fa-solid fa-file-import"></i> استيراد</button>
          <button class="admin-btn admin-btn-danger admin-btn-sm" onclick="adminResetAll()"><i class="fa-solid fa-trash"></i> إعادة تعيين</button>
        </div>
        <input type="file" id="adminImportFile" accept=".json" style="display:none" onchange="adminImport(event)">
        <div id="adminDataStatus" style="font-size:.7rem;color:var(--text-muted);margin-top:6px"></div>
      </div>
    </div>
    <button class="admin-btn admin-btn-primary" onclick="adminSaveSettings()" style="margin-top:12px;width:100%"><i class="fa-solid fa-floppy-disk"></i> حفظ كافة الإعدادات والشعار</button>
  `;
}

function adminAddZone() {
  const name = document.getElementById('asZoneName').value.trim();
  const price = parseFloat(document.getElementById('asZonePrice').value);
  if (!name || isNaN(price) || price < 0) { showToast('أدخل اسم المنطقة والسعر', 'error'); return; }
  const zones = loadDeliveryZones();
  zones.push({ name, price });
  saveDeliveryZones(zones);
  document.getElementById('asZoneName').value = '';
  document.getElementById('asZonePrice').value = '';
  adminLoadSettings();
  showToast('✅ تم إضافة منطقة التوصيل', 'success');
}

function adminDeleteZone(idx) {
  const zones = loadDeliveryZones();
  zones.splice(idx, 1);
  saveDeliveryZones(zones);
  adminLoadSettings();
}

async function adminUploadLogo() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, 800, 600, async function(url) {
      showToast('🔄 جاري رفع الشعار...', 'info');
      const imgbbUrl = await uploadToImgbb(url);
      if (!imgbbUrl) return;
      const logoImg = document.getElementById('asLogo');
      const rmBtn = document.getElementById('asRemoveLogoBtn');
      if (logoImg) { logoImg.src = imgbbUrl; logoImg.style.display = 'block'; }
      if (rmBtn) rmBtn.style.display = 'inline-block';
      
      try { localStorage.setItem('mycart_logo', imgbbUrl); } catch(ex) {}
      adminSettings.logo = imgbbUrl;
      try { localStorage.setItem('mycart_admin_settings', JSON.stringify(adminSettings)); } catch(e) {}
      
      showToast('✅ تم تغيير الشعار', 'success');
      init();
    });
  };
  input.click();
}

function adminRemoveLogo() {
  localStorage.removeItem('mycart_logo');
  delete adminSettings.logo;
  try { localStorage.setItem('mycart_admin_settings', JSON.stringify(adminSettings)); } catch(e) {}
  
  const logoImg = document.getElementById('asLogo');
  const rmBtn = document.getElementById('asRemoveLogoBtn');
  if (logoImg) logoImg.style.display = 'none';
  if (rmBtn) rmBtn.style.display = 'none';
  
  showToast('✅ تم إزالة الشعار', 'success');
  init();
}

async function adminUploadBg() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, 1200, 800, async function(url) {
      showToast('🔄 جاري رفع الخلفية...', 'info');
      const imgbbUrl = await uploadToImgbb(url);
      if (!imgbbUrl) return;
      try { localStorage.setItem('mycart_bg', imgbbUrl); } catch(ex) {}
      document.getElementById('header').style.setProperty('--header-bg', `url(${imgbbUrl})`);
      document.getElementById('header').classList.add('has-bg');
      showToast('✅ تم تغيير الخلفية', 'success');
    });
  };
  input.click();
}

function adminRemoveBg() {
  localStorage.removeItem('mycart_bg');
  const header = document.getElementById('header');
  if (header) {
    header.style.removeProperty('--header-bg');
    header.classList.remove('has-bg');
  }
  showToast('✅ تم إزالة الخلفية', 'success');
}

function adminSaveSettings() {
  const nameEl = document.getElementById('asName');
  const tagEl = document.getElementById('asTagline');
  const modeEl = document.getElementById('asLogoMode');
  const wCodeEl = document.getElementById('asWCode');
  const currEl = document.getElementById('asCurrency');
  const accentEl = document.getElementById('asAccent');

  const langEl = document.getElementById('asLang');
  const s = {
    storeName: (nameEl ? nameEl.value.trim() : '') || 'متجري',
    tagline: (tagEl ? tagEl.value.trim() : '') || 'اختر منتجك المفضل',
    logoDisplayMode: modeEl ? modeEl.value : 'both',
    wholesaleCode: (wCodeEl ? wCodeEl.value.trim() : '') || 'ADMIN123',
    currency: (currEl ? currEl.value.trim() : '') || '₪',
    accentColor: accentEl ? accentEl.value : '#ef4444',
    lang: langEl ? langEl.value : 'ar',
    logo: adminSettings.logo,
    favicon: adminSettings.favicon
  };
  try { localStorage.setItem('mycart_admin_settings', JSON.stringify(s)); } catch(e) { showToast('⚠️ مساحة التخزين ممتلئة', 'error'); return; }
  try { localStorage.setItem('mycart_wholesale_code', s.wholesaleCode); } catch(e) {}
  adminSettings = s;
  WHOLESALE_CODE = s.wholesaleCode;
  CURRENCY = s.currency;
  init();
  showToast('✅ تم حفظ الإعدادات والشعار', 'success');
}

function renderAnnounceCard(i,item){const el=document.getElementById('admAnnounceCards');if(!el)return null;const d=document.createElement('div');d.className='ann-card';d.style.cssText='display:flex;gap:8px;align-items:center;margin-bottom:6px';d.innerHTML='<input type="text" class="admAnnounceLine" style="flex:1;min-height:38px;padding:0 10px;border-radius:6px;border:1px solid var(--border);font-size:.8rem;font-family:inherit" placeholder="نص الإعلان"><button type="button" onclick="this.closest(\'.ann-card\').remove()" style="width:32px;height:32px;border:none;border-radius:6px;background:#ef4444;color:#fff;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center">×</button>';if(item!==undefined&&item!==null){const inp=d.querySelector('input');if(inp)inp.value=item;}el.appendChild(d);return d;}
function addAnnounceLine(){const d=renderAnnounceCard(-1);if(!d)return;const inp=d.querySelector('input');if(inp)inp.focus();}
function toggleAnnounceExtras(){const t=document.getElementById('admMktAnnounceType');const e=document.getElementById('admAnnounceExtras');if(!t||!e)return;const sh=t.value!=='static'&&t.value!=='pulse';e.style.display=sh?'inline':'none';if(!sh)return;const d=document.getElementById('admMktAnnounceDir');if(!d)return;const cur=d.value;const lab=document.querySelectorAll('#admAnnounceExtras label')[0];if(t.value==='rotate'){lab.textContent='من:';d.innerHTML='<option value="up">⬆ فوق</option><option value="down">⬇ تحت</option>';if(cur==='up'||cur==='down')d.value=cur;else d.value='up'}else{lab.textContent='اتجاه:';d.innerHTML='<option value="rtl">يمين→يسار</option><option value="ltr">يسار→يمين</option>';if(cur==='rtl'||cur==='ltr')d.value=cur;else d.value='rtl'}}

function adminRenderMarketing(subTab = 'seo') {
  const container = document.getElementById('admin-marketing');
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const currentOrigin = window.location.origin + '/';
  window._fbtProductIds = (data.fbt?.productIds || []).slice();
  
  let html = '';

  if (subTab === 'seo') {
    html = `<div class="admin-settings-grid">
      <div class="admin-card"><h4><i class="fa-solid fa-magnifying-glass"></i> تحسين محركات البحث (SEO)</h4>
        <div class="admin-form-group"><label>عنوان الموقع</label><input type="text" id="admMktSeoTitle" placeholder="متجري - أفضل متجر إلكتروني" value="${data.seo?.title||''}" oninput="updateAdminSeoPreview()"></div>
        <div class="admin-form-group"><label>وصف الموقع</label><textarea id="admMktSeoDesc" rows="2" placeholder="وصف مختصر للموقع يظهر في محركات البحث" oninput="updateAdminSeoPreview()">${data.seo?.description||''}</textarea></div>
        <div class="admin-form-group"><label>كلمات مفتاحية</label><input type="text" id="admMktSeoKeywords" placeholder="متجر, تسوق, منتجات, ..." value="${data.seo?.keywords||''}"></div>
        
        <!-- SEO Preview -->
        <div class="seo-preview-card" style="margin-top: 15px; padding: 14px; border: 1px solid var(--border); border-radius: 12px; background: #f8fafc;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 8px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-eye"></i> مظهر محركات البحث (SEO)
          </div>
          <div id="admMktSeoPreviewUrl" style="font-size: 0.72rem; color: #475569; direction: ltr; text-align: right; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${currentOrigin}</div>
          <div id="admMktSeoPreviewTitle" style="font-size: 1.1rem; color: #1a0dab; font-weight: 500; cursor: pointer; text-decoration: none; margin-bottom: 4px; display: inline-block; word-break: break-word; font-family: sans-serif;">${data.seo?.title || 'متجري - أفضل متجر إلكتروني'}</div>
          <div id="admMktSeoPreviewDesc" style="font-size: 0.82rem; color: #4d5156; line-height: 1.4; word-break: break-word; font-family: sans-serif;">${data.seo?.description || 'وصف مختصر للموقع يظهر في محركات البحث'}</div>
        </div>
      </div>
    </div>`;
  } else if (subTab === 'social') {
    html = `<div class="admin-settings-grid">
      <div class="admin-card"><h4><i class="fa-solid fa-share-nodes"></i> التواصل الاجتماعي</h4>
        <div class="admin-form-group"><label><i class="fa-brands fa-facebook"></i> فيسبوك</label><input type="url" id="admMktSocialFb" placeholder="https://facebook.com/..." value="${data.social?.facebook||''}"></div>
        <div class="admin-form-group"><label><i class="fa-brands fa-instagram"></i> إنستغرام</label><input type="url" id="admMktSocialIg" placeholder="https://instagram.com/..." value="${data.social?.instagram||''}"></div>
        <div class="admin-form-group"><label><i class="fa-brands fa-x-twitter"></i> تويتر / X</label><input type="url" id="admMktSocialX" placeholder="https://twitter.com/..." value="${data.social?.twitter||''}"></div>
        <div class="admin-form-group"><label><i class="fa-brands fa-tiktok"></i> تيك توك</label><input type="url" id="admMktSocialTt" placeholder="https://tiktok.com/..." value="${data.social?.tiktok||''}"></div>
        <div class="admin-form-group"><label><i class="fa-brands fa-whatsapp"></i> واتساب</label><input type="url" id="admMktSocialWa" placeholder="https://wa.me/..." value="${data.social?.whatsapp||''}"></div>
      </div>
      <div class="admin-card"><h4><i class="fa-solid fa-code"></i> أكواد التتبع</h4>
        <div class="admin-form-group"><label>Google Analytics ID</label><input type="text" id="admMktGaId" placeholder="G-XXXXXXXXXX" value="${data.tracking?.gaId||''}"></div>
        <div class="admin-form-group"><label>Facebook Pixel ID</label><input type="text" id="admMktFbPixel" placeholder="1234567890" value="${data.tracking?.fbPixel||''}"></div>
        <div class="admin-form-group"><label>كود الرأس (head)</label><textarea id="admMktHeadScript" rows="3" placeholder="أكواد توضع داخل <head>">${data.tracking?.headerScript||''}</textarea></div>
        <div class="admin-form-group"><label>كود التذييل (قبل إغلاق body)</label><textarea id="admMktFooterScript" rows="3" placeholder="أكواد توضع قبل إغلاق </body>">${data.tracking?.footerScript||''}</textarea></div>
      </div>
      <div class="admin-card"><h4>🔗 أزرار مشاركة المنتجات</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktShareShow" style="width:16px;height:16px" ${data.share?.show ? 'checked' : ''}> تفعيل أزرار مشاركة المنتجات
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">يعرض أزرار لنشر روابط المنتجات عبر فيسبوك، واتساب وتويتر.</p>
      </div>
      <div class="admin-card"><h4>🎁 النافذة الترويجية المنبثقة</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktPromoPopupShow" style="width:16px;height:16px" ${data.promoPopup?.show ? 'checked' : ''}> تفعيل النافذة الترويجية
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">نافذة ترحيبية تظهر للزائر تقدم له كود خصم فوري.</p>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">
          <input type="text" id="admMktPromoPopupTitle" placeholder="عنوان النافذة" value="${data.promoPopup?.title||''}">
          <input type="text" id="admMktPromoPopupText" placeholder="نص وصفي للعرض" value="${data.promoPopup?.text||''}">
          <input type="text" id="admMktPromoPopupCode" placeholder="كود الخصم" value="${data.promoPopup?.code||''}" style="font-weight:800;letter-spacing:1px">
        </div>
      </div>
    </div>`;
  } else if (subTab === 'offers') {
    const offersList = data.offersList || [];
    const prodOpts = (typeof products !== 'undefined' ? products : []).map(p =>
      `<label style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:var(--bg);border-radius:6px;font-size:.75rem;cursor:pointer"><input type="checkbox" class="admOfferProdCb" value="${p.id}" style="width:14px;height:14px"> ${p.name}</label>`
    ).join('');
    html = `<div style="margin-bottom:16px;border:1px solid var(--border);border-radius:12px;padding:16px;background:var(--card-bg)">
      <div style="font-size:.85rem;font-weight:800;margin-bottom:10px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-gem" style="color:#f59e0b"></i> إدارة العروض الخاصة <span style="font-size:.65rem;font-weight:400;color:var(--text-muted)">(${offersList.length} عرض)</span></div>
      ${offersList.length ? `<div style="margin-bottom:12px;display:flex;flex-direction:column;gap:5px">${offersList.map((o,i) => `<div style="display:flex;align-items:center;gap:6px;padding:7px 10px;background:var(--bg);border:1px solid var(--border);border-radius:8px;font-size:.78rem;${!o.active?'opacity:.6':''}">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px"><strong>${o.name}</strong> <span style="font-size:.7rem;font-weight:700;color:#f59e0b;background:#fef3c7;padding:1px 6px;border-radius:4px">${o.type==='percent'?o.value+'%':CURRENCY+o.value}</span> ${!o.active?'<span style="font-size:.65rem;color:#94a3b8">(معطل)</span>':''}</div>
          <div style="font-size:.68rem;color:var(--text-muted)">${o.applyTo==='all'?`جميع المنتجات`:`${(o.productIds||[]).length} منتج`}${o.badge?` • <span style="background:#fef3c7;padding:0 4px;border-radius:3px">${o.badge}</span>`:''}${o.endDate?` • حتى ${o.endDate}`:''}</div>
        </div>
        <button onclick="adminToggleOffer(${i})" style="background:none;border:none;color:${o.active?'#f59e0b':'#94a3b8'};cursor:pointer;font-size:.85rem" title="${o.active?'تعطيل':'تفعيل'}"><i class="fa-solid fa-${o.active?'toggle-on':'toggle-off'}"></i></button>
        <button onclick="adminEditOffer(${i})" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:.8rem" title="تعديل"><i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="adminDeleteOffer(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.8rem" title="حذف"><i class="fa-solid fa-trash-can"></i></button>
      </div>`).join('')}</div>` : `<p style="font-size:.75rem;color:var(--text-muted);margin-bottom:10px">لا توجد عروض مخصصة بعد.</p>`}
      <div id="admOfferFormTitle" style="font-size:.78rem;font-weight:700;margin-bottom:8px;color:var(--text-muted)">إضافة عرض جديد</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
        <input type="text" id="admOfferName" placeholder="اسم العرض" style="flex:1;min-width:140px;padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
        <select id="admOfferType" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem;background:var(--card);color:var(--text)">
          <option value="percent">% نسبة</option>
          <option value="fixed">₪ قيمة</option>
        </select>
        <input type="number" id="admOfferValue" placeholder="القيمة" min="1" style="width:70px;padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
        <select id="admOfferApplyTo" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem;background:var(--card);color:var(--text)" onchange="document.getElementById('admOfferProdPicker').style.display=this.value==='specific'?'block':'none'">
          <option value="all">جميع المنتجات</option>
          <option value="specific">منتجات محددة</option>
        </select>
        <input type="text" id="admOfferBadge" placeholder="الشارة" style="width:110px;padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
        <input type="date" id="admOfferEndDate" style="padding:8px;border:1px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem" title="تاريخ الانتهاء">
        <label style="display:flex;align-items:center;gap:4px;font-size:.78rem;cursor:pointer"><input type="checkbox" id="admOfferActive" checked style="width:15px;height:15px"> نشط</label>
        <button id="admOfferSubmitBtn" onclick="adminAddOffer()" class="admin-btn admin-btn-primary admin-btn-sm"><i class="fa-solid fa-plus"></i> إضافة</button>
        <button id="admOfferCancelBtn" onclick="adminCancelEdit()" style="display:none;background:none;border:1px solid var(--border);border-radius:8px;padding:6px 12px;cursor:pointer;color:var(--text-muted);font-size:.78rem;font-family:inherit"><i class="fa-solid fa-xmark"></i> إلغاء</button>
      </div>
      <div id="admOfferProdPicker" style="display:none;margin-top:8px;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:8px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:.75rem;font-weight:700;color:var(--text-muted)">المنتجات المحددة:</span>
          <button type="button" onclick="adminOpenOfferPicker()" style="padding:5px 12px;background:#f59e0b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.72rem;font-weight:700;font-family:inherit"><i class="fa-solid fa-plus"></i> اختر منتجات</button>
        </div>
        <div id="admOfferSelectedProds" style="display:flex;flex-wrap:wrap;gap:4px;min-height:28px;font-size:.72rem;color:var(--text-muted)">لم يتم اختيار أي منتج بعد</div>
      </div>
      <div style="display:none" id="admOfferProdCbs">${prodOpts || ''}</div>
    </div>
    <div class="admin-settings-grid">
      <div class="admin-card"><h4><i class="fa-solid fa-tag"></i> عروض الكميات التراكمية <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.75rem" onclick="showTooltipExample(this, 'كل ما زادت كمية المنتج في السلة، قل السعر تلقائياً. مثال: 2 حبة = خصم 5%، 3 حبات = خصم 10%. الخصم يحسب تلقائي عند إضافة المنتج.')"></i></h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktVolDiscShow" style="width:16px;height:16px" ${data.volumeDiscount?.show ? 'checked' : ''}> تفعيل عروض الكميات
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">تخفيض تلقائي للعملاء عند إضافة كمية أكبر من نفس المنتج.</p>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:0.75rem;font-weight:700">نوع الخصم:</span>
            <select id="admMktVolDiscType" style="padding:6px;border:1px solid var(--border);border-radius:8px;font-size:0.8rem;background:var(--card);color:var(--text)" onchange="
              const t = this.value;
              document.getElementById('admVolDiscVal').style.display = t==='bogo'?'none':'flex';
              document.getElementById('admVolDiscBogo').style.display = t==='bogo'?'flex':'none';
            ">
              <option value="percent" ${data.volumeDiscount?.type==='percent'?'selected':''}>نسبة مئوية (%)</option>
              <option value="fixed" ${data.volumeDiscount?.type==='fixed'?'selected':''}>قيمة ثابتة (₪)</option>
              <option value="bogo" ${data.volumeDiscount?.type==='bogo'?'selected':''}>اشترِ X واحصل على Y مجاناً</option>
            </select>
            <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.75rem" onclick="showTooltipExample(this, 'نسبة مئوية: خصم % من السعر. قيمة ثابتة: خصم مبلغ محدد. اشترِ X واحصل على Y: مثلاً اشترِ 2 واحصل على 1 مجاناً.')"></i>
          </div>
          <div id="admVolDiscVal" style="display:${data.volumeDiscount?.type==='bogo'?'none':'flex'};gap:8px;align-items:center;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="font-size:0.7rem;color:var(--text-muted)">عند شراء 2:</span>
              <input type="number" id="admMktVolDisc2" min="1" value="${data.volumeDiscount?.disc2||5}" style="width:60px">
              <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.7rem" onclick="showTooltipExample(this, 'الخصم اللي يحصل عليه الزبون عند شراء قطعتين من نفس المنتج.')"></i>
            </div>
            <div style="display:flex;align-items:center;gap:4px">
              <span style="font-size:0.7rem;color:var(--text-muted)">عند شراء 3+:</span>
              <input type="number" id="admMktVolDisc3" min="1" value="${data.volumeDiscount?.disc3||10}" style="width:60px">
              <i class="fa-regular fa-circle-question" style="color:#94a3b8;cursor:help;font-size:.7rem" onclick="showTooltipExample(this, 'الخصم اللي يحصل عليه الزبون عند شراء 3 قطع أو أكثر من نفس المنتج.')"></i>
            </div>
          </div>
          <div id="admVolDiscBogo" style="display:${data.volumeDiscount?.type==='bogo'?'flex':'none'};gap:8px;align-items:center;flex-wrap:wrap">
            <span style="font-size:0.7rem;color:var(--text-muted)">اشترِ:</span>
            <input type="number" id="admMktVolBogoBuy" min="1" value="${data.volumeDiscount?.bogoBuy||2}" style="width:50px">
            <span style="font-size:0.7rem;color:var(--text-muted)">واحصل على:</span>
            <input type="number" id="admMktVolBogoGet" min="1" value="${data.volumeDiscount?.bogoGet||1}" style="width:50px">
            <span style="font-size:0.7rem;color:var(--text-muted)">مجاناً!</span>
          </div>
        </div>
      </div>
      <div class="admin-card"><h4>📦 حزمة "اشترِ معاً ووفر"</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktFbtShow" style="width:16px;height:16px" ${data.fbt?.show ? 'checked' : ''}> 📦 حزمة "اشترِ معاً ووفر" (منتجات مكملة)
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">اختر حتى 4 منتجات لتظهر كحزمة مع كل منتج.</p>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span style="font-size:0.75rem">خصم الحزمة:</span>
          <input type="number" id="admMktFbtDiscount" value="${data.fbt?.discount || 10}" style="width:60px">
          <select id="admMktFbtDiscountType" style="padding:6px;border:1px solid var(--border);border-radius:8px;font-size:0.8rem;background:var(--card);color:var(--text)">
            <option value="percent" ${data.fbt?.discountType==='percent'?'selected':''}>% نسبة مئوية</option>
            <option value="fixed" ${data.fbt?.discountType==='fixed'?'selected':''}>قيمة ثابتة (${CURRENCY})</option>
          </select>
        </div>
        <div style="margin-top:10px">
          <div style="font-size:0.75rem;font-weight:700;margin-bottom:6px">المنتجات المختارة:</div>
          <div id="admMktFbtProducts" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px">${(data.fbt?.productIds||[]).map(id => { const pr = (typeof products !== 'undefined' ? products : []).find(p => p.id === id); return pr ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border:1px solid var(--border);border-radius:6px;font-size:.7rem;background:var(--bg)">${pr.name} <i class="fa-solid fa-xmark" style="cursor:pointer;color:#ef4444" onclick="removeFbtProduct(${id})"></i></span>` : ''; }).join('')}</div>
          <button type="button" class="admin-btn admin-btn-secondary admin-btn-sm" onclick="openFbtProductPicker()"><i class="fa-solid fa-plus"></i> اختيار منتجات</button>
        </div>
      </div>
      <div class="admin-card"><h4>🚚 شريط تقدم الشحن المجاني</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px">
          <input type="checkbox" id="admMktFreeShippingShow" style="width:16px;height:16px" ${data.freeShipping?.show ? 'checked' : ''}> 🚚 تفعيل شريط التقدم للشحن المجاني
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">شريط ملون متحرك في السلة يشجع العميل على زيادة مشترياته للحصول على توصيل مجاني.</p>
        <div style="display:flex;align-items:center;gap:8px;padding-right:24px">
          <span style="font-size:0.75rem;color:var(--text-muted)">الحد الأدنى للشحن المجاني:</span>
          <input type="number" id="admMktFreeShippingGoal" min="0" value="${data.freeShipping?.goal || 300}" style="width:80px">
        </div>
      </div>
      <div class="admin-card" style="grid-column:1/-1"><h4>📱 تحويل الطلبات تلقائياً إلى واتساب</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktWaNotifShow" style="width:16px;height:16px" ${data.waNotif?.show !== false ? 'checked' : ''}> 📱 تحويل العميل للواتساب تلقائياً بعد إتمام الطلب
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">يفتح تطبيق واتساب بالرسالة وتفاصيل الفاتورة فور نقر المشتري على "إتمام الطلب" لتأكيد سريع.</p>
    </div>`;
  } else if (subTab === 'widgets') {
    html = `<div class="admin-settings-grid">
      <div class="admin-card"><h4>📢 شريط الإعلان العلوي</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktAnnounceShow" style="width:16px;height:16px" ${data.announce?.show ? 'checked' : ''}> تفعيل شريط الإعلان العلوي
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">شريط نصي ملون في أعلى شاشة المتجر لجذب الانتباه (مثال: عروض مميزة بمناسبة الأعياد).</p>
        <div style="margin-top: 8px;">
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <label style="font-size:0.75rem">لون الخلفية:</label>
            <input type="color" id="admMktAnnounceBg" value="${data.announce?.bg||'#ef4444'}" style="width:40px;height:30px;border:none;cursor:pointer">
            <label style="font-size:0.75rem;margin-right:10px">لون النص:</label>
            <input type="color" id="admMktAnnounceColor" value="${data.announce?.color||'#ffffff'}" style="width:40px;height:30px;border:none;cursor:pointer">
            <label style="font-size:0.75rem;margin-right:10px">النوع:</label>
            <select id="admMktAnnounceType" onchange="toggleAnnounceExtras()" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:.75rem;font-family:inherit">
              <option value="marquee" ${(data.announce?.animation?.type||'marquee')==='marquee'?'selected':''}>🔄 مستمر (شريط متحرك)</option>
              <option value="slide" ${data.announce?.animation?.type==='slide'?'selected':''}>▶ انزلاق</option>
              <option value="rotate" ${data.announce?.animation?.type==='rotate'?'selected':''}>🔁 تناوب</option>
              <option value="static" ${data.announce?.animation?.type==='static'?'selected':''}>■ ثابت</option>
              <option value="pulse" ${data.announce?.animation?.type==='pulse'?'selected':''}>💓 نبض</option>
            </select>
            <span id="admAnnounceExtras">
              <label style="font-size:0.75rem;margin-right:10px">اتجاه:</label>
              <select id="admMktAnnounceDir" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:.75rem;font-family:inherit">
                <option value="rtl" ${(data.announce?.animation?.direction||'rtl')==='rtl'?'selected':''}>يمين→يسار</option>
                <option value="ltr" ${data.announce?.animation?.direction==='ltr'?'selected':''}>يسار→يمين</option>
              </select>
              <label style="font-size:0.75rem;margin-right:10px">سرعة:</label>
              <select id="admMktAnnounceSpeed" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:.75rem;font-family:inherit">
                <option value="slow" ${(data.announce?.animation?.speed||'medium')==='slow'?'selected':''}>بطيء</option>
                <option value="medium" ${(data.announce?.animation?.speed||'medium')==='medium'?'selected':''}>متوسط</option>
                <option value="fast" ${data.announce?.animation?.speed==='fast'?'selected':''}>سريع</option>
              </select>
            </span>
          </div>
          <div id="admAnnounceCards" style="margin-top:10px">
            <button type="button" onclick="addAnnounceLine()" style="padding:6px 14px;border-radius:6px;border:1px dashed var(--border);background:transparent;cursor:pointer;font-size:.75rem;width:100%">+ إضافة نص</button>
          </div>
        </div>
      </div>
      <div class="admin-card"><h4>🎄 مؤثرات موسمية</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktSeasonalShow" style="width:16px;height:16px" ${data.seasonalEffect?.enabled ? 'checked' : ''}> تفعيل المؤثرات الموسمية
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">إضافة تأثيرات بصرية احتفالية للمتجر (ثلج، رمضان، قلوب، إلخ).</p>
        <div style="margin-top: 8px;">
          <select id="admMktSeasonalType" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:.75rem;font-family:inherit;width:100%">
            <option value="snow" ${data.seasonalEffect?.type==='snow'?'selected':''}>❄️ ثلج</option>
            <option value="ramadan" ${data.seasonalEffect?.type==='ramadan'?'selected':''}>🏮 رمضان</option>
            <option value="confetti" ${data.seasonalEffect?.type==='confetti'?'selected':''}>🎊 أعياد</option>
            <option value="hearts" ${data.seasonalEffect?.type==='hearts'?'selected':''}>❤️ قلوب</option>
            <option value="leaves" ${data.seasonalEffect?.type==='leaves'?'selected':''}>🍂 أوراق</option>
            <option value="chillat" ${data.seasonalEffect?.type==='chillat'?'selected':''}>🎵 تشيلات</option>
            <option value="valentine" ${data.seasonalEffect?.type==='valentine'?'selected':''}>💖 عيد الحب</option>
            <option value="graduation" ${data.seasonalEffect?.type==='graduation'?'selected':''}>🎓 تخرج</option>
            <option value="eid" ${data.seasonalEffect?.type==='eid'?'selected':''}>🐏 عيد الأضحى</option>
            <option value="christmas" ${data.seasonalEffect?.type==='christmas'?'selected':''}>🎄 عيد الميلاد</option>
            <option value="newyear" ${data.seasonalEffect?.type==='newyear'?'selected':''}>🎆 رأس السنة</option>
            <option value="halloween" ${data.seasonalEffect?.type==='halloween'?'selected':''}>🎃 هالوين</option>
          </select>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px">
          <label style="font-size:.75rem">اتجاه:</label>
          <select id="admMktSeasonalDir" style="padding:3px 6px;border-radius:6px;border:1px solid var(--border);font-size:.75rem;font-family:inherit">
            <option value="top" ${(data.seasonalEffect?.direction||'top')==='top'?'selected':''}>من الأعلى</option>
            <option value="bottom" ${data.seasonalEffect?.direction==='bottom'?'selected':''}>من الأسفل</option>
            <option value="left" ${data.seasonalEffect?.direction==='left'?'selected':''}>من اليسار</option>
            <option value="right" ${data.seasonalEffect?.direction==='right'?'selected':''}>من اليمين</option>
          </select>
          <label style="font-size:.75rem">الكمية:</label>
          <input type="range" id="admMktSeasonalQty" min="10" max="100" value="${data.seasonalEffect?.quantity||35}" style="width:70px;height:4px" oninput="document.getElementById('admMktSeasonalQtyVal').textContent=this.value">
          <span id="admMktSeasonalQtyVal" style="font-size:.75rem;min-width:20px">${data.seasonalEffect?.quantity||35}</span>
          <label style="font-size:.75rem">حجم:</label>
          <select id="admMktSeasonalSize" style="padding:3px 6px;border-radius:6px;border:1px solid var(--border);font-size:.75rem;font-family:inherit">
            <option value="small" ${data.seasonalEffect?.size==='small'?'selected':''}>صغير</option>
            <option value="medium" ${(data.seasonalEffect?.size||'medium')==='medium'?'selected':''}>متوسط</option>
            <option value="large" ${data.seasonalEffect?.size==='large'?'selected':''}>كبير</option>
          </select>
          <label style="font-size:.75rem">سرعة:</label>
          <select id="admMktSeasonalSpeed" style="padding:3px 6px;border-radius:6px;border:1px solid var(--border);font-size:.75rem;font-family:inherit">
            <option value="slow" ${data.seasonalEffect?.speed==='slow'?'selected':''}>بطيء</option>
            <option value="medium" ${(data.seasonalEffect?.speed||'medium')==='medium'?'selected':''}>متوسط</option>
            <option value="fast" ${data.seasonalEffect?.speed==='fast'?'selected':''}>سريع</option>
          </select>
        </div>
      </div>
      <div class="admin-card"><h4>💎 قسم العروض الخاصة في الصفحة الرئيسية</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktOffersSectionShow" style="width:16px;height:16px" ${data.offersSection?.show !== false ? 'checked' : ''}> 💎 تفعيل قسم "العروض الخاصة" في الصفحة الرئيسية
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">يعرض المنتجات اللي عليها عروض مخصصة في قسم منفصل تحت البانر.</p>
      </div>
      <div class="admin-card"><h4>⏳ عداد العرض التنازلي للمنتجات</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktCountdownShow" style="width:16px;height:16px" ${data.countdown?.show ? 'checked' : ''}> تفعيل عداد العرض التنازلي للمنتجات
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 8px">عداد تنازلي وهمي يظهر داخل تفاصيل المنتج لخلق شعور بالاستعجال للشراء.</p>
        <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 0.75rem;">مدة العداد (بالدقائق):</span>
          <input type="number" id="admMktCountdownDuration" min="1" max="1440" value="${data.countdown?.duration||180}" style="width:80px">
        </div>
      </div>
      <div class="admin-card"><h4>🔥 عداد المشاهدين الحيّ في صفحة المنتج</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktLiveViewersShow" style="width:16px;height:16px" ${data.liveViewers?.show ? 'checked' : ''}> 🔥 عداد المشاهدين الحيّ في صفحة المنتج
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">يعرض نصاً مثل "يشاهد هذا المنتج 13 شخصاً الآن!" ويتغير تلقائياً.</p>
      </div>
      <div class="admin-card"><h4>💬 صندوق دعم واتساب العائم</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktWaChatShow" style="width:16px;height:16px" ${data.waChat?.show ? 'checked' : ''}> 💬 صندوق دعم واتساب العائم
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 6px">زر أخضر ثابت في أسفل الشاشة يأخذ العميل لواتساب مباشرة.</p>
        <input type="text" id="admMktWaChatGreeting" placeholder="نص الترحيب" value="${data.waChat?.greeting || ''}">
      </div>
      <div class="admin-card"><h4>🛍 إشعارات الشراء الحديثة</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktSocialProofShow" style="width:16px;height:16px" ${data.socialProof?.show ? 'checked' : ''}> 🛍 تفعيل إشعارات الشراء الحديثة
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">نافذة تنبيه صغيرة أسفل الشاشة تُحاكي عمليات شراء حية لبناء المصداقية.</p>
      </div>
      <div class="admin-card"><h4>💬 زر الشراء السريع عبر واتساب</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktWaCheckoutShow" style="width:16px;height:16px" ${data.waCheckout?.show ? 'checked' : ''}> تفعيل زر الطلب المباشر عبر واتساب
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">يضيف زراً أخضر واضحاً في صفحة المنتج للشراء عبر واتساب فوراً.</p>
      </div>
    </div>`;
  } else if (subTab === 'reviews') {
    html = `<div class="admin-settings-grid">
      <div class="admin-card"><h4>💬 تقييمات المنتج بالنجوم</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="admMktReviewsShow" style="width:16px;height:16px" ${data.reviews?.show ? 'checked' : ''}> 💬 تفعيل تقييمات العملاء في صفحة المنتج
        </label>
        <p style="font-size:0.7rem;color:var(--text-muted);margin:4px 0 0">يسمح للمشترين بكتابة تقييمات بالنجوم والتعليقات على المنتجات.</p>
      </div>
    </div>`;
  } else if (subTab === 'pagebuilder') {
    html = adminRenderPageBuilder(data);
  } else if (subTab === 'popup') {
    const pp = data.promoPopup || {};
    const ptype = pp.type || 'discount';
    html = `<div class="admin-settings-grid">
      <div class="admin-card" style="grid-column:1/-1"><h4><i class="fa-solid fa-window-restore"></i> النافذة الترويجية المنبثقة</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:8px">
          <input type="checkbox" id="admMktPromoPopupShow" style="width:16px;height:16px" ${pp.show ? 'checked' : ''}> تفعيل النافذة الترويجية عند فتح المتجر
        </label>
      </div>
      <!-- Type -->
      <div class="admin-card" style="grid-column:1/-1"><h4><i class="fa-solid fa-shapes"></i> نوع النافذة</h4>
        <select id="admMktPpType" onchange="adminPpToggleType()" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem;background:var(--card);color:var(--text);margin-top:6px">
          <option value="discount" ${ptype==='discount'?'selected':''}>🎫 خصم (كود + نسبة)</option>
          <option value="announcement" ${ptype==='announcement'?'selected':''}>📢 إعلان (رسالة + زر)</option>
          <option value="newsletter" ${ptype==='newsletter'?'selected':''}>📧 اشتراك بريد إلكتروني</option>
          <option value="sale" ${ptype==='sale'?'selected':''}>🔥 تخفيضات (مؤقت + نسبة)</option>
          <option value="newarrival" ${ptype==='newarrival'?'selected':''}>🆕 وصل حديثاً</option>
          <option value="halfprice" ${ptype==='halfprice'?'selected':''}>💰 نصف السعر</option>
          <option value="custom" ${ptype==='custom'?'selected':''}>✨ مخصص (كامل التحكم)</option>
        </select>
      </div>
      <!-- Content -->
      <div class="admin-card"><h4><i class="fa-solid fa-pen"></i> المحتوى</h4>
        <div class="admin-form-group"><label>العنوان</label><input type="text" id="admMktPpTitle" placeholder="عرض خاص لفترة محدودة!" value="${pp.title||''}"></div>
        <div class="admin-form-group"><label>النص</label><textarea id="admMktPpText" rows="2" placeholder="نص النافذة">${pp.text||''}</textarea></div>
        <div class="admin-form-group" id="admPpCodeGroup"><label>كود الخصم</label><div style="display:flex;gap:4px"><input type="text" id="admMktPpCode" placeholder="SPECIAL10" value="${pp.code||''}" style="flex:1;text-transform:uppercase"><button type="button" onclick="document.getElementById('admMktPpCode').value='LUCKY'+Math.random().toString(36).slice(2,6).toUpperCase()" title="توليد" style="padding:6px 10px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer">⚡</button></div></div>
        <div class="admin-form-group" id="admPpPercentGroup"><label>نسبة الخصم %</label><input type="number" id="admMktPpPercent" min="1" max="99" value="${pp.discountPercent||''}" placeholder="10"></div>
      </div>
      <!-- Media & Button -->
      <div class="admin-card"><h4><i class="fa-solid fa-image"></i> الوسائط والزر</h4>
        <div class="admin-form-group"><label>صورة النافذة</label><div style="display:flex;gap:6px;flex-wrap:wrap"><input type="text" id="admMktPpImage" placeholder="رابط الصورة" value="${pp.image||''}" style="flex:1;min-width:140px" oninput="adminPpPreviewImage(this.value)"><button type="button" onclick="adminPpUploadImage()" title="رفع صورة" style="padding:6px 12px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:.78rem;white-space:nowrap"><i class="fa-solid fa-upload"></i> رفع</button><input type="file" id="admPpFileInput" accept="image/*" style="display:none" onchange="adminPpHandleImageUpload(this)"></div>
          <div id="admPpImagePreview" style="margin-top:6px;${pp.image?'':'display:none'}">${pp.image ? '<img src="'+pp.image+'" style="max-height:80px;border-radius:8px;border:1px solid var(--border)">' : ''}</div></div>
        <div class="admin-form-group" id="admPpBtnTextGroup"><label>نص الزر</label><input type="text" id="admMktPpBtnText" placeholder="تسوق الآن 🛍️" value="${pp.btnText||''}"></div>
        <div class="admin-form-group" id="admPpBtnLinkGroup"><label>رابط الزر</label><input type="text" id="admMktPpBtnLink" placeholder="#offers" value="${pp.btnLink||''}"></div>
      </div>
      <!-- Design -->
      <div class="admin-card"><h4><i class="fa-solid fa-palette"></i> التصميم</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="admin-form-group"><label>خلفية النافذة</label><input type="color" id="admMktPpBg" value="${pp.bgColor||'#ffffff'}"></div>
          <div class="admin-form-group"><label>لون النص</label><input type="color" id="admMktPpTextColor" value="${pp.textColor||'#0f172a'}"></div>
          <div class="admin-form-group"><label>لون التأكيد</label><input type="color" id="admMktPpAccent" value="${pp.accentColor||pp.color||'#ef4444'}"></div>
          <div class="admin-form-group"><label>خلفية الزر</label><input type="color" id="admMktPpBtnBg" value="${pp.btnBg||'#ef4444'}"></div>
          <div class="admin-form-group"><label>لون نص الزر</label><input type="color" id="admMktPpBtnColor" value="${pp.btnColor||'#ffffff'}"></div>
        </div>
      </div>
      <!-- Behaviour -->
      <div class="admin-card"><h4><i class="fa-solid fa-gear"></i> السلوك</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div class="admin-form-group"><label>تأخير الظهور (ثوانٍ)</label><input type="number" id="admMktPpDelay" min="0" value="${pp.delay||3}" style="width:80px"></div>
          <div class="admin-form-group"><label>حجم النافذة</label><select id="admMktPpSize" style="padding:6px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
            <option value="small" ${(pp.size||'medium')==='small'?'selected':''}>صغير</option>
            <option value="medium" ${(pp.size||'medium')==='medium'?'selected':''}>وسط</option>
            <option value="large" ${pp.size==='large'?'selected':''}>كبير</option>
            <option value="fullscreen" ${pp.size==='fullscreen'?'selected':''}>ملء الشاشة</option>
          </select></div>
          <div class="admin-form-group"><label>الموضع</label><select id="admMktPpPos" style="padding:6px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
            <option value="center" ${(pp.position||'center')==='center'?'selected':''}>وسط</option>
            <option value="top" ${pp.position==='top'?'selected':''}>أعلى</option>
            <option value="bottom" ${pp.position==='bottom'?'selected':''}>أسفل</option>
          </select></div>
          <div class="admin-form-group"><label>حركة الظهور</label><select id="admMktPpAnim" style="padding:6px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
            <option value="bounce" ${(pp.animation||'bounce')==='bounce'?'selected':''}>ارتداد</option>
            <option value="fade" ${pp.animation==='fade'?'selected':''}>تلاشي</option>
            <option value="slide" ${pp.animation==='slide'?'selected':''}>انزلاق</option>
            <option value="zoom" ${pp.animation==='zoom'?'selected':''}>تكبير</option>
          </select></div>
          <div class="admin-form-group" id="admPpExpiryGroup"><label>تاريخ انتهاء الكود</label><input type="datetime-local" id="admMktPpExpires" value="${pp.expiresAt ? new Date(pp.expiresAt).toISOString().slice(0,16) : ''}"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
            <label style="display:flex;align-items:center;gap:4px;font-size:.72rem;cursor:pointer"><input type="checkbox" id="admMktPpShowClose" style="width:14px;height:14px" ${pp.showClose!==false?'checked':''}> زر إغلاق</label>
            <label style="display:flex;align-items:center;gap:4px;font-size:.72rem;cursor:pointer"><input type="checkbox" id="admMktPpCloseOutside" style="width:14px;height:14px" ${pp.closeOutside!==false?'checked':''}> إغلاق خارجياً</label>
          </div>
        </div>
      </div>
      <!-- Custom extras (show only for custom type) -->
      <div class="admin-card" id="admPpCustomExtras" style="grid-column:1/-1;display:${ptype==='custom'?'block':'none'}"><h4><i class="fa-solid fa-code"></i> خيارات مخصصة</h4>
        <div class="admin-form-group"><label>أيقونة مخصصة (اسم كلاس Font Awesome)</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="text" id="admMktPpCustomIcon" placeholder="مثال: fa-star, fa-heart" value="${pp.customIcon||''}" style="flex:1;font-family:monospace;direction:ltr" oninput="document.getElementById('admPpCustomIconPreview').className='fa-solid '+this.value||'fa-gift'">
            <i id="admPpCustomIconPreview" class="fa-solid ${pp.customIcon||'fa-gift'}" style="font-size:1.4rem;color:${pp.accentColor||'#ef4444'}"></i>
          </div>
          <div style="font-size:.65rem;color:var(--text-muted);margin-top:2px">أمثلة: fa-star, fa-heart, fa-truck, fa-rocket, fa-crown, fa-bolt, fa-fire</div>
        </div>
        <div class="admin-form-group"><label>HTML مخصص (يلغي المحتوى الافتراضي)</label><textarea id="admMktPpCustomHtml" rows="4" placeholder="اكتب HTML مخصص للنافذة..." style="font-family:monospace;direction:ltr;font-size:.78rem">${pp.customHtml||''}</textarea>
          <div style="font-size:.65rem;color:var(--text-muted);margin-top:2px">اكتب HTML وسيظهر بالكامل داخل النافذة. العنوان والنص والصورة والرمز والكود والزر كلها تخفى.</div>
        </div>
      </div>
      <!-- Preview -->
      <div class="admin-card" style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center"><h4><i class="fa-solid fa-eye"></i> معاينة سريعة</h4>
        <div id="adminPpPreview" style="margin-top:10px;width:100%;max-width:320px;border-radius:16px;padding:20px;text-align:center;background:#fff;color:#0f172a;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,.08)">
          ${pp.customHtml ? '<div style="font-size:.78rem;color:#64748b;padding:10px;background:#f8fafc;border-radius:8px;border:1px dashed #cbd5e1"><i class="fa-solid fa-code"></i> HTML مخصص — استخدم المعاينة الحية</div>' : `
          <div style="font-size:2rem;margin-bottom:8px"><i class="fa-solid ${pp.customIcon||(ptype==='discount'?'fa-tag':ptype==='announcement'?'fa-bullhorn':ptype==='newsletter'?'fa-envelope-open-text':ptype==='sale'?'fa-fire':ptype==='newarrival'?'fa-gem':ptype==='halfprice'?'fa-bolt':'fa-gift')}" style="color:${pp.accentColor||'#ef4444'}"></i></div>
          <h5 id="adminPpPrevTitle" style="font-size:1rem;font-weight:800;margin-bottom:4px">${pp.title||'العنوان'}</h5>
          <p id="adminPpPrevText" style="font-size:.75rem;color:#64748b;margin-bottom:10px;${pp.text?'':'display:none'}">${pp.text||''}</p>
          <div id="adminPpPrevBadge" style="font-size:2rem;font-weight:900;color:#ef4444;margin-bottom:8px;${(ptype==='discount'||ptype==='sale'||ptype==='halfprice')&&pp.discountPercent?'':'display:none'}">-${pp.discountPercent||''}%</div>
          <div id="adminPpPrevCode" style="background:#fef2f2;border:2px dashed #ef4444;padding:8px 12px;border-radius:8px;font-weight:800;letter-spacing:1px;margin-bottom:8px;font-size:1rem;${pp.code?'':'display:none'}">${pp.code||''}</div>
          <button id="adminPpPrevBtn" style="background:#ef4444;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-weight:700;font-size:.8rem;margin-top:6px;${pp.btnText&&pp.btnLink?'':'display:none'}">${pp.btnText||''}</button>
          `}
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">
      <button class="admin-btn admin-btn-primary" onclick="adminSaveMarketing('popup')"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>
      <button class="admin-btn admin-btn-secondary" onclick="adminPpTestPreview()"><i class="fa-solid fa-play"></i> معاينة حية</button>
    </div>`;
  }

container.innerHTML = html + `
   <button class="admin-btn admin-btn-primary" onclick="adminSaveMarketing('${subTab}')" style="margin-top:16px"><i class="fa-solid fa-floppy-disk"></i> حفظ التسويق</button>`;

  if (subTab === 'widgets') { toggleAnnounceExtras(); adminInitSectionToggles(); const el=document.getElementById('admAnnounceCards');if(el){const _al=(data.announce?.text||'').split('\n').map(t=>t.trim()).filter(t=>t);_al.forEach((t,i)=>{renderAnnounceCard(i,t);});} }
  if (subTab === 'pagebuilder') { adminInitPageBuilder(); }
  if (subTab === 'reviews') {
    admRenderSpinSegmentsList(data.spinWin?.segments || []);
  }
}

function adminSaveBannerSettings() {
  const settings = {
    layout: document.getElementById('admBannerLayout')?.value || 'slider',
    sliderStyle: document.getElementById('admSliderStyle')?.value || 'default',
    sliderEffect: document.getElementById('admSliderEffect')?.value || 'slide',
    sliderStyle: document.getElementById('admSliderStyle')?.value || 'default',
    sliderEffect: document.getElementById('admSliderEffect')?.value || 'slide',
    autoplay: document.getElementById('admBannerAutoplay')?.checked ?? true,
    interval: parseInt(document.getElementById('admBannerInterval')?.value || 4000),
    aspectRatio: document.getElementById('admBannerAspectRatio')?.value || '2/1',
    borderRadius: document.getElementById('admBannerBorderRadius')?.value || '14px'
  };
  localStorage.setItem('mycart_banner_settings', JSON.stringify(settings));
  if (typeof startBannerAutoScroll === 'function') {
    startBannerAutoScroll();
  }
}

function adminRenderBanners() {
  const container = document.getElementById('admin-banners');
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const bSettings = typeof loadBannerSettings === 'function' ? loadBannerSettings() : (data.bannerSettings || { autoplay: true, interval: 4000, aspectRatio: '2/1', borderRadius: '14px' });
  const banners = data.banners || [];
  
  container.innerHTML = `
    <!-- Top Card: General Settings -->
    <div class="admin-card" style="margin-bottom:20px">
      <h4><i class="fa-solid fa-gears"></i> إعدادات السلايدر العام</h4>
      <div style="display:flex;flex-direction:column;gap:8px">
        <label style="display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:700;cursor:pointer">
          <input type="checkbox" id="admBannerAutoplay" ${bSettings.autoplay !== false ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--accent)">
          تشغيل تلقائي (Auto-Play)
        </label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <div style="flex:1;min-width:130px">
            <label style="font-size:.7rem;font-weight:700">تخطيط العرض:</label>
            <select id="admBannerLayout" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="slider" ${bSettings.layout === 'slider' || !bSettings.layout ? 'selected' : ''}>سلايدر متحرك</option>
              <option value="grid" ${bSettings.layout === 'grid' ? 'selected' : ''}>شبكة صور</option>
              <option value="stack" ${bSettings.layout === 'stack' ? 'selected' : ''}>قائمة عمودية</option>
              <option value="hero" ${bSettings.layout === 'hero' ? 'selected' : ''}>صورة رئيسية</option>
              <option value="peek" ${bSettings.layout === 'peek' ? 'selected' : ''}>سلايدر متداخل</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px">
            <label style="font-size:.7rem;font-weight:700">نمط العرض:</label>
            <select id="admSliderStyle" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="default" ${bSettings.sliderStyle === 'default' || !bSettings.sliderStyle ? 'selected' : ''}>كلاسيكي</option>
              <option value="glass" ${bSettings.sliderStyle === 'glass' ? 'selected' : ''}>تأثير زجاجي</option>
              <option value="split" ${bSettings.sliderStyle === 'split' ? 'selected' : ''}>تقسيم جانبي</option>
              <option value="minimal" ${bSettings.sliderStyle === 'minimal' ? 'selected' : ''}>بسيط ومسطح</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px">
            <label style="font-size:.7rem;font-weight:700">حركة الانتقال:</label>
            <select id="admSliderEffect" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="slide" ${bSettings.sliderEffect === 'slide' || !bSettings.sliderEffect ? 'selected' : ''}>انزلاق</option>
              <option value="fade" ${bSettings.sliderEffect === 'fade' ? 'selected' : ''}>تلاشي</option>
              <option value="zoom" ${bSettings.sliderEffect === 'zoom' ? 'selected' : ''}>تقريب زووم</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px">
            <label style="font-size:.7rem;font-weight:700">السرعة:</label>
            <select id="admBannerInterval" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="3000" ${bSettings.interval == 3000 ? 'selected' : ''}>3 ثوانٍ</option>
              <option value="4000" ${bSettings.interval == 4000 || !bSettings.interval ? 'selected' : ''}>4 ثوانٍ</option>
              <option value="5000" ${bSettings.interval == 5000 ? 'selected' : ''}>5 ثوانٍ</option>
              <option value="7000" ${bSettings.interval == 7000 ? 'selected' : ''}>7 ثوانٍ</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px">
            <label style="font-size:.7rem;font-weight:700">نسبة الأبعاد:</label>
<select id="admBannerAspectRatio" onchange="updateAdminBannerSizeHints(this.value)" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="3/1" ${bSettings.aspectRatio === '3/1' ? 'selected' : ''}>عريض للغاية (3 : 1)</option>
              <option value="2.5/1" ${bSettings.aspectRatio === '2.5/1' ? 'selected' : ''}>عريض جداً (2.5 : 1)</option>
              <option value="2/1" ${bSettings.aspectRatio === '2/1' || !bSettings.aspectRatio ? 'selected' : ''}>متوسط (2 : 1)</option>
              <option value="16/9" ${bSettings.aspectRatio === '16/9' ? 'selected' : ''}>شاشة عريضة (16 : 9)</option>
              <option value="3/2" ${bSettings.aspectRatio === '3/2' ? 'selected' : ''}>كلاسيكي (3 : 2)</option>
              <option value="4/3" ${bSettings.aspectRatio === '4/3' ? 'selected' : ''}>تقليدي (4 : 3)</option>
              <option value="1/1" ${bSettings.aspectRatio === '1/1' ? 'selected' : ''}>مربع متساوي (1 : 1)</option>
            </select>
          </div>
          <div style="flex:1;min-width:130px">
            <label style="font-size:.7rem;font-weight:700">انحناء الحواف:</label>
            <select id="admBannerBorderRadius" style="width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:.75rem;background:var(--card);color:var(--text);font-family:inherit">
              <option value="14px" ${bSettings.borderRadius === '14px' || !bSettings.borderRadius ? 'selected' : ''}>دائري خفيف (14px)</option>
              <option value="0px" ${bSettings.borderRadius === '0px' ? 'selected' : ''}>حواف حادة (0px)</option>
              <option value="24px" ${bSettings.borderRadius === '24px' ? 'selected' : ''}>دائري كامل (24px)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom Card: Banners List (Spans full width) -->
    <div class="admin-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:15px;flex-wrap:wrap;gap:8px">
        <h4 style="margin:0"><i class="fa-solid fa-list"></i> قائمة البانرات الإعلانية</h4>
        <span style="font-size:0.75rem;font-weight:800;background:var(--accent);color:#fff;padding:4px 10px;border-radius:20px">عدد البانرات المضافة: ${banners.length}</span>
      </div>
      <div id="admBannersList" style="margin-bottom:15px">${adminRenderBannersList(banners)}</div>
      <div style="display:flex;gap:8px">
        <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="adminAddBanner()"><i class="fa-solid fa-plus"></i> إضافة بانر جديد</button>
        <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="adminSaveBanners()"><i class="fa-solid fa-floppy-disk"></i> حفظ كافة البانرات</button>
      </div>
    </div>`;
}

function adminSaveBanners() {
  const currentData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  currentData.banners = adminGetBanners();
  currentData.bannerSettings = {
    layout: document.getElementById('admBannerLayout')?.value || 'slider',
    sliderStyle: document.getElementById('admSliderStyle')?.value || 'default',
    sliderEffect: document.getElementById('admSliderEffect')?.value || 'slide',
    sliderStyle: document.getElementById('admSliderStyle')?.value || 'default',
    sliderEffect: document.getElementById('admSliderEffect')?.value || 'slide',
    autoplay: document.getElementById('admBannerAutoplay')?.checked ?? true,
    interval: parseInt(document.getElementById('admBannerInterval')?.value || 4000),
    aspectRatio: document.getElementById('admBannerAspectRatio')?.value || '2/1',
    borderRadius: document.getElementById('admBannerBorderRadius')?.value || '14px'
  };
  try { localStorage.setItem('mycart_marketing', JSON.stringify(currentData)); } catch(e) {}
  showToast('✅ تم حفظ البانرات', 'success');
}

function adminRenderBannersList(banners) {
  if (!banners || !banners.length) return '<p style="color:var(--text-muted);font-size:.85rem;text-align:center;padding:20px;background:#f8fafc;border-radius:10px;border:1px dashed var(--border)">لا توجد بانرات إعلانية مضافة بعد.</p>';
  const total = banners.length;
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const bSettings = data.bannerSettings || {};
  return banners.map((b, i) => {
    const hasImg = !!b.image;
    const isActive = b.active !== false;
    return `
    <div class="banner-card" data-idx="${i}" style="border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;background:#fff;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.02);opacity:${isActive?'1':'0.75'}">
      <!-- Row Header -->
      <div style="display:flex;align-items:center;padding:12px 16px;gap:12px;flex-wrap:wrap">
        <!-- Reorder Handles -->
        <div style="display:flex;flex-direction:column;gap:2px">
          <button type="button" onclick="adminMoveBanner(${i},-1)" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:0.75rem;padding:2px;${i===0?'opacity:.2;pointer-events:none':''}" title="تحريك لأعلى"><i class="fa-solid fa-chevron-up"></i></button>
          <button type="button" onclick="adminMoveBanner(${i},1)" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:0.75rem;padding:2px;${i===total-1?'opacity:.2;pointer-events:none':''}" title="تحريك لأسفل"><i class="fa-solid fa-chevron-down"></i></button>
        </div>
        
        <!-- Thumbnail -->
        <div style="width:64px;height:40px;border-radius:6px;overflow:hidden;border:1px solid #f1f5f9;background:#f8fafc;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <img src="${b.image||''}" style="width:100%;height:100%;object-fit:cover;${hasImg?'':'opacity:0.2'}">
        </div>
        
        <!-- Title & Info -->
        <div style="flex:1;min-width:150px">
          <div style="font-weight:700;font-size:0.85rem;color:#1e293b">${b.title || '<span style="color:#94a3b8;font-weight:400;font-style:italic">بدون عنوان</span>'}</div>
          ${b.link ? `<div style="font-size:0.7rem;color:#64748b;margin-top:2px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.link}</div>` : ''}
        </div>
        
        <!-- Status Badge -->
        <span style="font-size:0.7rem;font-weight:700;padding:4px 8px;border-radius:6px;background:${isActive?'#dcfce7':'#f1f5f9'};color:${isActive?'#15803d':'#475569'}">
          ${isActive?'نشط':'معطل'}
        </span>
        
        <!-- Actions -->
        <div style="display:flex;gap:6px">
          <button type="button" onclick="adminToggleEditBanner(${i})" style="background:#f1f5f9;border:none;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--accent)" title="تعديل"><i class="fa-solid fa-pen"></i></button>
          <button type="button" onclick="adminDeleteBanner(${i})" style="background:#fef2f2;border:none;border-radius:8px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#ef4444" title="حذف"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>
      
      <!-- Collapsible Edit Form -->
      <div class="banner-edit" style="display:none;padding:16px;background:#f8fafc;border-top:1px solid #f1f5f9">
        <div style="display:grid;grid-template-columns:1fr;gap:12px">
          <!-- Title Input -->
          <div>
            <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">عنوان البانر</label>
            <input type="text" class="banner-title-input" placeholder="اكتب عنواناً للبانر..." value="${(b.title||'').replace(/"/g,'&quot;')}" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:.78rem;box-sizing:border-box;background:#fff">
          </div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
            <!-- Button Text -->
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">نص الزر</label>
              <input type="text" class="banner-btn-input" placeholder="مثال: تسوق الآن" value="${(b.btnText||'').replace(/"/g,'&quot;')}" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:.78rem;box-sizing:border-box;background:#fff">
            </div>
            <!-- Product Selector Dropdown -->
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">ربط بمنتج سريع</label>
              <select onchange="this.parentElement.parentElement.querySelector('.banner-link-input').value = this.value" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:.78rem;box-sizing:border-box;background:#fff;height:35px">
                <option value="">-- اختر منتجاً --</option>
                ${(typeof products !== 'undefined' ? products : []).map(p => `<option value="javascript:openDetail(${p.id})" ${b.link === `javascript:openDetail(${p.id})` ? 'selected' : ''}>${p.name}</option>`).join('')}
              </select>
            </div>
            <!-- Destination Link -->
            <div>
              <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">رابط التوجيه</label>
              <input type="text" class="banner-link-input" placeholder="الرابط عند الضغط" value="${(b.link||'').replace(/"/g,'&quot;')}" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:.78rem;box-sizing:border-box;background:#fff">
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:0.72rem;font-weight:700;cursor:pointer;color:#475569">
              <input type="checkbox" class="banner-show-minicard-input" ${b.showMiniCard ? 'checked' : ''} style="width:15px;height:15px;accent-color:var(--accent);cursor:pointer;margin:0">
              <span>عرض بطاقة منبثقة مصغرة للمنتج المربوط على البانر أمام العملاء</span>
            </label>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:4px">
            <div style="flex:1;min-width:140px">
              <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">نص الشارة/العلم (مثال: جديد، عرض خاص)</label>
              <input type="text" class="banner-badge-text-input" placeholder="اتركه فارغاً لإخفاء الشارة" value="${(b.badgeText||'').replace(/"/g,'&quot;')}" style="width:100%;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:.78rem;box-sizing:border-box;background:#fff">
            </div>
            <div style="flex:1;min-width:120px">
              <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">حركة الشارة</label>
              <select class="banner-badge-anim-input" style="width:100%;padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;font-family:inherit;font-size:.78rem;box-sizing:border-box;background:#fff;height:32px">
                <option value="pulse" ${b.badgeAnim==='pulse'?'selected':''}>نبض (تكبير وتصغير)</option>
                <option value="glow" ${b.badgeAnim==='glow'?'selected':''}>وهج (إضاءة خلفية)</option>
                <option value="float" ${b.badgeAnim==='float'?'selected':''}>عائم (حركة رأسية)</option>
                <option value="none" ${b.badgeAnim==='none'?'selected':''}>بدون حركة</option>
              </select>
            </div>
            <div style="width:70px">
              <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">لون الشارة</label>
              <input type="color" class="banner-badge-color-input" value="${b.badgeColor || '#ef4444'}" style="width:100%;height:32px;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;padding:0;background:none">
            </div>
          </div>
          
          <!-- Image Upload & Preview Box -->
          <div>
            <label style="display:block;font-size:0.75rem;font-weight:700;margin-bottom:4px;color:#475569">صورة البانر <span class="banner-size-hint" style="font-size:0.65rem;color:#e11d48;font-weight:600;margin-right:6px">(المقاس الموصى به: ${bSettings.aspectRatio === '3/1' ? '1200 × 400 بكسل - نسبة 3:1' : bSettings.aspectRatio === '2.5/1' ? '1200 × 480 بكسل - نسبة 2.5:1' : bSettings.aspectRatio === '16/9' ? '1200 × 675 بكسل - نسبة 16:9' : bSettings.aspectRatio === '3/2' ? '1200 × 800 بكسل - نسبة 3:2' : bSettings.aspectRatio === '4/3' ? '1200 × 900 بكسل - نسبة 4:3' : bSettings.aspectRatio === '1/1' ? '1200 × 1200 بكسل - نسبة 1:1' : '1200 × 600 بكسل - نسبة 2:1'})</span></label>
            <div style="display:flex;align-items:center;gap:12px;background:#fff;padding:8px;border:1px solid #cbd5e1;border-radius:6px">
              <div style="width:60px;height:40px;border-radius:4px;overflow:hidden;border:1px solid #f1f5f9;background:#f8fafc;flex-shrink:0">
                <img class="banner-img-preview" src="${b.image||''}" style="width:100%;height:100%;object-fit:cover;${hasImg?'':'display:none'}">
              </div>
              <button type="button" onclick="this.parentElement.querySelector('.banner-file-input').click()" style="background:#fff;border:1px solid #cbd5e1;padding:6px 12px;border-radius:6px;font-size:0.75rem;cursor:pointer;font-weight:700;color:#475569;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-cloud-arrow-up" style="color:var(--accent)"></i> رفع صورة</button>
              <input type="file" class="banner-file-input" accept="image/*" style="display:none" onchange="adminBannerUpload(this)">
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function adminToggleEditBanner(idx) {
  const card = document.querySelector(`.banner-card[data-idx="${idx}"]`);
  if (!card) return;
  const view = card.querySelector('.banner-view');
  const edit = card.querySelector('.banner-edit');
  const btn = card.querySelector('.banner-card-header .fa-pen')?.parentElement;
  if (edit.style.display === 'block') {
    edit.style.display = 'none';
    view.style.display = '';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-pen"></i>';
  } else {
    edit.style.display = 'block';
    view.style.display = 'none';
    if (btn) btn.innerHTML = '<i class="fa-solid fa-check" style="color:#22c55e"></i>';
  }
}

function adminToggleBanner(idx) {
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  data.banners = data.banners || [];
  const b = data.banners[idx];
  if (!b) return;
  b.active = b.active === false ? true : false;
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) {}
  adminRenderBanners();
}

function adminMoveBanner(idx, dir) {
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  data.banners = data.banners || [];
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= data.banners.length) return;
  [data.banners[idx], data.banners[newIdx]] = [data.banners[newIdx], data.banners[idx]];
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) {}
  adminRenderBanners();
}

function adminAddBanner() {
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  data.banners = data.banners || [];
  data.banners.push({ image: '', title: '', link: '', btnText: '', active: true });
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) {}
  adminRenderBanners();
  const idx = data.banners.length - 1;
  setTimeout(() => adminToggleEditBanner(idx), 50);
}

function adminDeleteBanner(idx) {
  const data = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  data.banners = data.banners || [];
  data.banners.splice(idx, 1);
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) {}
  adminRenderBanners();
}

function adminExport() {
  const data = {
    products, settings: loadAdminSettings(),
    orders: JSON.parse(localStorage.getItem('mycart_orders') || '[]'),
    cart: JSON.parse(localStorage.getItem('mycart_cart') || '[]'),
    customer: JSON.parse(localStorage.getItem('mycart_customer') || '{}'),
    logo: localStorage.getItem('mycart_logo') || '',
    bg: localStorage.getItem('mycart_bg') || '',
    marketing: JSON.parse(localStorage.getItem('mycart_marketing')) || {},
    categories: JSON.parse(localStorage.getItem('mycart_categories') || '[]'),
    date: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `متجري-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  document.getElementById('adminDataStatus').textContent = '✅ تم التصدير';
}

function adminImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.products) { products.length = 0; products.push(...data.products); saveProductsToLS(); }
      if (data.settings) { try { localStorage.setItem('mycart_admin_settings', JSON.stringify(data.settings)); } catch(e) {} adminSettings = data.settings; WHOLESALE_CODE = data.settings.wholesaleCode || 'ADMIN123'; CURRENCY = data.settings.currency || '₪'; }
      if (data.orders) { try { localStorage.setItem('mycart_orders', JSON.stringify(data.orders)); } catch(e) {} }
      if (data.cart) { try { localStorage.setItem('mycart_cart', JSON.stringify(data.cart)); } catch(e) {} }
      if (data.customer) { try { localStorage.setItem('mycart_customer', JSON.stringify(data.customer)); } catch(e) {} }
      if (data.logo) { try { localStorage.setItem('mycart_logo', data.logo); } catch(e) {} document.getElementById('storeLogo').src = data.logo; }
      if (data.bg) { try { localStorage.setItem('mycart_bg', data.bg); } catch(e) {} document.getElementById('header').style.setProperty('--header-bg', `url(${data.bg})`); document.getElementById('header').classList.add('has-bg'); }
      // Re-render store with new settings
      renderProducts(getFilteredProducts());
      renderCartItems();
      document.getElementById('adminDataStatus').textContent = '✅ تم الاستيراد';
      adminRefreshAll();
      showToast('✅ تم استيراد البيانات', 'success');
    } catch(err) { showToast('⚠️ ملف غير صالح', 'error'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function adminResetAll() {
  showConfirmModal('هل أنت متأكد من حذف كل البيانات؟<br><small style="color:#ef4444">لا يمكن التراجع عن هذا الإجراء</small>', function() {
    showConfirmModal('تأكيد نهائي — سيتم مسح جميع البيانات؟', function() {
      localStorage.removeItem('mycart_admin_products');
      localStorage.removeItem('mycart_admin_settings');
      localStorage.removeItem('mycart_orders');
      localStorage.removeItem('mycart_cart');
      localStorage.removeItem('mycart_customer');
      localStorage.removeItem('mycart_logo');
      localStorage.removeItem('mycart_bg');
      localStorage.removeItem('mycart_wholesale');
      localStorage.removeItem('mycart_marketing');
      products.length = 0;
      adminRefreshAll();
      showToast('✅ تم إعادة تعيين الكل', 'success');
    });
  });
}

function adminRenderOrderDetailPage() {
  if (adminOrderEditMode) adminRenderOrderEditPage();
  else adminRenderOrderViewPage();
}

function adminRenderOrderViewPage() {
  const d = adminOrderEditData;
  if (!d) return;
  const currency = CURRENCY;
  const subtotal = d.items.reduce((s, i) => s + i.price * i.qty, 0);
  const disc = d.discount || 0;
  const discAmt = disc > 0 ? Math.round(subtotal * disc / 100) : 0;
  const total = subtotal - discAmt + (d.delivery || 0);
  const rawSt = d._status === 'done' ? 'completed' : (d._status || 'pending');
  const currSt = QUICK_ORDER_STATUSES[rawSt] || QUICK_ORDER_STATUSES.pending;

  const statusChipsHtml = Object.keys(QUICK_ORDER_STATUSES).map(stKey => {
    var info = QUICK_ORDER_STATUSES[stKey];
    var isCurrent = rawSt === stKey;
    return `<button type="button" onclick="updateQuickOrderStatusSelect(adminOrderEditIdx, '${stKey}'); adminOrderEditData._status = '${stKey}'; adminRenderOrderViewPage();" style="background:${isCurrent ? info.color : info.bg};color:${isCurrent ? '#fff' : info.text};border:1.5px solid ${info.color};padding:6px 14px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit;transition:all .15s;box-shadow:${isCurrent ? '0 3px 10px '+info.color+'40' : 'none'}"><i class="fa-solid ${info.icon}"></i> ${info.label}</button>`;
  }).join('');

  document.getElementById('admin-orderDetail').innerHTML = `
    <!-- Top Action Bar -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <button onclick="adminBackToOrders()" style="background:var(--card);border:1px solid var(--border);color:var(--text);padding:8px 14px;border-radius:10px;cursor:pointer;font-size:.82rem;font-weight:700;font-family:inherit;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-right"></i> العودة للطلبات</button>
      <div style="display:flex;gap:8px">
        <button class="admin-btn admin-btn-primary" onclick="adminToggleOrderEditMode()" style="padding:8px 16px;border-radius:10px;font-size:.82rem;font-weight:700"><i class="fa-solid fa-pen"></i> تعديل الطلب</button>
        <button class="admin-btn admin-btn-secondary" onclick="printOrderData(adminOrderEditData, CURRENCY)" style="padding:8px 16px;border-radius:10px;font-size:.82rem;font-weight:700"><i class="fa-solid fa-print"></i> طباعة الفاتورة</button>
      </div>
    </div>

    <!-- Header Status Banner -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="background:var(--accent);color:#fff;padding:6px 14px;border-radius:8px;font-weight:900;font-size:1.05rem">#${String(d.id).slice(-6)}</span>
        <div>
          <div style="font-size:.78rem;color:var(--text-muted)">تاريخ الطلب</div>
          <div style="font-weight:800;font-size:.88rem;color:var(--text)"><i class="fa-regular fa-calendar" style="color:var(--accent)"></i> ${d.date}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:.8rem;color:var(--text-muted);font-weight:700">الحالة الحالية:</span>
        <span style="padding:6px 16px;border-radius:999px;font-size:.82rem;font-weight:900;background:${currSt.bg};color:${currSt.text};display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px ${currSt.color}20"><i class="fa-solid ${currSt.icon}"></i> ${currSt.label}</span>
      </div>
    </div>

    <!-- 2-Column Main Dashboard Layout -->
    <div style="display:grid;grid-template-columns:1fr 340px;gap:20px" class="order-details-grid">
      
      <!-- MAIN LEFT COLUMN: Products & Status Changer -->
      <div>
        <!-- Interactive Status Control Box -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.82rem;font-weight:900;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-arrows-rotate" style="color:var(--accent)"></i> تغيير حالة الطلب بنقرة واحدة:</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            ${statusChipsHtml}
          </div>
        </div>

        <!-- Products Card -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.9rem;font-weight:900;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-box-open" style="color:var(--accent)"></i> محتويات الطلب (${d.items?.length || 0} منتجات)</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${d.items.map(item => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
                <img src="${item.image || 'https://placehold.co/50x50/e2e8f0/64748b?text=' + encodeURIComponent(item.name.slice(0,2))}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#e2e8f0;border:1px solid #cbd5e1">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:800;font-size:.88rem;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.name}</div>
                  ${item.variant ? `<div style="font-weight:600;color:#64748b;font-size:.78rem;margin-top:2px">${variantSwatchHtml(item.variantData)} الخيار: ${item.variant}</div>` : ''}
                  <div style="font-size:.78rem;color:#64748b;margin-top:2px">${currency}${item.price} × <strong style="color:#1e293b">${item.qty}</strong></div>
                </div>
                <div style="font-weight:900;font-size:.98rem;color:var(--accent);flex-shrink:0">${currency}${(item.price * item.qty).toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- SIDEBAR RIGHT COLUMN: Customer Info & Order Summary -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Customer Info Sidebar Card -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.9rem;font-weight:900;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-user-gear" style="color:var(--accent)"></i> بيانات الزبون والتوصيل</div>
          <div style="display:flex;flex-direction:column;gap:12px;font-size:.84rem">
            <div style="background:#f8fafc;padding:10px 12px;border-radius:8px;border:1px solid #f1f5f9">
              <span style="color:var(--text-muted);font-size:.74rem">الاسم الكامل</span><br>
              <strong id="ovName" style="font-size:.9rem;color:#0f172a">${d.customer?.name || '—'}</strong>
              ${d.customer?.name ? `<button onclick="copyText(document.getElementById('ovName').textContent,'الاسم')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.75rem;margin-right:6px"><i class="fa-regular fa-copy"></i> نسخ</button>` : ''}
            </div>
            <div style="background:#f8fafc;padding:10px 12px;border-radius:8px;border:1px solid #f1f5f9">
              <span style="color:var(--text-muted);font-size:.74rem">رقم الهاتف</span><br>
              <strong dir="ltr" id="ovPhone" style="font-size:.9rem;color:#0f172a;display:inline-block">${d.customer?.phone || '—'}</strong>
              ${d.customer?.phone ? `<button onclick="copyText(document.getElementById('ovPhone').textContent,'رقم الهاتف')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.75rem;margin-right:6px"><i class="fa-regular fa-copy"></i> نسخ</button>` : ''}
            </div>
            <div style="background:#f8fafc;padding:10px 12px;border-radius:8px;border:1px solid #f1f5f9">
              <span style="color:var(--text-muted);font-size:.74rem">المدينة والعنوان</span><br>
              <strong id="ovCity" style="color:#0f172a">${d.customer?.city || '—'}</strong> - <strong id="ovAddr" style="color:#0f172a">${d.customer?.address || '—'}</strong>
              ${(d.customer?.city || d.customer?.address) ? `<button onclick="copyText((d.customer?.city||'')+' '+(d.customer?.address||''),'العنوان')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:.75rem;margin-right:6px"><i class="fa-regular fa-copy"></i> نسخ</button>` : ''}
            </div>
            ${d.deliveryZone ? `<div style="background:#f8fafc;padding:10px 12px;border-radius:8px;border:1px solid #f1f5f9"><span style="color:var(--text-muted);font-size:.74rem">منطقة التوصيل</span><br><strong style="color:#0f172a">${d.deliveryZone}</strong></div>` : ''}
            ${d.note ? `<div style="background:#fff7ed;border:1px solid #ffedd5;padding:10px 12px;border-radius:8px"><span style="color:#c2410c;font-size:.74rem;font-weight:800">📝 ملاحظة الزبون:</span><p style="font-size:.82rem;font-weight:700;color:#9a3412;margin-top:2px">${d.note}</p></div>` : ''}
          </div>
        </div>

        <!-- Order Financial Summary Card -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.9rem;font-weight:900;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-calculator" style="color:var(--accent)"></i> الملخص المالي</div>
          <div style="display:flex;flex-direction:column;gap:8px;font-size:.85rem">
            <div style="display:flex;justify-content:space-between;color:#64748b"><span>المجموع الفرعي:</span><strong style="color:#1e293b">${currency}${subtotal.toFixed(2)}</strong></div>
            ${disc > 0 ? `<div style="display:flex;justify-content:space-between;color:#16a34a"><span>الخصم (${disc}%):</span><strong>-${currency}${discAmt.toFixed(2)}</strong></div>` : ''}
            ${d.delivery ? `<div style="display:flex;justify-content:space-between;color:#64748b"><span>التوصيل:</span><strong style="color:#1e293b">${currency}${d.delivery.toFixed(2)}</strong></div>` : ''}
            <div style="display:flex;justify-content:space-between;font-size:1.15rem;font-weight:900;padding-top:8px;border-top:1.5px solid var(--border);margin-top:4px;color:var(--accent)">
              <span>المجموع الكلي:</span>
              <span>${currency}${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;
}

function adminRenderOrderEditPage() {
  const d = adminOrderEditData;
  if (!d) return;
  const currency = CURRENCY;
  const subtotal = d.items.reduce((s, i) => s + i.price * i.qty, 0);
  const disc = d.discount || 0;
  const discAmt = disc > 0 ? Math.round(subtotal * disc / 100) : 0;
  const total = subtotal - discAmt + (d.delivery || 0);
  const rawSt = d._status === 'done' ? 'completed' : (d._status || 'pending');
  const currSt = QUICK_ORDER_STATUSES[rawSt] || QUICK_ORDER_STATUSES.pending;

  const statusChipsHtml = Object.keys(QUICK_ORDER_STATUSES).map(stKey => {
    var info = QUICK_ORDER_STATUSES[stKey];
    var isCurrent = rawSt === stKey;
    return `<button type="button" onclick="updateQuickOrderStatusSelect(adminOrderEditIdx, '${stKey}'); adminOrderEditData._status = '${stKey}'; adminRenderOrderEditPage();" style="background:${isCurrent ? info.color : info.bg};color:${isCurrent ? '#fff' : info.text};border:1.5px solid ${info.color};padding:6px 14px;border-radius:999px;font-size:.78rem;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit;transition:all .15s;box-shadow:${isCurrent ? '0 3px 10px '+info.color+'40' : 'none'}"><i class="fa-solid ${info.icon}"></i> ${info.label}</button>`;
  }).join('');

  document.getElementById('admin-orderDetail').innerHTML = `
    <!-- Top Action Bar -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <button onclick="adminBackToOrders()" style="background:var(--card);border:1px solid var(--border);color:var(--text);padding:8px 14px;border-radius:10px;cursor:pointer;font-size:.82rem;font-weight:700;font-family:inherit;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-right"></i> العودة للطلبات</button>
      <div style="display:flex;gap:8px">
        <button class="admin-btn admin-btn-primary" onclick="adminSaveOrderEdit()" style="padding:8px 18px;border-radius:10px;font-size:.82rem;font-weight:800"><i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات</button>
        <button class="admin-btn admin-btn-secondary" onclick="adminToggleOrderEditMode()" style="padding:8px 16px;border-radius:10px;font-size:.82rem;font-weight:700">إلغاء التعديل</button>
      </div>
    </div>

    <!-- Header Status Banner -->
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="background:#ef4444;color:#fff;padding:6px 14px;border-radius:8px;font-weight:900;font-size:1.05rem">#${String(d.id).slice(-6)} (وضع التعديل)</span>
        <div>
          <div style="font-size:.78rem;color:var(--text-muted)">تاريخ الطلب</div>
          <div style="font-weight:800;font-size:.88rem;color:var(--text)"><i class="fa-regular fa-calendar" style="color:var(--accent)"></i> ${d.date}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:.8rem;color:var(--text-muted);font-weight:700">الحالة:</span>
        <span style="padding:6px 16px;border-radius:999px;font-size:.82rem;font-weight:900;background:${currSt.bg};color:${currSt.text};display:inline-flex;align-items:center;gap:6px"><i class="fa-solid ${currSt.icon}"></i> ${currSt.label}</span>
      </div>
    </div>

    <!-- 2-Column Main Dashboard Layout (Edit Mode) -->
    <div style="display:grid;grid-template-columns:1fr 340px;gap:20px" class="order-details-grid">
      
      <!-- MAIN LEFT COLUMN: Products & Status Changer -->
      <div>
        <!-- Interactive Status Control Box -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.82rem;font-weight:900;color:var(--text);margin-bottom:10px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-arrows-rotate" style="color:var(--accent)"></i> حالة الطلب:</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            ${statusChipsHtml}
          </div>
        </div>

        <!-- Products Card Edit -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div style="font-size:.9rem;font-weight:900;color:var(--text);display:flex;align-items:center;gap:8px"><i class="fa-solid fa-box-open" style="color:var(--accent)"></i> المنتجات في الطلب</div>
            <button class="admin-btn admin-btn-primary admin-btn-sm" onclick="openProductPicker()" style="padding:6px 12px;border-radius:8px;font-size:.78rem;font-weight:800"><i class="fa-solid fa-plus"></i> إضافة منتج</button>
          </div>
          <div id="oeItemsList" style="display:flex;flex-direction:column;gap:8px">
            ${d.items.map((item, i) => `
              <div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
                <img src="${item.image || 'https://placehold.co/50x50/e2e8f0/64748b?text=' + encodeURIComponent(item.name.slice(0,2))}" style="width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0;background:#e2e8f0">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:800;font-size:.88rem;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.name}</div>
                  ${item.variant ? `<div style="font-weight:600;color:#64748b;font-size:.78rem">${variantSwatchHtml(item.variantData)} الخيار: ${item.variant}</div>` : ''}
                  <div style="font-size:.78rem;color:#64748b">${currency}${item.price}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
                  <span style="font-size:.75rem;font-weight:700;color:var(--text-muted)">الكمية:</span>
                  <input type="number" value="${item.qty}" min="1" style="width:55px;padding:5px;border:1.5px solid var(--border);border-radius:6px;text-align:center;font-family:inherit;font-size:.85rem;font-weight:800" onchange="adminOrderEditChangeQty(${i},this.value)">
                </div>
                <button onclick="adminOrderEditRemoveItem(${i})" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:1.1rem;flex-shrink:0;padding:4px"><i class="fa-solid fa-trash-can"></i></button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- SIDEBAR RIGHT COLUMN: Editable Customer Info & Summary -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Customer Info Edit Card -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.9rem;font-weight:900;color:var(--text);margin-bottom:14px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-user-pen" style="color:var(--accent)"></i> تعديل بيانات العميل</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div>
              <label style="font-size:.75rem;font-weight:800;color:var(--text-muted);display:block;margin-bottom:3px">الاسم الكامل</label>
              <input type="text" id="oeName" value="${d.customer?.name || ''}" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;font-weight:700">
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:800;color:var(--text-muted);display:block;margin-bottom:3px">رقم الهاتف</label>
              <input type="text" id="oePhone" value="${d.customer?.phone || ''}" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;font-weight:700" dir="ltr">
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:800;color:var(--text-muted);display:block;margin-bottom:3px">المدينة</label>
              <input type="text" id="oeCity" value="${d.customer?.city || ''}" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;font-weight:700">
            </div>
            <div>
              <label style="font-size:.75rem;font-weight:800;color:var(--text-muted);display:block;margin-bottom:3px">العنوان التفصيلي</label>
              <input type="text" id="oeAddr" value="${d.customer?.address || ''}" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;font-weight:700">
            </div>
          </div>
        </div>

        <!-- Order Financial Summary & Discount Edit Card -->
        <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;box-shadow:0 2px 10px rgba(0,0,0,.03)">
          <div style="font-size:.9rem;font-weight:900;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-calculator" style="color:var(--accent)"></i> الملخص والخصم</div>
          <div style="display:flex;flex-direction:column;gap:10px;font-size:.85rem">
            <div style="display:flex;align-items:center;justify-content:space-between;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px 10px">
              <span style="font-weight:800;color:#15803d;font-size:.8rem"><i class="fa-solid fa-tag"></i> نسبة الخصم (%)</span>
              <input type="number" id="oeDiscount" value="${disc}" min="0" max="100" style="width:65px;padding:5px;border:1.5px solid #86efac;border-radius:6px;text-align:center;font-family:inherit;font-size:.85rem;font-weight:800" onchange="adminOrderEditUpdateTotal()">
            </div>
            <div style="display:flex;justify-content:space-between;color:#64748b;margin-top:4px"><span>المجموع الفرعي:</span><strong style="color:#1e293b">${currency}${subtotal.toFixed(2)}</strong></div>
            ${d.delivery ? `<div style="display:flex;justify-content:space-between;color:#64748b"><span>التوصيل:</span><strong style="color:#1e293b">${currency}${d.delivery.toFixed(2)}</strong></div>` : ''}
            <div style="display:flex;justify-content:space-between;font-size:1.15rem;font-weight:900;padding-top:8px;border-top:1.5px solid var(--border);margin-top:4px;color:var(--accent)">
              <span>المجموع الكلي:</span>
              <span id="oeTotal">${currency}${total.toFixed(2)}</span>
            </div>
          </div>
          <button class="admin-btn admin-btn-primary" onclick="adminSaveOrderEdit()" style="width:100%;margin-top:14px;padding:10px;border-radius:8px;font-weight:900"><i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات</button>
        </div>
      </div>

    </div>
  `;
}

/* ── Subscription ── */
function adminRenderSubscriptionTab() {
  var container = document.getElementById('admin-subscription');
  if (!container) return;
  var info = getFeeInfo();
  var plans = { free:'مجانية', monthly:'شهرية', annual:'سنوية VIP' };
  var planLabel = plans[info.plan] || info.plan;
  var isFree = info.plan === 'free';
  var statusColor = isFree && info.accrued >= info.limit ? '#ef4444' : '#10b981';
  var sett = getAgencySettings();
  var freeFee = sett.freeFee || '2', monthlyFee = sett.monthlyFee || '100', annualFee = sett.annualFee || '1000';
  var suspDate = localStorage.getItem('mycart_fee_threshold_date');
  var daysLeft = '';
  if (suspDate && isFree) { var diff = Math.ceil((new Date(suspDate) - new Date()) / 86400000); daysLeft = diff > 0 ? 'مهلة '+diff+' يوم' : '⚠️ منتهي!'; }
  var pct = isFree && info.accrued > 0 ? Math.min(100, Math.round((info.accrued/info.limit)*100)) : 0;
  container.innerHTML = ''
    + '<div class="sub-hero"><div style="position:relative;z-index:1">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:14px">'
    + '<div><span style="display:inline-flex;align-items:center;gap:4px;font-size:.65rem;background:#f1f5f9;color:#475569;padding:3px 10px;border-radius:999px;font-weight:800;margin-bottom:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> الاشتراك والفوترة</span>'
    + '<h2 style="font-size:1.2rem;font-weight:1000;margin:0;color:#0f172a">'+planLabel+'</h2>'
    + '<p style="font-size:.75rem;color:#64748b;margin:1px 0 0">'+(isFree?'الخطة المجانية • '+freeFee+' ₪ رسم لكل طلب':'إعفاء كامل من عمولات الطلبات')+'</p></div>'
    + '<a href="../../agency/index.html" target="_blank" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:8px;background:#f1f5f9;color:#1e293b;font-weight:700;font-size:.72rem;text-decoration:none;border:1px solid #e2e8f0"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg> منصة الشركة</a></div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px">'
    + '<div class="sub-hero-stat"><div class="label">إجمالي الطلبات</div><div class="value">'+info.count+'</div></div>'
    + (isFree ? '<div class="sub-hero-stat"><div class="label">الرسوم المتراكمة</div><div class="value" style="color:'+statusColor+'">'+info.accrued+' / '+info.limit+' ₪</div></div>' : '<div class="sub-hero-stat"><div class="label">حالة العمولات</div><div class="value" style="color:#10b981">0 ₪ (إعفاء)</div></div>')
    + (daysLeft ? '<div class="sub-hero-stat"><div class="label">المهلة</div><div class="value" style="color:'+statusColor+'">'+daysLeft+'</div></div>' : '<div class="sub-hero-stat"><div class="label">الحالة</div><div class="value" style="color:#10b981">نشط</div></div>')
    + '</div></div></div>'
    + (isFree && info.accrued > 0 ? '<div class="sub-fee-bar"><div style="display:flex;justify-content:space-between;align-items:center"><div><span style="font-weight:800;font-size:.8rem;color:#0f172a">استهلاك حد الطلبات</span><br><span style="font-size:.65rem;color:#64748b">'+info.accrued+' ₪ من أصل '+info.limit+' ₪</span></div><span style="font-size:1rem;font-weight:1000;color:'+statusColor+'">'+pct+'%</span></div><div class="track"><div class="fill" style="width:'+pct+'%;background:'+statusColor+'"></div></div>'+(info.accrued>=info.limit?'<button onclick="paySubscriptionFees();setTimeout(adminRenderSubscriptionTab,300)" style="width:100%;margin-top:10px;padding:9px;border:none;border-radius:10px;background:linear-gradient(135deg,#06b6d4,#0891b2);color:#fff;font-weight:900;font-size:.78rem;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 3px 10px rgba(6,182,212,.25)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="5" width="22" height="15" rx="2"/></svg> تسديد '+info.accrued+' ₪ الآن</button>':'')+'</div>' : '')
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">'
    // Free
    + '<div class="sub-plan-card'+(info.plan==='free'?' active':'')+'">'
    + (info.plan==='free'?'<span class="sub-plan-badge" style="position:absolute;top:-8px;left:14px">✓ خطتك الحالية</span>':'')
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg></div><div><h3 style="font-size:.9rem;font-weight:900;margin:0;color:#0f172a">مجانية</h3><p style="font-size:.65rem;color:#64748b;margin:0">بدون تكاليف شهرية</p></div></div>'
    + '<div class="price">0 ₪<span>/ شهرياً</span></div>'
    + '<ul><li><i class="fa-solid fa-check"></i> متجر إلكتروني متكامل</li><li><i class="fa-solid fa-check"></i> <strong>'+freeFee+' ₪</strong> رسم لكل طلب</li><li><i class="fa-solid fa-check"></i> منتجات وتصنيفات بلا حدود</li><li><i class="fa-solid fa-check"></i> استقبال طلبات بالواتساب</li></ul>'
    + (info.plan!=='free'?'<button onclick="adminSwitchPlan(\'free\')" style="width:100%;padding:8px;border:1.5px solid #e2e8f0;border-radius:10px;background:transparent;color:#1e293b;font-weight:800;font-size:.75rem;cursor:pointer;font-family:inherit">التبديل إلى المجانية</button>':'<div style="width:100%;padding:8px;border-radius:10px;background:#f0fdf4;color:#10b981;font-weight:900;font-size:.75rem;text-align:center">✓ خطتك الحالية</div>')
    + '</div>'
    // Monthly
    + '<div class="sub-plan-card recommended'+(info.plan==='monthly'?' active':'')+'">'
    + (info.plan==='monthly'?'<span class="sub-plan-badge" style="position:absolute;top:-8px;left:14px">✓ خطتك الحالية</span>':'<span style="position:absolute;top:-8px;left:14px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-size:.55rem;font-weight:900;padding:3px 12px;border-radius:999px;box-shadow:0 2px 8px rgba(59,130,246,.25)">المفضلة</span>')
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#dbeafe,#bfdbfe);display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div><div><h3 style="font-size:.9rem;font-weight:900;margin:0;color:#0f172a">شهرية</h3><p style="font-size:.65rem;color:#64748b;margin:0">إلغاء عمولة الطلبات</p></div></div>'
    + '<div class="price">'+monthlyFee+' ₪<span>/ شهرياً</span></div>'
    + '<ul><li><i class="fa-solid fa-check"></i> <strong>0 ₪ عمولة على الطلبات</strong></li><li><i class="fa-solid fa-check"></i> طلبات ومنتجات غير محدودة</li><li><i class="fa-solid fa-check"></i> ميزات التسويق كاملة</li><li><i class="fa-solid fa-check"></i> دعم فني مباشر</li></ul>'
    + (info.plan!=='monthly'?'<button onclick="adminSwitchPlan(\'monthly\')" style="width:100%;padding:8px;border:none;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-weight:900;font-size:.75rem;cursor:pointer;font-family:inherit;box-shadow:0 3px 10px rgba(59,130,246,.25)">اشترك شهرياً</button>':'<div style="width:100%;padding:8px;border-radius:10px;background:#f0fdf4;color:#10b981;font-weight:900;font-size:.75rem;text-align:center">✓ خطتك الحالية</div>')
    + '</div>'
    // Annual
    + '<div class="sub-plan-card'+(info.plan==='annual'?' active':'')+'">'
    + (info.plan==='annual'?'<span class="sub-plan-badge" style="position:absolute;top:-8px;left:14px">✓ خطتك الحالية</span>':'')
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#fef3c7,#fde68a);display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><div><h3 style="font-size:.9rem;font-weight:900;margin:0;color:#0f172a">سنوية VIP</h3><p style="font-size:.65rem;color:#64748b;margin:0">الأفضل توفيراً</p></div></div>'
    + '<div class="price">'+annualFee+' ₪<span>/ سنوياً</span></div>'
    + '<ul><li><i class="fa-solid fa-check"></i> <strong>توفير 200+ ₪ سنوياً</strong></li><li><i class="fa-solid fa-check"></i> <strong>0 ₪ عمولة (إعفاء كامل)</strong></li><li><i class="fa-solid fa-check"></i> نطاق خاص مجاني</li><li><i class="fa-solid fa-check"></i> دعم VIP وتخصيص ثيمات</li></ul>'
    + (info.plan!=='annual'?'<button onclick="adminSwitchPlan(\'annual\')" style="width:100%;padding:8px;border:none;border-radius:10px;background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;font-weight:900;font-size:.75rem;cursor:pointer;font-family:inherit;box-shadow:0 3px 10px rgba(15,23,42,.15)">اشترك سنوياً</button>':'<div style="width:100%;padding:8px;border-radius:10px;background:#f0fdf4;color:#10b981;font-weight:900;font-size:.75rem;text-align:center">✓ خطتك الحالية</div>')
    + '</div></div>'
    // History
    + '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;margin-top:14px">'
    + '<h4 style="font-weight:900;margin:0 0 10px;display:flex;align-items:center;gap:6px;color:#0f172a;font-size:.85rem"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> سجل الاشتراك</h4>'
    + renderSubscriptionLog()
    + '</div>';
}
function renderSubscriptionLog() {
  var log = []; try { var r = localStorage.getItem('mycart_subscription_log'); if (r) log = JSON.parse(r); } catch(e) {}
  if (!log.length) return '<p style="font-size:.75rem;color:#94a3b8;text-align:center;padding:10px 0">لا توجد حركات اشتراك بعد</p>';
  return '<div style="display:flex;flex-direction:column;gap:3px">'+log.slice().reverse().map(function(e){
    var icon = e.action === 'plan_change' ? 'fa-arrows-rotate' : e.action === 'payment' ? 'fa-wallet' : 'fa-circle-info';
    var color = e.action === 'plan_change' ? '#3b82f6' : e.action === 'payment' ? '#10b981' : '#64748b';
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f8fafc;border-radius:8px;font-size:.75rem">'
      + '<span style="width:24px;height:24px;border-radius:50%;background:'+color+'15;color:'+color+';display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid '+icon+'" style="font-size:.6rem"></i></span>'
      + '<div style="flex:1"><div style="font-weight:700;font-size:.75rem">'+e.details+'</div><div style="font-size:.62rem;color:#94a3b8">'+e.date+'</div></div></div>';
  }).join('')+'</div>';
}
function addSubscriptionLog(action, details) {
  var log = []; try { var r = localStorage.getItem('mycart_subscription_log'); if (r) log = JSON.parse(r); } catch(e) {}
  log.push({ action:action, details:details, date:new Date().toLocaleDateString('ar-SA')+' '+new Date().toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'}) });
  try { localStorage.setItem('mycart_subscription_log', JSON.stringify(log)); } catch(e) {}
}
function adminSwitchPlan(plan) {
  var plans = { free:'مجانية', monthly:'شهرية', annual:'سنوية VIP' };
  if (plan === localStorage.getItem('mycart_subscription_plan')) { showAlertModal('أنت مشترك في هذه الخطة بالفعل.'); return; }
  showConfirmModal('التبديل إلى الخطة <strong>'+plans[plan]+'</strong>؟', function(){
    var oldPlan = localStorage.getItem('mycart_subscription_plan') || 'free';
    localStorage.setItem('mycart_subscription_plan', plan);
    if (plan !== 'free') { localStorage.removeItem('mycart_free_orders_count'); localStorage.removeItem('mycart_fee_threshold_date'); localStorage.removeItem('mycart_store_suspended'); }
    addSubscriptionLog('plan_change', 'التبديل من '+(plans[oldPlan]||oldPlan)+' ← '+plans[plan]);
    showAlertModal('✅ تم التبديل إلى '+plans[plan]+' بنجاح!');
    adminRenderSubscriptionTab();
  });
}
function openSubscriptionSheet() {
  var sheet = document.getElementById('subscriptionSheet');
  if (!sheet) return;
  sheet.classList.add('open');
  var cnt = document.getElementById('subscriptionSheetContent');
  if (!cnt) return;
  var info = getFeeInfo();
  var plans = { free:'مجانية', monthly:'شهرية', annual:'سنوية VIP' };
  var planLabel = plans[info.plan] || info.plan;
  var isFree = info.plan === 'free';
  var statusColor = isFree && info.accrued >= info.limit ? '#ef4444' : '#10b981';
  var sett = getAgencySettings();
  var freeFee = sett.freeFee || '2', monthlyFee = sett.monthlyFee || '100', annualFee = sett.annualFee || '1000';
  var pct = isFree && info.accrued > 0 ? Math.min(100, Math.round((info.accrued/info.limit)*100)) : 0;
  var suspDate = localStorage.getItem('mycart_fee_threshold_date');
  var daysLeft = '';
  if (suspDate && isFree) { var diff = Math.ceil((new Date(suspDate) - new Date()) / 86400000); daysLeft = diff > 0 ? 'مهلة '+diff+' يوم' : '⚠️ منتهي!'; }
  cnt.innerHTML = '<div style="padding:4px 0">'
    + '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:16px 18px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.03)">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px">'
    + '<div><h3 style="font-size:1.1rem;font-weight:1000;margin:0;color:#0f172a">'+planLabel+'</h3><p style="font-size:.72rem;color:#64748b;margin:0">'+(isFree?'الخطة المجانية • رسم '+freeFee+' ₪ لكل طلب':'إعفاء من عمولات الطلبات')+'</p></div>'
    + '<div style="display:flex;gap:8px;align-items:center">'
    + '<span style="font-size:.7rem;background:#f1f5f9;padding:3px 10px;border-radius:999px;color:#475569;font-weight:700">الطلبات: '+info.count+'</span>'
    + (daysLeft ? '<span style="font-size:.7rem;background:#f1f5f9;padding:3px 10px;border-radius:999px;color:'+statusColor+';font-weight:700">'+daysLeft+'</span>' : '')
    + '</div></div>'
    + (isFree && info.accrued > 0 ? '<div style="background:#f8fafc;border-radius:10px;padding:10px 12px"><div style="display:flex;justify-content:space-between;font-size:.78rem;font-weight:700"><span>الرسوم المتراكمة</span><span style="color:'+statusColor+'">'+info.accrued+' / '+info.limit+' ₪</span></div><div style="height:6px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-top:6px"><div style="width:'+pct+'%;height:100%;background:'+statusColor+';border-radius:999px"></div></div>'+(info.accrued>=info.limit?'<button onclick="paySubscriptionFees();setTimeout(function(){openSubscriptionSheet();location.reload();},500)" style="width:100%;margin-top:8px;padding:8px;border:none;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#0891b2);color:#fff;font-weight:800;font-size:.75rem;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="5" width="22" height="15" rx="2"/></svg> تسديد '+info.accrued+' ₪</button>':'')+'</div>' : '')
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px">'
    + '<div style="background:#fff;border:1.5px solid '+(info.plan==='free'?'#10b981':'#e2e8f0')+';border-radius:12px;padding:12px;text-align:center">'
    + '<div style="font-size:.85rem;font-weight:900">مجانية</div><div style="font-size:1.1rem;font-weight:1000;margin:4px 0">0 ₪</div>'
    + '<div style="font-size:.6rem;color:#64748b;margin-bottom:6px">/ شهرياً</div>'
    + (info.plan!=='free'?'<button onclick="adminSwitchPlan(\'free\')" style="width:100%;padding:6px;border:1.5px solid #e2e8f0;border-radius:8px;background:transparent;color:#1e293b;font-weight:800;font-size:.65rem;cursor:pointer;font-family:inherit">تبديل</button>':'<div style="font-size:.6rem;color:#10b981;font-weight:800">✓ حالي</div>')
    + '</div>'
    + '<div style="background:#fff;border:1.5px solid '+(info.plan==='monthly'?'#10b981':'#3b82f6')+';border-radius:12px;padding:12px;text-align:center;position:relative">'
    + '<span style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:#3b82f6;color:#fff;font-size:.5rem;font-weight:900;padding:2px 8px;border-radius:999px">شائع</span>'
    + '<div style="font-size:.85rem;font-weight:900;margin-top:4px">شهرية</div><div style="font-size:1.1rem;font-weight:1000;margin:4px 0">'+monthlyFee+' ₪</div>'
    + '<div style="font-size:.6rem;color:#64748b;margin-bottom:6px">/ شهرياً</div>'
    + (info.plan!=='monthly'?'<button onclick="adminSwitchPlan(\'monthly\')" style="width:100%;padding:6px;border:none;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;font-weight:800;font-size:.65rem;cursor:pointer;font-family:inherit;box-shadow:0 2px 6px rgba(59,130,246,.25)">اشتراك</button>':'<div style="font-size:.6rem;color:#10b981;font-weight:800">✓ حالي</div>')
    + '</div>'
    + '<div style="background:#fff;border:1.5px solid '+(info.plan==='annual'?'#10b981':'#e2e8f0')+';border-radius:12px;padding:12px;text-align:center">'
    + '<div style="font-size:.85rem;font-weight:900">سنوية VIP</div><div style="font-size:1.1rem;font-weight:1000;margin:4px 0">'+annualFee+' ₪</div>'
    + '<div style="font-size:.6rem;color:#64748b;margin-bottom:6px">/ سنوياً</div>'
    + (info.plan!=='annual'?'<button onclick="adminSwitchPlan(\'annual\')" style="width:100%;padding:6px;border:none;border-radius:8px;background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;font-weight:800;font-size:.65rem;cursor:pointer;font-family:inherit">اشتراك</button>':'<div style="font-size:.6rem;color:#10b981;font-weight:800">✓ حالي</div>')
    + '</div></div></div>'
    + '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px 14px">'
    + '<h4 style="font-weight:900;margin:0 0 8px;font-size:.8rem;display:flex;align-items:center;gap:6px;color:#0f172a"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> سجل الاشتراك</h4>'
    + renderSubscriptionLog()+'</div></div>';
}
function closeSubscriptionSheet() {
  var sheet = document.getElementById('subscriptionSheet');
  if (sheet) sheet.classList.remove('open');
}

// ===== FBT Product Picker =====
function filterFbtProducts() {
  const q = document.getElementById('fbtSearch').value.trim().toLowerCase();
  document.querySelectorAll('#fbtPickerList .fbtItem').forEach(el => {
    el.style.display = el.dataset.name.includes(q) ? '' : 'none';
  });
}
function toggleFbtCard(el, saved) {
  if (el.checked) {
    const checked = document.querySelectorAll('#fbtPickerList .fbtCb:checked:not(:disabled)').length;
    if (checked > (4 - saved)) {
      el.checked = false;
      const label = el.closest('.fbtItem');
      label.style.borderColor = '#ef4444';
      label.style.background = '#fef2f2';
      label.style.animation = 'shake .4s ease';
      setTimeout(() => {
        label.style.borderColor = '#e2e8f0';
        label.style.background = '#fff';
        label.style.animation = '';
      }, 500);
      if (typeof showToast === 'function') showToast('لا يمكنك التحديد، الحد الأقصى 4 منتجات', 'error');
      return;
    }
  }
  const label = el.closest('.fbtItem');
  const checked = document.querySelectorAll('#fbtPickerList .fbtCb:checked:not(:disabled)').length;
  const total = saved + checked;
  const counter = document.getElementById('fbtLiveCount');
  if (counter) counter.textContent = total + ' / 4';
  if (el.checked) {
    label.style.borderColor = 'var(--accent)';
    label.style.background = 'linear-gradient(135deg,var(--accent),var(--accent-hover))';
    label.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)';
    label.querySelector('img').style.borderColor = 'rgba(255,255,255,.25)';
    const nameDiv = label.querySelector('div:nth-child(3) > div:first-child');
    if (nameDiv) nameDiv.style.color = '#fff';
    const priceDiv = label.querySelector('div:nth-child(3) > div:last-child');
    if (priceDiv) priceDiv.style.color = 'rgba(255,255,255,.75)';
  } else {
    label.style.borderColor = '#e2e8f0';
    label.style.background = '#fff';
    label.style.boxShadow = '0 1px 2px rgba(0,0,0,.04)';
    label.querySelector('img').style.borderColor = '#f1f5f9';
    const nameDiv = label.querySelector('div:nth-child(3) > div:first-child');
    if (nameDiv) nameDiv.style.color = '#0f172a';
    const priceDiv = label.querySelector('div:nth-child(3) > div:last-child');
    if (priceDiv) priceDiv.style.color = '#94a3b8';
  }
}
function openFbtProductPicker() {
  const list = (typeof products !== 'undefined' ? products : []);
  const selected = window._fbtProductIds || [];
  const countSaved = selected.length;
  let html = '<div style="padding:4px 0">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;padding:10px 14px;border-radius:12px;margin-bottom:14px;border:1px solid #e2e8f0">';
  html += '<span style="font-size:.75rem;font-weight:600;color:#64748b"><i class="fa-solid fa-cube" style="margin-left:4px"></i>الحد الأقصى</span>';
  html += '<span id="fbtLiveCount" style="font-size:.85rem;font-weight:800;color:#0f172a;background:#e2e8f0;padding:3px 16px;border-radius:20px">' + countSaved + ' / 4</span>';
  html += '</div>';
  html += '<div style="margin-bottom:12px;position:relative">';
  html += '<i class="fa-solid fa-magnifying-glass" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:.75rem"></i>';
  html += '<input type="text" id="fbtSearch" placeholder="ابحث عن منتج..." oninput="filterFbtProducts()" style="width:100%;padding:10px 14px 10px 32px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.8rem;outline:none;box-sizing:border-box;background:#fff" autocomplete="off">';
  html += '</div>';
  html += '<div style="max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:8px" id="fbtPickerList">';
  list.forEach(p => {
    const added = selected.includes(p.id);
    html += '<label class="fbtItem" data-id="' + p.id + '" data-name="' + p.name.replace(/"/g,'&quot;') + '" style="display:flex;align-items:center;gap:12px;padding:10px 12px;border:1.5px solid ' + (added ? 'var(--accent)' : '#e2e8f0') + ';border-radius:12px;cursor:pointer;background:' + (added ? 'linear-gradient(135deg,var(--accent),var(--accent-hover))' : '#fff') + ';transition:all .2s;box-shadow:' + (added ? '0 4px 12px rgba(0,0,0,.1)' : '0 1px 2px rgba(0,0,0,.04)') + '">' +
      '<div style="width:22px;display:flex;align-items:center;justify-content:center">' +
      '<input type="checkbox" class="fbtCb" value="' + p.id + '" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer"' + (added ? ' checked disabled' : ' onchange="toggleFbtCard(this,' + countSaved + ')"') + '>' +
      '</div>' +
      '<img src="' + (Array.isArray(p.images) ? p.images[0] : p.image || 'https://placehold.co/46x46/e2e8f0/64748b?text=N') + '" style="width:46px;height:46px;border-radius:10px;object-fit:cover;border:2px solid ' + (added ? 'rgba(255,255,255,.25)' : '#f1f5f9') + ';flex-shrink:0">' +
      '<div style="flex:1;min-width:0">' +
      '<div style="font-size:.82rem;font-weight:700;color:' + (added ? '#fff' : '#0f172a') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + p.name + '</div>' +
      '<div style="font-size:.7rem;color:' + (added ? 'rgba(255,255,255,.75)' : '#94a3b8') + ';margin-top:2px">' + CURRENCY + p.price + (added ? ' <span style="font-weight:600">✓ مضاف</span>' : '') + '</div>' +
      '</div>' +
    '</label>';
  });
  if (!list.length) html += '<div style="font-size:.8rem;color:#94a3b8;padding:30px 10px;text-align:center">لا توجد منتجات.</div>';
  html += '<button onclick="addSelectedFbt()" style="width:100%;padding:12px;margin-top:12px;border:none;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--accent-hover));color:#fff;font-weight:800;font-size:.9rem;cursor:pointer;font-family:inherit;box-shadow:0 6px 20px rgba(0,0,0,.15);transition:opacity .15s" id="fbtAddBtn">إضافة المنتجات المختارة</button>';
  html += '<button onclick="closeModal()" style="width:100%;padding:10px;margin-top:6px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;font-weight:600;cursor:pointer;font-family:inherit;font-size:.8rem;transition:all .15s">إلغاء</button>';
  html += '</div>';
  document.getElementById('modalTitle').textContent = 'اختيار منتجات للحزمة';
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('backdropModal').classList.add('show');
}
function addSelectedFbt() {
  const selected = [...document.querySelectorAll('.fbtCb:checked')].map(cb => parseInt(cb.value));
  if (!window._fbtProductIds) window._fbtProductIds = [];
  const remaining = 4 - window._fbtProductIds.length;
  const toAdd = selected.slice(0, remaining).filter(id => !window._fbtProductIds.includes(id));
  if (!toAdd.length) { closeModal(); return; }
  window._fbtProductIds.push(...toAdd);
  refreshFbtProductTags();
  closeModal();
}
function removeFbtProduct(id) {
  if (!window._fbtProductIds) return;
  window._fbtProductIds = window._fbtProductIds.filter(x => x !== id);
  refreshFbtProductTags();
}
function refreshFbtProductTags() {
  const container = document.getElementById('admMktFbtProducts');
  if (!container) return;
  const list = typeof products !== 'undefined' ? products : [];
  container.innerHTML = (window._fbtProductIds || []).map(id => {
    const pr = list.find(p => p.id === id);
    return pr ? '<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border:1px solid var(--accent);border-radius:8px;font-size:.75rem;background:linear-gradient(135deg,var(--accent),var(--accent-hover));color:#fff;font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,.1)"><img src="' + (Array.isArray(pr.images) ? pr.images[0] : pr.image || 'https://placehold.co/24x24/e2e8f0/64748b?text=N') + '" style="width:20px;height:20px;border-radius:4px;object-fit:cover">' + pr.name + ' <i class="fa-solid fa-xmark" style="cursor:pointer;color:rgba(255,255,255,.7);font-size:.8rem" onclick="removeFbtProduct(' + id + ')"></i></span>' : '';
  }).join('');
}

// ==================== COUPONS MANAGEMENT ====================
function adminUpdateCouponBadge() {
  const badge = document.getElementById('adminCouponBadge');
  if (!badge) return;
  const coupons = loadCoupons();
  const active = coupons.filter(c => c.isActive && getCouponStatus(c) === CouponStatus.ACTIVE).length;
  if (active > 0) {
    badge.textContent = active;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

function adminRenderCoupons() {
  const container = document.getElementById('admin-coupons');
  if (!container) return;
  const coupons = loadCoupons();
  const now = Date.now();
  const active = coupons.filter(c => c.isActive && getCouponStatus(c) === CouponStatus.ACTIVE).length;
  const expired = coupons.filter(c => getCouponStatus(c) === CouponStatus.EXPIRED).length;
  const exhausted = coupons.filter(c => getCouponStatus(c) === CouponStatus.EXHAUSTED).length;
  const totalUses = coupons.reduce((s, c) => s + (c.uses || 0), 0);

  let html = '<div style="padding:16px 0">';
  // Stats
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px">';
  html += '<div class="admin-stat"><i class="fa-solid fa-ticket" style="color:#f59e0b"></i><div><span>' + coupons.length + '</span><p>إجمالي الكوبونات</p></div></div>';
  html += '<div class="admin-stat"><i class="fa-solid fa-circle-check" style="color:#16a34a"></i><div><span>' + active + '</span><p>نشط</p></div></div>';
  html += '<div class="admin-stat"><i class="fa-solid fa-clock" style="color:#ef4444"></i><div><span>' + expired + '</span><p>منتهية</p></div></div>';
  html += '<div class="admin-stat"><i class="fa-solid fa-coins" style="color:#3b82f6"></i><div><span>' + totalUses + '</span><p>مجموع الاستخدامات</div></div>';
  html += '</div>';

  // Toolbar
  html += '<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:16px">';
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">';
  html += '<div style="flex:1;min-width:180px"><input type="text" id="adminCouponSearch" placeholder="بحث بالكود أو الوصف..." oninput="adminRenderCoupons()" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem"></div>';
  html += '<div style="min-width:140px"><select id="adminCouponStatusFilter" onchange="adminRenderCoupons()" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.85rem;background:var(--card);color:var(--text)"><option value="">جميع الحالات</option><option value="active">نشط</option><option value="expired">منتهي</option><option value="exhausted">مستنفذ</option><option value="inactive">متوقف</option></select></div>';
  html += '<button class="btn-secondary" onclick="adminExportCoupons()" style="padding:8px 14px;font-size:.85rem"><i class="fa-solid fa-file-export"></i> تصدير</button>';
  html += '<button class="btn-primary" onclick="openAdminCouponForm()" style="padding:8px 14px;font-size:.85rem"><i class="fa-solid fa-plus"></i> كوبون جديد</button>';
  html += '</div></div>';

  // List
  html += '<div id="adminCouponsList" style="display:flex;flex-direction:column;gap:10px">';
  if (!coupons.length) {
    html += '<div class="admin-empty"><i class="fa-solid fa-ticket"></i><p>لا توجد أكواد خصم. أنشئ أول كوبون الآن!</p></div>';
  } else {
    const search = (document.getElementById('adminCouponSearch')?.value || '').trim().toLowerCase();
    const statusFilter = document.getElementById('adminCouponStatusFilter')?.value || '';
    let filtered = coupons.filter(c => {
      if (search && !(c.code.toLowerCase().includes(search) || (c.description||'').toLowerCase().includes(search))) return false;
      if (statusFilter && getCouponStatus(c) !== statusFilter) return false;
      return true;
    });
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    filtered.forEach((c, idx) => {
      const status = getCouponStatus(c);
      const statusLabels = { active:'نشط', expired:'منتهي', exhausted:'مستنفذ', not_started:'لم يبدأ', inactive:'متوقف' };
      const statusColors = { active:'#16a34a', expired:'#ef4444', exhausted:'#f59e0b', not_started:'#3b82f6', inactive:'#64748b' };
      const statusBg = { active:'rgba(22,163,74,.1)', expired:'rgba(239,68,68,.1)', exhausted:'rgba(245,158,11,.1)', not_started:'rgba(59,130,246,.1)', inactive:'rgba(100,116,128,.1)' };
      let typeLabel = '';
      if (c.type === CouponType.PERCENT) typeLabel = c.value + '% خصم';
      else if (c.type === CouponType.FIXED) typeLabel = CURRENCY + c.value + ' خصم';
      else if (c.type === CouponType.FREESHIP) typeLabel = 'شحن مجاني';
      html += '<div style="background:var(--card);border:1.5px solid var(--border);border-radius:12px;padding:14px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start">';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">';
      html += '<code style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:3px 10px;border-radius:6px;font-size:.8rem;font-weight:800;letter-spacing:.5px">' + c.code + '</code>';
      html += '<span style="font-size:.75rem;font-weight:600;color:' + statusColors[status] + ';background:' + statusBg[status] + ';padding:2px 8px;border-radius:999px">' + statusLabels[status] + '</span>';
      html += '<span style="font-size:.8rem;color:var(--text-muted)">' + typeLabel + '</span>';
      html += '</div>';
      if (c.description) html += '<div style="font-size:.75rem;color:var(--text-muted);margin-top:4px">' + c.description + '</div>';
      html += '</div>';
      html += '<div style="display:flex;gap:4px;flex-shrink:0">';
      html += '<button onclick="toggleAdminCouponActive(' + idx + ')" title="' + (c.isActive ? 'إيقاف التفعيل' : 'تفعيل') + '" style="padding:6px 10px;background:none;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:.8rem;color:' + (c.isActive ? '#16a34a' : '#ef4444') + '"><i class="fa-solid fa-' + (c.isActive ? 'pause' : 'play') + '"></i></button>';
      html += '<button onclick="openAdminCouponForm(' + idx + ')" title="تعديل" style="padding:6px 10px;background:none;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:.8rem;color:var(--text)"><i class="fa-solid fa-pen"></i></button>';
      html += '<button onclick="deleteAdminCoupon(' + idx + ')" title="حذف" style="padding:6px 10px;background:none;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:.8rem;color:#ef4444"><i class="fa-solid fa-trash"></i></button>';
      html += '</div>';
      html += '</div>';
      html += '<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:.72rem;color:var(--text-muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">';
      html += '<span><i class="fa-solid fa-users" style="margin-inline-end:4px"></i>استخدامات: ' + (c.uses || 0) + (c.limit > 0 ? ' / ' + c.limit : '') + '</span>';
      if (c.startDate) html += '<span><i class="fa-solid fa-calendar-plus" style="margin-inline-end:4px"></i>منذ: ' + new Date(c.startDate).toLocaleDateString('ar-SA') + '</span>';
      if (c.endDate) html += '<span><i class="fa-solid fa-calendar-minus" style="margin-inline-end:4px"></i>حتى: ' + new Date(c.endDate).toLocaleDateString('ar-SA') + '</span>';
      if (c.minOrder > 0) html += '<span><i class="fa-solid fa-wallet" style="margin-inline-end:4px"></i> حد أدنى: ' + CURRENCY + c.minOrder + '</span>';
      html += '</div>';
      html += '</div>';
    });
  }
  html += '</div></div>';
  container.innerHTML = html;
}

function openAdminCouponForm(idx) {
  const coupons = loadCoupons();
  const isEdit = idx !== undefined && idx >= 0;
  const c = isEdit ? coupons[idx] : {};
  const modal = document.getElementById('adminCouponFormModal');
  if (!modal) return;
  document.getElementById('adminCouponFormTitle').textContent = isEdit ? 'تعديل كوبون' : 'كوبون خصم جديد';
  document.getElementById('adminCpnId').value = isEdit ? c.id : '';
  document.getElementById('adminCpnCode').value = c.code || '';
  document.getElementById('adminCpnType').value = c.type || CouponType.PERCENT;
  document.getElementById('adminCpnValue').value = c.value || '';
  document.getElementById('adminCpnDescription').value = c.description || '';
  document.getElementById('adminCpnStartDate').value = c.startDate ? new Date(c.startDate).toISOString().slice(0, 16) : '';
  document.getElementById('adminCpnEndDate').value = c.endDate ? new Date(c.endDate).toISOString().slice(0, 16) : '';
  document.getElementById('adminCpnLimit').value = c.limit > 0 ? c.limit : '';
  document.getElementById('adminCpnMinOrder').value = c.minOrder > 0 ? c.minOrder : '';
  document.getElementById('adminCpnIsActive').checked = c.isActive !== false;
  toggleAdminCpnValueField();
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeAdminCouponForm() {
  const modal = document.getElementById('adminCouponFormModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
}

function toggleAdminCpnValueField() {
  const type = document.getElementById('adminCpnType')?.value;
  const group = document.getElementById('adminCpnValueGroup');
  const label = document.getElementById('adminCpnValueLabel');
  if (!group || !label) return;
  if (type === CouponType.FREESHIP) {
    group.style.display = 'none';
  } else {
    group.style.display = 'block';
    label.textContent = type === CouponType.PERCENT ? 'قيمة الخصم (%)' : 'قيمة الخصم (مبلغ ثابت)';
  }
}

function submitAdminCouponForm(e) {
  e.preventDefault();
  const id = document.getElementById('adminCpnId').value;
  const coupons = loadCoupons();
  const idx = coupons.findIndex(c => c.id === id);
  const coupon = {
    id: id || undefined,
    code: document.getElementById('adminCpnCode').value.trim().toUpperCase(),
    type: document.getElementById('adminCpnType').value,
    value: parseFloat(document.getElementById('adminCpnValue').value) || 0,
    description: document.getElementById('adminCpnDescription').value.trim(),
    startDate: document.getElementById('adminCpnStartDate').value ? new Date(document.getElementById('adminCpnStartDate').value).getTime() : 0,
    endDate: document.getElementById('adminCpnEndDate').value ? new Date(document.getElementById('adminCpnEndDate').value).getTime() : 0,
    limit: parseInt(document.getElementById('adminCpnLimit').value) || 0,
    minOrder: parseFloat(document.getElementById('adminCpnMinOrder').value) || 0,
    isActive: document.getElementById('adminCpnIsActive').checked
  };
  if (!coupon.code) { showToast('⚠️ يرجى إدخال كود الكوبون', 'error'); return; }
  if (coupon.type !== CouponType.FREESHIP && (!coupon.value || coupon.value <= 0)) { showToast('⚠️ يرجى إدخال قيمة الخصم', 'error'); return; }
  if (idx >= 0) {
    coupon.uses = coupons[idx].uses || 0;
    coupon.userUsed = coupons[idx].userUsed || {};
    coupon.createdAt = coupons[idx].createdAt || Date.now();
    coupons[idx] = coupon;
  } else {
    coupon.uses = 0;
    coupon.userUsed = {};
    coupon.createdAt = Date.now();
    coupons.push(coupon);
  }
  saveCoupons(coupons);
  closeAdminCouponForm();
  adminRenderCoupons();
  adminUpdateCouponBadge();
  showToast('✓ تم حفظ الكوبون بنجاح', 'success');
}

function deleteAdminCoupon(idx) {
  showConfirmModal('هل أنت متأكد من حذف هذا الكوبون؟<br><small style="color:#ef4444">لا يمكن التراجع عن هذا الإجراء</small>', function() {
    const coupons = loadCoupons();
    coupons.splice(idx, 1);
    saveCoupons(coupons);
    adminRenderCoupons();
    adminUpdateCouponBadge();
    showToast('✓ تم حذف الكوبون', 'success');
  });
}

function toggleAdminCouponActive(idx) {
  const coupons = loadCoupons();
  if (!coupons[idx]) return;
  coupons[idx].isActive = !coupons[idx].isActive;
  saveCoupons(coupons);
  adminRenderCoupons();
  adminUpdateCouponBadge();
}

function adminExportCoupons() {
  const coupons = loadCoupons();
  if (!coupons.length) { showToast('⚠️ لا توجد كوبونات لتصديرها', 'error'); return; }
  const dataStr = JSON.stringify(coupons, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'coupons-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ============ SPIN WHEEL ADMIN TAB ============

function adminRenderSpinWheel() {
  const container = document.getElementById('admin-spinwheel');
  const data = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  const sw = data.spinWin || {};

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:16px">
      <h3 style="font-size:1.1rem;font-weight:800;display:flex;align-items:center;gap:8px"><i class="fa-solid fa-circle-notch" style="color:#f59e0b"></i> إدارة عجلة الحظ التفاعلية</h3>
      <button class="admin-btn admin-btn-primary" onclick="adminSaveSpinWheel()"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>
    </div>
    <div class="admin-settings-grid">
      <!-- Status -->
      <div class="admin-card">
        <h4><i class="fa-solid fa-power-off" style="color:#22c55e"></i> حالة العجلة</h4>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;font-size:.85rem;margin-top:8px">
          <input type="checkbox" id="admMktSpinWinShow" style="width:16px;height:16px" ${sw.show ? 'checked' : ''}> 🎡 تفعيل عجلة الحظ
        </label>
        <p style="font-size:.72rem;color:var(--text-muted);margin:6px 0 0;line-height:1.5">عند التفعيل، تظهر العجلة تلقائياً للزوار بعد 6 ثوانٍ من فتح المتجر.</p>
        <div style="margin-top:10px;padding:10px 14px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.15);border-radius:10px">
          <div style="font-size:.72rem;color:var(--text-muted)">عدد القطاعات: <strong id="swStatCount2" style="color:#f59e0b">${(sw.segments||[]).length}</strong></div>
          <div style="font-size:.72rem;color:var(--text-muted);margin-top:4px">الحالة: <strong id="swStatStatus2" style="color:${sw.show?'#22c55e':'#94a3b8'}">${sw.show?'مفعلة':'غير مفعلة'}</strong></div>
        </div>
      </div>

      <!-- Segments -->
      <div class="admin-card" style="grid-column:1/-1">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <h4><i class="fa-solid fa-list"></i> قطاعات العجلة</h4>
          <span style="font-size:.72rem;color:var(--text-muted)">${(sw.segments||[]).length} قطاع</span>
        </div>
        <div id="admSpinSegmentsList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px;margin-bottom:12px"></div>

        <!-- Add Form -->
        <div style="background:var(--bg);border:1px dashed var(--border);border-radius:12px;padding:14px;margin-top:8px">
          <div style="font-size:.8rem;font-weight:800;margin-bottom:10px"><i class="fa-solid fa-plus-circle" style="color:#22c55e"></i> إضافة قطاع جديد</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div style="flex:2;min-width:120px">
              <label style="font-size:.65rem;color:var(--text-muted)">اسم الجائزة</label>
              <input type="text" id="admNewSegLabel" placeholder="خصم 20%" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
            </div>
            <div style="flex:1;min-width:90px">
              <label style="font-size:.65rem;color:var(--text-muted)">النوع</label>
              <select id="admNewSegType" onchange="swToggleSegForm()" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem;background:var(--card);color:var(--text)">
                <option value="discount">خصم %</option>
                <option value="freeship">شحن مجاني</option>
                <option value="none">حظ سعيد</option>
              </select>
            </div>
          </div>
          <div id="admNewSegDiscFields" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            <div style="flex:1;min-width:70px">
              <label style="font-size:.65rem;color:var(--text-muted)">الخصم %</label>
              <input type="number" id="admNewSegPercent" min="1" max="99" value="10" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
            </div>
            <div style="flex:2;min-width:130px">
              <label style="font-size:.65rem;color:var(--text-muted)">كود الخصم</label>
              <div style="display:flex;gap:4px">
                <input type="text" id="admNewSegCode" placeholder="SAVE10" style="flex:1;padding:7px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem;text-transform:uppercase">
                <button type="button" onclick="adminGenWheelCode()" title="توليد كود عشوائي" style="padding:7px 10px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:.75rem;white-space:nowrap"><i class="fa-solid fa-wand-magic-sparkles"></i></button>
              </div>
            </div>
            <div style="flex:1;min-width:70px">
              <label style="font-size:.65rem;color:var(--text-muted)">اللون</label>
              <input type="color" id="admNewSegColor" value="#ef4444" style="width:100%;height:34px;border:1.5px solid var(--border);border-radius:8px;cursor:pointer;padding:1px">
            </div>
          </div>
          <div id="admNewSegLimitRow" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            <div style="flex:1;min-width:120px">
              <label style="font-size:.65rem;color:var(--text-muted)">عدد مرات الاستخدام (0 = غير محدود)</label>
              <input type="number" id="admNewSegLimit" min="0" value="0" placeholder="0" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.8rem">
            </div>
          </div>
          <button onclick="admAddSpinSegment();updateSwStats()" class="admin-btn admin-btn-secondary admin-btn-sm" style="margin-top:10px"><i class="fa-solid fa-plus"></i> إضافة</button>
        </div>
      </div>

      <!-- Preview -->
      <div class="admin-card" style="display:flex;flex-direction:column;align-items:center">
        <h4><i class="fa-solid fa-eye"></i> معاينة</h4>
        <div style="position:relative;width:120px;height:120px;margin:10px auto 0">
          <div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:12px solid #f59e0b;z-index:2"></div>
          <div id="swPreviewWheel2" style="width:100%;height:100%;border-radius:50%;border:3px solid rgba(255,255,255,.8);background:conic-gradient(#e2e8f0 0deg 360deg)"></div>
        </div>
      </div>
    </div>
  `;

  admRenderSpinSegmentsList(sw.segments || []);
  updateSwPreview((sw.segments || []));
}

function updateSwPreview(segs) {
  const wheel = document.getElementById('swPreviewWheel2');
  if (!wheel) return;
  if (!segs || !segs.length) { wheel.style.background = 'conic-gradient(#e2e8f0 0deg 360deg)'; return; }
  const count = segs.length;
  const segDeg = 360 / count;
  const parts = segs.map((s, i) => {
    const from = Math.round(i * segDeg * 10) / 10;
    const to = Math.round((i + 1) * segDeg * 10) / 10;
    return `${s.color || '#ef4444'} ${from}deg ${to}deg`;
  });
  wheel.style.background = `conic-gradient(${parts.join(', ')})`;
}

function updateSwStats() {
  const data = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  const segs = data.spinWin?.segments || [];
  const c1 = document.getElementById('swStatCount2');
  const c2 = document.getElementById('swStatStatus2');
  if (c1) c1.textContent = segs.length;
  if (c2) {
    const enabled = !!data.spinWin?.show;
    c2.textContent = enabled ? 'مفعلة' : 'غير مفعلة';
    c2.style.color = enabled ? '#22c55e' : '#94a3b8';
  }
  updateSwPreview(segs);
}

function swToggleSegForm() {
  const t = document.getElementById('admNewSegType')?.value;
  const discFields = document.getElementById('admNewSegDiscFields');
  const limitRow = document.getElementById('admNewSegLimitRow');
  if (discFields) discFields.style.display = t === 'discount' ? 'flex' : 'none';
  if (limitRow) limitRow.style.display = t === 'none' ? 'none' : 'flex';
}

function adminGenWheelCode() {
  const prefix = 'LUCKY';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix;
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  const el = document.getElementById('admNewSegCode');
  if (el) el.value = code;
}

function adminPpToggleType() {
  const t = document.getElementById('admMktPpType')?.value;
  const codeGrp = document.getElementById('admPpCodeGroup');
  const pctGrp = document.getElementById('admPpPercentGroup');
  const btnTextGrp = document.getElementById('admPpBtnTextGroup');
  const btnLinkGrp = document.getElementById('admPpBtnLinkGroup');
  const expGrp = document.getElementById('admPpExpiryGroup');
  const customExtras = document.getElementById('admPpCustomExtras');
  const showCode = (t === 'discount' || t === 'halfprice');
  const showPct = (t === 'discount' || t === 'sale' || t === 'halfprice');
  const showExp = (t === 'discount' || t === 'sale' || t === 'halfprice');
  const showBtn = (t !== 'newsletter');
  if (codeGrp) codeGrp.style.display = showCode ? 'block' : 'none';
  if (pctGrp) pctGrp.style.display = showPct ? 'block' : 'none';
  if (btnTextGrp) btnTextGrp.style.display = showBtn ? 'block' : 'none';
  if (btnLinkGrp) btnLinkGrp.style.display = showBtn ? 'block' : 'none';
  if (expGrp) expGrp.style.display = showExp ? 'block' : 'none';
  if (customExtras) customExtras.style.display = (t === 'custom') ? 'block' : 'none';
}

function adminPpUploadImage() {
  document.getElementById('admPpFileInput')?.click();
}

function adminPpPreviewImage(url) {
  const prev = document.getElementById('admPpImagePreview');
  if (!prev) return;
  if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
    prev.innerHTML = '<img src="'+url+'" style="max-height:80px;border-radius:8px;border:1px solid var(--border)">';
    prev.style.display = 'block';
  } else { prev.style.display = 'none'; }
}

async function adminPpHandleImageUpload(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast('الصورة كبيرة جداً (الحد 5MB)', 'error'); return; }
  const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
  showToast('🔄 جاري رفع الصورة...', 'info');
  const url = await uploadToImgbb(dataUrl);
  if (!url) return;
  document.getElementById('admMktPpImage').value = url;
  const preview = document.getElementById('admPpImagePreview');
  if (preview) { preview.innerHTML = '<img src="'+url+'" style="max-height:80px;border-radius:8px;border:1px solid var(--border)">'; preview.style.display = 'block'; }
  showToast('✅ تم رفع الصورة بنجاح', 'success');
  input.value = '';
}

function adminPpTestPreview() {
  const title = document.getElementById('admMktPpTitle')?.value || '';
  const text = document.getElementById('admMktPpText')?.value || '';
  const code = document.getElementById('admMktPpCode')?.value || '';
  const pct = document.getElementById('admMktPpPercent')?.value || '';
  const btnText = document.getElementById('admMktPpBtnText')?.value || '';
  const btnLink = document.getElementById('admMktPpBtnLink')?.value || '';
  const bg = document.getElementById('admMktPpBg')?.value || '#ffffff';
  const tc = document.getElementById('admMktPpTextColor')?.value || '#0f172a';
  const ac = document.getElementById('admMktPpAccent')?.value || '#ef4444';
  const bb = document.getElementById('admMktPpBtnBg')?.value || '#ef4444';
  const bc = document.getElementById('admMktPpBtnColor')?.value || '#ffffff';
  const type = document.getElementById('admMktPpType')?.value || 'discount';
  const pos = document.getElementById('admMktPpPos')?.value || 'center';
  const sz = document.getElementById('admMktPpSize')?.value || 'medium';
  const anim = document.getElementById('admMktPpAnim')?.value || 'bounce';
  const delay = parseInt(document.getElementById('admMktPpDelay')?.value) || 0;
  const image = document.getElementById('admMktPpImage')?.value || '';
  const customHtml = document.getElementById('admMktPpCustomHtml')?.value || '';
  const customIcon = document.getElementById('admMktPpCustomIcon')?.value || '';

  const dummy = { show: true, type, title, text, code, discountPercent: parseInt(pct) || 0, image, btnText, btnLink, bgColor: bg, textColor: tc, accentColor: ac, btnBg: bb, btnColor: bc, position: pos, size: sz, animation: anim, delay, showClose: true, closeOutside: true, expiresAt: 0, customHtml, customIcon };
  sessionStorage.removeItem('promoPopupShown');
  renderPromoPopup(dummy);
  document.getElementById('promoPopupModal').style.display = 'flex';
}

function adminSaveSpinWheel() {
  const enabled = document.getElementById('admMktSpinWinShow')?.checked || false;
  const data = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  data.spinWin = data.spinWin || { show: false, segments: [] };
  data.spinWin.show = enabled;
  try { localStorage.setItem('mycart_marketing', JSON.stringify(data)); } catch(e) { showToast('مساحة التخزين ممتلئة', 'error'); return; }
  updateSwStats();
  showToast(enabled ? 'تم تفعيل عجلة الحظ 🎡' : 'تم إيقاف عجلة الحظ', 'success');
}

function adminRenderSectionOrderItems(data) {
  const order = (data.sectionOrder || ['banner','offers','flashSale','featured','newArrival','halfPrice','mostSold']).filter(function(s) { return s !== 'couponDetector'; });
  const labels = {
    banner: { label: '🖼️ البانرات', desc: 'البانرات الإعلانية' },
    offers: { label: '🎁 العروض الخاصة', desc: 'المنتضمن ضمن العروض' },
    flashSale: { label: '⚡ تخفيضات سريعة', desc: 'منتجات بخصم 20%+' },
    featured: { label: '💎 منتجات مميزة', desc: 'المنتجات الموسومة بمميز' },
    newArrival: { label: '🔖 وصل حديثاً', desc: 'أحدث المنتجات المضافة' },
    halfPrice: { label: '💰 نصف السعر', desc: 'المنتجات المخفضة 50%+' },
    mostSold: { label: '🔥 الأكثر مبيعاً', desc: 'المنتجات الأكثر مبيعاً' }
  };
  return order.filter(function(sid) { return sid !== 'couponDetector'; }).map(function(sid, idx) {
    var sec = labels[sid];
    if (!sec) return '';
    var showKey = sid === 'flashSale' ? 'flashSales' : sid === 'offers' ? 'offersSection' : sid;
    var showVal = (data[showKey] || {}).show !== false;
    return '<div class="section-order-item" data-id="' + sid + '" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:10px;cursor:grab;transition:all .2s;box-shadow:0 1px 4px rgba(0,0,0,.04)">' +
      '<span style="color:var(--text-muted);font-size:.85rem;cursor:move;flex-shrink:0"><i class="fa-solid fa-grip-vertical"></i></span>' +
      '<span style="font-size:.72rem;color:var(--text-muted);background:var(--card);padding:2px 8px;border-radius:6px;min-width:22px;text-align:center;font-weight:700;flex-shrink:0">' + (idx+1) + '</span>' +
      '<span style="flex:1;font-size:.8rem;font-weight:700">' + sec.label + '</span>' +
      '<span style="font-size:.68rem;color:var(--text-muted);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + sec.desc + '</span>' +
      '<label style="display:flex;align-items:center;gap:4px;cursor:pointer;flex-shrink:0;font-size:.7rem;font-weight:600">' +
      '<input type="checkbox" class="section-toggle" data-section="' + sid + '" data-showkey="' + showKey + '" ' + (showVal ? 'checked' : '') + ' style="width:14px;height:14px;accent-color:var(--accent)">' +
      '<span>' + (showVal ? 'مفعل' : 'معطل') + '</span>' +
      '</label>' +
      '</div>';
  }).join('');
}

function moveSection(direction) {
  var container = document.getElementById('sectionOrderList');
  if (!container) return;
  var items = Array.from(container.querySelectorAll('.section-order-item'));
  var selected = items.find(function(item) { return item.style.outline === '2px solid var(--accent)'; });
  if (!selected) selected = items[0];
  var idx = items.indexOf(selected);
  if (idx < 0) return;
  var newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= items.length) return;
  container.insertBefore(items[newIdx], selected);
  items.forEach(function(it) { it.style.outline = 'none'; });
  selected.style.outline = '2px solid var(--accent)';
  selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function saveSectionOrder() {
  var container = document.getElementById('sectionOrderList');
  if (!container) return;
  var items = container.querySelectorAll('.section-order-item');
  var order = Array.from(items).map(function(item) { return item.dataset.id; });
  var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  mkt.sectionOrder = order;
  try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) {}
  var status = document.getElementById('sectionOrderStatus');
  if (status) { status.textContent = '✓ تم حفظ الترتيب بنجاح'; status.style.display = 'block'; status.style.color = '#22c55e'; setTimeout(function() { status.style.display = 'none'; }, 2000); }
  showToast('✓ تم حفظ ترتيب الأقسام', 'success');
}

function adminInitSectionToggles() {
  setTimeout(function() {
    var container = document.getElementById('sectionOrderList');
    if (!container) return;
    container.querySelectorAll('.section-toggle').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var sectionId = this.dataset.section;
        var showKey = this.dataset.showkey || sectionId;
        var isChecked = this.checked;
        var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
        if (!mkt[showKey]) mkt[showKey] = {};
        mkt[showKey].show = isChecked;
        try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) {}
        var label = this.closest('.section-order-item').querySelector('span:last-child');
        if (label) { label.textContent = isChecked ? 'مفعل' : 'معطل'; label.style.color = isChecked ? '#22c55e' : '#94a3b8'; }
        if (typeof renderProducts === 'function') renderProducts(getFilteredProducts());
        if (typeof initFlashSales === 'function') initFlashSales();
      });
    });
  }, 100);
}

// ===== PAGE BUILDER PROFESSIONAL =====
(function(){ if (!document.getElementById('pbStyles')) { var s = document.createElement('style'); s.id = 'pbStyles'; s.textContent =
'.pb-section-item:hover{border-color:var(--accent)!important;box-shadow:0 4px 16px rgba(0,0,0,.08)!important}'+
'.pb-section-item.dragging{opacity:.4;background:#f1f5f9!important}'+
'.pb-section-item.drag-over{border-color:var(--accent)!important;border-style:dashed!important;background:rgba(239,68,68,.04)!important}'+
'#pbSectionList .pb-section-item:last-child{margin-bottom:0}'+
'.pb-type-option:hover{background:var(--bg)!important;border-color:var(--accent)!important;transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.06)}'+
'.pb-field{margin-bottom:14px;display:flex;flex-direction:column;gap:4px}'+
'.pb-field-label{font-size:.78rem;font-weight:700;color:var(--text);margin-bottom:2px}'+
'.pb-field-input{padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.83rem;background:#fff;color:var(--text);transition:border-color .2s;outline:none;width:100%;box-sizing:border-box}'+
'.pb-field-input:focus{border-color:var(--accent)}'+
'.pb-field-textarea{resize:vertical;min-height:80px;line-height:1.6}'+
'.pb-field-select{cursor:pointer}'+
'.pb-field-checkbox{width:18px;height:18px;accent-color:var(--accent);cursor:pointer}'+
'.pb-items-container .pb-item-row:last-child{margin-bottom:0}'+
'.pb-item-row:hover{border-color:var(--accent)!important}'+
'.pb-item-row .pb-field{margin-bottom:6px}'+
'.pb-item-row .pb-field:last-child{margin-bottom:0}'+
'.pb-item-row .pb-field-label{font-size:.72rem}'+
'.pb-item-row .pb-field-input{font-size:.78rem;padding:8px 10px}'+
'.pb-item-row img{max-height:50px!important;border-radius:6px}'+
'.pb-color-val{direction:ltr;display:inline-block}'+
'@keyframes pbMarqueePreview{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}'+
'@keyframes pbLogosPreview{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}'+
'@media(max-width:640px){#admin-marketing .admin-card>div:first-child{flex-direction:column;align-items:stretch!important;gap:10px}}'; document.head.appendChild(s); } })();
// Registry of all custom section types
var PB_SECTION_TYPES = {
  hero: { icon: '🏆', label: 'هيرو / بانر رئيسي', desc: 'بانر كامل مع نص وزر', color: '#fef2f2' },
  banner: { icon: '🖼️', label: 'بانر صور', desc: 'صورة مع رابط', color: '#f0fdf4' },
  text: { icon: '📝', label: 'نص / محتوى', desc: 'نص منسق مع عنوان', color: '#f8fafc' },
  spacer: { icon: '➖', label: 'فاصل / مسافة', desc: 'مسافة رأسية أو خط فاصل', color: '#f1f5f9' },
  divider: { icon: '〰️', label: 'خط فاصل', desc: 'خط أفقي مع نص', color: '#f8fafc' },
  gallery: { icon: '🖼️', label: 'معرض صور', desc: 'شبكة صور متعددة', color: '#fdf2f8' },
  video: { icon: '🎬', label: 'فيديو', desc: 'يوتيوب / فيميو / مباشر', color: '#fefce8' },
  countdown: { icon: '⏳', label: 'عد تنازلي', desc: 'مؤقت لفترة ترويجية', color: '#fff7ed' },
  testimonials: { icon: '💬', label: 'آراء العملاء', desc: 'شهادات وتقييمات', color: '#f0fdf4' },
  features: { icon: '⭐', label: 'مميزات', desc: 'مربعات مميزات بأيقونات', color: '#faf5ff' },
  newsletter: { icon: '📧', label: 'اشتراك بريد', desc: 'نموذج اشتراك إيميل', color: '#ecfdf5' },
  products: { icon: '🏷️', label: 'منتجات مخصصة', desc: 'عرض منتجات محددة', color: '#fff7ed' },
  categories: { icon: '📂', label: 'تصنيفات', desc: 'شبكة تصنيفات', color: '#fef2f2' },
  faq: { icon: '❓', label: 'أسئلة شائعة', desc: 'قائمة أسئلة وأجوبة', color: '#f8fafc' },
  contact: { icon: '📞', label: 'اتصل بنا', desc: 'معلومات تواصل + خريطة', color: '#f0f9ff' },
  social: { icon: '🔗', label: 'روابط التواصل', desc: 'أيقونات وسائل التواصل', color: '#fdf4ff' },
  html: { icon: '</>', label: 'HTML مخصص', desc: 'كود HTML / iframe', color: '#fefce8' },
  marquee: { icon: '📜', label: 'نص متحرك', desc: 'شريط نص متحرك مستمر', color: '#fff7ed' },
  logos: { icon: '🏢', label: 'شعارات متحركة', desc: 'شريط شعارات وعلامات تجارية', color: '#f0f9ff' },
  counters: { icon: '📊', label: 'إحصائيات', desc: 'أرقام إحصائية متحركة', color: '#fefce8' },
  trust: { icon: '🛡️', label: 'شريط ثقة', desc: 'شارات ضمان وثقة المتجر', color: '#f0fdf4' },
  table: { icon: '📋', label: 'جدول', desc: 'جدول بيانات / مقاسات', color: '#f8fafc' }
};

function adminRenderPageBuilder(data) {
  // Remove couponDetector from section order if present
  if (data.sectionOrder) data.sectionOrder = data.sectionOrder.filter(function(s) { return s !== 'couponDetector'; });
  var order = data.sectionOrder || ['banner','offers','flashSale','featured','newArrival','halfPrice','mostSold'];
  const customSections = data.customSections || [];
  window._pbCustomSections = JSON.parse(JSON.stringify(customSections));
  // Ensure all custom sections are in the order list
  window._pbCustomSections.forEach(function(cs) {
    if (order.indexOf(cs._id) === -1) order.push(cs._id);
  });
  
  const labels = {
    banner: { icon: '🖼️', label: 'البانرات', desc: 'البانرات الإعلانية' },
    offers: { icon: '🎁', label: 'العروض الخاصة', desc: 'المنتجات ضمن العروض' },
    flashSale: { icon: '⚡', label: 'تخفيضات سريعة', desc: 'منتجات بخصم 20%+' },
    featured: { icon: '💎', label: 'منتجات مميزة', desc: 'المنتجات الموسومة بمميز' },
    newArrival: { icon: '🔖', label: 'وصل حديثاً', desc: 'أحدث المنتجات المضافة' },
    halfPrice: { icon: '💰', label: 'نصف السعر', desc: 'المنتجات المخفضة 50%+' },
    mostSold: { icon: '🔥', label: 'الأكثر مبيعاً', desc: 'المنتجات الأكثر مبيعاً' }
  };

  function renderItemHtml(sid, idx, isCustom, extra, editIdx) {
    if (isCustom) {
      var c = extra || {};
      var eIdx = editIdx != null ? editIdx : idx;
      var info = PB_SECTION_TYPES[c.type] || { icon: '📄', label: 'قسم', desc: '' };
      return '<div class="pb-section-item" data-id="' + sid + '" draggable="true" style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(135deg,' + (info.color||'#f8fafc') + ',#fff);border:1.5px dashed var(--accent);border-radius:12px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:all .2s">' +
        '<span style="color:var(--text-muted);font-size:1rem;cursor:grab;flex-shrink:0"><i class="fa-solid fa-grip-vertical"></i></span>' +
        '<span style="font-size:.72rem;color:var(--text-muted);background:#fff;padding:2px 8px;border-radius:6px;min-width:22px;text-align:center;font-weight:700;flex-shrink:0">' + (idx+1) + '</span>' +
        '<span style="font-size:1.2rem;flex-shrink:0">' + info.icon + '</span>' +
        '<span style="flex:1;font-size:.85rem;font-weight:700">' + (c.title || info.label) + '</span>' +
        '<span style="font-size:.7rem;color:var(--text-muted);padding:2px 8px;background:#fff;border-radius:4px;font-weight:600">' + info.label + '</span>' +
        '<span style="font-size:.7rem;color:' + (c._visible !== false ? '#22c55e' : '#94a3b8') + ';font-weight:600;flex-shrink:0">' + (c._visible !== false ? 'نشط' : 'متوقف') + '</span>' +
        '<button onclick="adminEditCustomSection(' + eIdx + ')" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:.85rem;padding:4px" title="تعديل"><i class="fa-solid fa-pen-to-square"></i></button>' +
        '<button onclick="adminToggleCustomSection(' + eIdx + ')" style="background:none;border:none;color:' + (c._visible !== false ? '#f59e0b' : '#22c55e') + ';cursor:pointer;font-size:.85rem;padding:4px" title="' + (c._visible !== false ? 'إخفاء' : 'إظهار') + '"><i class="fa-solid ' + (c._visible !== false ? 'fa-eye-slash' : 'fa-eye') + '"></i></button>' +
        '<button onclick="adminDuplicateCustomSection(' + eIdx + ')" style="background:none;border:none;color:#8b5cf6;cursor:pointer;font-size:.85rem;padding:4px" title="نسخ"><i class="fa-solid fa-copy"></i></button>' +
        '<button onclick="adminDeleteCustomSection(' + eIdx + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.85rem;padding:4px" title="حذف"><i class="fa-solid fa-trash-can"></i></button>' +
        '</div>';
    }
    var sec = labels[sid] || { icon: '📄', label: sid, desc: '' };
    var showKey = sid === 'flashSale' ? 'flashSales' : sid === 'offers' ? 'offersSection' : sid;
    var showVal = (data[showKey] || {}).show !== false;
    return '<div class="pb-section-item" data-id="' + sid + '" draggable="true" style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--card);border:1px solid var(--border);border-radius:12px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:all .2s">' +
      '<span style="color:var(--text-muted);font-size:1rem;cursor:grab;flex-shrink:0"><i class="fa-solid fa-grip-vertical"></i></span>' +
      '<span style="font-size:.72rem;color:var(--text-muted);background:var(--bg);padding:2px 8px;border-radius:6px;min-width:22px;text-align:center;font-weight:700;flex-shrink:0">' + (idx+1) + '</span>' +
      '<span style="font-size:1.2rem;flex-shrink:0">' + sec.icon + '</span>' +
      '<span style="flex:1;font-size:.85rem;font-weight:700">' + sec.label + '</span>' +
      '<span style="font-size:.7rem;color:var(--text-muted);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + sec.desc + '</span>' +
      '<button onclick="adminEditBuiltinSection(\'' + sid + '\')" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:.85rem;padding:4px" title="تعديل العنوان"><i class="fa-solid fa-pen-to-square"></i></button>' +
      '<label style="display:flex;align-items:center;gap:4px;cursor:pointer;flex-shrink:0;font-size:.72rem;font-weight:600">' +
      '<input type="checkbox" class="pb-section-toggle" data-section="' + sid + '" data-showkey="' + showKey + '" ' + (showVal ? 'checked' : '') + ' style="width:15px;height:15px;accent-color:var(--accent)">' +
      '<span>' + (showVal ? 'مفعل' : 'معطل') + '</span>' +
      '</label>' +
      '</div>';
  }

  var itemsHtml = '';
  order.forEach(function(sid, idx) {
    if (sid.startsWith('_custom_')) {
      var cIdx = parseInt(sid.replace('_custom_', ''));
      var c = window._pbCustomSections[cIdx];
      if (c) itemsHtml += renderItemHtml(sid, idx, true, c, cIdx);
    } else {
      itemsHtml += renderItemHtml(sid, idx, false, null);
    }
  });

  // Build add-section type selector dropdown
  var typeOpts = '';
  for (var t in PB_SECTION_TYPES) {
    var info = PB_SECTION_TYPES[t];
    typeOpts += '<div class="pb-type-option" onclick="adminAddCustomSection(\'' + t + '\')" style="display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:all .2s;background:var(--card);font-size:.8rem;font-weight:600">' +
      '<span style="font-size:1.1rem">' + info.icon + '</span>' +
      '<div style="flex:1"><div>' + info.label + '</div><div style="font-size:.65rem;font-weight:400;color:var(--text-muted)">' + info.desc + '</div></div>' +
      '<span style="color:var(--text-muted);font-size:.7rem"><i class="fa-solid fa-plus-circle"></i></span></div>';
  }

  return '<div class="admin-settings-grid" style="grid-template-columns:1fr">' +
    '<div class="admin-card" style="grid-column:1/-1">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">' +
    '<div><h4 style="font-size:.95rem;font-weight:800"><i class="fa-solid fa-pen-ruler"></i> منشئ الصفحة الرئيسية</h4>' +
    '<p style="font-size:.75rem;color:var(--text-muted);margin:2px 0 0">اسحب الأقسام لترتيبها. أضف أقسام مخصصة متعددة الأنواع.</p></div>' +
    '<button onclick="adminShowAddSectionPicker()" class="admin-btn admin-btn-primary" style="padding:8px 18px;font-size:.8rem"><i class="fa-solid fa-plus"></i> إضافة قسم جديد</button>' +
    '</div>' +
    '<div id="pbSectionList">' + itemsHtml + '</div>' +
    (itemsHtml ? '' : '<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:.85rem"><i class="fa-solid fa-layer-group" style="font-size:2rem;display:block;margin-bottom:12px;opacity:.3"></i> لا توجد أقسام مخصصة بعد.<br>اضغط "إضافة قسم جديد" للبدء.</div>') +
    '<div style="display:flex;gap:8px;margin-top:16px">' +
    '<button onclick="adminSavePageBuilder()" style="padding:10px 24px;border:none;border-radius:10px;background:var(--accent);color:#fff;cursor:pointer;font-family:inherit;font-size:.85rem;font-weight:800"><i class="fa-solid fa-check"></i> حفظ التغييرات</button>' +
    '<button onclick="adminResetPageBuilder()" style="padding:10px 20px;border:1px solid #ef4444;border-radius:10px;background:transparent;color:#ef4444;cursor:pointer;font-family:inherit;font-size:.8rem;font-weight:700"><i class="fa-solid fa-rotate-left"></i> إعادة تعيين</button>' +
    '</div>' +
    '<p id="pbStatus" style="font-size:.8rem;color:var(--text-muted);display:none;margin-top:8px"></p>' +
    '</div></div>';
}

function pbUploadImage(btn) {
  var input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = function() {
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = async function(e) {
      var dataUrl = e.target.result;
      showToast('جاري رفع الصورة...', 'info');
      var url = await uploadToImgbb(dataUrl);
      if (!url) { showToast('فشل رفع الصورة', 'error'); return; }
      var i = btn.previousElementSibling;
      i.value = url;
      var p = i.closest('.pb-field').querySelector('img');
      if (p) { p.src = url; } else {
        var im = document.createElement('img');
        im.style.cssText = 'max-height:80px;border-radius:8px;border:1px solid var(--border);display:block;margin-bottom:6px';
        im.src = url;
        i.parentElement.parentElement.insertBefore(im, i.parentElement);
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function adminRenderPBField(name, label, value, type, extra) {
  var v = (value !== undefined && value !== null) ? String(value).replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;') : '';
  var e = extra || {};
  if (type === 'text') {
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><input type="text" class="pb-field-input" data-field="' + name + '" value="' + v + '" placeholder="' + (e.placeholder||'') + '"></div>';
  } else if (type === 'textarea') {
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><textarea class="pb-field-input pb-field-textarea" data-field="' + name + '" rows="' + (e.rows||4) + '" placeholder="' + (e.placeholder||'') + '">' + v + '</textarea></div>';
  } else if (type === 'number') {
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><input type="number" class="pb-field-input" data-field="' + name + '" value="' + v + '" min="' + (e.min||0) + '" max="' + (e.max||9999) + '" style="width:120px"></div>';
  } else if (type === 'datetime-local') {
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><input type="datetime-local" class="pb-field-input" data-field="' + name + '" value="' + v + '" style="padding:8px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem"></div>';
  } else if (type === 'color') {
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><div style="display:flex;align-items:center;gap:8px"><input type="color" class="pb-field-input" data-field="' + name + '" value="' + (v||'#ffffff') + '" style="width:45px;height:35px;padding:0;border:1px solid var(--border);border-radius:6px;cursor:pointer"><span class="pb-color-val" style="font-size:.7rem;color:var(--text-muted)">' + (v||'#ffffff') + '</span></div></div>';
  } else if (type === 'image') {
    var img = value ? '<img src="' + value.replace(/"/g,'&quot;') + '" style="max-height:80px;border-radius:8px;border:1px solid var(--border);display:block;margin-bottom:6px">' : '';
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label>' + img + '<div style="display:flex;gap:4px"><input type="text" class="pb-field-input" data-field="' + name + '" value="' + v + '" placeholder="' + (e.placeholder||'رابط الصورة') + '" style="flex:1"><button type="button" onclick="pbUploadImage(this)" style="padding:6px 12px;background:var(--accent);color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:.7rem"><i class="fa-solid fa-upload"></i></button></div></div>';
  } else if (type === 'select') {
    var opts = (e.options||[]).map(function(o) { return '<option value="' + o.value + '" ' + (value==o.value?'selected':'') + '>' + o.label + '</option>'; }).join('');
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><select class="pb-field-input pb-field-select" data-field="' + name + '" style="padding:10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem;background:var(--card);color:var(--text);max-width:300px">' + opts + '</select></div>';
  } else if (type === 'multiselect') {
    var opts = e.options || [];
    var vals = value ? String(value).split(',').map(function(s) { return s.trim(); }) : [];
    var btnText = vals.length > 0 ? vals.length + ' مختارة' : 'اختر...';
    var hiddenId = 'ms_' + name + '_' + Math.random().toString(36).substring(2, 7);
    return '<div class="pb-field"><label class="pb-field-label">' + label + '</label><div style="display:flex;align-items:center;gap:8px">' +
      '<input type="hidden" id="' + hiddenId + '" data-field="' + name + '" value="' + (value || '') + '">' +
      '<button type="button" onclick="adminOpenMultiPicker(\'' + hiddenId + '\',\'' + label.replace(/'/g,"\\'") + '\',\'' + encodeURIComponent(JSON.stringify(opts)) + '\')" style="flex:1;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;background:var(--card);cursor:pointer;font-family:inherit;font-size:.82rem;color:var(--text);text-align:right;display:flex;align-items:center;justify-content:space-between;transition:border-color .2s" onmouseenter="this.style.borderColor=\'var(--accent)\'" onmouseleave="this.style.borderColor=\'\'">' +
      '<span id="' + hiddenId + '_label" style="color:' + (vals.length > 0 ? 'var(--text)' : 'var(--text-muted)') + '">' + btnText + '</span>' +
      '<span style="color:var(--text-muted);font-size:.75rem"><i class="fa-solid fa-chevron-down"></i></span></button></div></div>';
  } else if (type === 'checkbox') {
    return '<div class="pb-field" style="flex-direction:row;align-items:center;gap:10px"><label class="pb-field-label" style="margin-bottom:0;flex:1">' + label + '</label><input type="checkbox" class="pb-field-checkbox" data-field="' + name + '" ' + (value ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--accent)"></div>';
  } else if (type === 'section') {
    return '<div style="font-size:.9rem;font-weight:800;padding:10px 0 6px;border-bottom:2px solid var(--accent);margin-bottom:12px;color:var(--text)">' + label + '</div>';
  } else if (type === 'items') {
    var items = Array.isArray(value) ? value : [];
    var itemFields = e.itemFields || [{name:'text',label:'النص',type:'text'}];
    var itemHtml = items.map(function(item, i) {
      var fields = itemFields.map(function(f) {
        return adminRenderPBField(f.name, f.label, item[f.name], f.type, f.extra||{});
      }).join('');
      return '<div class="pb-item-row" data-index="' + i + '" style="display:grid;grid-template-columns:1fr auto;gap:6px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;background:var(--bg)">' +
        '<div style="display:contents">' + fields + '</div>' +
        '<div style="display:flex;align-items:flex-end;gap:2px;padding-bottom:2px">' +
        '<button type="button" onclick="var p=this.closest(\'.pb-item-row\');var l=p.parentElement;var i=Array.from(l.children).indexOf(p);adminDeletePBItem(l.dataset.field,i)" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.85rem;padding:3px" title="حذف"><i class="fa-solid fa-trash-can"></i></button>' +
        '<button type="button" onclick="var p=this.closest(\'.pb-item-row\');var l=p.parentElement;var i=Array.from(l.children).indexOf(p);if(i>0){l.insertBefore(p,l.children[i-1])}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.75rem;padding:3px" title="لأعلى"><i class="fa-solid fa-chevron-up"></i></button>' +
        '<button type="button" onclick="var p=this.closest(\'.pb-item-row\');var l=p.parentElement;var i=Array.from(l.children).indexOf(p);if(i<l.children.length-1){l.insertBefore(l.children[i+1],p)}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.75rem;padding:3px" title="لأسفل"><i class="fa-solid fa-chevron-down"></i></button></div></div>';
    }).join('');
    return '<div class="pb-field" data-field="' + name + '"><label class="pb-field-label">' + label + '</label><div class="pb-items-container" data-field="' + name + '">' + itemHtml + '</div>' +
      '<button type="button" onclick="adminAddPBItem(\'' + name + '\')" style="padding:6px 14px;border:1px dashed var(--border);border-radius:8px;background:transparent;cursor:pointer;font-size:.75rem;font-weight:600;color:var(--text-muted);font-family:inherit;margin-top:2px"><i class="fa-solid fa-plus"></i> إضافة ' + (e.addLabel||'عنصر') + '</button></div>';
  }
  return '';
}

function adminToggleGalleryFields(layout, idx) {
  var container = document.getElementById('pbEditFields_' + idx);
  if (!container) return;
  var show = {};
  if (layout === 'grid') { show.columns = 1; show.aspectRatio = 1; show.imageHeight = 1; show.gap = 1; show.lightbox = 1; show.autoPlay = 0; show.interval = 0; }
  else if (layout === 'slider') { show.columns = 0; show.aspectRatio = 1; show.imageHeight = 1; show.gap = 1; show.lightbox = 1; show.autoPlay = 1; show.interval = 1; }
  else if (layout === 'carousel') { show.columns = 1; show.aspectRatio = 1; show.imageHeight = 1; show.gap = 1; show.lightbox = 1; show.autoPlay = 1; show.interval = 1; }
  else if (layout === 'masonry') { show.columns = 0; show.aspectRatio = 1; show.imageHeight = 0; show.gap = 1; show.lightbox = 1; show.autoPlay = 0; show.interval = 0; }
  Object.keys(show).forEach(function(name) {
    var el = container.querySelector('[data-field="' + name + '"]');
    if (el) {
      var pb = el.closest('.pb-field');
      if (pb) pb.style.display = show[name] ? '' : 'none';
    }
  });
}

function adminGetPBFields(section) {
  var t = section.type;
  var fields = [];
  if (t === 'hero') {
    fields = [
      { name:'title', label:'العنوان الرئيسي', type:'text', placeholder:'عنوان البانر' },
      { name:'subtitle', label:'النص الفرعي', type:'text', placeholder:'نص توضيحي قصير' },
      { name:'content', label:'وصف إضافي', type:'textarea', rows:2, placeholder:'...' },
      { name:'btnText', label:'نص الزر', type:'text' },
      { name:'btnLink', label:'رابط الزر', type:'text', placeholder:'https://...' },
      { name:'bgImage', label:'صورة الخلفية', type:'image' },
      { name:'bgColor', label:'لون الخلفية', type:'color' },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'overlay', label:'طبقة تعتيم', type:'checkbox' },
      { name:'height', label:'الارتفاع (بكسل)', type:'number', min:200, max:800 },
      { name:'btnStyle', label:'نوع الزر', type:'select', options:[{value:'fill',label:'مملوء'},{value:'outline',label:'مفرغ'},{value:'underline',label:'خط فقط'}] }
    ];
  } else if (t === 'banner') {
    fields = [
      { name:'image', label:'صورة البانر', type:'image' },
      { name:'link', label:'رابط الضغط', type:'text', placeholder:'https://...' },
      { name:'alt', label:'نص بديل', type:'text' },
      { name:'borderRadius', label:'استدارة الزوايا', type:'number', min:0, max:50 }
    ];
  } else if (t === 'text') {
    fields = [
      { name:'title', label:'العنوان', type:'text' },
      { name:'content', label:'المحتوى (يدعم HTML)', type:'textarea', rows:6 },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'textAlign', label:'محاذاة النص', type:'select', options:[{value:'right',label:'يمين'},{value:'center',label:'وسط'},{value:'left',label:'يسار'}] },
      { name:'textSize', label:'حجم الخط', type:'select', options:[{value:'sm',label:'صغير'},{value:'md',label:'متوسط'},{value:'lg',label:'كبير'}] }
    ];
  } else if (t === 'spacer') {
    fields = [
      { name:'height', label:'الارتفاع (بكسل)', type:'number', min:5, max:300 }
    ];
  } else if (t === 'divider') {
    fields = [
      { name:'text', label:'نص على الخط', type:'text' },
      { name:'lineColor', label:'لون الخط', type:'color' },
      { name:'lineStyle', label:'نوع الخط', type:'select', options:[{value:'solid',label:'متصل'},{value:'dashed',label:'متقطع'},{value:'dotted',label:'منقط'}] },
      { name:'thickness', label:'سماكة الخط', type:'number', min:1, max:10 }
    ];
  } else if (t === 'gallery') {
    fields = [
      { name:'images', label:'الصور', type:'items', itemFields:[{name:'src',label:'الصورة',type:'image'},{name:'link',label:'رابط (اختياري)',type:'text'},{name:'caption',label:'شرح (اختياري)',type:'text'}], addLabel:'صورة' },
      { name:'layout', label:'الشكل', type:'select', options:[{value:'grid',label:'شبكة'},{value:'carousel',label:'كاروسيل'},{value:'slider',label:'سلايدر'},{value:'masonry',label:'ماسونري'}] },
      { name:'columns', label:'الأعمدة', type:'select', options:[{value:'2',label:'2'},{value:'3',label:'3'},{value:'4',label:'4'},{value:'5',label:'5'},{value:'6',label:'6'}] },
      { name:'aspectRatio', label:'نسبة الصورة', type:'select', options:[{value:'3/2',label:'3:2'},{value:'4/3',label:'4:3'},{value:'16/9',label:'16:9'},{value:'1/1',label:'مربع'},{value:'free',label:'حسب الصورة'}] },
      { name:'imageHeight', label:'الارتفاع', type:'number', min:80, max:500 },
      { name:'gap', label:'الفراغ', type:'number', min:0, max:30 },
      { name:'lightbox', label:'تكبير عند الضغط', type:'checkbox' },
      { name:'autoPlay', label:'تشغيل تلقائي', type:'checkbox' },
      { name:'interval', label:'الفاصل (ثواني)', type:'number', min:1, max:15 }
    ];
    if (section.layout === 'slider') fields = fields.filter(function(f) { return f.name !== 'columns'; });
    if (section.layout === 'grid') fields = fields.filter(function(f) { return f.name !== 'autoPlay' && f.name !== 'interval'; });
    if (section.layout === 'masonry') fields = fields.filter(function(f) { return f.name !== 'columns' && f.name !== 'imageHeight' && f.name !== 'autoPlay' && f.name !== 'interval'; });
  } else if (t === 'video') {
    fields = [
      { name:'url', label:'رابط الفيديو (YouTube/Vimeo)', type:'text', placeholder:'https://youtube.com/watch?v=...' },
      { name:'autoplay', label:'تشغيل تلقائي', type:'checkbox' },
      { name:'muted', label:'صامت', type:'checkbox' },
      { name:'controls', label:'إظهار عناصر التحكم', type:'checkbox' },
      { name:'loop', label:'تكرار', type:'checkbox' },
      { name:'ratio', label:'نسبة العرض للارتفاع', type:'select', options:[{value:'56.25',label:'16:9'},{value:'75',label:'4:3'},{value:'100',label:'1:1'}] }
    ];
  } else if (t === 'countdown') {
    fields = [
      { name:'title', label:'العنوان', type:'text' },
      { name:'timerType', label:'نوع المؤقت', type:'select', options:[{value:'fixed',label:'تاريخ محدد'},{value:'duration',label:'مدة من الآن'}] },
      { name:'endDate', label:'تاريخ الانتهاء', type:'datetime-local' },
      { name:'duration', label:'المدة (بالساعات)', type:'number', min:1, max:720, extra:{min:1} },
      { name:'message', label:'رسالة عند الانتهاء', type:'text' },
      { name:'bgType', label:'نوع الخلفية', type:'select', options:[{value:'color',label:'لون'},{value:'image',label:'صورة'},{value:'transparent',label:'شفاف'}] },
      { name:'bgColor', label:'لون الخلفية', type:'color' },
      { name:'bgImage', label:'صورة الخلفية', type:'image' },
      { name:'overlay', label:'طبقة تعتيم على الصورة', type:'checkbox' },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'accentColor', label:'لون التمييز', type:'color' },
      { name:'layout', label:'ترتيب الأرقام', type:'select', options:[{value:'row',label:'صف أفقي'},{value:'column',label:'عمودي'},{value:'grid',label:'شبكة 2×2'}] },
      { name:'animation', label:'أنيميشن عند تغير الأرقام', type:'checkbox' },
      { name:'showDays', label:'إظهار الأيام', type:'checkbox' },
      { name:'showHours', label:'إظهار الساعات', type:'checkbox' },
      { name:'showMinutes', label:'إظهار الدقائق', type:'checkbox' },
      { name:'showSeconds', label:'إظهار الثواني', type:'checkbox' }
    ];
  } else if (t === 'testimonials') {
    fields = [
      { name:'items', label:'الآراء', type:'items', itemFields:[
        {name:'name',label:'الاسم',type:'text'},
        {name:'role',label:'الدور/المنصب',type:'text'},
        {name:'avatar',label:'الصورة الشخصية',type:'image'},
        {name:'text',label:'نص الرأي',type:'textarea',rows:3},
        {name:'rating',label:'التقييم (1-5)',type:'number',min:1,max:5}
      ], addLabel:'رأي' },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'autoplay', label:'تشغيل تلقائي (كاروسيل)', type:'checkbox' }
    ];
  } else if (t === 'features') {
    fields = [
      { name:'items', label:'المميزات', type:'items', itemFields:[
        {name:'icon',label:'رمز (FontAwesome أو إيموجي)',type:'text',placeholder:'fa-star أو ⭐'},
        {name:'title',label:'العنوان',type:'text'},
        {name:'desc',label:'الوصف',type:'textarea',rows:2}
      ], addLabel:'ميزة' },
      { name:'columns', label:'عدد الأعمدة', type:'select', options:[{value:'2',label:'2'},{value:'3',label:'3'},{value:'4',label:'4'}] },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'iconColor', label:'لون الأيقونات', type:'color' },
      { name:'showBorder', label:'إظهار حدود', type:'checkbox' }
    ];
  } else if (t === 'newsletter') {
    fields = [
      { name:'title', label:'العنوان', type:'text' },
      { name:'subtitle', label:'النص التوضيحي', type:'text' },
      { name:'btnText', label:'نص الزر', type:'text' },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'accentColor', label:'لون الزر', type:'color' },
      { name:'icon', label:'الأيقونة', type:'text', placeholder:'📧' },
      { name:'placeholder', label:'نص الحقل', type:'text' }
    ];
  } else if (t === 'products') {
    fields = [
      { name:'_sec1', label:'عام', type:'section' },
      { name:'mode', label:'طريقة العرض', type:'select', options:[{value:'category',label:'من تصنيف'},{value:'ids',label:'معرفات محددة'},{value:'featured',label:'مميزة فقط'}] },
      { name:'sortBy', label:'ترتيب العرض', type:'select', options:[{value:'default',label:'بدون ترتيب'},{value:'newest',label:'الأحدث'},{value:'cheapest',label:'الأرخص'},{value:'expensive',label:'الأغلى'},{value:'bestselling',label:'الأكثر مبيعاً'}] },
      { name:'limit', label:'عدد المنتجات', type:'number', min:1, max:50 },
      { name:'layout', label:'نوع العرض', type:'select', options:[{value:'grid',label:'شبكة'},{value:'carousel',label:'كاروسيل متحرك'}] },
      { name:'_sec2', label:'المحتوى', type:'section' },
      { name:'title', label:'عنوان القسم', type:'text' },
      { name:'category', label:'التصنيف', type:'text', placeholder:'اسم التصنيف (لطريقة "من تصنيف")' },
      { name:'productIds', label:'معرفات المنتجات (مفصولة بفواصل)', type:'text', placeholder:'1,5,12,23' },
      { name:'_sec3', label:'التصميم', type:'section' },
      { name:'bgColor', label:'لون الخلفية', type:'color' },
      { name:'bgImage', label:'صورة الخلفية', type:'image' },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'columns', label:'عدد الأعمدة', type:'number', min:1, max:12, extra:{min:1} },
      { name:'gap', label:'الفراغ بين المنتجات', type:'number', min:0, max:40 },
      { name:'_sec4', label:'بطاقة المنتج', type:'section' },
      { name:'showTitle', label:'إظهار اسم المنتج', type:'checkbox' },
      { name:'showPrice', label:'إظهار السعر', type:'checkbox' },
      { name:'showAddToCart', label:'إظهار زر الشراء', type:'checkbox' },
      { name:'showRating', label:'إظهار التقييم', type:'checkbox' },
      { name:'cardRadius', label:'استدارة زوايا البطاقة', type:'number', min:0, max:30 },
      { name:'cardShadow', label:'ظل البطاقة', type:'select', options:[{value:'none',label:'بدون'},{value:'sm',label:'خفيف'},{value:'md',label:'متوسط'},{value:'lg',label:'ثقيل'}] }
    ];
    if (section.mode !== 'category') fields = fields.filter(function(f) { return f.name !== 'category'; });
    if (section.mode !== 'ids') fields = fields.filter(function(f) { return f.name !== 'productIds'; });
  } else if (t === 'categories') {
    fields = [
      { name:'_sec1', label:'عام', type:'section' },
      { name:'title', label:'عنوان القسم', type:'text' },
      { name:'mode', label:'مصدر التصنيفات', type:'select', options:[{value:'auto',label:'من تصنيفات الموقع'},{value:'manual',label:'إضافة يدوية'}] },
      { name:'layout', label:'شكل العرض', type:'select', options:[{value:'grid',label:'شبكة'},{value:'carousel',label:'كاروسيل'},{value:'list',label:'قائمة أفقية'}] },
      { name:'cardsPerView', label:'عدد البطاقات (ديسكتوب)', type:'number', min:2, max:8, extra:{min:2} },
      { name:'mobileCards', label:'عدد البطاقات (جوال)', type:'number', min:1, max:4, extra:{min:1} },
      { name:'_sec2', label:'محتوى إضافي', type:'section' },
      { name:'categoryNames', label:'تصنيفات محددة', type:'text', placeholder:'مفصولة بفواصل - اتركه فارغاً لعرض الكل' },
      { name:'items', label:'التصنيفات (يدوي)', type:'items', itemFields:[
        {name:'name',label:'الاسم',type:'text'},
        {name:'image',label:'الصورة',type:'image'},
        {name:'count',label:'عدد المنتجات',type:'text'},
        {name:'link',label:'الرابط',type:'text'}
      ], addLabel:'تصنيف' },
      { name:'_sec3', label:'التصميم', type:'section' },
      { name:'bgColor', label:'لون الخلفية', type:'color' },
      { name:'bgImage', label:'صورة الخلفية', type:'image' },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'_sec4', label:'تخصيص البطاقة', type:'section' },
      { name:'showNames', label:'إظهار الأسماء', type:'checkbox' },
      { name:'showCount', label:'إظهار عدد المنتجات', type:'checkbox' },
      { name:'compact', label:'مصغر', type:'checkbox' },
      { name:'cardRadius', label:'استدارة الزوايا', type:'number', min:0, max:30 },
      { name:'cardShadow', label:'الظل', type:'select', options:[{value:'none',label:'بدون'},{value:'sm',label:'خفيف'},{value:'md',label:'متوسط'},{value:'lg',label:'ثقيل'}] },
      { name:'imageHeight', label:'ارتفاع الصورة', type:'number', min:40, max:300 },
      { name:'gap', label:'الفراغ', type:'number', min:0, max:40 }
    ];
    if (section.mode === 'auto') {
      fields = fields.filter(function(f) { return f.name !== 'items'; });
      // Build category & brand options from site
      var storedCats = [];
      try { storedCats = JSON.parse(localStorage.getItem('mycart_categories') || '[]'); } catch(e) {}
      var catOpts = storedCats.filter(function(c) { return !c.isBrand; }).map(function(c) { return { value: c.name, label: c.name, image: c.image || '' }; });
      var brandOpts = storedCats.filter(function(c) { return c.isBrand; }).map(function(c) { return { value: c.name, label: c.name, image: c.image || '' }; });
      // Replace categoryNames with multiselect
      for (var fi = 0; fi < fields.length; fi++) {
        if (fields[fi].name === 'categoryNames') {
          fields[fi].type = 'multiselect';
          fields[fi].options = catOpts;
          fields[fi].placeholder = '';
        }
      }
      // Insert brands fields after categoryNames
      var catIdx = -1;
      for (var fi = 0; fi < fields.length; fi++) { if (fields[fi].name === 'categoryNames') { catIdx = fi; break; } }
      if (catIdx !== -1 && brandOpts.length) {
        fields.splice(catIdx + 1, 0, { name:'_brandsHint', label:'الماركات', type:'section' });
        fields.splice(catIdx + 2, 0, { name:'includeBrands', label:'الماركات المحددة', type:'multiselect', options: brandOpts });
      }
    }
    if (section.mode === 'manual') fields = fields.filter(function(f) { return f.name !== 'categoryNames' && f.name !== 'includeBrands'; });
  } else if (t === 'faq') {
    fields = [
      { name:'items', label:'الأسئلة', type:'items', itemFields:[
        {name:'q',label:'السؤال',type:'text'},
        {name:'a',label:'الجواب',type:'textarea',rows:3}
      ], addLabel:'سؤال' },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'openFirst', label:'فتح أول سؤال افتراضياً', type:'checkbox' }
    ];
  } else if (t === 'contact') {
    fields = [
      { name:'title', label:'العنوان', type:'text' },
      { name:'address', label:'العنوان', type:'text' },
      { name:'phone', label:'رقم الهاتف', type:'text' },
      { name:'email', label:'البريد الإلكتروني', type:'text' },
      { name:'whatsapp', label:'رقم واتساب', type:'text' },
      { name:'mapEmbed', label:'كود تضمين خريطة (iframe)', type:'textarea', rows:3 },
      { name:'bg', label:'لون الخلفية', type:'color' }
    ];
  } else if (t === 'social') {
    fields = [
      { name:'items', label:'الروابط', type:'items', itemFields:[
        {name:'platform',label:'المنصة',type:'select',options:[{value:'facebook',label:'فيسبوك'},{value:'twitter',label:'تويتر'},{value:'instagram',label:'انستغرام'},{value:'youtube',label:'يوتيوب'},{value:'tiktok',label:'تيك توك'},{value:'snapchat',label:'سناب شات'},{value:'whatsapp',label:'واتساب'},{value:'telegram',label:'تيليغرام'},{value:'linkedin',label:'لينكد إن'},{value:'pinterest',label:'بينتريست'},{value:'custom',label:'أخرى'}]},
        {name:'url',label:'الرابط',type:'text'},
        {name:'icon',label:'رمز مخصص (اختياري)',type:'text',placeholder:'fa-...'}
      ], addLabel:'رابط' },
      { name:'size', label:'حجم الأيقونات', type:'select', options:[{value:'sm',label:'صغير'},{value:'md',label:'متوسط'},{value:'lg',label:'كبير'}] },
      { name:'style', label:'نوع الأيقونات', type:'select', options:[{value:'rounded',label:'دائرية'},{value:'square',label:'مربعة'},{value:'circle',label:'دائرة كاملة'}] },
      { name:'bg', label:'لون الخلفية', type:'color' }
    ];
  } else if (t === 'html') {
    fields = [
      { name:'code', label:'كود HTML / iframe', type:'textarea', rows:8, placeholder:'<iframe src="..."></iframe>' },
      { name:'height', label:'الارتفاع (بكسل، 0 = تلقائي)', type:'number', min:0, max:2000 }
    ];
  } else if (t === 'marquee') {
    fields = [
      { name:'text', label:'النص', type:'textarea', rows:2, placeholder:'النص الذي تريد عرضه' },
      { name:'speed', label:'السرعة', type:'select', options:[{value:'slow',label:'بطيء'},{value:'medium',label:'متوسط'},{value:'fast',label:'سريع'}] },
      { name:'direction', label:'الاتجاه', type:'select', options:[{value:'rtl',label:'يمين→يسار'},{value:'ltr',label:'يسار→يمين'}] },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'textSize', label:'حجم الخط', type:'select', options:[{value:'sm',label:'صغير'},{value:'md',label:'متوسط'},{value:'lg',label:'كبير'}] },
      { name:'repeat', label:'تكرار النص', type:'checkbox' }
    ];
  } else if (t === 'logos') {
    fields = [
      { name:'images', label:'الشعارات', type:'items', itemFields:[{name:'src',label:'صورة الشعار',type:'image'},{name:'name',label:'اسم العلامة',type:'text'},{name:'link',label:'رابط مخصص',type:'text',placeholder:'https://...'}], addLabel:'شعار' },
      { name:'linkMode', label:'نوع الرابط', type:'select', options:[{value:'none',label:'بدون رابط'},{value:'custom',label:'رابط مخصص'},{value:'brand',label:'تصنيف ماركة'}] },
      { name:'speed', label:'السرعة', type:'select', options:[{value:'slow',label:'بطيء'},{value:'medium',label:'متوسط'},{value:'fast',label:'سريع'}] },
      { name:'height', label:'الارتفاع (بكسل)', type:'number', min:30, max:200 },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'grayscale', label:'تدرج رمادي', type:'checkbox' }
    ];
    if (section.linkMode === 'brand') {
      var storedCats = [];
      try { storedCats = JSON.parse(localStorage.getItem('mycart_categories') || '[]'); } catch(e) {}
      var allOpts = storedCats.map(function(c) { return { value: c.name, label: c.name }; });
      var nameField = null;
      for (var fi = 0; fi < fields.length; fi++) {
        if (fields[fi].name === 'images' && fields[fi].itemFields) {
          for (var ii = 0; ii < fields[fi].itemFields.length; ii++) {
            if (fields[fi].itemFields[ii].name === 'name') { nameField = fields[fi].itemFields[ii]; break; }
          }
        }
      }
      if (nameField) { nameField.type = 'select'; nameField.options = allOpts.length ? allOpts : [{value:'',label:'(لا توجد تصنيفات)'}]; delete nameField.placeholder; }
    }
  } else if (t === 'counters') {
    fields = [
      { name:'items', label:'الإحصائيات', type:'items', itemFields:[
        {name:'icon',label:'رمز (إيموجي)',type:'text',placeholder:'⭐'},
        {name:'value',label:'الرقم',type:'number',min:0,max:999999},
        {name:'label',label:'النص',type:'text'},
        {name:'suffix',label:'لاحقة (+, %, K)',type:'text',placeholder:'+'}
      ], addLabel:'إحصائية' },
      { name:'columns', label:'الأعمدة', type:'select', options:[{value:'2',label:'2'},{value:'3',label:'3'},{value:'4',label:'4'}] },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'iconColor', label:'لون الأيقونات', type:'color' },
      { name:'animation', label:'تحريك الأرقام', type:'checkbox' }
    ];
  } else if (t === 'trust') {
    fields = [
      { name:'items', label:'عناصر الثقة', type:'items', itemFields:[
        {name:'icon',label:'رمز (إيموجي أو FontAwesome)',type:'text',placeholder:'🛡️'},
        {name:'title',label:'العنوان',type:'text'},
        {name:'desc',label:'الوصف',type:'textarea',rows:2}
      ], addLabel:'عنصر' },
      { name:'layout', label:'الشكل', type:'select', options:[{value:'row',label:'صف أفقي'},{value:'grid',label:'شبكة'},{value:'cards',label:'بطاقات'}] },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'iconColor', label:'لون الأيقونات', type:'color' },
      { name:'textColor', label:'لون النص', type:'color' }
    ];
  } else if (t === 'table') {
    fields = [
      { name:'title', label:'عنوان الجدول', type:'text' },
      { name:'headers', label:'رؤوس الأعمدة (مفصولة بفاصلة)', type:'text', placeholder:'المقاس, الصدر, الخصر, الطول' },
      { name:'rows', label:'البيانات', type:'items', itemFields:[
        {name:'cells',label:'الخلايا (مفصولة بفاصلة)',type:'text',placeholder:'M, 96, 80, 70'}
      ], addLabel:'صف' },
      { name:'bg', label:'لون الخلفية', type:'color' },
      { name:'headerBg', label:'لون خلفية الرأس', type:'color' },
      { name:'textColor', label:'لون النص', type:'color' },
      { name:'striped', label:'تباين الصفوف', type:'checkbox' },
      { name:'border', label:'حدود الخلايا', type:'checkbox' }
    ];
  }
  return fields;
}

var PB_PREVIEW_HTML = {
  hero:'<div style="height:140px;border-radius:12px;background:linear-gradient(135deg,#1e293b,#0f172a);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;padding:16px;text-align:center;position:relative;overflow:hidden"><div style="position:absolute;inset:0;background:url(https://placehold.co/600x300/1e293b/64748b?text=BG) center/cover;opacity:.3"></div><div style="position:relative;z-index:1;font-size:1.1rem;font-weight:900;margin-bottom:4px">عنوان البانر</div><div style="position:relative;z-index:1;font-size:.7rem;opacity:.8;margin-bottom:8px">نص توضيحي قصير</div><div style="position:relative;z-index:1;padding:6px 18px;background:var(--accent);border-radius:8px;font-size:.7rem;font-weight:800">تسوق الآن</div></div>',
  banner:'<div style="height:120px;border-radius:12px;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:2.5rem"><i class="fa-solid fa-image"></i></div>',
  text:'<div style="padding:16px;text-align:center"><div style="font-size:.95rem;font-weight:800;margin-bottom:6px;color:var(--text)">عنوان النص</div><div style="font-size:.72rem;color:var(--text-muted);line-height:1.6">هذا نص توضيحي للمحتوى الذي يمكنك إضافته إلى الصفحة الرئيسية.</div></div>',
  spacer:'<div style="height:30px;background:transparent;border-bottom:1px dashed #e2e8f0"></div>',
  divider:'<div style="display:flex;align-items:center;gap:10px;padding:10px 0;color:#94a3b8"><span style="flex:1;height:1px;background:#e2e8f0"></span><span style="font-size:.7rem;font-weight:600">نص على الخط</span><span style="flex:1;height:1px;background:#e2e8f0"></span></div>',
  gallery:'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:8px">' + Array(6).fill('<div style="aspect-ratio:1;border-radius:8px;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:1.2rem"><i class="fa-solid fa-image"></i></div>').join('') + '</div>',
  video:'<div style="height:130px;border-radius:12px;background:#1e293b;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;gap:8px"><div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:1rem"><i class="fa-solid fa-play"></i></div><div style="font-size:.7rem;opacity:.7">YouTube / Vimeo</div></div>',
  countdown:'<div style="padding:16px;text-align:center;background:#0f172a;border-radius:12px"><div style="font-size:.8rem;font-weight:800;color:#fff;margin-bottom:10px">عرض ينتهي قريباً!</div><div style="display:flex;justify-content:center;gap:8px"><div style="background:rgba(255,255,255,.1);border-radius:8px;padding:8px 12px;text-align:center"><div style="font-size:1.1rem;font-weight:900;color:#ef4444">05</div><div style="font-size:.55rem;color:rgba(255,255,255,.6)">أيام</div></div><div style="background:rgba(255,255,255,.1);border-radius:8px;padding:8px 12px;text-align:center"><div style="font-size:1.1rem;font-weight:900;color:#ef4444">12</div><div style="font-size:.55rem;color:rgba(255,255,255,.6)">ساعة</div></div><div style="background:rgba(255,255,255,.1);border-radius:8px;padding:8px 12px;text-align:center"><div style="font-size:1.1rem;font-weight:900;color:#ef4444">30</div><div style="font-size:.55rem;color:rgba(255,255,255,.6)">دقيقة</div></div></div></div>',
  testimonials:'<div style="padding:12px"><div style="background:#f8fafc;border-radius:10px;padding:12px;border:1px solid #e2e8f0"><div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#cbd5e1,#94a3b8)"></div><div><div style="font-size:.7rem;font-weight:700">اسم العميل</div><div style="font-size:.6rem;color:var(--text-muted)">مشتري</div></div><div style="margin-right:auto;color:#f59e0b;font-size:.6rem">★★★★★</div></div><div style="font-size:.68rem;color:var(--text-muted);line-height:1.5">"منتج رائع جداً، أنصح الجميع بشرائه. خدمة ممتازة وسرعة في التوصيل."</div></div></div>',
  features:'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:8px">' + Array(3).fill('<div style="text-align:center;padding:10px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0"><div style="font-size:1.2rem;margin-bottom:4px">⭐</div><div style="font-size:.65rem;font-weight:700">ميزة</div><div style="font-size:.6rem;color:var(--text-muted)">وصف</div></div>').join('') + '</div>',
  newsletter:'<div style="padding:16px;text-align:center;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);border-radius:12px"><div style="font-size:.9rem;font-weight:800;margin-bottom:4px">اشترك في النشرة</div><div style="font-size:.65rem;color:var(--text-muted);margin-bottom:10px">احصل على آخر العروض</div><div style="display:flex;gap:6px;max-width:260px;margin:0 auto"><input style="flex:1;padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:.7rem;font-family:inherit" placeholder="بريدك الإلكتروني"><span style="padding:8px 14px;background:var(--accent);color:#fff;border-radius:8px;font-size:.7rem;font-weight:700">اشتراك</span></div></div>',
  products:'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:8px">' + Array(4).fill('<div style="border-radius:10px;overflow:hidden;border:1px solid var(--border)"><div style="height:60px;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:1rem"><i class="fa-solid fa-box"></i></div><div style="padding:6px;text-align:center"><div style="font-size:.6rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">منتج</div><div style="font-size:.65rem;font-weight:800;color:var(--accent)">$19.99</div></div></div>').join('') + '</div>',
  categories:'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:8px">' + Array(4).fill('<div style="border-radius:10px;overflow:hidden;border:1px solid var(--border);text-align:center"><div style="height:50px;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:1rem"><i class="fa-solid fa-folder-open"></i></div><div style="padding:6px;font-size:.6rem;font-weight:700">تصنيف</div></div>').join('') + '</div>',
  faq:'<div style="padding:8px"><div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden"><div style="display:flex;align-items:center;gap:8px;padding:10px;font-size:.7rem;font-weight:700;background:#f8fafc"><i class="fa-solid fa-plus" style="color:var(--accent);font-size:.6rem"></i> سؤال شائع هنا؟</div><div style="padding:10px 14px 10px 28px;font-size:.65rem;color:var(--text-muted);border-top:1px solid #e2e8f0">هذا هو الجواب على السؤال الشائع.</div></div></div>',
  contact:'<div style="padding:12px;display:flex;gap:8px"><div style="flex:1"><div style="font-size:.7rem;font-weight:700;margin-bottom:6px">معلومات الاتصال</div><div style="display:flex;align-items:center;gap:6px;font-size:.65rem;color:var(--text-muted);margin-bottom:4px"><span style="color:var(--accent);font-size:.7rem"><i class="fa-solid fa-location-dot"></i></span> العنوان هنا</div><div style="display:flex;align-items:center;gap:6px;font-size:.65rem;color:var(--text-muted);margin-bottom:4px"><span style="color:var(--accent);font-size:.7rem"><i class="fa-solid fa-phone"></i></span> +966 5X XXX XXXX</div></div><div style="width:80px;height:60px;background:linear-gradient(135deg,#dbeafe,#bfdbfe);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#3b82f6;font-size:.7rem">خريطة</div></div>',
  social:'<div style="display:flex;justify-content:center;gap:10px;padding:14px"><span style="width:36px;height:36px;border-radius:50%;background:#1877f2;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.9rem"><i class="fa-brands fa-facebook-f"></i></span><span style="width:36px;height:36px;border-radius:50%;background:#e4405f;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.9rem"><i class="fa-brands fa-instagram"></i></span><span style="width:36px;height:36px;border-radius:50%;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.9rem"><i class="fa-brands fa-whatsapp"></i></span><span style="width:36px;height:36px;border-radius:50%;background:#1da1f2;color:#fff;display:flex;align-items:center;justify-content:center;font-size:.9rem"><i class="fa-brands fa-twitter"></i></span></div>',
  html:'<div style="padding:16px;text-align:center;background:#f8fafc;border:1px dashed #e2e8f0;border-radius:8px;margin:8px"><div style="font-size:.8rem;color:#94a3b8"><i class="fa-solid fa-code"></i></div><div style="font-size:.65rem;color:var(--text-muted);margin-top:4px">&lt;iframe&gt; أو كود HTML مخصص</div></div>',
  marquee:'<div style="padding:10px;background:#1e293b;border-radius:8px;overflow:hidden;margin:8px"><div style="white-space:nowrap;overflow:hidden"><div style="display:inline-block;animation:pbMarqueePreview 8s linear infinite;color:#fff;font-weight:700;padding:0 20px;font-size:.82rem">نص متحرك مستمر — نص متحرك مستمر — نص متحرك مستمر</div></div></div>',
  logos:'<div style="padding:14px;background:#f8fafc;border-radius:8px;margin:8px;text-align:center"><div style="display:flex;gap:12px;overflow:hidden"><div style="display:flex;gap:12px;animation:pbLogosPreview 6s linear infinite">🏢 ⭐ 💎 🔧 🎯 🏢 ⭐ 💎 🔧 🎯</div></div></div>',
  counters:'<div style="padding:12px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;margin:8px;display:grid;grid-template-columns:1fr 1fr;gap:8px">' + Array(4).fill('<div style="text-align:center;padding:8px;background:rgba(255,255,255,.06);border-radius:8px"><div style="font-size:1.1rem;margin-bottom:2px">⭐</div><div style="font-size:.95rem;font-weight:900;color:#ef4444">15K+</div><div style="font-size:.58rem;color:rgba(255,255,255,.7)">عميل</div></div>').join('') + '</div>',
  trust:'<div style="padding:12px;margin:8px;display:grid;grid-template-columns:1fr 1fr;gap:8px">' + Array(4).fill('<div style="text-align:center"><div style="font-size:1.2rem;margin-bottom:3px">🛡️</div><div style="font-size:.65rem;font-weight:700">ضمان</div><div style="font-size:.55rem;color:var(--text-muted)">وصف</div></div>').join('') + '</div>',
  table:'<div style="padding:8px;margin:8px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-size:.6rem"><table style="width:100%;border-collapse:collapse;text-align:center"><thead><tr style="background:#1e293b;color:#fff"><th style="padding:5px 8px">المقاس</th><th style="padding:5px 8px">الصدر</th><th style="padding:5px 8px">الخصر</th><th style="padding:5px 8px">الطول</th></tr></thead><tbody><tr><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">M</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">96</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">80</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">70</td></tr><tr style="background:#f8fafc"><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">L</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">102</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">86</td><td style="padding:4px 8px;border-bottom:1px solid #e2e8f0">75</td></tr></tbody></table></div>'
};

function adminShowAddSectionPicker() {
  var id = 'pbTypePicker';
  var ex = document.getElementById(id);
  if (ex) ex.remove();
  var modal = document.createElement('div');
  modal.id = id;
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px';
  var types = '';
  for (var t in PB_SECTION_TYPES) {
    var info = PB_SECTION_TYPES[t];
    types += '<div data-pbtype="' + t + '" onclick="adminAddCustomSection(\'' + t + '\');document.getElementById(\'' + id + '\').remove()" style="display:flex;align-items:center;gap:12px;padding:14px 16px;border:1.5px solid var(--border);border-radius:12px;cursor:pointer;transition:border-color .2s,background .2s;background:var(--card);margin-bottom:8px" onmouseenter="this.style.borderColor=\'var(--accent)\';this.style.background=\'' + info.color + '\';showPBPreview(\'' + t + '\', this)" onmouseleave="this.style.borderColor=\'var(--border)\';this.style.background=\'\'">' +
      '<span style="font-size:1.5rem;flex-shrink:0">' + info.icon + '</span>' +
      '<div style="flex:1"><div style="font-weight:800;font-size:.88rem">' + info.label + '</div><div style="font-size:.72rem;color:var(--text-muted)">' + info.desc + '</div></div>' +
      '<span class="pb-pick-icon" style="color:var(--accent);font-size:1.1rem"><i class="fa-solid fa-plus-circle"></i></span></div>';
  }
  modal.innerHTML = '<div style="background:var(--card);border-radius:20px;padding:24px;max-width:820px;width:100%;max-height:90vh;box-shadow:0 25px 60px rgba(0,0,0,.2);direction:rtl;text-align:right;display:flex;gap:20px;overflow:hidden">' +
    '<div style="flex:1;min-width:0;overflow-y:auto;max-height:calc(90vh - 48px)">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding-left:4px">' +
        '<div style="display:flex;align-items:center;gap:8px"><button onclick="this.closest(\'#' + id + '\').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-muted);padding:4px"><i class="fa-solid fa-arrow-right"></i></button>' +
        '<h3 style="font-size:1rem;font-weight:800;margin:0"><i class="fa-solid fa-plus-circle" style="color:var(--accent)"></i> إضافة قسم جديد</h3></div>' +
        '<button onclick="this.closest(\'#' + id + '\').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted);padding:4px;line-height:1">&times;</button></div>' +
      '<p style="font-size:.72rem;color:var(--text-muted);margin-bottom:12px">اختر نوع القسم الذي تريد إضافته. حرك الماوس لرؤية معاينة حية.</p>' +
      types +
    '</div>' +
    '<div style="width:300px;flex-shrink:0;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;display:flex;flex-direction:column">' +
      '<div style="padding:10px 12px;font-size:.7rem;font-weight:700;color:#94a3b8;display:flex;align-items:center;gap:6px;border-bottom:1px solid #e2e8f0;background:#fff"><i class="fa-solid fa-eye"></i> معاينة حية</div>' +
      '<div id="pbPreviewPane" style="flex:1;padding:12px;overflow-y:auto;display:flex;align-items:center;justify-content:center;min-height:200px">' +
        '<div style="text-align:center;color:#94a3b8;font-size:.72rem"><i class="fa-solid fa-arrow-pointer fa-2x" style="margin-bottom:8px;display:block;opacity:.4"></i> حرك الماوس على <br>نوع القسم للمعاينة</div>' +
      '</div>' +
    '</div>' +
  '</div>';
  document.body.appendChild(modal);
}

function showPBPreview(type, el) {
  var pane = document.getElementById('pbPreviewPane');
  if (!pane) return;
  var info = PB_SECTION_TYPES[type];
  var preview = PB_PREVIEW_HTML[type] || '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:.8rem">لا توجد معاينة متاحة</div>';
  pane.innerHTML = '<div style="font-size:.72rem;font-weight:700;color:var(--text-muted);margin-bottom:10px;display:flex;align-items:center;gap:6px"><span style="font-size:1.2rem">' + info.icon + '</span> ' + info.label + '</div>' + preview;
}

function adminInitPageBuilder() {
  setTimeout(function() {
    var list = document.getElementById('pbSectionList');
    if (!list) return;
    var dragItem = null;
    list.addEventListener('dragstart', function(e) {
      var item = e.target.closest('.pb-section-item');
      if (!item) return;
      dragItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    list.addEventListener('dragend', function(e) {
      var item = e.target.closest('.pb-section-item');
      if (item) { item.classList.remove('dragging'); item.style.opacity = ''; }
      document.querySelectorAll('.pb-section-item.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
    });
    list.addEventListener('dragover', function(e) {
      e.preventDefault();
      var target = e.target.closest('.pb-section-item');
      if (!target || target === dragItem) return;
      document.querySelectorAll('.pb-section-item.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
      var rect = target.getBoundingClientRect();
      var mid = rect.top + rect.height / 2;
      if (e.clientY < mid) { list.insertBefore(dragItem, target); target.classList.add('drag-over'); }
      else { list.insertBefore(dragItem, target.nextElementSibling); target.classList.add('drag-over'); }
    });
    list.addEventListener('drop', function() {
      document.querySelectorAll('.pb-section-item.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
    });
    // Update indices after drag
    list.addEventListener('dragend', function() {
      setTimeout(function() {
        var items = list.querySelectorAll('.pb-section-item');
        items.forEach(function(item, i) {
          var idxSpan = item.querySelector('span:nth-child(2)');
          if (idxSpan) idxSpan.textContent = i + 1;
        });
      }, 50);
    });
    // Toggles for built-in sections
    list.querySelectorAll('.pb-section-toggle').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var showKey = this.dataset.showkey || this.dataset.section;
        var isChecked = this.checked;
        var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
        if (!mkt[showKey]) mkt[showKey] = {};
        mkt[showKey].show = isChecked;
        try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) {}
        var label = this.closest('.pb-section-item').querySelector('span:last-child');
        if (label) { label.textContent = isChecked ? 'مفعل' : 'معطل'; label.style.color = isChecked ? '#22c55e' : '#94a3b8'; }
        if (typeof renderProducts === 'function') renderProducts(getFilteredProducts());
        if (typeof initFlashSales === 'function') initFlashSales();
      });
    });
  }, 100);
}

function adminAddCustomSection(type) {
  var sections = window._pbCustomSections || [];
  var idx = sections.length;
  var newSection = { _id: '_custom_' + idx, type: type, title: '', _visible: true };
  // Default values per type
  var info = PB_SECTION_TYPES[type] || {};
  newSection.title = info.label || 'قسم جديد';
  var fields = adminGetPBFields({ type: type });
  fields.forEach(function(f) {
    if (f.type === 'checkbox') newSection[f.name] = true;
    else if (f.type === 'number') newSection[f.name] = (f.extra && f.extra.min) || 0;
    else if (f.type === 'items') newSection[f.name] = [];
    else if (f.type === 'color') newSection[f.name] = f.name.indexOf('bg') !== -1 || f.name.indexOf('Bg') !== -1 ? '#ffffff' : '#1e293b';
    else newSection[f.name] = '';
  });
  // Special defaults
  if (type === 'hero') { newSection.height = 400; newSection.overlay = true; newSection.bgColor = '#1e293b'; newSection.textColor = '#ffffff'; newSection.btnStyle = 'fill'; newSection.title = 'عنوان رئيسي'; newSection.subtitle = 'نص فرعي'; newSection.btnText = 'تسوق الآن'; }
  if (type === 'spacer') { newSection.height = 40; }
  if (type === 'video') { newSection.controls = true; newSection.ratio = '56.25'; }
  if (type === 'countdown') { newSection.showDays = true; newSection.showHours = true; newSection.showMinutes = true; newSection.showSeconds = true; newSection.bgColor = '#0f172a'; newSection.accentColor = '#ef4444'; newSection.textColor = '#ffffff'; newSection.title = 'عرض ينتهي قريباً!'; newSection.endDate = '2026-12-31T23:59'; newSection.duration = 48; newSection.timerType = 'fixed'; newSection.bgType = 'color'; newSection.layout = 'row'; newSection.animation = true; }
  if (type === 'testimonials') { newSection.autoplay = true; }
  if (type === 'newsletter') { newSection.title = 'اشترك في النشرة البريدية'; newSection.subtitle = 'احصل على آخر العروض'; newSection.btnText = 'اشتراك'; newSection.bg = '#f1f5f9'; newSection.accentColor = '#ef4444'; newSection.placeholder = 'بريدك الإلكتروني'; newSection.icon = '📧'; }
  if (type === 'products') { newSection.mode = 'category'; newSection.limit = 8; newSection.columns = '4'; newSection.showTitle = true; newSection.showPrice = true; newSection.showAddToCart = true; newSection.sortBy = 'default'; newSection.layout = 'grid'; newSection.gap = 16; newSection.cardRadius = 12; newSection.cardShadow = 'sm'; }
  if (type === 'categories') { newSection.columns = '4'; newSection.showCount = true; newSection.showNames = true; newSection.layout = 'grid'; newSection.cardRadius = 12; newSection.cardShadow = 'sm'; newSection.imageHeight = 100; newSection.gap = 12; newSection.mode = 'auto'; newSection.compact = false; newSection.categoryNames = ''; newSection.includeBrands = ''; }
  if (type === 'divider') { newSection.thickness = 2; newSection.lineColor = '#e2e8f0'; newSection.lineStyle = 'solid'; }
  if (type === 'gallery') { newSection.columns = '3'; newSection.gap = 10; newSection.lightbox = true; newSection.images = []; }
  if (type === 'features') { newSection.columns = '3'; newSection.showBorder = true; }
  if (type === 'social') { newSection.size = 'md'; newSection.style = 'rounded'; }
  if (type === 'faq') { newSection.openFirst = true; }
  if (type === 'banner') { newSection.borderRadius = 12; }
  if (type === 'marquee') { newSection.text = 'نص متحرك مستمر - أهلاً بكم في متجرنا'; newSection.speed = 'medium'; newSection.direction = 'rtl'; newSection.bg = '#1e293b'; newSection.textColor = '#ffffff'; newSection.textSize = 'md'; newSection.repeat = true; }
  if (type === 'logos') { newSection.speed = 'medium'; newSection.height = 60; newSection.bg = '#ffffff'; newSection.grayscale = true; }
  if (type === 'counters') { newSection.columns = '4'; newSection.bg = '#0f172a'; newSection.textColor = '#ffffff'; newSection.iconColor = '#ef4444'; newSection.animation = true; newSection.items = [{icon:'😊',value:15000,label:'عميل سعيد',suffix:'+'},{icon:'📦',value:50000,label:'طلب منجز',suffix:'+'},{icon:'⭐',value:4.8,label:'تقييم المتجر',suffix:''},{icon:'🏆',value:10,label:'سنوات خبرة',suffix:'+'}] }
  if (type === 'trust') { newSection.layout = 'row'; newSection.bg = '#ffffff'; newSection.iconColor = '#ef4444'; newSection.textColor = '#1e293b'; newSection.items = [{icon:'🛡️',title:'ضمان الجودة',desc:'منتجات أصلية 100%'},{icon:'🚚',title:'شحن سريع',desc:'توصيل خلال 3-5 أيام'},{icon:'💳',title:'دفع آمن',desc:'طرق دفع موثوقة'},{icon:'🔄',title:'إرجاع مجاني',desc:'خلال 14 يوم'}] }
  if (type === 'table') { newSection.title = 'جدول المقاسات'; newSection.headers = 'المقاس,الصدر,الخصر,الطول'; newSection.bg = '#ffffff'; newSection.headerBg = '#1e293b'; newSection.textColor = '#1e293b'; newSection.striped = true; newSection.border = true; newSection.rows = [{cells:'S, 90, 74, 65'},{cells:'M, 96, 80, 70'},{cells:'L, 102, 86, 75'},{cells:'XL, 108, 92, 80'}] }
  
  sections.push(newSection);
  window._pbCustomSections = sections;
  adminEditCustomSection(idx);
}

function renderSectionPreviewHTML(sec) {
  var t = sec.type;
  var shadowMap = { none:'0 0 0 transparent', sm:'0 1px 3px rgba(0,0,0,.08)', md:'0 4px 12px rgba(0,0,0,.1)', lg:'0 8px 25px rgba(0,0,0,.15)' };
  if (t === 'hero') {
    var h = sec.height || 400;
    var bg = sec.bgImage ? 'url(' + sec.bgImage + ') center/cover no-repeat' : (sec.bgColor || '#1e293b');
    var overlay = sec.overlay !== false ? 'linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)),' : '';
    return '<div style="min-height:' + Math.min(h,200) + 'px;border-radius:12px;background:' + overlay + bg + ';display:flex;align-items:center;justify-content:center;padding:20px;text-align:center;color:' + (sec.textColor||'#fff') + ';position:relative;overflow:hidden">' +
      '<div style="max-width:600px">' +
      (sec.title ? '<div style="font-size:1.3rem;font-weight:900;margin:0 0 6px">' + sec.title + '</div>' : '') +
      (sec.subtitle ? '<div style="font-size:.78rem;margin:0 0 4px;opacity:.9">' + sec.subtitle + '</div>' : '') +
      (sec.content ? '<div style="font-size:.68rem;margin:0 0 10px;opacity:.75;line-height:1.6">' + sec.content + '</div>' : '') +
      ((sec.btnText && sec.btnLink) ? '<div style="display:inline-block;padding:6px 20px;border-radius:50px;font-weight:800;font-size:.7rem;' +
        (sec.btnStyle === 'outline' ? 'border:2px solid #fff;color:#fff;background:transparent' : sec.btnStyle === 'underline' ? 'border-bottom:2px solid #fff;padding:4px;border-radius:0;color:#fff;background:transparent' : 'background:' + (sec.accentColor || '#ef4444') + ';color:#fff') + '">' + sec.btnText + ' <i class="fa-solid fa-arrow-left"></i></div>' : '') +
      '</div></div>';
  }
  if (t === 'banner') {
    var br = sec.borderRadius || 12;
    var img = sec.image || '';
    return '<div style="padding:6px 10px">' +
      (img ? '<div style="border-radius:'+br+'px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)"><img src="' + img + '" style="width:100%;max-height:160px;object-fit:cover;display:block;border-radius:'+br+'px"></div>' :
      '<div style="height:90px;border-radius:'+br+'px;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:2rem"><i class="fa-solid fa-image"></i></div>') + '</div>';
  }
  if (t === 'text') {
    var align = sec.textAlign || 'center';
    var sizeScale = sec.textSize === 'lg' ? 1.15 : sec.textSize === 'sm' ? 0.9 : 1;
    return '<div style="padding:20px 14px;background:' + (sec.bg || '#ffffff') + ';border-radius:8px;text-align:'+align+'">' +
      (sec.title ? '<div style="font-size:' + (1*sizeScale) + 'rem;font-weight:800;margin:0 0 8px;color:var(--text)">' + sec.title + '</div>' : '') +
      (sec.content ? '<div style="line-height:1.8;color:var(--text-muted);font-size:' + (0.75*sizeScale) + 'rem">' + sec.content + '</div>' : '') +
      '</div>';
  }
  if (t === 'spacer') { return '<div style="height:' + (sec.height||20) + 'px;background:' + (sec.bg||'transparent') + ';border-bottom:1px dashed #e2e8f0"></div>'; }
  if (t === 'divider') {
    var t2 = sec.thickness || 2;
    var lc = sec.lineColor || '#e2e8f0';
    var ls = sec.lineStyle || 'solid';
    var lineHtml = '<span style="flex:1;height:'+t2+'px;background:'+lc+';border-radius:2px;'+(ls==='dashed'?'border-top:'+t2+'px dashed '+lc+';background:transparent':ls==='dotted'?'border-top:'+t2+'px dotted '+lc+';background:transparent':'')+'"></span>';
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0">' + lineHtml +
      (sec.text ? '<span style="font-size:.75rem;font-weight:700;color:'+lc+';white-space:nowrap">' + sec.text + '</span>' + lineHtml : '') + '</div>';
  }
  if (t === 'gallery') {
    var images = sec.images || [];
    var layout = sec.layout || 'grid';
    var cols = parseInt(sec.columns)||3; var gap = sec.gap||10;
    var placeholderCount = images.length ? 0 : Math.min(cols*2,6);
    function gPrevImg(img, h) {
      if (!img||!img.src) return '<div style="aspect-ratio:3/2;border-radius:8px;border:1px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:.8rem"><i class="fa-solid fa-image"></i></div>';
      return '<div style="border-radius:8px;overflow:hidden;border:1px solid var(--border);flex-shrink:0"><img src="'+img.src+'" style="width:100%;height:'+(h||60)+'px;object-fit:cover;display:block">'+(img.caption?'<div style="padding:3px 6px;font-size:.5rem;color:var(--text-muted);background:var(--card)">'+img.caption+'</div>':'')+'</div>';
    }
    var imgs = images.slice(0,8);
    var phs = images.length===0 ? Array(placeholderCount).fill(0).map(function(){return '<div style="aspect-ratio:3/2;border-radius:8px;border:1px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:.8rem"><i class="fa-solid fa-image"></i></div>';}).join('') : '';
    if (layout === 'slider' || layout === 'carousel') {
      var prevCount = layout === 'carousel' ? cols : 1;
      var arrowBtn = 'width:16px;height:16px;border-radius:50%;border:1px solid var(--border);background:var(--card);display:flex;align-items:center;justify-content:center;font-size:.35rem;color:var(--text-muted);flex-shrink:0';
      return '<div style="padding:8px">' +
        '<div style="display:flex;gap:4px;align-items:center">' +
        '<div style="'+arrowBtn+'"><i class="fa-solid fa-chevron-'+(document.dir==='rtl'?'right':'left')+'"></i></div>' +
        '<div style="flex:1;display:flex;gap:'+gap+'px;overflow:hidden">' + imgs.map(function(img){return gPrevImg(img,50)}).join('') + phs + '</div>' +
        '<div style="'+arrowBtn+'"><i class="fa-solid fa-chevron-'+(document.dir==='rtl'?'left':'right')+'"></i></div>' +
        '</div>' +
        (layout==='slider'?'<div style="text-align:center;margin-top:4px;font-size:.45rem;color:var(--text-muted)">'+(sec.autoPlay?'● تلقائي | ':'')+'سلايدر</div>':'<div style="text-align:center;font-size:.45rem;color:var(--text-muted);margin-top:4px">كاروسيل '+prevCount+'</div>')+
        '</div>';
    } else if (layout === 'masonry') {
      return '<div style="padding:8px"><div style="display:flex;gap:'+gap+'px;height:120px">' +
        '<div style="flex:1;display:flex;flex-direction:column;gap:'+gap+'px">' +
        (imgs[0]?gPrevImg(imgs[0],55)+'<div style="flex:1;overflow:hidden">'+gPrevImg(imgs[1]||{},40)+'</div>':phs)+
        '</div>'+
        '<div style="flex:1;display:flex;flex-direction:column;gap:'+gap+'px">'+
        (imgs[1]?'<div style="flex:1;overflow:hidden">'+gPrevImg(imgs[1],40)+'</div>'+gPrevImg(imgs[2]||{},55):phs)+
        '</div></div></div>';
    }
    return '<div style="padding:8px"><div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:'+gap+'px">' +
      imgs.map(function(img){return gPrevImg(img,55)}).join('')+phs+
    '</div></div>';
  }
  if (t === 'video') {
    var ratio = sec.ratio || '56.25';
    return '<div style="padding:8px"><div style="border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.1);background:#000;position:relative;padding-bottom:'+ratio+'%"><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;gap:8px"><div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:.9rem"><i class="fa-solid fa-play"></i></div><div style="font-size:.6rem;opacity:.6">'+(sec.url||'youtube.com')+'</div></div></div></div>';
  }
  if (t === 'countdown') {
    var endDate = sec.endDate || '';
    var isImageBg = sec.bgType === 'image' && sec.bgImage;
    var textCol = sec.textColor || '#fff';
    var accentCol = sec.accentColor || '#ef4444';
    var overlayStyle = isImageBg ? 'linear-gradient(rgba(0,0,0,'+(sec.overlay?'.65':'.15')+'),rgba(0,0,0,'+(sec.overlay?'.65':'.15')+')),' : '';
    var bgCss = isImageBg ? overlayStyle + 'url(' + sec.bgImage + ') center/cover no-repeat' : sec.bgType === 'transparent' ? 'transparent' : (sec.bgColor || '#0f172a');
    var layoutStyle = sec.layout === 'column' ? 'flex-direction:column;align-items:center' : sec.layout === 'grid' ? 'display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:240px;margin:0 auto' : 'display:flex;justify-content:center;gap:12px;flex-wrap:wrap';
    var unitStyle = sec.layout === 'grid' ? 'min-width:auto;padding:12px 8px' : sec.layout === 'column' ? 'min-width:100px;padding:12px 16px' : 'min-width:60px;padding:10px 14px';
    var anim = sec.animation ? 'perspective:200px' : '';
    return '<div style="padding:20px 12px;text-align:center;background:'+bgCss+';border-radius:12px;color:'+textCol+'">' +
      (sec.title ? '<div style="font-size:.85rem;font-weight:800;margin:0 0 12px;color:'+textCol+'">' + sec.title + '</div>' : '') +
      '<div style="direction:ltr;' + layoutStyle + '">'+
      (sec.showDays!==false?'<div style="'+unitStyle+';background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border-radius:12px;text-align:center;' + anim + '"><div style="font-size:1.3rem;font-weight:900;color:'+accentCol+';line-height:1">05</div><div style="font-size:.55rem;opacity:.6;margin-top:3px;font-weight:600">أيام</div></div>':'')+
      (sec.showHours!==false?'<div style="'+unitStyle+';background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border-radius:12px;text-align:center;' + anim + '"><div style="font-size:1.3rem;font-weight:900;color:'+accentCol+';line-height:1">12</div><div style="font-size:.55rem;opacity:.6;margin-top:3px;font-weight:600">ساعة</div></div>':'')+
      (sec.showMinutes!==false?'<div style="'+unitStyle+';background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border-radius:12px;text-align:center;' + anim + '"><div style="font-size:1.3rem;font-weight:900;color:'+accentCol+';line-height:1">30</div><div style="font-size:.55rem;opacity:.6;margin-top:3px;font-weight:600">دقيقة</div></div>':'')+
      (sec.showSeconds!==false?'<div style="'+unitStyle+';background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border-radius:12px;text-align:center;' + anim + '"><div style="font-size:1.3rem;font-weight:900;color:'+accentCol+';line-height:1">45</div><div style="font-size:.55rem;opacity:.6;margin-top:3px;font-weight:600">ثانية</div></div>':'')+
    '</div>' + (sec.message ? '<div style="color:'+textCol+';font-size:.72rem;margin:10px 0 0;opacity:.8">'+sec.message+'</div>' : '') + '</div>';
  }
  if (t === 'testimonials') {
    var items = sec.items || [];
    var bg = sec.bg || '#f8fafc';
    if (!items.length) items = [{name:'اسم',role:'مشتري',text:'نص الرأي هنا',rating:5}];
    return '<div style="padding:10px;background:'+bg+';border-radius:8px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+items.slice(0,2).map(function(it){
      var stars = ''; var rating = parseInt(it.rating)||0;
      for (var si=0;si<5;si++) stars += si < rating ? '<i class="fa-solid fa-star" style="color:#f59e0b;font-size:.55rem"></i>' : '<i class="fa-regular fa-star" style="color:#d1d5db;font-size:.55rem"></i>';
      return '<div style="background:#fff;border-radius:10px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,.05);text-align:center">' +
        (it.avatar ? '<img src="'+it.avatar+'" style="width:30px;height:30px;border-radius:50%;object-fit:cover;margin:0 auto 6px;display:block;border:2px solid var(--border)">' : '<div style="width:30px;height:30px;border-radius:50%;background:#e2e8f0;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:.8rem;color:#94a3b8"><i class="fa-solid fa-user"></i></div>') +
        (it.text ? '<div style="font-size:.6rem;line-height:1.6;color:var(--text);margin:0 0 6px;font-style:italic">" ' + it.text + ' "</div>' : '') +
        '<div style="font-size:.5rem;margin-bottom:4px">' + stars + '</div>' +
        (it.name ? '<div style="font-size:.65rem;font-weight:800">' + it.name + '</div>' : '') +
        (it.role ? '<div style="font-size:.58rem;color:var(--text-muted)">' + it.role + '</div>' : '') + '</div>';}).join('')+'</div></div>';
  }
  if (t === 'features') {
    var items = sec.items || [];
    var cols = parseInt(sec.columns)||3;
    var ic = sec.iconColor || '#ef4444';
    var sb = sec.showBorder !== false;
    if (!items.length) items = Array(3).fill({icon:'fa-star',title:'ميزة',desc:'وصف'});
    return '<div style="padding:10px;background:'+(sec.bg||'#ffffff')+';border-radius:8px"><div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:12px">'+
      items.slice(0,6).map(function(f){return '<div style="text-align:center;padding:14px 8px;'+(sb?'border:1px solid var(--border);':'')+'border-radius:10px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.04)"><div style="font-size:1.2rem;margin-bottom:5px;color:'+ic+'">'+(f.icon&&f.icon.indexOf('fa-')===0?'<i class="fa-solid '+f.icon+'"></i>':(f.icon||'⭐'))+'</div>'+
      (f.title?'<div style="font-size:.65rem;font-weight:800;margin:0 0 3px">'+f.title+'</div>':'')+(f.desc?'<div style="font-size:.58rem;line-height:1.5;color:var(--text-muted);margin:0">'+f.desc+'</div>':'')+'</div>';}).join('')+'</div></div>';
  }
  if (t === 'newsletter') {
    var nsBg = sec.bg || '#f1f5f9';
    var ac = sec.accentColor || '#ef4444';
    return '<div style="padding:20px 12px;text-align:center;background:'+nsBg+';border-radius:10px">' +
      (sec.icon ? '<div style="font-size:1.8rem;margin-bottom:6px">' + sec.icon + '</div>' : '') +
      (sec.title ? '<div style="font-size:.9rem;font-weight:800;margin:0 0 4px">' + sec.title + '</div>' : '') +
      (sec.subtitle ? '<div style="font-size:.65rem;color:var(--text-muted);margin:0 0 12px">' + sec.subtitle + '</div>' : '') +
      '<div style="display:flex;gap:6px;max-width:260px;margin:0 auto;direction:ltr">' +
      '<input style="flex:1;padding:8px 10px;border:2px solid var(--border);border-radius:8px;font-family:inherit;font-size:.68rem;outline:none;text-align:right" placeholder="'+(sec.placeholder||'بريدك الإلكتروني')+'">' +
      '<span style="padding:8px 14px;border:none;border-radius:8px;background:'+ac+';color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:.7rem;white-space:nowrap">'+(sec.btnText||'اشتراك')+'</span></div></div>';
  }
  if (t === 'faq') {
    var items = sec.items || [];
    var openFirst = sec.openFirst !== false;
    if (!items.length) items = [{q:'سؤال شائع هنا؟',a:'هذا هو الجواب على السؤال الشائع.'}];
    return '<div style="padding:8px;background:'+(sec.bg||'#ffffff')+';border-radius:8px">'+items.slice(0,3).map(function(qa,i){var isOpen=i===0&&openFirst;return '<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:6px"><div style="display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;font-weight:700;font-size:.7rem;'+(isOpen?'background:#f8fafc':'')+'"><i class="fa-solid '+(isOpen?'fa-minus':'fa-plus')+'" style="color:var(--accent);font-size:.65rem;flex-shrink:0"></i><span>'+(qa.q||'')+'</span></div>'+(isOpen?'<div style="padding:8px 12px 10px 36px;font-size:.62rem;line-height:1.7;color:var(--text-muted);border-top:1px solid var(--border)">'+(qa.a||'')+'</div>':'')+'</div>';}).join('')+'</div>';
  }
  if (t === 'contact') {
    return '<div style="padding:12px;background:'+(sec.bg||'#ffffff')+';border-radius:8px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
      '<div>'+(sec.title?'<div style="font-size:.75rem;font-weight:800;margin:0 0 10px">'+sec.title+'</div>':'')+
      (sec.address?'<div style="display:flex;align-items:center;gap:8px;font-size:.65rem;margin-bottom:6px"><span style="color:var(--accent);font-size:.85rem"><i class="fa-solid fa-location-dot"></i></span><span>'+sec.address+'</span></div>':'')+
      (sec.phone?'<div style="display:flex;align-items:center;gap:8px;font-size:.65rem;margin-bottom:6px"><span style="color:var(--accent);font-size:.85rem"><i class="fa-solid fa-phone"></i></span><span dir="ltr">'+sec.phone+'</span></div>':'')+
      (sec.email?'<div style="display:flex;align-items:center;gap:8px;font-size:.65rem;margin-bottom:6px"><span style="color:var(--accent);font-size:.85rem"><i class="fa-solid fa-envelope"></i></span><span dir="ltr">'+sec.email+'</span></div>':'')+
      (sec.whatsapp?'<div style="display:flex;align-items:center;gap:8px;font-size:.65rem;margin-bottom:6px"><span style="color:#25D366;font-size:.85rem"><i class="fa-brands fa-whatsapp"></i></span><span dir="ltr">'+sec.whatsapp+'</span></div>':'')+
    '</div><div style="border-radius:10px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06);background:linear-gradient(135deg,#dbeafe,#bfdbfe);display:flex;align-items:center;justify-content:center;color:#3b82f6;font-size:.65rem;min-height:60px">خريطة الموقع</div></div></div>';
  }
  if (t === 'social') {
    var items = sec.items || [];
    var size = sec.size || 'md';
    var style = sec.style || 'rounded';
    var sizeMap = { sm:'28px', md:'36px', lg:'44px' };
    var iconSizeMap = { sm:'.65rem', md:'.85rem', lg:'1.1rem' };
    var s = sizeMap[size] || '36px';
    var isz = iconSizeMap[size] || '.85rem';
    var br = style === 'circle' ? '50%' : style === 'square' ? '6px' : '10px';
    var platformColors = { facebook:'#1877F2', twitter:'#1DA1F2', instagram:'#E4405F', youtube:'#FF0000', tiktok:'#000000', snapchat:'#FFFC00', whatsapp:'#25D366', telegram:'#0088CC', linkedin:'#0A66C2', pinterest:'#BD081C' };
    var iconMap = { facebook:'fa-facebook-f', twitter:'fa-x-twitter', instagram:'fa-instagram', youtube:'fa-youtube', tiktok:'fa-tiktok', snapchat:'fa-snapchat-ghost', whatsapp:'fa-whatsapp', telegram:'fa-telegram-plane', linkedin:'fa-linkedin-in', pinterest:'fa-pinterest-p' };
    if (!items.length) items = [{platform:'facebook'},{platform:'instagram'},{platform:'whatsapp'}];
    return '<div style="padding:10px;background:'+(sec.bg||'transparent')+';border-radius:8px;text-align:center"><div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">'+
      items.slice(0,5).map(function(link){var color=platformColors[link.platform]||'#64748b';var icon=link.icon||iconMap[link.platform]||'fa-globe';return '<span style="display:flex;align-items:center;justify-content:center;width:'+s+';height:'+s+';border-radius:'+br+';background:'+color+';color:#fff;font-size:'+isz+'"><i class="fa-brands '+icon+'"></i></span>';}).join('')+'</div></div>';
  }
  if (t === 'products') {
    var cols = Math.min(parseInt(sec.columns)||4, 6); var gap = sec.gap!=null?sec.gap:16;
    var cardR = (sec.cardRadius!=null?sec.cardRadius:12)+'px';
    var cardShadow = shadowMap[sec.cardShadow]||shadowMap.sm;
    var cardCount = sec.layout === 'carousel' ? cols : Math.min(cols,6);
    var prodCards = Array(cardCount).fill(0).map(function(){return '<div style="border-radius:'+cardR+';overflow:hidden;border:1px solid var(--border);background:#fff;box-shadow:'+cardShadow+'"><div style="height:65px;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:1.1rem"><i class="fa-solid fa-box"></i></div><div style="padding:8px;text-align:center">'+
      (sec.showRating?'<div style="font-size:.5rem;color:#f59e0b;margin-bottom:3px;direction:ltr;text-align:center">★★★★☆</div>':'')+
      (sec.showTitle!==false?'<div style="font-size:.6rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">اسم المنتج</div>':'')+
      (sec.showPrice!==false?'<div style="font-size:.65rem;font-weight:800;color:var(--accent);margin-top:2px">$29.99</div>':'')+
      (sec.showAddToCart!==false?'<div style="margin-top:5px;padding:5px;background:var(--accent);color:#fff;border-radius:6px;font-size:.55rem;font-weight:700">🛒 أضف للسلة</div>':'')+
    '</div></div>';});
    var pOpen = sec.layout === 'carousel' ? '<div style="display:flex;gap:'+gap+'px;overflow:hidden;padding:2px 0">' :
      '<div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:'+gap+'px">';
    var pClose = '</div>';
    return '<div style="padding:10px;background:'+(sec.bgColor||'transparent')+'">' +
      (sec.title ? '<div style="font-size:.82rem;font-weight:800;color:'+(sec.textColor||'var(--text)')+';margin:0 0 10px;text-align:center">' + sec.title + '</div>' : '') +
      pOpen + prodCards.join('') + pClose + '</div>';
  }
  if (t === 'categories') {
    var gap = sec.gap!=null?sec.gap:12;
    var cardR = (sec.cardRadius!=null?sec.cardRadius:12)+'px';
    var imgH = (sec.imageHeight||100)+'px';
    var isCompact = sec.compact;
    var cardShadow = shadowMap[sec.cardShadow]||shadowMap.sm;
    var tCol = sec.textColor || 'var(--text)';
    var bgCss = sec.bgImage ? 'url('+sec.bgImage+') center/cover no-repeat' : (sec.bgColor||'transparent');
    var showNames = sec.showNames !== false;
    var showCount = sec.showCount !== false;
    // Build real items for preview
    var catItems = [];
    if (sec.mode === 'auto') {
      var stored = localStorage.getItem('mycart_categories');
      var siteCats = [];
      if (stored) { try { siteCats = JSON.parse(stored); } catch(e) {} }
      var allProds = window._allProducts || [];
      var filterNames = sec.categoryNames ? sec.categoryNames.split(',').map(function(s){return s.trim()}).filter(Boolean) : [];
      var brandNames = sec.includeBrands ? sec.includeBrands.split(',').map(function(s){return s.trim()}).filter(Boolean) : [];
      siteCats.forEach(function(sc) {
        if (sc.isBrand && brandNames.indexOf(sc.name) === -1) return;
        if (filterNames.length && filterNames.indexOf(sc.name) === -1) return;
        var cnt = allProds.filter(function(p){return p.category === sc.name || (Array.isArray(p.categories) && p.categories.indexOf(sc.name) !== -1)}).length;
        catItems.push({name:sc.name, image:sc.image||'', count:cnt||''});
      });
      if (!catItems.length && allProds.length) {
        var allCats = [...new Set(allProds.flatMap(function(p){return p.categories&&p.categories.length?p.categories:(p.category?[p.category]:[])}))];
        allCats.forEach(function(cn) {
          if (filterNames.length && filterNames.indexOf(cn) === -1) return;
          var cnt = allProds.filter(function(p){return p.category===cn||(Array.isArray(p.categories)&&p.categories.indexOf(cn)!==-1)}).length;
          catItems.push({name:cn,image:'',count:cnt||''});
        });
      }
    } else {
      catItems = sec.items || [];
    }
    var hasItems = catItems.length > 0;
    if (!hasItems) catItems = Array(6).fill(null);
    function renderCatCard(cat) {
      if (!cat) {
        return '<div style="border-radius:'+cardR+';overflow:hidden;border:1px solid var(--border);text-align:center;background:#fff;box-shadow:'+cardShadow+'"><div style="height:'+(isCompact?'40px':imgH)+';background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:'+(isCompact?'.85rem':'1.2rem')+'"><i class="fa-solid fa-folder-open"></i></div><div style="padding:'+(isCompact?'6px':'8px')+'">' +
          (showNames ? '<div style="font-weight:'+(isCompact?'600':'700')+';font-size:'+(isCompact?'.6rem':'.68rem')+'">تصنيف</div>' : '') +
        '</div></div>';
      }
      var imgHtml = cat.image ? '<img src="'+cat.image+'" style="width:100%;height:'+(isCompact?'40px':imgH)+';object-fit:cover;display:block">' : '<div style="height:'+(isCompact?'40px':imgH)+';background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:'+(isCompact?'.85rem':'1.2rem')+'"><i class="fa-solid fa-folder-open"></i></div>';
      var nameHtml = showNames ? '<div style="font-weight:'+(isCompact?'600':'700')+';font-size:'+(isCompact?'.6rem':'.68rem')+'">'+(cat.name||'')+'</div>' : '';
      var countHtml = showCount && cat.count ? '<div style="font-size:.52rem;color:'+tCol+';opacity:.6;margin-top:2px">'+cat.count+' منتج</div>' : '';
      if (sec.layout === 'list') {
        return '<div style="display:inline-flex;align-items:center;gap:6px;background:#fff;border-radius:'+cardR+';padding:'+(isCompact?'5px 10px':'7px 12px')+';border:1px solid var(--border);cursor:pointer;box-shadow:'+cardShadow+'">' +
          (cat.image ? '<img src="'+cat.image+'" style="width:'+(isCompact?'20':'28')+'px;height:'+(isCompact?'20':'28')+'px;border-radius:50%;object-fit:cover;flex-shrink:0">' : '<span style="font-size:'+(isCompact?'.85rem':'1.1rem')+';color:#94a3b8"><i class="fa-solid fa-folder"></i></span>') +
          nameHtml + countHtml +
        '</div>';
      }
      return '<div style="border-radius:'+cardR+';overflow:hidden;border:1px solid var(--border);text-align:center;background:#fff;box-shadow:'+cardShadow+'">' +
        imgHtml +
        '<div style="padding:'+(isCompact?'5px 6px':'7px 8px')+'">' + nameHtml + countHtml + '</div></div>';
    }
    var layoutOpen = '', layoutClose = '';
    if (sec.layout === 'carousel') {
      var cpv = parseInt(sec.cardsPerView) || 4;
      var mcpv = parseInt(sec.mobileCards) || Math.min(cpv, 2);
      var respNote = cpv !== mcpv ? '<div style="font-size:.55rem;color:#94a3b8;text-align:center;margin-bottom:4px">ديسكتوب ' + cpv + ' · جوال ' + mcpv + '</div>' : '';
      layoutOpen = respNote + '<div style="display:flex;gap:'+gap+'px;overflow:hidden;padding:2px 0">';
      layoutClose = '</div>';
    } else if (sec.layout === 'list') {
      layoutOpen = '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:'+gap+'px">';
      layoutClose = '</div>';
    } else {
      layoutOpen = '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));gap:'+gap+'px">';
      layoutClose = '</div>';
    }
    return '<div style="padding:10px;background:'+bgCss+'">' +
      (sec.title ? '<div style="font-size:.82rem;font-weight:800;color:'+tCol+';margin:0 0 10px;text-align:center">' + sec.title + '</div>' : '') +
      layoutOpen + catItems.slice(0,8).map(renderCatCard).join('') + layoutClose + (catItems.length>8?'<div style="text-align:center;font-size:.6rem;color:var(--text-muted);margin-top:6px">... +'+(catItems.length-8)+' تصنيف</div>':'') + '</div>';
  }
  if (t === 'html') {
    return '<div style="padding:10px;background:#f8fafc;border:1px dashed #e2e8f0;border-radius:8px;text-align:center"><div style="font-size:1rem;color:#94a3b8"><i class="fa-solid fa-code"></i></div><div style="font-size:.6rem;color:var(--text-muted);margin-top:4px;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(sec.code||sec.content||'&lt;!-- كود HTML --&gt;')+'</div></div>';
  }
  if (t === 'marquee') {
    var spd = sec.speed === 'fast' ? 6 : sec.speed === 'slow' ? 14 : 9;
    var dir = sec.direction === 'ltr' ? 'normal' : 'reverse';
    var sz = sec.textSize === 'lg' ? '.95rem' : sec.textSize === 'sm' ? '.7rem' : '.82rem';
    var txt = sec.text || 'نص متحرك';
    var rep = sec.repeat !== false ? Array(6).fill(txt).join(' &nbsp;·&nbsp; ') : txt;
    return '<div style="background:'+(sec.bg||'#1e293b')+';border-radius:8px;overflow:hidden;padding:14px 0"><div style="white-space:nowrap;overflow:hidden"><div style="display:inline-block;animation:pbMarqueePreview '+spd+'s linear infinite;animation-direction:'+dir+';font-size:'+sz+';color:'+(sec.textColor||'#fff')+';font-weight:700;padding:0 10px">'+rep+'</div></div></div>';
  }
  if (t === 'logos') {
    var spd = sec.speed === 'fast' ? 5 : sec.speed === 'slow' ? 12 : 8;
    var imgs = sec.images || [];
    var h = Math.min(parseInt(sec.height)||60, 80)+'px';
    var gr = sec.grayscale !== false ? 'filter:grayscale(1);opacity:.7' : '';
    if (!imgs.length) imgs = [{name:'شعار 1'},{name:'شعار 2'},{name:'شعار 3'},{name:'شعار 4'}];
    var items = imgs.concat(imgs).map(function(img){return img.src?'<div style="flex-shrink:0;height:'+h+';display:flex;align-items:center;padding:0 14px;'+gr+'"><img src="'+img.src+'" style="max-height:100%;max-width:80px;object-fit:contain;border-radius:4px"></div>':'<div style="flex-shrink:0;height:'+h+';width:70px;display:flex;align-items:center;justify-content:center;'+gr+';background:linear-gradient(135deg,#f1f5f9,#e2e8f0);border-radius:6px;color:#94a3b8;font-size:.55rem;font-weight:700">'+(img.name||'شعار')+'</div>';}).join('');
    return '<div style="padding:10px 0;background:'+(sec.bg||'#ffffff')+';border-radius:8px;overflow:hidden"><div style="display:flex;animation:pbLogosPreview '+spd+'s linear infinite">'+items+'</div></div>';
  }
  if (t === 'counters') {
    var items = sec.items || [];
    var cols = parseInt(sec.columns) || 4;
    var ic = sec.iconColor || '#ef4444';
    var tc = sec.textColor || '#fff';
    var bg = sec.bg || '#0f172a';
    if (!items.length) items = [{icon:'⭐',value:100,label:'عميل',suffix:'+'}];
    return '<div style="padding:14px;background:'+bg+';border-radius:8px"><div style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:10px">'+
      items.slice(0,cols).map(function(c){return '<div style="text-align:center"><div style="font-size:1.3rem;margin-bottom:3px">'+(c.icon||'⭐')+'</div><div style="font-size:1.1rem;font-weight:900;color:'+ic+'">'+(c.value||'')+(c.suffix||'')+'</div><div style="font-size:.6rem;color:'+tc+';opacity:.7">'+(c.label||'')+'</div></div>';}).join('')+'</div></div>';
  }
  if (t === 'trust') {
    var items = sec.items || [];
    var lay = sec.layout || 'row';
    var ic = sec.iconColor || '#ef4444';
    if (!items.length) items = [{icon:'🛡️',title:'ضمان',desc:'وصف'}];
    if (lay === 'cards') {
      var cHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+items.slice(0,4).map(function(it){return '<div style="border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center;background:#fff"><div style="font-size:1.3rem;margin-bottom:4px;color:'+ic+'">'+(it.icon||'🛡️')+'</div><div style="font-size:.65rem;font-weight:700;margin-bottom:2px">'+(it.title||'')+'</div><div style="font-size:.58rem;color:var(--text-muted)">'+(it.desc||'')+'</div></div>';}).join('')+'</div>';
    } else {
      var cHtml = '<div style="display:grid;grid-template-columns:repeat('+Math.min(items.length,4)+',1fr);gap:8px">'+items.slice(0,4).map(function(it){return '<div style="text-align:center;padding:8px"><div style="font-size:1.4rem;margin-bottom:3px;color:'+ic+'">'+(it.icon||'🛡️')+'</div><div style="font-size:.65rem;font-weight:700">'+(it.title||'')+'</div>'+(lay==='grid'?'<div style="font-size:.55rem;color:var(--text-muted);margin-top:2px">'+(it.desc||'')+'</div>':'')+'</div>';}).join('')+'</div>';
    }
    return '<div style="padding:10px;background:'+(sec.bg||'#fff')+';border-radius:8px">'+cHtml+'</div>';
  }
  if (t === 'table') {
    var headers = (sec.headers||'').split(',').map(function(s){return s.trim()}).filter(Boolean);
    var rows = sec.rows || [];
    var hBg = sec.headerBg || '#1e293b';
    var tc = sec.textColor || '#1e293b';
    var striped = sec.striped !== false;
    var border = sec.border !== false;
    var bStyle = border ? 'border:1px solid #e2e8f0;' : '';
    var hStyle = 'padding:6px 10px;font-size:.6rem;font-weight:700;color:#fff;background:'+hBg+';'+bStyle;
    var rStyle = 'padding:5px 10px;font-size:.58rem;color:'+tc+';'+bStyle;
    if (!headers.length) headers = ['المقاس','الصدر','الخصر'];
    if (!rows.length) rows = [{cells:'M,96,80'},{cells:'L,102,86'}];
    var tbl = '<table style="width:100%;border-collapse:collapse;text-align:center">'+
      '<thead><tr>'+headers.map(function(h){return '<th style="'+hStyle+'">'+h+'</th>';}).join('')+'</tr></thead><tbody>'+
      rows.slice(0,4).map(function(r,i){var cells=(r.cells||'').split(',').map(function(s){return s.trim()});var rowStyle=i%2&&striped?'background:#f8fafc;':'';return '<tr style="'+rowStyle+'">'+cells.slice(0,headers.length).map(function(c){return '<td style="'+rStyle+'">'+c+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';
    return '<div style="padding:6px;border-radius:8px;overflow:hidden;border:'+(border?'1px solid #e2e8f0':'none')+'">'+(sec.title?'<div style="font-size:.7rem;font-weight:800;margin-bottom:6px;text-align:center;color:'+tc+'">'+sec.title+'</div>':'')+tbl+'</div>';
  }
  return '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:.75rem">معاينة قيد التطوير</div>';
}

function adminEditCustomSection(idx) {
  var sections = window._pbCustomSections || [];
  var sec = sections[idx];
  if (!sec) return;
  window._pbEditingIdx = idx;
  var editId = 'pbEditModal';
  var existing = document.getElementById(editId);
  if (existing) existing.remove();
  var modal = document.createElement('div');
  modal.id = editId;
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow-y:auto';
  
  var info = PB_SECTION_TYPES[sec.type] || { icon: '📄', label: 'قسم' };
  var fields = adminGetPBFields(sec);
  var fieldsHtml = '';
  fields.forEach(function(f) {
    fieldsHtml += adminRenderPBField(f.name, f.label, sec[f.name], f.type, f);
  });
  var previewId = 'pbLivePreview_' + idx;
  var fieldsId = 'pbEditFields_' + idx;
  
  modal.innerHTML = '<div style="background:var(--card);border-radius:20px;padding:20px;max-width:820px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,.2);direction:rtl;text-align:right">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
    '<div style="display:flex;align-items:center;gap:8px"><button onclick="this.closest(\'#' + editId + '\').remove();adminShowAddSectionPicker()" style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--text-muted);padding:4px" title="رجوع"><i class="fa-solid fa-arrow-right"></i></button>' +
    '<div><h3 style="font-size:1rem;font-weight:800;margin:0"><span style="font-size:1.1rem">' + info.icon + '</span> ' + (info.label||'تعديل القسم') + '</h3></div></div>' +
    '<button onclick="this.closest(\'#' + editId + '\').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted);padding:4px;line-height:1">&times;</button></div>' +
    '<div style="display:flex;gap:16px;align-items:flex-start">' +
      // Preview column
      '<div style="flex:1;min-width:0">' +
        '<div id="' + previewId + '" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;position:sticky;top:0">' +
          '<div style="font-size:.68rem;font-weight:700;color:#94a3b8;margin-bottom:10px;display:flex;align-items:center;gap:5px"><i class="fa-solid fa-eye"></i> معاينة حية</div>' +
          '<div class="preview-content">' + renderSectionPreviewHTML(sec) + '</div>' +
        '</div>' +
      '</div>' +
      // Fields column
      '<div style="width:340px;flex-shrink:0">' +
        '<div style="margin-bottom:10px;padding:8px 10px;background:#f8fafc;border-radius:8px;font-size:.75rem">' +
          '<label style="font-weight:700;display:block;margin-bottom:3px">عنوان القسم (داخلي)</label>' +
          '<input type="text" id="pbSecTitle" value="' + (sec.title||'').replace(/"/g,'&quot;') + '" oninput="refreshPBPreview(' + idx + ')" style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem" placeholder="اسم تعريفي للقسم">' +
        '</div>' +
        '<div id="' + fieldsId + '" data-pbidx="' + idx + '">' + fieldsHtml + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">' +
        '<button onclick="adminSaveCustomSection(' + idx + ')" style="flex:1;padding:11px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:.85rem;min-width:100px"><i class="fa-solid fa-check"></i> حفظ</button>' +
        '<button onclick="document.getElementById(\'' + editId + '\').remove()" style="padding:11px 20px;border:1.5px solid var(--border);border-radius:10px;background:var(--card);color:var(--text-muted);font-weight:700;cursor:pointer;font-family:inherit;font-size:.82rem">إلغاء</button>' +
        '<button onclick="adminDeleteCustomSection(' + idx + ');document.getElementById(\'' + editId + '\').remove()" style="padding:11px 18px;border:1.5px solid #fecaca;border-radius:10px;background:#fef2f2;color:#ef4444;font-weight:700;cursor:pointer;font-family:inherit;font-size:.8rem"><i class="fa-solid fa-trash-can"></i></button></div>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);
  // Live preview on field change
  setTimeout(function() {
    var container = document.getElementById(fieldsId);
    if (container) {
      container.addEventListener('input', function() { refreshPBPreview(idx); });
      container.addEventListener('change', function() { refreshPBPreview(idx); });
      // Dynamic gallery field visibility
      var layoutSelect = container.querySelector('[data-field="layout"]');
      if (layoutSelect) {
        layoutSelect.setAttribute('onchange', 'adminToggleGalleryFields(this.value,' + idx + ')');
        adminToggleGalleryFields(layoutSelect.value, idx);
      }
    }
  }, 100);
}

function refreshPBPreview(idx) {
  var preview = document.getElementById('pbLivePreview_' + idx);
  if (!preview) return;
  var fieldsContainer = document.getElementById('pbEditFields_' + idx);
  if (!fieldsContainer) return;
  var sec = window._pbCustomSections && window._pbCustomSections[idx];
  if (!sec) return;
  // Build a temp section with current form values
  var tmp = JSON.parse(JSON.stringify(sec));
  var titleEl = document.getElementById('pbSecTitle');
  if (titleEl) tmp.title = titleEl.value || '';
  // Read layout from form first so adminGetPBFields uses the selected layout
  var layoutEl = fieldsContainer.querySelector('[data-field="layout"]');
  if (layoutEl) tmp.layout = layoutEl.value || 'grid';
  var fields = adminGetPBFields(tmp);
  fields.forEach(function(f) {
    if (f.type === 'section') return;
    var el;
    if (f.type === 'items') {
      tmp[f.name] = sec[f.name] || [];
      return;
    }
    if (f.type === 'multiselect') {
      el = fieldsContainer.querySelector('[data-field="' + f.name + '"]');
      if (el) tmp[f.name] = el.value || '';
      return;
    }
    el = fieldsContainer.querySelector('[data-field="' + f.name + '"]');
    if (!el) return;
    if (f.type === 'checkbox') tmp[f.name] = el.checked;
    else if (f.type === 'number') tmp[f.name] = parseFloat(el.value) || 0;
    else tmp[f.name] = el.value;
  });
  var content = preview.querySelector('.preview-content');
  if (content) content.innerHTML = renderSectionPreviewHTML(tmp);
}

function adminSaveCustomSection(idx) {
  var sections = window._pbCustomSections || [];
  var sec = sections[idx];
  if (!sec) return;
  
  // Internal title
  var titleEl = document.getElementById('pbSecTitle');
  if (titleEl) sec.title = titleEl.value || 'قسم';
  
  // Save all fields from the form
  var container = document.getElementById('pbEditFields_' + idx);
  if (container) {
    // Read layout from DOM first so adminGetPBFields uses the selected layout
    var layoutEl = container.querySelector('[data-field="layout"]');
    if (layoutEl) sec.layout = layoutEl.value || 'grid';
  }
  var fields = adminGetPBFields(sec);
  if (container) {
    fields.forEach(function(f) {
      if (f.type === 'section') return;
      if (f.type === 'items') {
        // Items are stored in the DOM
        var itemsContainer = container.querySelector('.pb-items-container[data-field="' + f.name + '"]');
        if (itemsContainer) {
          var items = [];
          itemsContainer.querySelectorAll('.pb-item-row').forEach(function(row) {
            var item = {};
            row.querySelectorAll('.pb-field-input').forEach(function(inp) {
              item[inp.dataset.field] = inp.value;
            });
            row.querySelectorAll('.pb-field-checkbox').forEach(function(cb) {
              item[cb.dataset.field] = cb.checked;
            });
            items.push(item);
          });
          sec[f.name] = items;
        }
        return;
      }
      var el = container.querySelector('[data-field="' + f.name + '"]');
      if (!el) return;
      if (f.type === 'checkbox') sec[f.name] = el.checked;
      else if (f.type === 'number') sec[f.name] = parseFloat(el.value) || 0;
      else if (f.type === 'multiselect') sec[f.name] = el.value;
      else sec[f.name] = el.value;
    });
  }
  
  window._pbCustomSections = sections;
  var modal = document.getElementById('pbEditModal');
  if (modal) modal.remove();
  adminRefreshPageBuilder();
  showToast('✅ تم حفظ القسم: ' + sec.title, 'success');
}

function adminDeleteCustomSection(idx) {
  showConfirmModal('هل أنت متأكد من حذف هذا القسم؟', function() {
    var sections = window._pbCustomSections || [];
    sections.splice(idx, 1);
    sections.forEach(function(s, i) { s._id = '_custom_' + i; });
    window._pbCustomSections = sections;
    adminRefreshPageBuilder();
    showToast('🗑️ تم حذف القسم', 'info');
  });
}

function adminToggleCustomSection(idx) {
  var sections = window._pbCustomSections || [];
  var sec = sections[idx];
  if (!sec) return;
  sec._visible = sec._visible === false ? true : false;
  window._pbCustomSections = sections;
  adminRefreshPageBuilder();
  if (typeof renderProducts === 'function') renderProducts(getFilteredProducts());
}

function adminDuplicateCustomSection(idx) {
  var sections = window._pbCustomSections || [];
  var sec = sections[idx];
  if (!sec) return;
  var copy = JSON.parse(JSON.stringify(sec));
  copy.title = (copy.title || 'قسم') + ' (نسخة)';
  copy._id = '_custom_' + sections.length;
  sections.push(copy);
  window._pbCustomSections = sections;
  adminRefreshPageBuilder();
  showToast('📋 تم نسخ القسم', 'success');
}

function adminResetPageBuilder() {
  showConfirmModal('هل أنت متأكد من إعادة تعيين جميع الأقسام المخصصة؟<br><small style="color:#ef4444">لا يمكن التراجع</small>', function() {
    showConfirmModal('تأكيد: سيتم حذف جميع الأقسام المخصصة', function() {
      window._pbCustomSections = [];
      adminRefreshPageBuilder();
      showToast('🔄 تم إعادة تعيين المنشئ', 'info');
    });
  });
}

// Item management helpers for the form
function adminAddPBItem(fieldName) {
  var container = document.querySelector('.pb-items-container[data-field="' + fieldName + '"]');
  if (!container) return;
  var sec = window._pbCustomSections && window._pbCustomSections[window._pbEditingIdx];
  if (!sec) return;
  var fields = adminGetPBFields(sec).find(function(f) { return f.name === fieldName; });
  if (!fields) return;
  var emptyItem = {};
  (fields.itemFields || []).forEach(function(f) {
    if (f.type === 'checkbox') emptyItem[f.name] = false;
    else emptyItem[f.name] = '';
  });
  var itemFieldsHtml = (fields.itemFields || []).map(function(f) {
    return adminRenderPBField(f.name, f.label, emptyItem[f.name], f.type, f.extra||{});
  }).join('');
  var div = document.createElement('div');
  div.className = 'pb-item-row';
  div.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:6px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;background:var(--bg)';
  div.innerHTML = '<div style="display:contents">' + itemFieldsHtml + '</div>' +
    '<div style="display:flex;align-items:flex-end;gap:2px;padding-bottom:2px">' +
    '<button type="button" onclick="var p=this.closest(\'.pb-item-row\');var l=p.parentElement;var i=Array.from(l.children).indexOf(p);adminDeletePBItem(l.dataset.field,i)" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:.85rem;padding:3px" title="حذف"><i class="fa-solid fa-trash-can"></i></button>' +
    '<button type="button" onclick="var p=this.closest(\'.pb-item-row\');var l=p.parentElement;var i=Array.from(l.children).indexOf(p);if(i>0){l.insertBefore(p,l.children[i-1])}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.75rem;padding:3px" title="لأعلى"><i class="fa-solid fa-chevron-up"></i></button>' +
    '<button type="button" onclick="var p=this.closest(\'.pb-item-row\');var l=p.parentElement;var i=Array.from(l.children).indexOf(p);if(i<l.children.length-1){l.insertBefore(l.children[i+1],p)}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.75rem;padding:3px" title="لأسفل"><i class="fa-solid fa-chevron-down"></i></button></div>';
  container.appendChild(div);
}

function adminDeletePBItem(fieldName, idx) {
  var container = document.querySelector('.pb-items-container[data-field="' + fieldName + '"]');
  if (!container) return;
  var rows = container.querySelectorAll('.pb-item-row');
  if (rows[idx]) rows[idx].remove();
}

function adminOpenMultiPicker(hiddenId, label, optsJson) {
  var opts = JSON.parse(decodeURIComponent(optsJson));
  var hidden = document.getElementById(hiddenId);
  if (!hidden) return;
  var currentVal = hidden.value ? hidden.value.split(',').map(function(s) { return s.trim(); }) : [];
  var modalId = 'multiPicker_' + hiddenId;
  var existing = document.getElementById(modalId);
  if (existing) existing.remove();
  var modal = document.createElement('div');
  modal.id = modalId;
  modal.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px';
  var html = '<div style="background:var(--card);border-radius:16px;padding:24px;max-width:400px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,.2);direction:rtl;text-align:right">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">' +
    '<h3 style="font-size:1rem;font-weight:800;margin:0">' + label + '</h3>' +
    '<button onclick="document.getElementById(\'' + modalId + '\').remove()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text-muted);padding:4px;line-height:1">&times;</button></div>' +
    '<div style="display:flex;flex-direction:column;gap:4px">';
  opts.forEach(function(o) {
    var checked = currentVal.indexOf(o.value) !== -1;
    html += '<label style="display:flex;align-items:center;gap:10px;padding:8px 10px;cursor:pointer;border-radius:8px;transition:background .15s;font-size:.85rem;font-weight:600;background:' + (checked ? '#f8fafc' : 'transparent') + '">' +
      '<input type="checkbox" class="ms-item" data-value="' + o.value.replace(/"/g,'&quot;') + '" ' + (checked ? 'checked' : '') + ' style="accent-color:var(--accent);width:17px;height:17px">' +
      (o.image ? '<img src="' + o.image.replace(/"/g,'&quot;') + '" style="width:32px;height:32px;border-radius:8px;object-fit:cover;flex-shrink:0;border:1px solid var(--border)" onerror="this.style.display=\'none\'">' : '<span style="width:32px;height:32px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:.9rem;color:#94a3b8;flex-shrink:0"><i class="fa-solid fa-folder"></i></span>') +
      ' ' + o.label + '</label>';
  });
  html += '</div>' +
    '<button onclick="adminSaveMultiPicker(\'' + hiddenId + '\',\'' + modalId + '\')" style="width:100%;margin-top:16px;padding:12px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:.88rem">تأكيد</button></div>';
  modal.innerHTML = html;
  document.body.appendChild(modal);
}

function adminSaveMultiPicker(hiddenId, modalId) {
  var hidden = document.getElementById(hiddenId);
  var modal = document.getElementById(modalId);
  if (!hidden || !modal) return;
  var checked = modal.querySelectorAll('.ms-item:checked');
  var vals = Array.from(checked).map(function(c) { return c.getAttribute('data-value'); }).join(',');
  hidden.value = vals;
  var label = document.getElementById(hiddenId + '_label');
  if (label) {
    var count = vals ? vals.split(',').filter(Boolean).length : 0;
    label.textContent = count > 0 ? count + ' مختارة' : 'اختر...';
    label.style.color = count > 0 ? 'var(--text)' : 'var(--text-muted)';
  }
  modal.remove();
  // Trigger change for live preview
  var evt = new Event('change', { bubbles: true });
  hidden.dispatchEvent(evt);
}

var BUILTIN_SECTION_FIELDS = {
  flashSale: { hasIntro: true },
  halfPrice: { hasIntro: true },
  offers: { hasIntro: false },
  featured: { hasIntro: false },
  newArrival: { hasIntro: false },
  mostSold: { hasIntro: false },
  couponDetector: { hasIntro: false },
  banner: { hasIntro: false }
};

function adminEditBuiltinSection(sid) {
  var id = 'editBuiltin_' + sid;
  var ex = document.getElementById(id);
  if (ex) ex.remove();
  var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  var overrides = mkt.sectionOverrides || {};
  var ov = overrides[sid] || {};
  var info = BUILTIN_SECTION_FIELDS[sid] || {};
  var labels = { flashSale:'تخفيضات سريعة', halfPrice:'نصف السعر', offers:'عروض خاصة', featured:'منتجات مميزة', newArrival:'وصل حديثاً', mostSold:'الأكثر مبيعاً', couponDetector:'كاشف الخصم', banner:'البانرات' };
  var iconMap = { flashSale:'fa-bolt', halfPrice:'fa-tags', offers:'fa-gem', featured:'fa-star', newArrival:'fa-bookmark', mostSold:'fa-fire', couponDetector:'fa-ticket', banner:'fa-images' };
  var colorMap = { flashSale:'#ef4444', halfPrice:'#ec4899', offers:'#f59e0b', featured:'#3b82f6', newArrival:'#f59e0b', mostSold:'#ef4444', couponDetector:'#8b5cf6', banner:'#3b82f6' };
  var gradientMap = { flashSale:'linear-gradient(145deg, #ff416c 0%, #ff4b2b 100%)', halfPrice:'linear-gradient(145deg, #ec4899 0%, #be185d 100%)', offers:'linear-gradient(145deg, #f59e0b 0%, #d97706 100%)', featured:'linear-gradient(145deg, #3b82f6 0%, #2563eb 100%)', newArrival:'linear-gradient(145deg, #f59e0b 0%, #d97706 100%)', mostSold:'linear-gradient(145deg, #ef4444 0%, #dc2626 100%)', couponDetector:'linear-gradient(145deg, #8b5cf6 0%, #7c3aed 100%)', banner:'linear-gradient(145deg, #3b82f6 0%, #2563eb 100%)' };
  var icon = iconMap[sid] || 'fa-star';
  var col = colorMap[sid] || 'var(--accent)';
  var grad = gradientMap[sid] || 'linear-gradient(145deg, #ef4444, #dc2626)';
  var titleVal = ov.title || '';
  var introTitleVal = ov.introTitle || '';
  var introSubVal = ov.introSub || '';
  var previewId = 'preview_' + id;
  var lbl = labels[sid] || sid;

  // Build form fields
  var fieldsHtml = '<div class="pb-field"><label class="pb-field-label">عنوان القسم</label><input type="text" id="builtinTitle" value="' + titleVal.replace(/"/g,'&quot;') + '" oninput="updateBuiltinPreview(\'' + previewId + '\',\'title\',this.value)" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem"></div>';
  if (info.hasIntro) {
    fieldsHtml += '<div class="pb-field" style="margin-top:10px"><label class="pb-field-label">عنوان البطاقة</label><input type="text" id="builtinIntroTitle" value="' + introTitleVal.replace(/"/g,'&quot;') + '" oninput="updateBuiltinPreview(\'' + previewId + '\',\'introTitle\',this.value)" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem"><div style="font-size:.7rem;color:var(--text-muted);margin-top:4px">النص الأساسي في البطاقة التعريفية</div></div>';
    fieldsHtml += '<div class="pb-field" style="margin-top:10px"><label class="pb-field-label">نص البطاقة الفرعي</label><textarea id="builtinIntroSub" rows="2" oninput="updateBuiltinPreview(\'' + previewId + '\',\'introSub\',this.value)" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:8px;font-family:inherit;font-size:.82rem;resize:vertical">' + introSubVal.replace(/"/g,'&quot;') + '</textarea></div>';
  }
  // Realistic intro card preview
  var introHtml = info.hasIntro ?
    '<div style="width:155px;flex-shrink:0;border-radius:16px;overflow:hidden;cursor:pointer;min-height:270px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:22px 14px;gap:8px;color:#fff;background:' + grad + ';box-shadow:0 8px 24px rgba(239,68,68,.2)">' +
      '<div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.22);backdrop-filter:blur(6px);border:1.5px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:8px;box-shadow:0 4px 12px rgba(0,0,0,.15)"><i class="fa-solid ' + icon + '"></i></div>' +
      '<div class="bi-preview-introTitle" style="font-size:1.05rem;font-weight:900;text-shadow:0 2px 4px rgba(0,0,0,.2)">' + (introTitleVal || lbl) + '</div>' +
      '<div class="bi-preview-introSub" style="font-size:.75rem;font-weight:600;opacity:.95;line-height:1.4">' + (introSubVal || 'نص توضيحي') + '</div>' +
      '<div style="margin-top:10px;font-size:.75rem;font-weight:800;background:rgba(255,255,255,.22);padding:6px 16px;border-radius:999px;border:1.5px solid rgba(255,255,255,.45);backdrop-filter:blur(6px);box-shadow:0 4px 12px rgba(0,0,0,.1)">عرض الكل ›</div>' +
    '</div>' : '';

  // Modal container: two columns (form + preview)
  var modal = document.createElement('div');
  modal.id = id;
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = '<div style="background:var(--card);border-radius:20px;padding:28px;max-width:840px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,.2);direction:rtl;text-align:right">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">' +
    '<h3 style="font-size:1.05rem;font-weight:800;margin:0"><i class="fa-solid ' + icon + '" style="color:' + col + '"></i> ' + lbl + '</h3>' +
    '<button onclick="this.closest(\'#' + id + '\').remove()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--text-muted);padding:4px;line-height:1">&times;</button></div>' +
    '<div style="display:flex;gap:20px;align-items:flex-start">' +
      // Left: preview
      '<div style="flex:1;min-width:0">' +
        '<div id="' + previewId + '" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px 16px;position:sticky;top:0">' +
          '<div style="font-size:.72rem;font-weight:700;color:#94a3b8;margin-bottom:14px;display:flex;align-items:center;gap:6px"><i class="fa-solid fa-eye"></i> معاينة حية</div>' +
          // Preview header (section header)
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
            '<h3 style="display:flex;align-items:center;gap:8px;font-size:1.1rem;font-weight:800;color:var(--text);margin:0"><i class="fa-solid ' + icon + '" style="color:' + col + ';font-size:1.15rem;animation:flashPulse 2s infinite"></i> <span class="bi-preview-title">' + (titleVal || lbl) + '</span></h3>' +
            '<div style="display:flex;align-items:center;gap:6px">' +
              '<span style="display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,#fff5f5,#fef2f2);color:#991b1b;padding:3px 8px;border-radius:999px;font-weight:800;font-size:.8rem;border:1px solid #fecaca;box-shadow:0 2px 6px rgba(239,68,68,.08)"><i class="fa-regular fa-clock" style="font-size:.7rem"></i> <span style="background:#fff;color:#dc2626;padding:2px 6px;border-radius:6px;font-weight:900;font-size:.78rem;border:1px solid #fca5a5">00</span><span style="color:#ef4444;font-weight:900;font-size:.82rem;animation:timerBlink 1s infinite">:</span><span style="background:#fff;color:#dc2626;padding:2px 6px;border-radius:6px;font-weight:900;font-size:.78rem;border:1px solid #fca5a5">00</span><span style="color:#ef4444;font-weight:900;font-size:.82rem;animation:timerBlink 1s infinite">:</span><span style="background:#fff;color:#dc2626;padding:2px 6px;border-radius:6px;font-weight:900;font-size:.78rem;border:1px solid #fca5a5">00</span></span>' +
              '<span style="display:inline-flex;align-items:center;gap:5px"><button style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--card);color:var(--text);display:inline-flex;align-items:center;justify-content:center;font-size:.75rem;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.05)"><i class="fa-solid fa-chevron-right"></i></button><button style="width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--card);color:var(--text);display:inline-flex;align-items:center;justify-content:center;font-size:.75rem;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.05)"><i class="fa-solid fa-chevron-left"></i></button></span>' +
              '<button style="border:none;background:none;color:var(--accent);font-weight:800;font-size:.82rem;cursor:pointer;padding:4px">عرض الكل ›</button>' +
            '</div>' +
          '</div>' +
          // Products scroll area with intro card
          '<div style="display:flex;gap:12px;overflow:hidden">' +
            introHtml +
            // Fake product cards
            '<div style="width:140px;flex-shrink:0;border-radius:16px;overflow:hidden;border:1px solid var(--border);background:var(--card)">' +
              '<div style="height:120px;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:2rem"><i class="fa-solid fa-box"></i></div>' +
              '<div style="padding:10px"><div style="height:10px;background:#f1f5f9;border-radius:4px;width:80%;margin-bottom:6px"></div><div style="height:10px;background:#f1f5f9;border-radius:4px;width:50%"></div></div>' +
            '</div>' +
            '<div style="width:140px;flex-shrink:0;border-radius:16px;overflow:hidden;border:1px solid var(--border);background:var(--card)">' +
              '<div style="height:120px;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:2rem"><i class="fa-solid fa-box"></i></div>' +
              '<div style="padding:10px"><div style="height:10px;background:#f1f5f9;border-radius:4px;width:70%;margin-bottom:6px"></div><div style="height:10px;background:#f1f5f9;border-radius:4px;width:60%"></div></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // Right: form fields
      '<div style="width:340px;flex-shrink:0">' +
        fieldsHtml +
        '<div style="display:flex;gap:10px;margin-top:20px">' +
        '<button onclick="adminSaveBuiltinSection(\'' + sid + '\',\'' + id + '\')" style="flex:1;padding:12px;border:none;border-radius:12px;background:var(--accent);color:#fff;font-weight:800;cursor:pointer;font-family:inherit;font-size:.88rem"><i class="fa-solid fa-check"></i> حفظ</button>' +
        '<button onclick="document.getElementById(\'' + id + '\').remove()" style="padding:12px 24px;border:1.5px solid var(--border);border-radius:12px;background:var(--card);color:var(--text-muted);font-weight:700;cursor:pointer;font-family:inherit;font-size:.85rem">إلغاء</button></div>' +
      '</div>' +
    '</div></div>';
  document.body.appendChild(modal);
}

function updateBuiltinPreview(previewId, field, value) {
  var preview = document.getElementById(previewId);
  if (!preview) return;
  if (field === 'title') {
    var el = preview.querySelector('.bi-preview-title');
    if (el) el.textContent = value || '';
  } else if (field === 'introTitle') {
    var el = preview.querySelector('.bi-preview-introTitle');
    if (el) el.textContent = value || 'عنوان البطاقة';
  } else if (field === 'introSub') {
    var el = preview.querySelector('.bi-preview-introSub');
    if (el) el.innerHTML = value || 'نص توضيحي';
  }
}

function adminSaveBuiltinSection(sid, modalId) {
  var title = document.getElementById('builtinTitle');
  var introTitle = document.getElementById('builtinIntroTitle');
  var introSub = document.getElementById('builtinIntroSub');
  var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  var overrides = mkt.sectionOverrides || {};
  var ov = overrides[sid] || {};
  if (title) ov.title = title.value || '';
  if (introTitle) ov.introTitle = introTitle.value || '';
  if (introSub) ov.introSub = introSub.value || '';
  overrides[sid] = ov;
  mkt.sectionOverrides = overrides;
  try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) {}
  document.getElementById(modalId).remove();
  showToast('✅ تم تحديث ' + (sid === 'flashSale' ? 'تخفيضات سريعة' : sid === 'halfPrice' ? 'نصف السعر' : sid), 'success');
  if (typeof applySectionOverrides === 'function') applySectionOverrides();
}

function applySectionOverrides() {
  var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  var overrides = mkt.sectionOverrides || {};
  var sectionIds = { flashSale:'flashSaleSection', halfPrice:'halfPriceSection', offers:'offersSection', featured:'featuredSection', newArrival:'newArrivalSection', mostSold:'mostSoldSection', couponDetector:'couponDetectorWidget', banner:'bannerSlider' };
  Object.keys(overrides).forEach(function(sid) {
    var ov = overrides[sid];
    if (!ov) return;
    var el = document.getElementById(sectionIds[sid]);
    if (!el) return;
    if (ov.title) {
      var titleEl = el.querySelector('h3') || el.querySelector('.flash-section-header h3');
      if (titleEl) {
        // Preserve icons inside h3
        var icon = titleEl.querySelector('i');
        if (icon) { titleEl.textContent = ov.title; titleEl.prepend(icon); }
        else titleEl.textContent = ov.title;
      } else {
        // Try any span that looks like a title
        var sp = el.querySelector('[class*="title"]') || el.querySelector('.hp-intro-title');
        if (sp) sp.textContent = ov.title;
      }
    }
    if (ov.introTitle) {
      var introEl = el.querySelector('.hp-intro-title');
      if (introEl) introEl.textContent = ov.introTitle;
    }
    if (ov.introSub) {
      var subEl = el.querySelector('.hp-intro-sub');
      if (subEl) subEl.innerHTML = ov.introSub;
    }
  });
}

function adminRefreshPageBuilder() {
  var container = document.getElementById('admin-marketing');
  if (!container) return;
  var data = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  data.customSections = window._pbCustomSections || [];
  var newHtml = adminRenderPageBuilder(data);
  var saveBtn = container.querySelector('button[onclick*="adminSaveMarketing"]');
  if (saveBtn) {
    container.innerHTML = newHtml + '\n<button class="admin-btn admin-btn-primary" onclick="adminSaveMarketing(\'pagebuilder\')" style="margin-top:16px;display:none"><i class="fa-solid fa-floppy-disk"></i> حفظ التسويق</button>';
  } else {
    container.innerHTML = newHtml;
  }
  adminInitPageBuilder();
}

function adminSavePageBuilder() {
  var list = document.getElementById('pbSectionList');
  if (!list) return;
  var items = list.querySelectorAll('.pb-section-item');
  var order = Array.from(items).map(function(item) { return item.dataset.id; });
  var mkt = JSON.parse(localStorage.getItem('mycart_marketing') || '{}');
  mkt.sectionOrder = order;
  mkt.customSections = window._pbCustomSections || [];
  try { localStorage.setItem('mycart_marketing', JSON.stringify(mkt)); } catch(e) {}
  if (typeof renderProducts === 'function') renderProducts(getFilteredProducts());
  var status = document.getElementById('pbStatus');
  if (status) { status.textContent = '✓ تم حفظ تخطيط الصفحة الرئيسية بنجاح'; status.style.display = 'block'; status.style.color = '#22c55e'; setTimeout(function() { status.style.display = 'none'; }, 3000); }
  showToast('✅ تم حفظ تخطيط الصفحة الرئيسية', 'success');
}


