// ============================================
// FIREBASE CONFIGURATION - COMPAT SDK VERSION
// WITH ORDERS AND USER FUNCTIONS
// ============================================

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCTI8tl54A-kpqmdHR8wXti5h0fNn5-Co8",
    authDomain: "e-commerce-8be2d.firebaseapp.com",
    projectId: "e-commerce-8be2d",
    storageBucket: "e-commerce-8be2d.firebasestorage.app",
    messagingSenderId: "761432033974",
    appId: "1:761432033974:web:a21d35d7328a43f7b37417",
    measurementId: "G-NT5P9PXVVV"
};

// Initialize Firebase (compat version)
firebase.initializeApp(firebaseConfig);

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();

// Make db and auth available globally
window.db = db;
window.auth = auth;

console.log('✅ Firebase initialized successfully!');
console.log('✅ Firestore available:', !!db);
console.log('✅ Auth available:', !!auth);

// Enable offline persistence
db.enablePersistence()
    .then(() => console.log('✅ Offline persistence enabled'))
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('⚠️ Persistence failed: Multiple tabs open');
        } else if (err.code == 'unimplemented') {
            console.log('⚠️ Persistence not available in this browser');
        }
    });

// ============================================
// PRODUCT FUNCTIONS
// ============================================

// Sample products for initialization
const sampleProducts = [
    {
        id: 'p1',
        name: 'Premium Notebook',
        price: 50,
        category: 'notebooks',
        image: 'book1.jpeg',
        description: '200 pages, ruled, hardcover'
    },
    {
        id: 'p2',
        name: 'Gel Pen Set (5pc)',
        price: 75,
        category: 'pens',
        image: 'pen2.jpeg',
        description: 'Smooth gel ink pens, 5 colors'
    },
    {
        id: 'p3',
        name: 'Scientific Calculator',
        price: 1000,
        category: 'electronics',
        image: 'scal.jpeg',
        description: '991-ES plus, 417 functions'
    },
    {
        id: 'p4',
        name: 'Sticky Notes Pack',
        price: 40,
        category: 'paper',
        image: 'sticky.jpeg',
        description: '3x3 inches, 5 colors, 100 sheets each'
    },
    {
        id: 'p5',
        name: 'A4 Binder Folder',
        price: 300,
        category: 'organization',
        image: 'A4.jpeg',
        description: '2-ring binder with pocket'
    },
    {
        id: 'p6',
        name: 'Highlighter 4in1',
        price: 400,
        category: 'pens',
        image: 'm2.jpeg',
        description: '4 fluorescent colors'
    },
    {
        id: 'p7',
        name: 'Mechanical Pencil Set',
        price: 1500,
        category: 'pencils',
        image: 'pencil.jpeg',
        description: '0.5mm and 0.7mm with lead'
    },
    {
        id: 'p8',
        name: 'USB Flash Drive 32GB',
        price: 700,
        category: 'electronics',
        image: 'usb.jpeg',
        description: 'USB 3.0, metal casing'
    }
];

// Initialize products in Firestore
async function initializeProducts() {
    try {
        console.log('Checking for existing products...');
        const snapshot = await db.collection('products').get();
        
        if (snapshot.empty) {
            console.log('Adding sample products to Firestore...');
            const batch = db.batch();
            
            sampleProducts.forEach(product => {
                const docRef = db.collection('products').doc(product.id);
                batch.set(docRef, {
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    image: product.image,
                    description: product.description
                });
            });
            
            await batch.commit();
            console.log('✅ Sample products added to Firestore successfully!');
        } else {
            console.log('✅ Products already exist in Firestore');
            console.log(`📊 Found ${snapshot.size} products`);
        }
    } catch (error) {
        console.error('❌ Error initializing products:', error);
    }
}

// ============================================
// ORDER FUNCTIONS - FOR FIREBASE STORAGE
// ============================================

/**
 * Save order to Firebase
 * @param {Object} orderData - The order data to save
 * @returns {Promise<string|null>} - Order ID if successful, null if failed
 */
async function saveOrderToFirebase(orderData) {
    try {
        const user = auth.currentUser;
        const orderWithMeta = {
            ...orderData,
            userId: user ? user.uid : 'guest',
            userEmail: user ? user.email : 'guest@example.com',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            orderDate: new Date().toISOString()
        };
        
        const docRef = await db.collection('orders').add(orderWithMeta);
        console.log('✅ Order saved to Firebase with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error saving order:', error);
        return null;
    }
}

/**
 * Get user's orders from Firebase
 * @returns {Promise<Array>} - Array of order objects
 */
async function getUserOrdersFromFirebase() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.log('No user logged in');
            return [];
        }
        
        const snapshot = await db.collection('orders')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firebase timestamp to JS date
            createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
        }));
        
        console.log(`✅ Loaded ${orders.length} orders from Firebase`);
        return orders;
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        return [];
    }
}

/**
 * Get all orders (admin function)
 * @returns {Promise<Array>} - Array of all orders
 */
async function getAllOrders() {
    try {
        const snapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('❌ Error loading all orders:', error);
        return [];
    }
}

/**
 * Update order status
 * @param {string} orderId - Order ID to update
 * @param {string} status - New status
 */
async function updateOrderStatus(orderId, status) {
    try {
        await db.collection('orders').doc(orderId).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Order status updated');
    } catch (error) {
        console.error('❌ Error updating order:', error);
    }
}

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

/**
 * Save user profile to Firebase
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to save
 */
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

/**
 * Get user profile from Firebase
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - User profile or null
 */
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

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 */
async function updateUserProfile(userId, updates) {
    try {
        await db.collection('users').doc(userId).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ User profile updated');
    } catch (error) {
        console.error('❌ Error updating profile:', error);
    }
}

// ============================================
// CART SYNC FUNCTIONS (Optional)
// ============================================

/**
 * Save cart to Firebase for logged-in user
 * @param {Array} cartItems - Cart items array
 */
async function syncCartToFirebase(cartItems) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        await db.collection('carts').doc(user.uid).set({
            items: cartItems,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Cart synced to Firebase');
    } catch (error) {
        console.error('❌ Error syncing cart:', error);
    }
}

/**
 * Load cart from Firebase
 * @returns {Promise<Array>} - Cart items
 */
async function loadCartFromFirebase() {
    try {
        const user = auth.currentUser;
        if (!user) return [];
        
        const doc = await db.collection('carts').doc(user.uid).get();
        if (doc.exists) {
            return doc.data().items || [];
        }
        return [];
    } catch (error) {
        console.error('❌ Error loading cart:', error);
        return [];
    }
}

// ============================================
// WISHLIST SYNC FUNCTIONS (Optional)
// ============================================

/**
 * Save wishlist to Firebase
 * @param {Array} wishlistItems - Wishlist items array
 */
async function syncWishlistToFirebase(wishlistItems) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        await db.collection('wishlists').doc(user.uid).set({
            items: wishlistItems,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Wishlist synced to Firebase');
    } catch (error) {
        console.error('❌ Error syncing wishlist:', error);
    }
}

/**
 * Load wishlist from Firebase
 * @returns {Promise<Array>} - Wishlist items
 */
async function loadWishlistFromFirebase() {
    try {
        const user = auth.currentUser;
        if (!user) return [];
        
        const doc = await db.collection('wishlists').doc(user.uid).get();
        if (doc.exists) {
            return doc.data().items || [];
        }
        return [];
    } catch (error) {
        console.error('❌ Error loading wishlist:', error);
        return [];
    }
}

// ============================================
// AUTH HELPER FUNCTIONS
// ============================================

/**
 * Create new user account
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} userData - Additional user data
 */
async function createUserAccount(email, password, userData) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Save additional user data
        await saveUserProfile(user.uid, {
            email: email,
            ...userData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ User account created');
        return user;
    } catch (error) {
        console.error('❌ Error creating account:', error);
        throw error;
    }
}

/**
 * Sign in user
 * @param {string} email - User email
 * @param {string} password - User password
 */
async function signInUser(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ User signed in');
        return userCredential.user;
    } catch (error) {
        console.error('❌ Error signing in:', error);
        throw error;
    }
}

/**
 * Sign out user
 */
async function signOutUser() {
    try {
        await auth.signOut();
        console.log('✅ User signed out');
    } catch (error) {
        console.error('❌ Error signing out:', error);
    }
}

// ============================================
// MAKE FUNCTIONS AVAILABLE GLOBALLY
// ============================================

// Order functions
window.saveOrderToFirebase = saveOrderToFirebase;
window.getUserOrdersFromFirebase = getUserOrdersFromFirebase;
window.getAllOrders = getAllOrders;
window.updateOrderStatus = updateOrderStatus;

// User profile functions
window.saveUserProfile = saveUserProfile;
window.getUserProfile = getUserProfile;
window.updateUserProfile = updateUserProfile;

// Cart/Wishlist sync functions
window.syncCartToFirebase = syncCartToFirebase;
window.loadCartFromFirebase = loadCartFromFirebase;
window.syncWishlistToFirebase = syncWishlistToFirebase;
window.loadWishlistFromFirebase = loadWishlistFromFirebase;

// Auth helper functions
window.createUserAccount = createUserAccount;
window.signInUser = signInUser;
window.signOutUser = signOutUser;

// Initialize products after a small delay
setTimeout(() => {
    initializeProducts();
}, 1000);

console.log('✅ All Firebase functions loaded successfully!');