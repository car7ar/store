(function() {
  const EXCLUDED_KEYS = [
    'mycart_cart',
    'mycart_wishlist',
    'mycart_customer',
    'mycart_cid',
    'mycart_dark_mode',
    'mycart_read_notifications',
    'mycart_admin_logged',
    'mycart_wholesale',
    'mycart_store_images_temp'
  ];

  // Extract storeId from the URL pathname (e.g., /stores/watches/ -> watches)
  const pathParts = window.location.pathname.split('/');
  const storesIndex = pathParts.indexOf('stores');
  let storeId = 'default';
  if (storesIndex !== -1 && pathParts[storesIndex + 1]) {
    storeId = pathParts[storesIndex + 1];
  }

  // Helper to namespace localstorage keys to avoid collisions on localhost
  function getNamespacedKey(key) {
    if (key.startsWith('mycart_') && !['mycart_cid', 'mycart_dark_mode'].includes(key)) {
      return `${key}_${storeId}`;
    }
    return key;
  }

  // Intercept localStorage functions to apply store namespacing dynamically
  const originalGetItem = localStorage.getItem;
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;

  localStorage.getItem = function(key) {
    return originalGetItem.call(this, getNamespacedKey(key));
  };

  localStorage.removeItem = function(key) {
    originalRemoveItem.call(this, getNamespacedKey(key));
  };

  localStorage.setItem = function(key, value) {
    // Write locally first (with namespace)
    try {
      originalSetItem.call(this, getNamespacedKey(key), value);
    } catch (e) {
      console.error('Local localStorage write failed:', e);
    }

    // Sync config-related mycart_ keys with server
    if (key.startsWith('mycart_') && !EXCLUDED_KEYS.includes(key)) {
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        parsedValue = value; // Fallback if it's not a JSON string
      }

      fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: key, value: parsedValue, store: storeId })
      }).catch(err => {
        console.warn('Failed to sync key to server:', key, err);
      });
    }
  };

  // 1. Synchronously pre-populate localStorage with server-side data on load
  try {
    // Clean up oversized legacy store-images temp value (from old uncompressed version)
    try {
      const legacyRaw = originalGetItem.call(localStorage, `mycart_store_images_temp_${storeId}`);
      if (legacyRaw && legacyRaw.length > 700000) {
        originalRemoveItem.call(localStorage, `mycart_store_images_temp_${storeId}`);
      }
    } catch (e) {}

    const xhr = new XMLHttpRequest();
    xhr.open('GET', `/api/init-data?store=${encodeURIComponent(storeId)}`, false); // synchronous request
    xhr.send(null);
    if (xhr.status === 200) {
      const serverData = JSON.parse(xhr.responseText);
      Object.keys(serverData).forEach(key => {
        if (!EXCLUDED_KEYS.includes(key)) {
          try {
            // This will go through our overridden localStorage.setItem and be namespaced automatically!
            const val = serverData[key];
            const strVal = typeof val === 'string' ? val : JSON.stringify(val);
            localStorage.setItem(key, strVal);
          } catch (e) {
            console.error('Error writing server data to localStorage:', key, e);
          }
        }
      });
    } else {
      // Fallback for static hosts (like GitHub Pages) where API is not available
      const staticKeys = [
        'mycart_admin_products',
        'mycart_admin_settings',
        'mycart_appearance',
        'mycart_bg',
        'mycart_categories',
        'mycart_logo',
        'mycart_marketing',
        'mycart_orders',
        'mycart_wholesale_code'
      ];
      staticKeys.forEach(key => {
        try {
          const staticXhr = new XMLHttpRequest();
          staticXhr.open('GET', `data/${key}.json`, false);
          staticXhr.send(null);
          if (staticXhr.status === 200) {
            localStorage.setItem(key, staticXhr.responseText);
          }
        } catch (e) {
          console.warn(`Failed to load static fallback for ${key}:`, e);
        }
      });
    }
  } catch (err) {
    console.warn('Could not sync data from server (running offline or direct file mode):', err);
  }
})();
