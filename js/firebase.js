/*
 * Firebase bridge for SahaPicks.
 * Paste your Firebase project config below.
 * Required: apiKey, authDomain, projectId, messagingSenderId, appId
 */

window.FIREBASE_CONFIG = window.FIREBASE_CONFIG || {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID",
    measurementId: "YOUR_FIREBASE_MEASUREMENT_ID"
};

const FirebaseBridge = {
    app: null,
    db: null,
    auth: null,
    initialized: false,

    isConfigured() {
        const config = window.FIREBASE_CONFIG || {};
        return Boolean(
            config.apiKey &&
            config.authDomain &&
            config.projectId &&
            config.messagingSenderId &&
            config.appId &&
            typeof window.firebase !== 'undefined'
        );
    },

    async init() {
        if (!this.isConfigured()) {
            return false;
        }

        if (this.initialized) {
            return true;
        }

        if (!window.firebase.apps.length) {
            window.firebase.initializeApp(window.FIREBASE_CONFIG);
        }

        this.app = window.firebase.app();
        this.db = window.firebase.firestore();
        this.auth = typeof window.firebase.auth === 'function' ? window.firebase.auth() : null;
        this.initialized = true;
        return true;
    },

    async initAuth() {
        await this.init();
        return Boolean(this.auth);
    },

    async onAuthStateChange(callback) {
        const ready = await this.initAuth();
        if (!ready) {
            callback(null);
            return () => {};
        }

        return this.auth.onAuthStateChanged(callback);
    },

    async signInWithGoogle() {
        const ready = await this.initAuth();
        if (!ready) {
            throw new Error('Firebase Auth is not available in this environment.');
        }

        const provider = new window.firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account',
        });

        return this.auth.signInWithPopup(provider);
    },

    async signInAsGuest() {
        const ready = await this.initAuth();
        if (!ready) {
            return { user: { uid: `guest-${Date.now()}`, isAnonymous: true } };
        }

        return this.auth.signInAnonymously();
    },

    async signOut() {
        const ready = await this.initAuth();
        if (!ready) {
            return true;
        }

        await this.auth.signOut();
        return true;
    },

    getCurrentUser() {
        return this.auth?.currentUser || null;
    },

    async getProducts() {
        await this.init();
        if (!this.initialized) return [];

        const snapshot = await this.db.collection('products').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    },

    async onProductsChange(callback) {
        await this.init();
        if (!this.initialized) {
            return () => {};
        }

        return this.db.collection('products')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const products = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
                callback(products);
            });
    },

    async seedProducts(products) {
        await this.init();
        if (!this.initialized) return false;

        const snapshot = await this.db.collection('products').get();
        if (!snapshot.empty) {
            return false;
        }

        const batch = this.db.batch();
        products.forEach((product) => {
            const ref = this.db.collection('products').doc(product.id);
            const { id, ...rest } = product;
            batch.set(ref, {
                ...rest,
                createdAt: rest.createdAt || new Date().toISOString(),
                clickCount: Number(rest.clickCount || 0),
            });
        });

        await batch.commit();
        return true;
    },

    async addProduct(product) {
        await this.init();
        if (!this.initialized) return null;

        const ref = this.db.collection('products').doc();
        const { id, ...rest } = product;
        const payload = {
            ...rest,
            createdAt: rest.createdAt || new Date().toISOString(),
            clickCount: Number(rest.clickCount || 0),
        };
        await ref.set(payload);
        return { ...payload, id: ref.id };
    },

    async updateProduct(id, updates) {
        await this.init();
        if (!this.initialized) return null;

        const ref = this.db.collection('products').doc(id);
        const snapshot = await ref.get();
        if (!snapshot.exists) return null;

        await ref.update({
            ...updates,
        });

        const updated = await ref.get();
        return { ...updated.data(), id: updated.id };
    },

    async deleteProduct(id) {
        await this.init();
        if (!this.initialized) return false;

        const ref = this.db.collection('products').doc(id);
        const snapshot = await ref.get();
        if (!snapshot.exists) return false;

        await ref.delete();
        return true;
    },

    async clearProducts() {
        await this.init();
        if (!this.initialized) return false;

        const snapshot = await this.db.collection('products').get();
        const batch = this.db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        return true;
    },

    async incrementClickCount(id) {
        await this.init();
        if (!this.initialized) return null;

        const ref = this.db.collection('products').doc(id);
        await ref.update({
            clickCount: window.firebase.firestore.FieldValue.increment(1),
        });

        const updated = await ref.get();
        return { ...updated.data(), id: updated.id };
    },

    async importProducts(products, merge = false) {
        await this.init();
        if (!this.initialized) return false;

        if (!merge) {
            await this.clearProducts();
        }

        for (const product of products) {
            if (product.title && product.affiliateUrl) {
                await this.addProduct(product);
            }
        }

        return true;
    },
};

window.FirebaseBridge = FirebaseBridge;
