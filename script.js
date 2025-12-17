// script.js

/******************** FIREBASE INIT ********************/
const firebaseConfig = {
  apiKey: "AIzaSyBJXO-TsCpd0dlV5LO84RG0yJv2_zKFEoU",
  authDomain: "money-plant-9b247.firebaseapp.com",
  projectId: "money-plant-9b247",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
let isLogin = true;

/******************** LOAD PLANTS FROM FIREBASE ********************/
const productGrid = document.getElementById("productGrid");

db.collection("plants").onSnapshot(snapshot => {
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
          'Water regularly||Bright indirect light||Indoor friendly'
        )">

        <img src="${p.image}">
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
  document.getElementById("cartCount").innerText =
    cart.reduce((sum, item) => sum + item.qty, 0);
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

  careTips.split("||").forEach(tip => {
    const li = document.createElement("li");
    li.innerText = tip;
    tipsList.appendChild(li);
  });

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
      .orderBy("createdAt", "desc")
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

          <div class="order-total">
            <p>Subtotal: ₹${o.items.reduce((s,i)=>s+i.price*i.qty,0)}</p>
            <p>Delivery: ₹49</p>
            <strong>Total: ₹${o.total}</strong>
          </div>

        </div>
        <span class="order-status">${o.status}</span>
          </div>
      `;
    });

  } catch (err) {
    console.error("ORDERS ERROR:", err);
    list.innerHTML = "Failed to load orders";
  }
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

  // Not logged in → show sign-in ONLY now
  if (!user) {
    hideAll();
    document.getElementById("auth").classList.remove("hidden");
    return;
  }

  // Logged in → show orders
  hideAll();
  document.getElementById("orders").classList.remove("hidden");

  document.getElementById("orderEmail").innerText =
    "Logged in as: " + user.email;

  loadMyOrders();
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
function showLogin() {
  hideAll();
  document.getElementById("auth").classList.remove("hidden");
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

  if (user) {
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
  } else {
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
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

/******************** INIT ********************/
showHome();
updateCartCount();
