// script.js

/******************** FIREBASE INIT ********************/
/******************** FIREBASE INIT (NEW KEYS) ********************/
// ================= FIREBASE INIT (NEW KEYS) =================

const firebaseConfig = {
  apiKey: "AIzaSyCb3NMFbLCBPbbxA2C7J8uMJ5ME2vs-1l4",
  authDomain: "instaplants2.firebaseapp.com",
  projectId: "instaplants2",
  storageBucket: "instaplants2.firebasestorage.app",
  messagingSenderId: "547063766288",
  appId: "1:547063766288:web:49f80da6f1a82fb2f75995",
  measurementId: "G-F1FXSHHJXP"
};

// ✅ Initialize Firebase ONCE
firebase.initializeApp(firebaseConfig);

// ✅ Create services ONCE
const db = firebase.firestore();
const auth = firebase.auth();

// Auth mode
let isLogin = true;


/******************** LOAD PLANTS FROM FIREBASE ********************/
const productGrid = document.getElementById("productGrid");

db.collection("plants")
.onSnapshot(snapshot => {
  productGrid.innerHTML = "";

  snapshot.forEach(doc => {
    const p = doc.data();

    productGrid.innerHTML += `
      <div class="product-card ${p.category?.toLowerCase() || "all"}"
        onclick="showProductDetails(
          '${p.name}',
          '${p.price}',
          '${p.description || "Healthy premium plant"}',
          '${p.image}',
          '${p.category || "Plant"}',
         '${p.careTips || "Water regularly||Bright indirect light"}'
        )">

        <img src="${p.image || 'https://images.unsplash.com/photo-1483794344563-d27a8d18014e'}">
        <div class="product-content">
          <span class="category-label">${p.category || "Plant"}</span>
          <h3>${p.name}</h3>
          <p class="price">₹${p.price}</p>

        <button class="add-btn"
  onclick="addToCartFromCard(event,'${p.name}',${p.price},'${p.image}')">
  Add to Cart
</button>

        </div>
      </div>
    `;
  });
});

/******************** GLOBALS ********************/
let cart = []; // TEMP CART (NOT STORED)
const DELIVERY_CHARGE = 49;

/******************** PAGE CONTROL ********************/
function hideAll() {
  document.getElementById("home").classList.add("hidden");
  document.getElementById("cart").classList.add("hidden");
  document.getElementById("checkout").classList.add("hidden");
  document.getElementById("orders").classList.add("hidden");
  document.getElementById("auth").classList.add("hidden");
}


function showHome() {
  hideAll();
  document.getElementById("home").classList.remove("hidden");
}

function showCart() {
  hideAll();
  document.getElementById("cart").classList.remove("hidden");
  renderCart();
}

function showCheckout() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  hideAll();
  document.getElementById("checkout").classList.remove("hidden");
}

/******************** CATEGORY FILTER ********************/
function filterCategory(category) {
  document.querySelectorAll(".product-card").forEach(card => {
    // Categories are now 'indoor', 'outdoor', 'succulent', 'flowering'
    card.style.display =
      category === "all" || card.classList.contains(category)
        ? "block"
        : "none";
  });
}

/******************** TOAST NOTIFICATION ********************/
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/******************** CART LOGIC (TEMP ONLY) ********************/
function addToCart(name, price, image) {
  const item = cart.find(p => p.name === name);

  if (item) {
    item.qty++;
    showToast("Quantity updated 🛒");
  } else {
    cart.push({ name, price, image, qty: 1 });
    showToast("Item added to cart 🌱");
  }

  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  // Update navbar count (if exists)
  const navCount = document.getElementById("cartCount");
  if (navCount) navCount.innerText = count;

  // Bottom cart
  const bottomCart = document.getElementById("bottomCart");
  const bottomCount = document.getElementById("bottomCartCount");

  if (bottomCount) bottomCount.innerText = count;

  if (bottomCart) {
    if (count > 0) {
      bottomCart.classList.remove("hidden");
    } else {
      bottomCart.classList.add("hidden");
    }
  }
}

function renderCart() {
  const list = document.getElementById("cartList");
  const empty = document.getElementById("emptyCart");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");

  list.innerHTML = "";

  if (cart.length === 0) {
    empty.style.display = "block";
    subtotalEl.innerText = "0";
    totalEl.innerText = "0";
    return;
  }

  empty.style.display = "none";

  let subtotal = 0;

  cart.forEach((item, index) => {
    subtotal += item.price * item.qty;

    list.insertAdjacentHTML(
      "beforeend",
      `
      <div class="cart-item">
        <img src="${item.image}" class="cart-img">

        <div class="cart-item-info">
          <strong>${item.name}</strong>
          <p>₹${item.price} × ${item.qty}</p>

          <div class="qty-controls">
            <button onclick="changeQty(${index}, 1)">+</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${index}, -1)">−</button>
          </div>
        </div>

        <button class="remove-btn" onclick="removeItem(${index})">✕</button>
      </div>
    `
    );
  });

  subtotalEl.innerText = subtotal;
  totalEl.innerText = subtotal + DELIVERY_CHARGE;
}

function changeQty(index, value) {
  cart[index].qty += value;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  updateCartCount();
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  updateCartCount();
  renderCart();
}

/******************** PLACE ORDER (FIREBASE ONLY HERE) ********************/
async function placeOrder(event) {
  event.preventDefault();

  // ✅ CONFIRMATION STEP
  const confirmOrder = confirm(
    "🪴 Please confirm your order.\n\nDo you want to place this order now?"
  );

  if (!confirmOrder) {
    return; // ❌ User cancelled
  }

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");
    if (cart.length === 0) throw new Error("Cart empty");

    const orderData = {
      userId: user.uid,

      customer: {
        name: document.getElementById("name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim()
      },

      address: {
        house: house.value,
        street: street.value,
        city: city.value,
        state: state.value,
        pincode: pincode.value
      },

      items: cart,
      total: cart.reduce((s, i) => s + i.price * i.qty, 0) + 49,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("orders").add(orderData);

    alert("✅ Order placed successfully");

    cart = [];
    updateCartCount();
    showHome();

  } catch (error) {
    console.error(error);
    alert("❌ " + error.message);
  }
}



/******************** SCROLL ********************/
function scrollToProducts() {
  document.getElementById("products")
    .scrollIntoView({ behavior: "smooth" });
}
/******************** PRODUCT DETAILS MODAL ********************/

function showProductDetails(name, price, description, image, category, careTips) {
  document.getElementById("modalName").innerText = name;
  document.getElementById("modalPrice").innerText = price;
  document.getElementById("modalDescription").innerText = description;
  document.getElementById("modalImage").src = image;
  document.getElementById("modalCategory").innerText = category;

  // Care tips list
const tipsList = document.getElementById("modalCareTips");
tipsList.innerHTML = "";

const icons = ["🌞", "💧", "🌱"]; // 👈 3 icons = 3 tips

const tipsArray = careTips
  ? careTips.split("||")
  : [];

// 🔥 FORCE EXACTLY 3 ROWS
for (let i = 0; i < 3; i++) {
  const li = document.createElement("li");

  li.innerHTML = `
    <span class="care-icon">${icons[i]}</span>
    <span class="care-text">${tipsArray[i] ? tipsArray[i].trim() : "—"}</span>
  `;

  tipsList.appendChild(li);
}

  // Add to cart from modal
  const btn = document.getElementById("modalAddToCartBtn");
  btn.onclick = () => {
    addToCart(name, Number(price), image);
    hideProductDetails();
  };

  document.getElementById("productModal").classList.remove("hidden");
}

function hideProductDetails() {
  document.getElementById("productModal").classList.add("hidden");
}
function addToCartFromCard(e, name, price, image) {
  e.stopPropagation(); // FULL STOP
  addToCart(name, price, image);
}
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
});
/******************** MY ORDERS ********************/
/******************** LOAD MY ORDERS (FULL DETAILS) ********************/
async function loadMyOrders() {
  const user = auth.currentUser;
  const list = document.getElementById("ordersList");

  if (!user) return;

  list.innerHTML = "Loading your orders...";

  try {
    const snapshot = await db
  .collection("orders")
  .where("userId", "==", user.uid)
  .get();


    if (snapshot.empty) {
      list.innerHTML = "No orders found";
      return;
    }

    list.innerHTML = "";

    snapshot.forEach(doc => {
      const o = doc.data();
      const date = o.createdAt
        ? o.createdAt.toDate().toLocaleString()
        : "—";

      list.innerHTML += `
      <div class="order-card">

  <div class="order-top">
    <div>
      <strong>Order ID:</strong> ${doc.id}<br>
      <small>${date}</small>
    </div>
  </div>

  <div class="order-items">
    ${o.items.map(item => `
      <div class="order-item">
        <img src="${item.image}">
        <div class="order-item-info">
          <p>${item.name}</p>
          <small>₹${item.price} × ${item.qty}</small>
        </div>
      </div>
    `).join("")}
  </div>

  <!-- ✅ ORDER TRACKING (4.1) -->
  <div class="order-tracking">
    ${getTrackingSteps(o.status)}
  </div>

  <<div class="order-footer">
  <span class="order-status">${o.status}</span>

  ${o.status === "pending" || o.status === "confirmed" ? `
  <button class="cancel-btn"
    onclick="cancelOrder('${doc.id}', '${o.status}')">
    ❌ Cancel
  </button>
` : ""}

  <button class="wa-btn"
    onclick="openWhatsAppSupport('${doc.id}')">
    📲 Need Help
  </button>
</div>

</div>

      `;
    });

  } catch (err) {
    console.error("ORDERS ERROR:", err);
    list.innerHTML = "Failed to load orders";
  }
}
function getTrackingSteps(status) {
  const steps = [
    "pending",
    "confirmed",
    "packed",
    "out_for_delivery",
    "delivered"
  ];

  if (!status) status = "pending";

  if (status === "cancelled") {
    return `<div class="track cancelled">❌ Order Cancelled</div>`;
  }

  let html = `<div class="track">`;

  steps.forEach(step => {
    const active =
      steps.indexOf(step) <= steps.indexOf(status);

    html += `
      <span class="track-step ${active ? "active" : ""}">
        ${step.replaceAll("_", " ")}
      </span>
    `;
  });

  html += `</div>`;
  return html;
}


function toggleAuth() {
  isLogin = !isLogin;
  document.querySelector(".auth-box h2").innerText =
    isLogin ? "Sign In" : "Create Account";
  document.getElementById("authToggle").innerText =
    isLogin ? "Create new account" : "Already have an account?";
}

async function authUser(e) {
  e.preventDefault();

  const email = authEmail.value;
  const password = authPassword.value;

  try {
    if (isLogin) {
      await auth.signInWithEmailAndPassword(email, password);
    } else {
      await auth.createUserWithEmailAndPassword(email, password);
    }

    // Hide auth and show orders
 document.getElementById("auth").classList.add("hidden");
showWelcomeMessage();


  } catch (err) {
    alert(err.message);
  }
}




function logout() {
  auth.signOut();
}
function showOrders() {
  const user = auth.currentUser;

  if (!user) {
    hideAll();
    document.getElementById("auth").classList.remove("hidden");
    return;
  }

  hideAll();
  document.getElementById("orders").classList.remove("hidden");
  document.getElementById("orderEmail").innerText =
    "Logged in as: " + user.email;

  loadMyOrders();
}

function logout() {
  auth.signOut().then(() => {
    hideAll();
    showThankYouMessage();
  });
}

function openWhatsAppSupport(orderId) {
  const phone = "918639533425";
  const message = `
Hello Instaplants 🌿
I need help with my order.
Order ID: ${orderId}
  `.trim();

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

function logout() {
  auth.signOut().then(() => {
    hideAll();
    showThankYouMessage();
  });
}
auth.onAuthStateChanged(user => {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userNameEl = document.getElementById("userName");

  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");

    const name = user.displayName || user.email.split("@")[0];
    userNameEl.innerText = `Hi, ${name} 👋`;
    userNameEl.classList.remove("hidden");
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    userNameEl.classList.add("hidden");
    userNameEl.innerText = "";
  }
});

function showWelcomeMessage() {
  const overlay = document.getElementById("welcomeOverlay");
  overlay.classList.remove("hidden");

  setTimeout(() => {
    overlay.classList.add("hidden");
    showHome(); // or showOrders()
  }, 3000);
}
function showThankYouMessage() {
  const overlay = document.getElementById("thankYouOverlay");
  overlay.classList.remove("hidden");

  setTimeout(() => {
    overlay.classList.add("hidden");
    showHome();
  }, 3000);
}
function forgotPassword() {
  const email = document.getElementById("authEmail").value;

  if (!email) {
    alert("Please enter your email first");
    return;
  }

  auth.sendPasswordResetEmail(email)
    .then(() => {
      alert("📩 Password reset link sent to your email");
    })
    .catch(err => {
      alert(err.message);
    });
}
function checkDeliveryTimeWarning() {
  const now = new Date();
  const hours = now.getHours();

  if (hours >= 19) {
    document.querySelectorAll(".delivery-warning").forEach(el => {
      el.innerHTML =
        "⚠️ Orders placed after <strong>7:00 PM</strong> will be delivered by <strong>tomorrow 11am</strong>.";
    });
  }
}

checkDeliveryTimeWarning();

function toggleMenu(e) {
  e.stopPropagation(); // 🔥 THIS IS THE KEY

  const menu = document.getElementById("mobileMenu");
  if (!menu) return;

  menu.style.display =
    menu.style.display === "block" ? "none" : "block";
}

function closeMenu() {
  const menu = document.getElementById("mobileMenu");
  if (menu) menu.style.display = "none";
}

/* Close menu when clicking outside */
document.addEventListener("click", () => {
  closeMenu();
});

async function cancelOrder(orderId) {
  const confirmCancel = confirm(
    "Are you sure?\nYou can cancel only before shipping."
  );

  if (!confirmCancel) return;

  try {
    await db.collection("orders").doc(orderId).update({
      status: "cancelled"
    });

    alert("✅ Order cancelled successfully");
  } catch (err) {
    console.error(err);
    alert("❌ Unable to cancel order");
  }
}
function renderOrders(orders) {
  const list = document.getElementById("ordersList");
  list.innerHTML = "";

  orders.forEach(order => {
    const canCancel = order.status === "pending"; // 👈 STEP 3 LOGIC

    list.innerHTML += `
      <div class="order-card">

        <div class="order-header">
          <strong>Order ID:</strong> ${order.id}
          <span class="order-status">${order.status}</span>
        </div>

        <div class="order-items">
          ${order.items.map(item => `
            <div class="order-item">
              <img src="${item.image}">
              <div>${item.name} × ${item.qty}</div>
            </div>
          `).join("")}
        </div>

        <div class="order-footer">
          <div><strong>Total:</strong> ₹${order.total}</div>

          ${
            canCancel
              ? `<button class="cancel-btn"
                   onclick="cancelOrder('${order.id}')">
                   Cancel Order
                 </button>`
              : ""
          }
        </div>

      </div>
    `;
  });
}
async function cancelOrder(orderId, currentStatus) {

  // 🔒 HARD BLOCK (VERY IMPORTANT)
  if (currentStatus !== "pending" && currentStatus !== "confirmed") {
    alert("❌ This order can no longer be cancelled");
    return;
  }

  const confirmCancel = confirm(
    "Are you sure you want to cancel this order?"
  );

  if (!confirmCancel) return;

  try {
    await db.collection("orders").doc(orderId).update({
      status: "cancelled",
      cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("❌ Order cancelled successfully");

    loadMyOrders(); // refresh UI

  } catch (err) {
    console.error(err);
    alert("Failed to cancel order");
  }
}
function showLogin() {
  hideAll();
  document.getElementById("auth").classList.remove("hidden");
}

/******************** INIT ********************/
showHome();
updateCartCount();
