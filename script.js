
"use strict";

/*
  BHAT CHOICE KASHMIR
  Static-site demo:
  - Cart, wishlist and profile use this browser's localStorage.
  - Orders are sent to WhatsApp for manual handling.
  - This is NOT secure online payment verification or a secure admin backend.
*/

const WHATSAPP_NUMBER = "917889928279";
const CURRENCY = "₹";
const STORAGE = {
  cart: "bhatChoiceCartV3",
  wishlist: "bhatChoiceWishlistV3",
  profile: "bhatChoiceProfileV3",
  orders: "bhatChoiceOrdersV3",
  customProducts: "bhatChoiceCustomProductsV3"
};

const DEFAULT_PRODUCTS = [
  { id: "cable", name: "Fast Charging Cable", category: "Mobile Accessories", price: 155, emoji: "🔌", image: "fast_charging_cable.png", badge: "Everyday pick", description: "A handy everyday charging accessory." },
  { id: "case", name: "Premium Phone Case", category: "Mobile Accessories", price: 196, emoji: "📱", image: "premium_phone_case.png", badge: "Popular", description: "A stylish phone accessory for everyday use." },
  { id: "suit", name: "Kashmiri Style Suit", category: "Suits", price: 1199, emoji: "🧵", image: "suit kashmire.png", badge: "Featured", description: "A Kashmiri-inspired style for your wardrobe." },
  { id: "sneakers", name: "Casual Sneakers", category: "Shoes", price: 1099, emoji: "👟", image: "casual_sneakers.png", badge: "Style pick", description: "Casual footwear for everyday outfits." },
  { id: "beauty", name: "Beauty Essentials", category: "Cosmetics", price: 499, emoji: "💄", image: "beauty_essentials.png", badge: "Popular", description: "Beauty essentials for your collection." },
  { id: "jewellery", name: "Fashion Jewellery Set", category: "Jewellery", price: 799, emoji: "💎", image: "fashion_jewellery_set.png", badge: "Elegant", description: "A fashion jewellery set for special looks." },
  { id: "backpack", name: "Everyday Backpack", category: "Other", price: 999, emoji: "🎒", image: "everyday_backpack.png", badge: "Daily use", description: "A useful bag for daily essentials." },
  { id: "earbuds", name: "Wireless Earbuds", category: "Mobile Accessories", price: 479, emoji: "🎧", image: "wireless_earbuds.png", badge: "Popular", description: "Wireless audio accessories for everyday use." }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    showToast("Browser storage unavailable. Your changes may not be saved.");
    return false;
  }
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
function money(value) {
  return CURRENCY + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
function safeImage(value) {
  const filename = String(value || "").trim();
  // Only allow a simple local filename; no external URLs or HTML.
  if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\") || /[:<>"]/g.test(filename)) return "";
  return filename;
}
function imageMarkup(filename, emoji, extraClass = "") {
  const image = safeImage(filename);
  if (!image) return `<span class="product-emoji ${extraClass}">${escapeHTML(emoji || "🛍️")}</span>`;
  return `<img class="${extraClass}" src="${escapeHTML(image)}" alt="" loading="lazy" onerror="this.remove();this.parentElement.insertAdjacentHTML('beforeend','<span class=&quot;product-emoji&quot;>${escapeHTML(emoji || "🛍️")}</span>')>`;
}

let customProducts = readStore(STORAGE.customProducts, []);
if (!Array.isArray(customProducts)) customProducts = [];

let products = [...DEFAULT_PRODUCTS, ...customProducts].filter(p =>
  p && typeof p.id === "string" && typeof p.name === "string" &&
  Number.isFinite(Number(p.price)) && Number(p.price) > 0
);

let cart = readStore(STORAGE.cart, {});
if (!cart || typeof cart !== "object" || Array.isArray(cart)) cart = {};
let wishlist = readStore(STORAGE.wishlist, []);
if (!Array.isArray(wishlist)) wishlist = [];
let profile = readStore(STORAGE.profile, { name: "", phone: "" });
if (!profile || typeof profile !== "object") profile = { name: "", phone: "" };
let orders = readStore(STORAGE.orders, []);
if (!Array.isArray(orders)) orders = [];

let activeCategory = "All";
let searchTerm = "";
let sortMode = "featured";
let couponApplied = false;
let toastTimer;

function saveCart() { writeStore(STORAGE.cart, cart); }
function saveWishlist() { writeStore(STORAGE.wishlist, wishlist); }
function saveProfile() { writeStore(STORAGE.profile, profile); }
function saveOrders() { writeStore(STORAGE.orders, orders); }

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function getProduct(id) {
  return products.find(p => p.id === id);
}
function cartQuantity() {
  return Object.values(cart).reduce((sum, qty) => sum + Math.max(0, Number(qty) || 0), 0);
}
function getSubtotal() {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = getProduct(id);
    return sum + (product ? product.price * Math.max(0, Number(qty) || 0) : 0);
  }, 0);
}
function getDiscount() {
  if (!couponApplied) return 0;
  return Math.min(300, Math.round(getSubtotal() * 0.10));
}
function getTotal() {
  return Math.max(0, getSubtotal() - getDiscount());
}

function renderProducts() {
  const grid = $("#productGrid");
  if (!grid) return;

  let shown = products.filter(product => {
    const categoryMatch = activeCategory === "All" || product.category === activeCategory;
    const text = `${product.name} ${product.category} ${product.description || ""}`.toLowerCase();
    return categoryMatch && text.includes(searchTerm.toLowerCase());
  });

  if (sortMode === "low") shown.sort((a, b) => a.price - b.price);
  if (sortMode === "high") shown.sort((a, b) => b.price - a.price);
  if (sortMode === "az") shown.sort((a, b) => a.name.localeCompare(b.name));

  $("#resultCount").textContent = `${shown.length} product${shown.length === 1 ? "" : "s"}`;
  $("#emptyProducts").classList.toggle("hidden", shown.length !== 0);

  grid.innerHTML = shown.map(product => {
    const saved = wishlist.includes(product.id);
    return `
      <article class="product-card">
        <div class="product-picture" data-detail="${escapeHTML(product.id)}" role="button" tabindex="0" aria-label="View ${escapeHTML(product.name)}">
          <span class="product-badge">${escapeHTML(product.badge || "Featured")}</span>
          <button class="wish-toggle ${saved ? "is-saved" : ""}" data-wish="${escapeHTML(product.id)}" aria-label="${saved ? "Remove from" : "Add to"} wishlist" type="button">${saved ? "❤️" : "♡"}</button>
          ${imageMarkup(product.image, product.emoji)}
        </div>
        <div class="product-info">
          <span class="product-category">${escapeHTML(product.category)}</span>
          <h3 data-detail="${escapeHTML(product.id)}" tabindex="0">${escapeHTML(product.name)}</h3>
          <div class="product-price-row"><span class="product-price">${money(product.price)}</span></div>
          <button class="add-cart-btn" data-add="${escapeHTML(product.id)}" type="button">＋ Add to cart</button>
        </div>
      </article>`;
  }).join("");

  $$(".nav-chip, .filter-chip").forEach(button => {
    button.classList.toggle("active", button.dataset.category === activeCategory);
  });
}

function setCategory(category) {
  activeCategory = category || "All";
  renderProducts();
}
function addToCart(id) {
  if (!getProduct(id)) return;
  cart[id] = Math.max(0, Number(cart[id]) || 0) + 1;
  saveCart();
  renderCart();
  showToast("Added to your cart 🛒");
}
function changeQuantity(id, delta) {
  if (!getProduct(id)) return;
  cart[id] = Math.max(0, Number(cart[id]) || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
}
function removeFromCart(id) {
  delete cart[id];
  saveCart();
  renderCart();
  showToast("Product removed from cart");
}
function renderCart() {
  $("#cartCount").textContent = cartQuantity();
  $("#drawerCount").textContent = `(${cartQuantity()})`;

  const entries = Object.entries(cart).filter(([id, qty]) => getProduct(id) && Number(qty) > 0);
  $("#cartItems").innerHTML = entries.map(([id, qty]) => {
    const product = getProduct(id);
    return `<div class="cart-line">
      <div class="cart-thumb">${imageMarkup(product.image, product.emoji)}</div>
      <div><h4>${escapeHTML(product.name)}</h4><span class="line-price">${money(product.price * qty)}</span>
        <div class="qty-controls"><button data-qty="${escapeHTML(id)}" data-delta="-1" aria-label="Decrease quantity" type="button">−</button><span>${qty}</span><button data-qty="${escapeHTML(id)}" data-delta="1" aria-label="Increase quantity" type="button">+</button></div>
      </div>
      <button class="remove-item" data-remove="${escapeHTML(id)}" aria-label="Remove product" type="button">×</button>
    </div>`;
  }).join("");

  const empty = entries.length === 0;
  $("#cartEmpty").classList.toggle("show", empty);
  $("#cartBottom").style.display = empty ? "none" : "block";
  $("#cartSubtotal").textContent = money(getSubtotal());
  $("#cartDiscount").textContent = "−" + money(getDiscount());
  $("#cartTotal").textContent = money(getTotal());
  $("#couponInput").value = couponApplied ? "CHOICE10" : $("#couponInput").value;
  $("#couponMessage").textContent = couponApplied ? "CHOICE10 applied — 10% off (max ₹300)." : "";
  $("#wishCount").textContent = wishlist.length;
  $("#checkoutAmount").textContent = money(getTotal());
}

function openDrawer() {
  $("#cartOverlay").classList.add("open");
  $("#cartDrawer").classList.add("open");
  $("#cartDrawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeDrawer() {
  $("#cartOverlay").classList.remove("open");
  $("#cartDrawer").classList.remove("open");
  $("#cartDrawer").setAttribute("aria-hidden", "true");
  if (!$(".modal-backdrop.open")) document.body.style.overflow = "";
}
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("open");
  if (!$(".modal-backdrop.open") && !$("#cartDrawer").classList.contains("open")) {
    document.body.style.overflow = "";
  }
}
function closeAllModals() {
  $$(".modal-backdrop").forEach(modal => modal.classList.remove("open"));
  closeDrawer();
  document.body.style.overflow = "";
}

function toggleWishlist(id) {
  if (!getProduct(id)) return;
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(item => item !== id);
    showToast("Removed from wishlist");
  } else {
    wishlist.push(id);
    showToast("Saved to wishlist ❤️");
  }
  saveWishlist();
  renderProducts();
  renderCart();
  renderWishlist();
}
function renderWishlist() {
  $("#wishCount").textContent = wishlist.length;
  const savedProducts = wishlist.map(getProduct).filter(Boolean);
  $("#wishlistContent").innerHTML = savedProducts.length ? savedProducts.map(product => `
    <div class="wishlist-row">
      ${imageMarkup(product.image, product.emoji)}
      <div><h4>${escapeHTML(product.name)}</h4><p>${money(product.price)}</p></div>
      <button type="button" data-wish-add="${escapeHTML(product.id)}">Add</button>
    </div>`).join("") : `<p class="muted">Your wishlist is empty. Tap ♡ on a product to save it.</p>`;
}

function showProductDetail(id) {
  const product = getProduct(id);
  if (!product) return;
  $("#productDetailContent").innerHTML = `
    <div class="detail-product">
      <div class="detail-product-picture">${imageMarkup(product.image, product.emoji)}</div>
      <span class="product-category">${escapeHTML(product.category)}</span>
      <h3 id="productDetailTitle">${escapeHTML(product.name)}</h3>
      <div class="product-price">${money(product.price)}</div>
      <p>${escapeHTML(product.description || "Contact us on WhatsApp for product information.")}</p>
      <button class="primary-btn" type="button" data-detail-add="${escapeHTML(product.id)}">＋ Add to cart</button>
    </div>`;
  openModal("productModal");
}

function applyCoupon() {
  const value = $("#couponInput").value.trim().toUpperCase();
  if (value === "CHOICE10") {
    if (getSubtotal() <= 0) {
      couponApplied = false;
      $("#couponMessage").textContent = "Add a product before applying a coupon.";
    } else {
      couponApplied = true;
      $("#couponMessage").textContent = "Coupon applied! You saved " + money(getDiscount()) + ".";
      showToast("CHOICE10 applied 🎁");
    }
  } else {
    couponApplied = false;
    $("#couponMessage").textContent = "Invalid code. Try CHOICE10.";
  }
  renderCart();
}

function renderProfile() {
  $("#profileName").value = profile.name || "";
  $("#profilePhone").value = profile.phone || "";
  const recent = orders.slice().reverse().slice(0, 5);
  $("#profileOrders").innerHTML = recent.length ? recent.map(order => `
    <div class="order-mini"><b>${escapeHTML(order.id)} · ${money(order.total)}</b>
      <span>${escapeHTML(order.date || "")}</span><br><span class="status-pill">${escapeHTML(order.status || "Pending Verification")}</span>
    </div>`).join("") : `<p class="muted">No orders saved on this browser yet.</p>`;
}

function renderAdminOrders() {
  $("#adminOrders").innerHTML = orders.length ? orders.slice().reverse().map(order => `
    <div class="order-mini">
      <b>${escapeHTML(order.id)} · ${money(order.total)}</b>
      <div>${escapeHTML(order.customerName || "Customer")} · ${escapeHTML(order.customerPhone || "")}</div>
      <div>${escapeHTML(order.date || "")}</div>
      <div class="status-pill">${escapeHTML(order.status || "Pending Verification")}</div>
      <label class="muted" for="status-${escapeHTML(order.id)}">Demo status (local only)</label>
      <select id="status-${escapeHTML(order.id)}" data-order-status="${escapeHTML(order.id)}">
        ${["Pending Verification", "Payment Verified", "Processing", "Shipped", "Delivered", "Cancelled"].map(status =>
          `<option ${order.status === status ? "selected" : ""}>${status}</option>`).join("")}
      </select>
    </div>`).join("") : `<p class="muted">No local orders yet.</p>`;
}

function createOrderId() {
  return "BC" + Date.now().toString().slice(-7) + Math.floor(100 + Math.random() * 900);
}

function handleCheckout(event) {
  event.preventDefault();
  if (cartQuantity() === 0) {
    showToast("Your cart is empty");
    closeModal("checkoutModal");
    return;
  }
  const form = $("#checkoutForm");
  if (!form.reportValidity()) return;

  const name = $("#customerName").value.trim();
  const phone = $("#customerPhone").value.trim();
  const address = $("#customerAddress").value.trim();
  const note = $("#customerNote").value.trim();
  const transactionId = $("#transactionId").value.trim();

  if (!name || !phone || !address || !transactionId) {
    showToast("Please complete all required fields.");
    return;
  }
  if (!/^[0-9 +()-]{10,18}$/.test(phone)) {
    showToast("Please enter a valid contact number.");
    $("#customerPhone").focus();
    return;
  }
  if (!$("#paidCheck").checked || !$("#termsCheck").checked) {
    showToast("Please confirm the payment details and order terms.");
    return;
  }
  if (transactionId.length < 4) {
    showToast("Please check your Transaction ID / UTR.");
    $("#transactionId").focus();
    return;
  }

  const items = Object.entries(cart).map(([id, qty]) => {
    const p = getProduct(id);
    return p ? { id, name: p.name, qty: Number(qty), price: p.price } : null;
  }).filter(Boolean);

  const order = {
    id: createOrderId(),
    date: new Date().toLocaleString("en-IN"),
    customerName: name,
    customerPhone: phone,
    address,
    note,
    transactionId,
    items,
    subtotal: getSubtotal(),
    discount: getDiscount(),
    total: getTotal(),
    status: "Pending Verification"
  };

  orders.push(order);
  saveOrders();
  profile = { name, phone };
  saveProfile();

  const itemLines = items.map(item => `• ${item.name} x ${item.qty} = ${money(item.price * item.qty)}`).join("\n");
  const message =
`🛍️ *NEW ORDER REQUEST — BHAT CHOICE KASHMIR*

Order ID: ${order.id}
Status: PAYMENT PENDING VERIFICATION — NOT CONFIRMED

Customer: ${name}
Mobile: ${phone}
Address: ${address}

*Items*
${itemLines}

Subtotal: ${money(order.subtotal)}
Discount: ${money(order.discount)}
*Total paid/claimed: ${money(order.total)}*

Transaction ID / UTR: ${transactionId}
Order note: ${note || "None"}

Please verify payment in the receiving account before confirming this order. I will send my payment screenshot in this WhatsApp chat.

This message is an order request, not proof that payment was received.`;

  const whatsappURL = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);

  // Keep the order request as pending; do not clear cart or mark as paid.
  renderProfile();
  renderAdminOrders();
  closeModal("checkoutModal");
  showToast("Order request saved locally. Send it on WhatsApp.");

  const whatsappWindow = window.open(whatsappURL, "_blank", "noopener,noreferrer");
  if (!whatsappWindow) {
    // A clickable fallback appears if the browser blocks the popup.
    showWhatsAppFallback(whatsappURL);
  }
}

function showWhatsAppFallback(url) {
  const old = $("#whatsappFallback");
  if (old) old.remove();
  const box = document.createElement("div");
  box.id = "whatsappFallback";
  box.style.cssText = "position:fixed;z-index:200;left:16px;right:16px;bottom:18px;padding:17px;background:white;border:1px solid #ddd;border-radius:15px;box-shadow:0 8px 40px #0002";
  const text = document.createElement("p");
  text.textContent = "WhatsApp did not open automatically. Tap below to send your order request.";
  text.style.cssText = "font-size:13px;line-height:1.5";
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open WhatsApp";
  link.style.cssText = "display:inline-block;background:#00b884;color:white;padding:11px 15px;border-radius:9px;font-weight:800;font-size:13px";
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "×";
  close.style.cssText = "float:right;border:0;background:transparent;font-size:22px";
  close.addEventListener("click", () => box.remove());
  box.append(close, text, link);
  document.body.append(box);
}

function handleTrack(event) {
  event.preventDefault();
  const id = $("#trackId").value.trim().toUpperCase();
  const order = orders.find(item => String(item.id).toUpperCase() === id);
  const result = $("#trackResult");
  if (!order) {
    result.textContent = "Order not found on this browser. Check the ID or contact the shop on WhatsApp.";
    result.style.color = "#d83a55";
    return;
  }
  result.textContent = `${order.id} — ${order.status}. Total: ${money(order.total)}. This status is saved locally on this device.`;
  result.style.color = "#008b68";
}

function handleProfileSave(event) {
  event.preventDefault();
  profile = { name: $("#profileName").value.trim(), phone: $("#profilePhone").value.trim() };
  saveProfile();
  renderProfile();
  showToast("Profile saved on this device");
}

function addAdminProduct(event) {
  event.preventDefault();
  const name = $("#adminProductName").value.trim();
  const category = $("#adminProductCategory").value;
  const price = Number($("#adminProductPrice").value);
  const image = safeImage($("#adminProductImage").value);
  const emoji = $("#adminProductEmoji").value.trim() || "🛍️";
  if (!name || !Number.isFinite(price) || price < 1 || price > 1000000) {
    showToast("Enter a valid product name and price.");
    return;
  }
  const product = {
    id: "custom-" + Date.now().toString(36),
    name, category, price, image, emoji,
    badge: "New item",
    description: "Contact the shop for more information."
  };
  customProducts.push(product);
  writeStore(STORAGE.customProducts, customProducts);
  products = [...DEFAULT_PRODUCTS, ...customProducts];
  renderProducts();
  $("#adminProductForm").reset();
  $("#adminProductEmoji").value = "🛍️";
  showToast("Product added on this browser");
}

function restoreDefaultProducts() {
  if (!confirm("Remove custom products from this browser and restore the original 8 products?")) return;
  customProducts = [];
  writeStore(STORAGE.customProducts, customProducts);
  products = [...DEFAULT_PRODUCTS];
  renderProducts();
  renderCart();
  showToast("Default products restored");
}

function exportOrders() {
  if (!orders.length) {
    showToast("No local orders to export");
    return;
  }
  const blob = new Blob([JSON.stringify(orders, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "bhat-choice-local-orders.json";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  $("#year").textContent = new Date().getFullYear();

  $("#productGrid").addEventListener("click", event => {
    const wish = event.target.closest("[data-wish]");
    if (wish) {
      event.stopPropagation();
      toggleWishlist(wish.dataset.wish);
      return;
    }
    const add = event.target.closest("[data-add]");
    if (add) {
      addToCart(add.dataset.add);
      return;
    }
    const detail = event.target.closest("[data-detail]");
    if (detail) showProductDetail(detail.dataset.detail);
  });
  $("#productGrid").addEventListener("keydown", event => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-detail]")) {
      event.preventDefault();
      showProductDetail(event.target.dataset.detail);
    }
  });

  document.addEventListener("click", event => {
    const category = event.target.closest("[data-category]");
    if (category) setCategory(category.dataset.category);

    const qty = event.target.closest("[data-qty]");
    if (qty) changeQuantity(qty.dataset.qty, Number(qty.dataset.delta));

    const remove = event.target.closest("[data-remove]");
    if (remove) removeFromCart(remove.dataset.remove);

    const wishAdd = event.target.closest("[data-wish-add]");
    if (wishAdd) addToCart(wishAdd.dataset.wishAdd);

    const detailAdd = event.target.closest("[data-detail-add]");
    if (detailAdd) {
      addToCart(detailAdd.dataset.detailAdd);
      closeModal("productModal");
      openDrawer();
    }

    const close = event.target.closest("[data-close]");
    if (close) {
      const name = close.dataset.close;
      if (name === "cart") closeDrawer();
      else closeModal(({ checkout: "checkoutModal", profile: "profileModal", product: "productModal", wishlist: "wishlistModal", admin: "adminModal" })[name]);
    }
  });

  $("#searchInput").addEventListener("input", event => {
    searchTerm = event.target.value.trim();
    renderProducts();
  });
  $("#clearSearch").addEventListener("click", () => {
    $("#searchInput").value = "";
    searchTerm = "";
    renderProducts();
    $("#searchInput").focus();
  });
  $("#sortSelect").addEventListener("change", event => {
    sortMode = event.target.value;
    renderProducts();
  });
  $("#resetFilters").addEventListener("click", resetFilters);
  $("#emptyReset").addEventListener("click", resetFilters);

  function resetFilters() {
    activeCategory = "All";
    searchTerm = "";
    sortMode = "featured";
    $("#searchInput").value = "";
    $("#sortSelect").value = "featured";
    renderProducts();
  }

  $("#cartBtn").addEventListener("click", () => {
    renderCart();
    openDrawer();
  });
  $("#cartOverlay").addEventListener("click", closeDrawer);
  $("#checkoutBtn").addEventListener("click", () => {
    if (!cartQuantity()) {
      showToast("Add a product to your cart first");
      return;
    }
    $("#checkoutAmount").textContent = money(getTotal());
    $("#customerName").value = profile.name || "";
    $("#customerPhone").value = profile.phone || "";
    openModal("checkoutModal");
  });
  $("#applyCoupon").addEventListener("click", applyCoupon);
  $("#couponInput").addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyCoupon();
    }
  });
  $("#checkoutForm").addEventListener("submit", handleCheckout);

  $("#wishlistBtn").addEventListener("click", () => {
    renderWishlist();
    openModal("wishlistModal");
  });
  $("#profileBtn").addEventListener("click", () => {
    renderProfile();
    openModal("profileModal");
  });
  $("#profileForm").addEventListener("submit", handleProfileSave);

  $("#heroOffersBtn").addEventListener("click", () => $("#offers").scrollIntoView({ behavior: "smooth" }));
  $("#copyCoupon").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("CHOICE10");
      showToast("Coupon copied: CHOICE10");
    } catch {
      showToast("Use coupon code CHOICE10 at checkout");
    }
  });

  $("#trackForm").addEventListener("submit", handleTrack);
  $("#adminBtn").addEventListener("click", () => {
    renderAdminOrders();
    openModal("adminModal");
  });
  $("#adminProductForm").addEventListener("submit", addAdminProduct);
  $("#restoreProducts").addEventListener("click", restoreDefaultProducts);
  $("#exportOrders").addEventListener("click", exportOrders);

  document.addEventListener("change", event => {
    const statusSelect = event.target.closest("[data-order-status]");
    if (!statusSelect) return;
    const order = orders.find(item => item.id === statusSelect.dataset.orderStatus);
    if (!order) return;
    order.status = statusSelect.value;
    saveOrders();
    renderAdminOrders();
    renderProfile();
    showToast("Local demo status updated");
  });

  $$(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) closeModal(backdrop.id);
    });
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeAllModals();
  });
}

function init() {
  bindEvents();
  renderProducts();
  renderCart();
  renderWishlist();
  renderProfile();
  renderAdminOrders();
}

init();
