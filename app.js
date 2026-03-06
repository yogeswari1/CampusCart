// ============================================
// MAIN APPLICATION LOGIC - WITH FIREBASE INTEGRATION
// ============================================

// Global state
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let currentUser = null;

// DOM Elements (will be set per page)
let cartBadge, wishBadge;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App.js loaded');
    
    // Get badge elements
    cartBadge = document.getElementById('cart-count');
    wishBadge = document.getElementById('wish-count');
    
    // Check if Firebase is available
    if (typeof db === 'undefined') {
        console.error('❌ Firebase db is not defined. Check script loading order.');
        return;
    }
    
    // Load products
    await loadProducts();
    
    // Update UI based on current page
    updateCurrentPage();
    
    // Setup event listeners
    setupEventListeners();
});

// Load products from Firebase
async function loadProducts() {
    console.log('Loading products from Firebase...');
    
    try {
        const snapshot = await db.collection('products').get();
        
        if (!snapshot.empty) {
            products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log(`✅ Loaded ${products.length} products from Firebase`);
        } else {
            console.log('No products in Firebase, using fallback');
            // Fallback to sample products - with correct root paths
            products = [
                {
                    id: 'p1',
                    name: 'Premium Notebook',
                    price: 50,
                    category: 'notebooks',
                    image: 'book1.jpeg'
                },
                {
                    id: 'p2',
                    name: 'Gel Pen Set (5pc)',
                    price: 75,
                    category: 'pens',
                    image: 'pen2.jpeg'
                },
                {
                    id: 'p3',
                    name: 'Scientific Calculator',
                    price: 1000,
                    category: 'electronics',
                    image: 'scal.jpeg'
                },
                {
                    id: 'p4',
                    name: 'Sticky Notes Pack',
                    price: 40,
                    category: 'paper',
                    image: 'sticky.jpeg'
                },
                {
                    id: 'p5',
                    name: 'A4 Binder Folder',
                    price: 300,
                    category: 'organization',
                    image: 'A4.jpeg'
                },
                {
                    id: 'p6',
                    name: 'Highlighter 4in1',
                    price: 400,
                    category: 'pens',
                    image: 'm2.jpeg'
                }
            ];
        }
    } catch (error) {
        console.error('❌ Error loading products:', error);
        // Use fallback products with correct root paths
        products = [
            {
                id: 'p1',
                name: 'Premium Notebook',
                price: 50,
                category: 'notebooks',
                image: 'book1.jpeg'
            },
            {
                id: 'p2',
                name: 'Gel Pen Set (5pc)',
                price: 75,
                category: 'pens',
                image: 'pen2.jpeg'
            },
            {
                id: 'p3',
                name: 'Scientific Calculator',
                price: 1000,
                category: 'electronics',
                image: 'scal.jpeg'
            },
            {
                id: 'p4',
                name: 'Sticky Notes Pack',
                price: 40,
                category: 'paper',
                image: 'sticky.jpeg'
            },
            {
                id: 'p5',
                name: 'A4 Binder Folder',
                price: 300,
                category: 'organization',
                image: 'A4.jpeg',
            },
            {
                id: 'p6',
                name: 'Highlighter 4in1',
                price: 400,
                category: 'pens',
                image: 'm2.jpeg',
            },
            {
                id: 'p7',
                name: 'Mechanical Pencil Set',
                price: 1500,
                category: 'pencils',
                image: 'pencil.jpeg',
            },
            {
                id: 'p8',
                name: 'USB Flash Drive 32GB',
                price: 700,
                category: 'electronics',
                image: 'usb.jpeg',
            }
        ];
        console.log('Using fallback products');
    }
}

// ============================================
// AUTH STATE OBSERVER
// ============================================

// Track authentication state
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('👤 User is signed in:', user.email);
        currentUser = user;
        
        // Update UI for logged in user
        updateNavForLoggedInUser();
        
        // Load user-specific data
        loadUserData();
    } else {
        console.log('👤 User is signed out');
        currentUser = null;
        
        // Reset login link
        resetNavForLoggedOutUser();
    }
});

// Update navigation for logged in user
function updateNavForLoggedInUser() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === 'login.html') {
            link.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            link.href = '#';
            link.id = 'logout-btn';
        }
    });
}

// Reset navigation for logged out user
function resetNavForLoggedOutUser() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.id === 'logout-btn') {
            link.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            link.href = 'login.html';
            link.id = '';
        }
    });
}

// Load user data from Firebase
async function loadUserData() {
    if (!currentUser) return;
    
    // Load orders from Firebase
    const firebaseOrders = await getUserOrdersFromFirebase();
    if (firebaseOrders.length > 0) {
        orders = firebaseOrders;
        localStorage.setItem('orders', JSON.stringify(orders));
    }
    
    // Load profile data
    const profile = await getUserProfile(currentUser.uid);
    if (profile) {
        // Update profile page if we're on it
        if (document.getElementById('profile-name')) {
            document.getElementById('profile-name').textContent = profile.fullName || 'Student';
            document.getElementById('profile-email').textContent = profile.email || currentUser.email;
            document.getElementById('profile-phone').textContent = profile.phone || '+1 (212) 555-7865';
            document.getElementById('profile-address').textContent = profile.address || 'Campus';
        }
    }
}

// ============================================
// FIREBASE FUNCTIONS FOR ORDERS AND USERS
// ============================================

// Save order to Firebase
async function saveOrderToFirebase(orderData) {
    try {
        const user = auth.currentUser;
        const orderWithMeta = {
            ...orderData,
            userId: user ? user.uid : 'guest',
            userEmail: user ? user.email : 'guest@example.com',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        };
        
        const docRef = await db.collection('orders').add(orderWithMeta);
        console.log('✅ Order saved to Firebase with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving order:', error);
        return null;
    }
}

// Get user's orders from Firebase
async function getUserOrdersFromFirebase() {
    try {
        const user = auth.currentUser;
        if (!user) return [];
        
        const snapshot = await db.collection('orders')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        return [];
    }
}

// Save user profile to Firebase
async function saveUserProfile(userId, profileData) {
    try {
        await db.collection('users').doc(userId).set({
            ...profileData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log('✅ User profile saved');
    } catch (error) {
        console.error('❌ Error saving profile:', error);
    }
}

// Get user profile from Firebase
async function getUserProfile(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            return doc.data();
        }
        return null;
    } catch (error) {
        console.error('❌ Error loading profile:', error);
        return null;
    }
}

// ============================================
// ORDER MODAL HANDLING
// ============================================

let currentOrderProduct = null;
let isBulkOrder = false;

// Setup order modal listeners
function setupOrderModalListeners() {
    const orderModal = document.getElementById('orderModal');
    if (!orderModal) return;
    
    const cancelBtn = document.getElementById('cancelOrderBtn');
    const confirmBtn = document.getElementById('confirmOrderBtn');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            orderModal.style.display = 'none';
            currentOrderProduct = null;
            isBulkOrder = false;
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const name = document.getElementById('modal-name').value;
            const phone = document.getElementById('modal-phone').value;
            const address = document.getElementById('modal-address').value;
            const payment = document.getElementById('modal-payment').value;
            
            if (isBulkOrder) {
                // Order all cart items
                const cartItems = products.filter(p => cart.includes(p.id));
                
                for (let item of cartItems) {
                    const orderData = {
                        ...item,
                        customer: name,
                        phone,
                        address,
                        payment,
                        placedAt: new Date().toLocaleString(),
                        quantity: 1,
                        totalPrice: item.price
                    };
                    
                    // Save to Firebase
                    await saveOrderToFirebase(orderData);
                    
                    // Also save to local orders array
                    orders.push(orderData);
                }
                cart = [];
            } else if (currentOrderProduct) {
                // Order single item
                const orderData = {
                    ...currentOrderProduct,
                    customer: name,
                    phone,
                    address,
                    payment,
                    placedAt: new Date().toLocaleString(),
                    quantity: 1,
                    totalPrice: currentOrderProduct.price
                };
                
                // Save to Firebase
                await saveOrderToFirebase(orderData);
                
                // Also save to local orders array
                orders.push(orderData);
                cart = cart.filter(id => id !== currentOrderProduct.id);
            }
            
            saveToLocalStorage();
            orderModal.style.display = 'none';
            currentOrderProduct = null;
            isBulkOrder = false;
            
            // Redirect to orders page
            window.location.href = 'orders.html';
        });
    }
    
    // Close modal on outside click
    orderModal.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            orderModal.style.display = 'none';
            currentOrderProduct = null;
            isBulkOrder = false;
        }
    });
}

// Update current page based on URL
function updateCurrentPage() {
    const path = window.location.pathname;
    
    if (path.includes('cart.html')) {
        renderCartPage();
        setupOrderModalListeners();
    } else if (path.includes('wishlist.html')) {
        renderWishlistPage();
    } else if (path.includes('orders.html')) {
        renderOrdersPage();
    } else if (path.includes('profile.html')) {
        renderProfilePage();
    } else {
        renderHomePage();
    }
    
    updateBadges();
}

// Render home page
function renderHomePage() {
    const container = document.getElementById('product-grid-container');
    if (!container) return;
    
    let html = '';
    products.forEach(product => {
        const inCart = cart.includes(product.id);
        const inWish = wishlist.includes(product.id);
        
        html += `
            <div class="product-card" data-id="${product.id}">
                <div class="product-img">
                    <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://placehold.co/400x300/CCCCCC/000000?text=No+Image'">
                </div>
                <div class="product-info">
                    <div class="product-title">${product.name}</div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-price">₹${product.price.toFixed(2)}</div>
                    <div class="card-actions">
                        <button class="btn-cart add-to-cart-btn" data-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i> ${inCart ? 'Added' : 'Cart'}
                        </button>
                        <button class="btn-wish add-to-wish-btn" data-id="${product.id}">
                            <i class="fas fa-heart"></i> ${inWish ? 'Saved' : 'Wish'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Render cart page
function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    const summaryDiv = document.getElementById('cart-summary');
    const subtotalSpan = document.getElementById('cart-subtotal');
    const totalSpan = document.getElementById('cart-total');
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<div class="empty-message"><i class="fas fa-shopping-cart"></i> Your cart is empty. Start shopping!</div>';
        if (summaryDiv) summaryDiv.style.display = 'none';
        return;
    }
    
    const cartItems = products.filter(p => cart.includes(p.id));
    let html = '';
    let subtotal = 0;
    
    cartItems.forEach(item => {
        subtotal += item.price;
        html += `
            <div class="list-item" data-id="${item.id}">
                <div class="item-info">
                    <div class="item-img">
                        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/70x70/CCCCCC/000000?text=No+Image'">
                    </div>
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <span class="price">₹${item.price.toFixed(2)}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="order-btn order-single-btn" data-id="${item.id}">
                        <i class="fas fa-clipboard-list"></i> Order
                    </button>
                    <button class="remove-btn remove-cart" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    if (summaryDiv && subtotalSpan && totalSpan) {
        summaryDiv.style.display = 'block';
        subtotalSpan.textContent = `₹${subtotal.toFixed(2)}`;
        totalSpan.textContent = `₹${(subtotal + 2.99).toFixed(2)}`;
    }
}

// Render wishlist page
function renderWishlistPage() {
    const container = document.getElementById('wishlist-items-container');
    if (!container) return;
    
    if (wishlist.length === 0) {
        container.innerHTML = '<div class="empty-message"><i class="fas fa-heart-broken"></i> Your wishlist is empty</div>';
        return;
    }
    
    const wishItems = products.filter(p => wishlist.includes(p.id));
    let html = '';
    
    wishItems.forEach(item => {
        const inCart = cart.includes(item.id);
        html += `
            <div class="list-item" data-id="${item.id}">
                <div class="item-info">
                    <div class="item-img">
                        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://placehold.co/70x70/CCCCCC/000000?text=No+Image'">
                    </div>
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <span class="price">₹${item.price.toFixed(2)}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="add-to-cart-from-wish" data-id="${item.id}">
                        <i class="fas fa-cart-plus"></i> ${inCart ? 'In Cart' : 'Move to Cart'}
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Render orders page
async function renderOrdersPage() {
    const container = document.getElementById('orders-container');
    if (!container) return;
    
    // Show loading
    container.innerHTML = '<div class="empty-message"><i class="fas fa-spinner fa-spin"></i> Loading orders...</div>';
    
    // Try to load from Firebase first
    let firebaseOrders = [];
    if (auth.currentUser) {
        firebaseOrders = await getUserOrdersFromFirebase();
    }
    
    // Merge with local orders (or use Firebase orders)
    const allOrders = firebaseOrders.length > 0 ? firebaseOrders : orders;
    
    if (allOrders.length === 0) {
        container.innerHTML = '<div class="empty-message"><i class="fas fa-box-open"></i> No orders yet</div>';
        return;
    }
    
    let html = '';
    allOrders.slice().reverse().forEach(order => {
        const orderDate = order.createdAt ? 
            new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 
            order.placedAt || new Date().toLocaleDateString();
        
        html += `
            <div class="list-item">
                <div class="item-info">
                    <div class="item-img">
                        <img src="${order.image}" 
                             alt="${order.name}"
                             onerror="this.src='https://placehold.co/70x70/CCCCCC/000000?text=No+Image'">
                    </div>
                    <div class="item-details">
                        <h4>${order.name}</h4>
                        <span class="price">₹${order.price.toFixed(2)}</span>
                        <br>
                        <small><i class="fas fa-map-marker-alt"></i> ${order.address || 'Campus'}</small>
                        <br>
                        <small><i class="fas fa-credit-card"></i> ${order.payment || 'Cash'}</small>
                    </div>
                </div>
                <div>
                    <span class="badge" style="background: #27ae60;">${order.status || 'Delivered'}</span>
                    <br>
                    <small>${orderDate}</small>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Render profile page
function renderProfilePage() {
    const orderCount = document.getElementById('profile-orders-count');
    const wishCount = document.getElementById('profile-wishlist-count');
    const cartCount = document.getElementById('profile-cart-count');
    const activityList = document.getElementById('recent-activity');
    
    if (orderCount) orderCount.textContent = orders.length;
    if (wishCount) wishCount.textContent = wishlist.length;
    if (cartCount) cartCount.textContent = cart.length;
    
    if (activityList) {
        let activityHtml = '';
        const recentOrders = orders.slice(-3).reverse();
        
        recentOrders.forEach(order => {
            activityHtml += `
                <div class="activity-item">
                    <div class="activity-icon"><i class="fas fa-shopping-bag"></i></div>
                    <div class="activity-details">
                        <p>Ordered: ${order.name}</p>
                        <small>${order.placedAt || 'Today'}</small>
                    </div>
                </div>
            `;
        });
        
        if (recentOrders.length === 0) {
            activityHtml = '<p style="text-align:center; color:var(--text-light);">No recent activity</p>';
        }
        
        activityList.innerHTML = activityHtml;
    }
}

// Update badges
function updateBadges() {
    if (cartBadge) cartBadge.textContent = cart.length;
    if (wishBadge) wishBadge.textContent = wishlist.length;
}

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    localStorage.setItem('orders', JSON.stringify(orders));
    updateBadges();
}

// Setup global event listeners
function setupEventListeners() {
    document.addEventListener('click', (e) => {
        // Add to cart
        if (e.target.closest('.add-to-cart-btn')) {
            const btn = e.target.closest('.add-to-cart-btn');
            const productId = btn.dataset.id;
            
            if (cart.includes(productId)) {
                cart = cart.filter(id => id !== productId);
            } else {
                cart.push(productId);
                // Remove from wishlist if present
                wishlist = wishlist.filter(id => id !== productId);
            }
            
            saveToLocalStorage();
            updateCurrentPage();
        }
        
        // Add to wishlist
        if (e.target.closest('.add-to-wish-btn')) {
            const btn = e.target.closest('.add-to-wish-btn');
            const productId = btn.dataset.id;
            
            if (wishlist.includes(productId)) {
                wishlist = wishlist.filter(id => id !== productId);
            } else {
                wishlist.push(productId);
            }
            
            saveToLocalStorage();
            updateCurrentPage();
        }
        
        // Remove from cart
        if (e.target.closest('.remove-cart')) {
            const btn = e.target.closest('.remove-cart');
            const productId = btn.dataset.id;
            cart = cart.filter(id => id !== productId);
            saveToLocalStorage();
            updateCurrentPage();
        }
        
        // Move from wishlist to cart
        if (e.target.closest('.add-to-cart-from-wish')) {
            const btn = e.target.closest('.add-to-cart-from-wish');
            const productId = btn.dataset.id;
            
            if (!cart.includes(productId)) {
                cart.push(productId);
            }
            wishlist = wishlist.filter(id => id !== productId);
            
            saveToLocalStorage();
            updateCurrentPage();
        }
        
        // Open order modal for single item
        if (e.target.closest('.order-single-btn')) {
            const btn = e.target.closest('.order-single-btn');
            const productId = btn.dataset.id;
            const product = products.find(p => p.id === productId);
            
            if (product) {
                currentOrderProduct = product;
                isBulkOrder = false;
                document.getElementById('orderModal').style.display = 'flex';
            }
        }
        
        // Checkout all
        if (e.target.closest('#checkout-all-btn')) {
            e.preventDefault();
            if (cart.length > 0) {
                isBulkOrder = true;
                document.getElementById('orderModal').style.display = 'flex';
            }
        }
        
        // Logout
        if (e.target.closest('#logout-btn')) {
            e.preventDefault();
            auth.signOut();
            window.location.href = 'index.html';
        }
        
        // Mobile menu toggle
        if (e.target.closest('.mobile-menu')) {
            document.querySelector('.nav-links').classList.toggle('active');
        }
    });
}