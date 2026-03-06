// ============================================
// PAGE-SPECIFIC JAVASCRIPT
// ============================================

// ❌ REMOVED - These are already declared in app.js
// let currentOrderProduct = null;
// let isBulkOrder = false;

// ============================================
// CART PAGE
// ============================================
if (window.location.pathname.includes('cart.html')) {
    document.addEventListener('click', (e) => {
        // Open order modal for single item
        if (e.target.closest('.order-single-btn')) {
            const btn = e.target.closest('.order-single-btn');
            const productId = btn.dataset.id;
            const product = products.find(p => p.id === productId);
            
            if (product) {
                // Use the global variables from app.js
                window.currentOrderProduct = product;
                window.isBulkOrder = false;
                document.getElementById('orderModal').style.display = 'flex';
            }
        }
        
        // Checkout all
        if (e.target.closest('#checkout-all-btn')) {
            if (cart.length > 0) {
                window.isBulkOrder = true;
                document.getElementById('orderModal').style.display = 'flex';
            }
        }
    });
}

// ============================================
// ORDER MODAL (shared across pages)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const orderModal = document.getElementById('orderModal');
    if (!orderModal) return;
    
    const cancelBtn = document.getElementById('cancelOrderBtn');
    const confirmBtn = document.getElementById('confirmOrderBtn');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            orderModal.style.display = 'none';
            window.currentOrderProduct = null;
            window.isBulkOrder = false;
        });
    }
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const name = document.getElementById('modal-name').value;
            const phone = document.getElementById('modal-phone').value;
            const address = document.getElementById('modal-address').value;
            const payment = document.getElementById('modal-payment').value;
            
            if (window.isBulkOrder) {
                // Order all cart items
                const cartItems = products.filter(p => cart.includes(p.id));
                cartItems.forEach(item => {
                    const order = {
                        ...item,
                        customer: name,
                        phone,
                        address,
                        payment,
                        placedAt: new Date().toLocaleString()
                    };
                    orders.push(order);
                });
                cart = [];
            } else if (window.currentOrderProduct) {
                // Order single item
                const order = {
                    ...window.currentOrderProduct,
                    customer: name,
                    phone,
                    address,
                    payment,
                    placedAt: new Date().toLocaleString()
                };
                orders.push(order);
                cart = cart.filter(id => id !== window.currentOrderProduct.id);
            }
            
            saveToLocalStorage();
            orderModal.style.display = 'none';
            window.currentOrderProduct = null;
            window.isBulkOrder = false;
            
            // Redirect to orders page if on cart page
            if (window.location.pathname.includes('cart.html')) {
                window.location.href = 'orders.html';
            } else {
                updateCurrentPage();
            }
        });
    }
    
    // Close modal on outside click
    orderModal.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            orderModal.style.display = 'none';
            window.currentOrderProduct = null;
            window.isBulkOrder = false;
        }
    });
});

// ============================================
// LOGIN PAGE
// ============================================
if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const loginForm = document.getElementById('login-form');
        const showSignup = document.getElementById('show-signup');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Login successful! Redirecting to profile...');
                window.location.href = 'profile.html';
            });
        }
        
        if (showSignup) {
            showSignup.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Sign up functionality - In production, this would create a new account');
            });
        }
    });
}

// ============================================
// PROFILE PAGE
// ============================================
if (window.location.pathname.includes('profile.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const editBtn = document.getElementById('edit-profile-btn');
        const editModal = document.getElementById('editProfileModal');
        
        if (editBtn && editModal) {
            editBtn.addEventListener('click', () => {
                // Populate with current values
                document.getElementById('edit-name').value = document.getElementById('profile-name').textContent;
                document.getElementById('edit-email').value = document.getElementById('profile-email').textContent;
                document.getElementById('edit-phone').value = document.getElementById('profile-phone').textContent;
                document.getElementById('edit-address').value = document.getElementById('profile-address').textContent;
                
                editModal.style.display = 'flex';
            });
            
            document.getElementById('cancelEditBtn').addEventListener('click', () => {
                editModal.style.display = 'none';
            });
            
            document.getElementById('saveProfileBtn').addEventListener('click', () => {
                document.getElementById('profile-name').textContent = document.getElementById('edit-name').value;
                document.getElementById('profile-email').textContent = document.getElementById('edit-email').value;
                document.getElementById('profile-phone').textContent = document.getElementById('edit-phone').value;
                document.getElementById('profile-address').textContent = document.getElementById('edit-address').value;
                
                editModal.style.display = 'none';
                alert('Profile updated successfully!');
            });
            
            // Close modal on outside click
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    editModal.style.display = 'none';
                }
            });
        }
    });
}