function addFromDetail(el) {
  if (!currentProduct) return;
  const p = currentProduct;
  if (p.type === 'bundle' && p.bundleProducts && p.bundleProducts.length) {
    const anyOut = p.bundleProducts.some(bp => {
      const child = products.find(x => x.id === bp.id);
      return !child || (child.stock !== undefined && child.stock === 0);
    });
    if (anyOut) { showToast('بعض منتجات البكج غير متوفرة', 'error'); return; }
    p.bundleProducts.forEach(bp => {
      const child = products.find(x => x.id === bp.id);
      for (let i = 0; i < (bp.qty || 1) * detailQty; i++) addToCart(child, null, null);
    });
    animateAddToCart(el);
    playSound('add');
    showToast('تمت إضافة البكج للسلة', 'success');
    return;
  }
  if (p.stock === 0) { showToast( __('outOfStock'), 'error'); return; }
  if (p.options && p.options.length) {
    const selected = currentProduct.options.map(opt => ({ n: opt.name, v: window._selOptions[opt.name] || opt.values[0].value }));
    for (let i = 0; i < detailQty; i++) addToCart(currentProduct, null, selected);
  } else {
    for (let i = 0; i < detailQty; i++) addToCart(currentProduct, currentVariant);
  }
  animateAddToCart(el);
  playSound('add');
  var _qd = cart.find(function(x) { return x.id === currentProduct.id && !x.variant; });
  showToast( __('addedToCart') + (_qd && _qd.qty > 1 ? ' ×' + _qd.qty : ''), 'success');
  updateQuickBadge(currentProduct.id, el);
}

function updateQuickBadge(id, el) {
  var target = el;
  if (!target) {
    var card = document.querySelector('[data-id="' + id + '"]');
    if (!card) return;
    target = card.querySelector('.quick-add') || card.querySelector('.flash-add-btn') || card.querySelector('.feat-add');
  }
  if (!target) return;
  if (target.closest('.product-card')) return;
  var c = parseInt(target.dataset.quickQty || '0', 10) + 1;
  target.dataset.quickQty = String(c);
  var existing = target.querySelector('.quick-qty');
  if (existing) {
    existing.textContent = c;
  } else {
    var badge = document.createElement('span');
    badge.className = 'quick-qty';
    badge.textContent = c;
    target.style.position = 'relative';
    target.appendChild(badge);
  }
}

function quickAdd(id, el) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (p.stock === 0) { showToast( __('outOfStock'), 'error'); return; }
  if (p.type === 'bundle' && p.bundleProducts && p.bundleProducts.length) {
    const anyOut = p.bundleProducts.some(bp => {
      const child = products.find(x => x.id === bp.id);
      return !child || (child.stock !== undefined && child.stock === 0);
    });
    if (anyOut) { showToast('بعض منتجات البكج غير متوفرة', 'error'); return; }
    p.bundleProducts.forEach(bp => {
      const child = products.find(x => x.id === bp.id);
      for (let i = 0; i < (bp.qty || 1); i++) addToCart(child, null, null);
    });
    animateAddToCart(el); playSound('add'); showToast('تمت إضافة البكج للسلة', 'success');
    return;
  }
  addToCart(p); animateAddToCart(el); playSound('add');
  var _qi = cart.find(function(x) { return x.id === id && !x.variant; });
  showToast( __('addedToCart') + (_qi && _qi.qty > 1 ? ' ×' + _qi.qty : ''), 'success');
  updateQuickBadge(id, el);
}

function openCartSheet() {
  renderCartItems();
  renderOrders();
  // Restore tabs & footer (hidden by thank you)
  const tabs = document.querySelector('.sheet-tabs');
  if (tabs) tabs.style.display = '';
  const footer = document.getElementById('cartSummary');
  if (footer) footer.style.display = '';
  // Reset to cart items tab
  setCartTabActive('items');
  currentCheckoutStep = 0;
  if (isWholesale) {
    document.getElementById('merchantLoggedIn').style.display = 'block';
    document.getElementById('merchantCode').style.display = 'none';
    const btn = document.querySelector('#merchantBody > button');
    if (btn) btn.style.display = 'none';
  }
  document.getElementById('cartSheet').classList.add('show');
  document.body.style.overflow = 'hidden';
  // Reset to cart items tab
  setCartTabActive('items');
  currentCheckoutStep = 0;
}

function closeCartSheet() {
  document.getElementById('cartSheet').classList.remove('show');
  document.body.style.overflow = '';
}

function addToCart(p, variant, options) {
  const isOptionMode = options && options.length;
  const vLabel = isOptionMode ? options.map(o => o.v).join(' - ') : (variant ? (variant.attrs || []).map(a => a.v).filter(Boolean).join(' - ') : '');
  const vKey = vLabel;
  const existing = cart.find(item => item.id === p.id && (item.variant || '') === vKey);
  if (existing) existing.qty += 1;
  else {
    const offered = typeof calcOfferPrice === 'function' ? calcOfferPrice(p) : null;
    const basePrice = offered !== null ? offered : (isWholesale ? Math.round(p.price * 0.85) : p.price);
    let optPrice = 0;
    if (isOptionMode && p.options) {
      optPrice = options.reduce((sum, o) => {
        const opt = p.options.find(op => op.name === o.n);
        if (!opt) return sum;
        const val = opt.values.find(v => v.value === o.v);
        return sum + (val ? val.price : 0);
      }, 0);
    }
    const variantPrice = variant && variant.price ? variant.price : 0;
    const extraPrice = isOptionMode ? optPrice : variantPrice;
    const variantImages = isOptionMode ? [] : (variant ? variant.images || [] : []);
    const firstImg = isOptionMode ? '' : (variantImages[0] || getProductImages(p)[0]);
    cart.push({
      id: p.id,
      name: p.name,
      variant: vKey,
      variantData: isOptionMode ? { attrs: options.map(o => ({ n: o.n, v: o.v })) } : (variant ? { attrs: variant.attrs, images: variant.images } : undefined),
      price: basePrice + extraPrice,
      image: firstImg || getProductImages(p)[0],
      qty: 1
    });
  }
  saveCart();
  updateCartBadge();
  // Pixel tracking: AddToCart
  if (typeof fbq === 'function') {
    fbq('track', 'AddToCart', { content_name: p.name, content_ids: p.sku ? [p.sku] : [p.id], content_type: 'product', value: p.price, currency: CURRENCY });
  }
  if (typeof gtag === 'function') {
    gtag('event', 'add_to_cart', { currency: CURRENCY, value: p.price, items: [{ id: p.sku || p.id, name: p.name, price: p.price, quantity: 1 }] });
  }
}

function removeFromCart(id, variant) {
  cart = cart.filter(item => !(item.id === id && (item.variant || '') === (variant || '')));
  saveCart();
  renderCartItems();
  updateCartBadge();
  playSound('remove');
}

function changeCartQty(id, delta, variant) {
  const item = cart.find(x => x.id === id && (x.variant || '') === (variant || ''));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id, variant); return; }
  saveCart();
  renderCartItems();
  updateCartBadge();
}

function renderCartItems() {
  const list = document.getElementById('cartItemsList');
  if (!cart.length) {
    list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-bag-shopping"></i><p>${__('emptyCart')}</p></div>`;
    document.getElementById('cartSummary').style.display = 'none';
    return;
  }
  // Only show footer if on cart items tab
  if (currentCheckoutStep === 0) {
    document.getElementById('cartSummary').style.display = 'block';
    const navBtns = document.getElementById('checkoutNavBtns');
    navBtns.innerHTML = `<button class="checkout-btn" onclick="goToCheckout()"><i class="fa-solid fa-arrow-left"></i> ${__('next')}</button>`;
  }
  list.innerHTML = cart.map(item => {
    const escV = (item.variant || '').replace(/'/g, "\\'");
    return `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <h4>${item.name}${item.variant ? ` <span style="font-weight:400;color:var(--text-muted);font-size:.75rem">${variantSwatchHtml(item.variantData)}${item.variant}</span>` : ''}</h4>
        <div class="item-price">${CURRENCY}${item.price}</div>
        <div class="cart-item-qty">
          <button onclick="changeCartQty(${item.id},-1,'${escV}')">-</button>
          <span>${item.qty}</span>
          <button onclick="changeCartQty(${item.id},1,'${escV}')">+</button>
        </div>
      </div>
      <div class="cart-item-remove" onclick="removeFromCart(${item.id},'${escV}')"><i class="fa-solid fa-trash-can"></i></div>
    </div>`;
  }).join('');
  const total = cart.reduce((sum, item) => sum + getVolumeDiscountedPrice(item.price, item.qty), 0);
  // Free Shipping Progress Bar calculation
  const mData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  const isFreeShipActive = mData.freeShipping?.show || false;
  const goal = mData.freeShipping?.goal || mData.freeShippingGoal || 300;
  const progressText = document.getElementById('freeShippingProgressText');
  const progressGoal = document.getElementById('freeShippingGoalText');
  const progressBar = document.getElementById('freeShippingProgressBar');
  const progressContainer = document.getElementById('freeShippingProgressContainer');
  if (progressContainer) {
    if (isFreeShipActive) {
      progressContainer.style.display = 'block';
      if (progressGoal) progressGoal.textContent = `${CURRENCY}${goal}`;
      const pct = Math.min(100, (total / goal) * 100);
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (progressText) {
        if (total >= goal) {
          progressText.innerHTML = __('freeShippingCongrats');
          if (progressBar) progressBar.style.background = '#10b981';
        } else {
          const remaining = goal - total;
          progressText.innerHTML = __('freeShippingRemaining').replace('{amount}', `${CURRENCY}${remaining}`);
          if (progressBar) progressBar.style.background = 'var(--accent)';
        }
      }
    } else {
      progressContainer.style.display = 'none';
    }
  }
  let discount = 0;
  let discLabelExtra = '';
  if (typeof appliedCoupon !== 'undefined' && appliedCoupon) {
    const disc = (typeof calculateDiscount === 'function') ? calculateDiscount(appliedCoupon, total) : { amount: 0, isFreeShip: false };
    discount = disc.amount || 0;
    if (appliedCoupon.type === CouponType.FIXED) discLabelExtra = ` (كوبون ${appliedCoupon.code})`;
    else if (appliedCoupon.type === CouponType.PERCENT) discLabelExtra = ` (${appliedCoupon.code} - ${appliedCoupon.value}%)`;
    else if (appliedCoupon.type === CouponType.FREESHIP) discLabelExtra = ` (${appliedCoupon.code})`;
  } else if (appliedDiscount > 0) {
    discount = Math.round(total * appliedDiscount / 100);
  }
  if (typeof appliedCoupon !== 'undefined' && appliedCoupon && appliedCoupon._fixedAmount) {
    discount = appliedCoupon._fixedAmount;
  }
  const zoneEl = document.getElementById('custZone');
  const zoneName = zoneEl ? zoneEl.value : '';
  const zones = loadDeliveryZones();
  const zone = zones.find(z => z.name === zoneName);
  let delivery = zone ? zone.price : 0;
  const isCouponFreeShip = (typeof appliedIsFreeShip !== 'undefined' && appliedIsFreeShip) || (typeof appliedCoupon !== 'undefined' && appliedCoupon && appliedCoupon.type === CouponType.FREESHIP);
  if (isCouponFreeShip) {
    delivery = 0;
  } else if (isFreeShipActive && total >= goal) {
    delivery = 0;
  }
  const final = Math.max(0, total - discount + delivery);
  const discRow = document.getElementById('discountRow');
  const discAmt = document.getElementById('cartDiscount');
  const discLbl = document.getElementById('discountRowLabel');
  if (discount > 0) {
    discRow.style.display = 'flex';
    if (discAmt) discAmt.textContent = `-${CURRENCY}${discount.toFixed(2)}`;
    if (discLbl && discLabelExtra) discLbl.textContent = `الخصم ${discLabelExtra}`;
    else if (discLbl) discLbl.textContent = 'الخصم';
  } else if (isCouponFreeShip) {
    discRow.style.display = 'flex';
    if (discAmt) discAmt.textContent = 'مجاني 🎁';
    if (discLbl) discLbl.textContent = `الشحن ${discLabelExtra || ''}`.trim();
  } else {
    discRow.style.display = 'none';
  }
  const delRow = document.getElementById('deliveryRow');
  const delAmt = document.getElementById('cartDelivery');
  const delLbl = document.getElementById('deliveryRowLabel');
  if (delivery > 0) {
    delRow.style.display = 'flex';
    if (delAmt) delAmt.textContent = `${CURRENCY}${delivery.toFixed(2)}`;
  } else if (isCouponFreeShip) {
    delRow.style.display = 'flex';
    if (delAmt) delAmt.textContent = 'مجاني 🎁';
    if (delLbl) delLbl.textContent = 'التوصيل (بفضلك الكوبون)';
  } else if (isFreeShipActive && total >= goal) {
    delRow.style.display = 'flex';
    if (delAmt) delAmt.textContent = 'مجاني 🎁';
    if (delLbl) delLbl.textContent = 'التوصيل (شحن مجاني للطلب)';
  } else {
    delRow.style.display = 'none';
  }
  const cartTotalEl = document.getElementById('cartTotal');
  if (cartTotalEl) cartTotalEl.textContent = `${CURRENCY}${final.toFixed(2)}`;
}

function updateCartBadge() {
  const count = cart.reduce((a, b) => a + b.qty, 0);
  const badge = document.getElementById('cartBadge');
  if (count > 0) { badge.style.display = 'flex'; badge.textContent = count; }
  else badge.style.display = 'none';
  document.getElementById('cartCountTab').textContent = count;
}

function loadCustomerForm() {
  if (customer.name) document.getElementById('custName').value = customer.name;
  if (customer.phone) { document.getElementById('custPhone').value = customer.phone; validatePhone(); }
  if (customer.phone2 && customer.phone2.length === 10) {
    const wrap = document.getElementById('phone2Wrap');
    const p2 = document.getElementById('custPhone2');
    const icon = document.getElementById('addPhone2Icon');
    const btn = document.getElementById('addPhone2Btn');
    if (wrap) wrap.style.display = 'block';
    if (p2) { p2.value = customer.phone2; p2.style.borderColor = '#10b981'; }
    if (icon) icon.className = 'fa-solid fa-xmark';
    if (btn) btn.style.color = '#6b7280';
  }
  if (customer.city) document.getElementById('custCity').value = customer.city;
  if (customer.address) document.getElementById('custAddress').value = customer.address;
}

function loadDeliveryZones() {
  try { return JSON.parse(localStorage.getItem('mycart_delivery_zones')) || []; } catch(e) { return []; }
}

function saveDeliveryZones(zones) {
  try { localStorage.setItem('mycart_delivery_zones', JSON.stringify(zones)); } catch(e) { showToast('⚠️ مساحة التخزين ممتلئة', 'error'); }
}

function getVolumeDiscountedPrice(basePrice, qty) {
  const mData = JSON.parse(localStorage.getItem('mycart_marketing')) || {};
  if (!mData.volumeDiscount?.show) return basePrice * qty;

  const type = mData.volumeDiscount.type || 'percent';

  if (type === 'bogo') {
    const buy = mData.volumeDiscount.bogoBuy || 2;
    const get = mData.volumeDiscount.bogoGet || 1;
    const groupSize = buy + get;
    const freeGroups = Math.floor(qty / groupSize);
    const paidQty = qty - (freeGroups * get);
    return basePrice * paidQty;
  }

  if (type === 'fixed') {
    const disc2 = mData.volumeDiscount.disc2 || 5;
    const disc3 = mData.volumeDiscount.disc3 || 10;
    if (qty >= 3) {
      return Math.max(0, (basePrice - disc3) * qty);
    }
    if (qty >= 2) {
      return Math.max(0, (basePrice - disc2) * qty);
    }
    return basePrice * qty;
  }

  // default 'percent'
  if (qty >= 3) {
    const disc = (mData.volumeDiscount.disc3 || 10) / 100;
    return Math.round(basePrice * qty * (1 - disc));
  }
  if (qty >= 2) {
    const disc = (mData.volumeDiscount.disc2 || 5) / 100;
    return Math.round(basePrice * qty * (1 - disc));
  }
  return basePrice * qty;
}

function addToCartWithPrice(p, customPrice) {
  let img = Array.isArray(p.images) ? p.images[0] : p.image;
  const item = {
    id: p.id,
    name: p.name,
    price: customPrice,
    image: img,
    qty: 1,
    variant: ''
  };
  const existing = cart.find(x => x.id === p.id && x.variant === '');
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push(item);
  }
  saveCart();
  renderCartItems();
  updateCartBadge();
}