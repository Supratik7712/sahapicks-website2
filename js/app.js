/**
 * Main Application Module
 * Handles UI interactions and product display for the storefront
 */

window.NEWSLETTER_CONFIG = window.NEWSLETTER_CONFIG || {
    webhookUrl: 'https://formspree.io/f/mykvdoop',
};

class SahaPicks {
    constructor() {
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.currentSearch = '';
        this.authUser = null;
        this.authPromptKey = 'sahapicks_auth_prompt_seen';
        this.authSessionKey = 'sahapicks_auth_session_type';
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        this.cacheElements();
        this.attachEventListeners();
        this.setupTheme();
        this.setupAuth();
        await Storage.init();
        Storage.onChange(() => this.renderProducts());
        this.renderProducts();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        // Navigation
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.querySelector('.search-btn');
        this.searchMessage = document.getElementById('searchMessage');
        this.authButton = document.getElementById('authButton');
        this.themeToggle = document.getElementById('themeToggle');
        this.menuToggle = document.getElementById('menuToggle');
        this.navLinks = document.querySelector('.nav-links');

        // Filter and Sort
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.sortSelect = document.getElementById('sortSelect');

        // Products Grid
        this.productsGrid = document.getElementById('productsGrid');
        this.noResults = document.getElementById('noResults');

        // Hero CTA
        this.shopBtn = document.getElementById('shopBtn');
        this.trendingBtn = document.getElementById('trendingBtn');

        // Newsletter
        this.newsletterForm = document.getElementById('newsletterForm');
        this.newsletterMessage = document.getElementById('newsletterMessage');

        // Modal
        this.modal = document.getElementById('quickViewModal');
        this.modalClose = document.querySelector('.modal-close');

        // Auth modal
        this.authModal = document.getElementById('authModal');
        this.authModalClose = this.authModal?.querySelector('.modal-close');
        this.googleLoginBtn = document.getElementById('googleLoginBtn');
        this.guestLoginBtn = document.getElementById('guestLoginBtn');
        this.signOutBtn = document.getElementById('signOutBtn');
        this.authStatusText = document.getElementById('authStatusText');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Search
        this.searchInput?.addEventListener('input', () => this.handleSearch());
        this.searchInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSearch();
            }
        });
        this.searchBtn?.addEventListener('click', () => this.handleSearch());

        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleFilter(btn));
        });

        // Sort
        this.sortSelect?.addEventListener('change', () => this.handleSort());

        // Theme toggle
        this.themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Mobile menu
        this.menuToggle?.addEventListener('click', () => this.toggleMenu());
        this.navLinks?.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => this.closeMenu());
        });

        // Hero CTA
        this.shopBtn?.addEventListener('click', () => this.scrollToProducts());
        this.trendingBtn?.addEventListener('click', () => this.showTrending());

        // Newsletter
        this.newsletterForm?.addEventListener('submit', (e) => this.handleNewsletterSubmit(e));

        // Modal
        this.modalClose?.addEventListener('click', () => this.closeModal());
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });

        // Auth modal
        this.authButton?.addEventListener('click', () => this.openAuthModal(true));
        this.authModalClose?.addEventListener('click', () => this.dismissAuthModal());
        this.authModal?.addEventListener('click', (e) => {
            if (e.target === this.authModal) this.dismissAuthModal();
        });
        this.googleLoginBtn?.addEventListener('click', () => this.handleGoogleLogin());
        this.guestLoginBtn?.addEventListener('click', () => this.handleGuestLogin());
        this.signOutBtn?.addEventListener('click', () => this.handleSignOut());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeAuthModal();
            }
        });
    }

    /**
     * Handle search input
     */
    handleSearch() {
        const query = (this.searchInput?.value || '').trim();

        if (!query) {
            this.currentSearch = '';
            this.clearSearchMessage();
            this.renderProducts();
            return;
        }

        this.currentSearch = query;
        const matches = Products.filter({
            search: query,
            tag: this.currentFilter,
            sort: this.currentSort,
        });

        if (matches.length === 0) {
            this.showSearchMessage(`Product not found for "${query}".`);
        } else {
            this.clearSearchMessage();
        }
        this.renderProducts();
        this.scrollToProducts();
    }

    /**
     * Setup user authentication UI and Firebase hooks.
     */
    async setupAuth() {
        const sessionType = localStorage.getItem(this.authSessionKey);
        if (sessionType) {
            this.updateAuthStatusLabel(sessionType === 'guest'
                ? 'Guest browsing enabled.'
                : 'Signed in on this device.');
        }

        if (!window.FirebaseBridge || typeof window.FirebaseBridge.onAuthStateChange !== 'function') {
            this.updateAuthButton(null);
            this.maybeShowAuthPrompt();
            return;
        }

        try {
            this.unsubscribeAuth = await window.FirebaseBridge.onAuthStateChange((user) => {
                this.authUser = user || null;
                if (user) {
                    const nextSession = user.isAnonymous ? 'guest' : 'google';
                    localStorage.setItem(this.authSessionKey, nextSession);
                    this.markAuthPromptSeen();
                    this.updateAuthStatusLabel(user.isAnonymous
                        ? 'Guest browsing enabled.'
                        : `Signed in as ${user.displayName || user.email || 'Google user'}.`);
                } else {
                    this.updateAuthStatusLabel('Choose Google sign-in or guest mode to continue.');
                }
                this.updateAuthButton(user);
                this.updateAuthModalState();
            });
        } catch (error) {
            console.error('Auth initialization failed:', error);
            this.updateAuthButton(null);
            this.updateAuthStatusLabel('Authentication is not available yet.');
        }

        this.maybeShowAuthPrompt();
    }

    /**
     * Show the login prompt only once for first-time visitors.
     */
    maybeShowAuthPrompt() {
        const promptSeen = localStorage.getItem(this.authPromptKey) === 'true';
        if (!promptSeen && !this.authUser) {
            window.setTimeout(() => this.openAuthModal(), 350);
        }
    }

    /**
     * Open the auth modal.
     */
    openAuthModal(force = false) {
        if (!this.authModal) return;
        this.authModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.updateAuthModalState();
        if (force) {
            this.markAuthPromptSeen();
        }
    }

    /**
     * Close the auth modal.
     */
    closeAuthModal() {
        if (!this.authModal) return;
        this.authModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * Close the auth modal and remember the prompt was seen.
     */
    dismissAuthModal() {
        this.markAuthPromptSeen();
        this.closeAuthModal();
    }

    /**
     * Remember that the auth prompt has been shown.
     */
    markAuthPromptSeen() {
        localStorage.setItem(this.authPromptKey, 'true');
    }

    /**
     * Update the header auth button text.
     */
    updateAuthButton(user) {
        if (!this.authButton) return;
        const labelNode = this.authButton.querySelector('.auth-btn-label') || this.authButton;

        if (!user) {
            labelNode.textContent = 'Login';
            this.authButton.title = 'Open sign-in options';
            return;
        }

        if (user.isAnonymous) {
            labelNode.textContent = 'Guest';
            this.authButton.title = 'Guest browsing active';
            return;
        }

        const label = user.displayName || user.email || 'Signed in';
        labelNode.textContent = label.length > 14 ? `${label.slice(0, 13)}…` : label;
        this.authButton.title = label;
    }

    /**
     * Update helper copy in the auth modal.
     */
    updateAuthStatusLabel(message) {
        if (!this.authStatusText) return;
        this.authStatusText.textContent = message;
    }

    /**
     * Update auth modal controls for the current session state.
     */
    updateAuthModalState() {
        const signedIn = Boolean(this.authUser);
        const googleLabel = this.googleLoginBtn?.querySelector('.auth-btn-label') || this.googleLoginBtn;
        const guestLabel = this.guestLoginBtn?.querySelector('.auth-btn-label') || this.guestLoginBtn;
        if (this.signOutBtn) {
            this.signOutBtn.style.display = signedIn ? 'inline-flex' : 'none';
        }
        if (googleLabel) {
            googleLabel.textContent = signedIn ? 'Switch to Google' : 'Continue with Google';
        }
        if (guestLabel) {
            guestLabel.textContent = this.authUser?.isAnonymous ? 'Stay as Guest' : 'Continue as Guest';
        }
    }

    /**
     * Start Google sign-in using Firebase Auth.
     */
    async handleGoogleLogin() {
        try {
            this.updateAuthStatusLabel('Opening Google sign-in...');
            if (!window.FirebaseBridge || typeof window.FirebaseBridge.signInWithGoogle !== 'function') {
                throw new Error('Firebase Auth is not configured yet.');
            }
            await window.FirebaseBridge.signInWithGoogle();
            this.markAuthPromptSeen();
            this.closeAuthModal();
            this.showToast('Signed in successfully.', 'success');
        } catch (error) {
            console.error('Google sign-in failed:', error);
            this.updateAuthStatusLabel(error.message || 'Google sign-in failed.');
            this.showToast('Google sign-in could not be completed.', 'error');
        }
    }

    /**
     * Continue browsing as a guest.
     */
    async handleGuestLogin() {
        try {
            this.updateAuthStatusLabel('Continuing as guest...');
            if (!window.FirebaseBridge || typeof window.FirebaseBridge.signInAsGuest !== 'function') {
                this.activateLocalGuestSession();
                return;
            }
            const result = await window.FirebaseBridge.signInAsGuest();
            if (result?.user && !window.FirebaseBridge.getCurrentUser?.()) {
                this.authUser = result.user;
                this.updateAuthButton(result.user);
                this.updateAuthModalState();
            }
            localStorage.setItem(this.authSessionKey, 'guest');
            this.markAuthPromptSeen();
            this.closeAuthModal();
            this.showToast('You are browsing as a guest.', 'success');
        } catch (error) {
            console.error('Guest login failed:', error);
            this.activateLocalGuestSession();
        }
    }

    /**
     * Fall back to a local guest session if Firebase anonymous auth is not available.
     */
    activateLocalGuestSession() {
        const localGuest = {
            uid: `guest-${Date.now()}`,
            isAnonymous: true,
            displayName: 'Guest',
        };

        this.authUser = localGuest;
        this.updateAuthButton(localGuest);
        this.updateAuthModalState();
        localStorage.setItem(this.authSessionKey, 'guest');
        this.markAuthPromptSeen();
        this.closeAuthModal();
        this.updateAuthStatusLabel('Guest browsing enabled.');
        this.showToast('You are browsing as a guest.', 'success');
    }

    /**
     * Sign out of the current auth session.
     */
    async handleSignOut() {
        try {
            if (window.FirebaseBridge && typeof window.FirebaseBridge.signOut === 'function') {
                await window.FirebaseBridge.signOut();
            }
            localStorage.removeItem(this.authSessionKey);
            this.authUser = null;
            this.updateAuthButton(null);
            this.updateAuthModalState();
            this.updateAuthStatusLabel('Signed out. Choose Google sign-in or guest mode to continue.');
            this.showToast('Signed out successfully.', 'success');
        } catch (error) {
            console.error('Sign out failed:', error);
            this.showToast('Could not sign out right now.', 'error');
        }
    }

    /**
     * Show search status below the search bar.
     */
    showSearchMessage(message) {
        if (!this.searchMessage) return;
        this.searchMessage.textContent = message;
        this.searchMessage.classList.add('show');
    }

    /**
     * Clear search status without changing the product grid.
     */
    clearSearchMessage() {
        if (!this.searchMessage) return;
        this.searchMessage.textContent = '';
        this.searchMessage.classList.remove('show');
    }

    /**
     * Handle filter click
     */
    handleFilter(btn) {
        // Remove active class from all buttons
        this.filterBtns.forEach(b => b.classList.remove('active'));

        // Add active class to clicked button
        btn.classList.add('active');

        // Update current filter
        this.currentFilter = btn.dataset.filter;

        // Render products
        this.renderProducts();
    }

    /**
     * Handle sort change
     */
    handleSort() {
        this.currentSort = this.sortSelect?.value || 'newest';
        this.renderProducts();
    }

    /**
     * Render products to grid
     */
    renderProducts() {
        try {
            // Get filtered and sorted products
            const products = Products.filter({
                search: this.currentSearch,
                tag: this.currentFilter,
                sort: this.currentSort,
            });

            if (!this.productsGrid) return;

            // Clear grid
            this.productsGrid.innerHTML = '';

            // Show/hide no results message
            if (products.length === 0) {
                this.productsGrid.style.display = 'none';
                if (this.noResults) this.noResults.style.display = 'block';
                if (this.currentSearch) {
                    this.showSearchMessage(`Product not found for "${this.currentSearch}".`);
                } else {
                    this.clearSearchMessage();
                }
                return;
            }

            this.productsGrid.style.display = 'grid';
            if (this.noResults) this.noResults.style.display = 'none';
            if (this.currentSearch) {
                this.clearSearchMessage();
            }

            // Render each product
            const cardsHTML = [];
            products.forEach((product, index) => {
                const cardHTML = this.createProductCard(product, index);
                cardsHTML.push(cardHTML);
            });
            this.productsGrid.innerHTML = cardsHTML.join('');

            // Attach event listeners to new elements
            this.attachProductCardListeners();
        } catch (error) {
            console.error('Error rendering products:', error);
        }
    }

    /**
     * Create product card HTML
     */
    createProductCard(product, index) {
        const tags = product.tags || [];
        const badgesHTML = tags
            .slice(0, 3)
            .map(tag => `<div class="badge ${tag}">${this.getBadgeText(tag)}</div>`)
            .join('');
        const affiliateBadgeHTML = `<span class="affiliate-badge">Amazon Affiliate</span>`;
        const cardLabelsHTML = `
            <div class="product-card-labels">
                ${affiliateBadgeHTML}
                ${badgesHTML}
            </div>
        `;

        const tagsHTML = tags
            .map(tag => `<span class="tag">${this.getBadgeText(tag)}</span>`)
            .join('');
        const originalPrice = product.originalPrice ? this.formatPrice(product.originalPrice) : '';
        const offerPrice = this.formatPrice(product.price || product.offerPrice || 0);
        const discountPercent = product.originalPrice ? this.calculateDiscountPercentage(product.originalPrice, product.price || product.offerPrice) : '';
        const discountHTML = discountPercent ? `<span class="discount-badge">${discountPercent}% off</span>` : '';
        const priceHTML = originalPrice
            ? `<span class="product-price">${offerPrice}</span><span class="old-price">${originalPrice}</span>${discountHTML}`
            : `<span class="product-price">${offerPrice}</span>`;

        return `
            <div class="product-card" data-product-id="${product.id}" style="animation-delay: ${index * 0.05}s; animation: fadeIn 0.6s ease-out both;">
                <div class="product-image">
                    <img src="${this.escapeHTML(product.image || '')}" alt="${this.escapeHTML(product.title)}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 200%22%3E%3Crect fill=%22%23E5E7EB%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2220%22 fill=%22%239CA3AF%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                </div>
                ${cardLabelsHTML}

                <div class="product-content">
                    <h3 class="product-title">${this.escapeHTML(product.title)}</h3>
                    <p class="product-description">${this.escapeHTML(product.description || '').substring(0, 100)}...</p>

                    <div class="product-meta">
                        ${priceHTML}
                    </div>

                    <div class="product-tags">
                        ${tagsHTML}
                    </div>

                    <div class="product-actions">
                        <a href="${this.escapeHTML(product.affiliateUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-buy" data-product-id="${product.id}">
                            Buy Now
                        </a>
                        <button class="btn btn-quickview" data-product-id="${product.id}">
                            Quick View
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get badge display text
     */
    getBadgeText(tag) {
        const badges = {
            'new': 'New',
            'hot-deal': 'Hot Deal',
            'trending': 'Trending',
            'mobiles': 'Mobiles',
            'audio': 'Audio',
            'laptops': 'Laptops & Desk Setup',
            'wearables': 'Wearables',
            'creator-gadgets': 'Content Creator Gadgets',
            'budget-tech': 'Budget Tech Gadgets',
            'accessories': 'Accessories',
            'smart-home': 'Smart Home',
            'gaming': 'Gaming',
            'tech': 'Tech',
            'lifestyle': 'Lifestyle',
            'home': 'Home',
        };
        return badges[tag] || tag;
    }

    /**
     * Attach product card event listeners
     */
    attachProductCardListeners() {
        // Buy buttons
        document.querySelectorAll('.btn-buy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = btn.dataset.productId;
                Storage.incrementClickCount(productId);
            });
        });

        // Quick view buttons
        document.querySelectorAll('.btn-quickview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.dataset.productId;
                this.showQuickView(productId);
            });
        });

    }

    /**
     * Show quick view modal
     */
    showQuickView(productId) {
        const product = Products.getById(productId);
        if (!product) return;

        document.getElementById('modalImage').src = product.image || '';
        document.getElementById('modalImage').alt = product.title;
        document.getElementById('modalTitle').textContent = product.title;
        const originalPrice = product.originalPrice ? this.formatPrice(product.originalPrice) : '';
        const offerPrice = this.formatPrice(product.price || product.offerPrice || 0);
        const discountPercent = product.originalPrice ? this.calculateDiscountPercentage(product.originalPrice, product.price || product.offerPrice) : '';
        const discountHTML = discountPercent ? `<span class="discount-badge">${discountPercent}% off</span>` : '';
        document.getElementById('modalPrice').innerHTML = originalPrice
            ? `<span>${offerPrice}</span><span class="old-price">${originalPrice}</span>${discountHTML}`
            : `<span>${offerPrice}</span>`;

        const tagsHTML = (product.tags || [])
            .map(tag => `<span class="tag">${this.getBadgeText(tag)}</span>`)
            .join('');
        document.getElementById('modalTags').innerHTML = tagsHTML;
        document.getElementById('modalDescription').textContent = product.description || '';

        const buyBtn = document.getElementById('modalBuyBtn');
        buyBtn.href = product.affiliateUrl;
        buyBtn.textContent = 'Buy Now';

        this.openModal();
    }

    /**
     * Open modal
     */
    openModal() {
        if (!this.modal) return;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close modal
     */
    closeModal() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * Handle newsletter submit
     */
    async handleNewsletterSubmit(e) {
        e.preventDefault();
        const emailInput = e.target.querySelector('input[type="email"]');
        const email = emailInput.value.trim();

        if (!emailInput.checkValidity()) {
            emailInput.reportValidity();
            return;
        }

        const success = await this.saveNewsletterEmail(email);
        if (success) {
            if (this.newsletterMessage) {
                this.newsletterMessage.textContent = `Thanks. ${email} has been added for deal updates.`;
                this.newsletterMessage.classList.add('show');
            }
            this.showToast(`Thanks. ${email} has been added for deal updates.`, 'success');
            e.target.reset();
        } else {
            this.showToast('Could not save your email right now. Please try again.', 'error');
        }
    }

    /**
     * Store newsletter email locally and send it to Formspree.
     */
    async saveNewsletterEmail(email) {
        try {
            const key = 'sahapicks_newsletter_emails';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            if (!existing.includes(email)) {
                existing.push(email);
                localStorage.setItem(key, JSON.stringify(existing));
            }

            const webhookUrl = window.NEWSLETTER_CONFIG?.webhookUrl || '';
            if (!webhookUrl) {
                console.warn('Newsletter webhook URL is missing.');
                return true;
            }

            const formData = new FormData();
            formData.append('email', email);
            formData.append('page', window.location.pathname);
            formData.append('source', window.location.href);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Formspree returned ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error saving newsletter email:', error);
            return false;
        }
    }

    /**
     * Scroll to products section
     */
    scrollToProducts() {
        const section = document.getElementById('products');
        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Show trending products
     */
    showTrending() {
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.currentSearch = '';
        this.clearSearchMessage();
        this.currentFilter = 'hot-deal';
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === 'hot-deal');
        });
        this.renderProducts();
        this.scrollToProducts();
    }

    /**
     * Setup theme handling
     */
    setupTheme() {
        const theme = Storage.getTheme();
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (this.themeToggle) this.themeToggle.textContent = '\u2600';
        } else {
            document.body.classList.remove('dark-mode');
            if (this.themeToggle) this.themeToggle.textContent = '\u263e';
        }
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const newTheme = Storage.toggleTheme();
        if (newTheme === 'dark') {
            document.body.classList.add('dark-mode');
            if (this.themeToggle) this.themeToggle.textContent = '\u2600';
        } else {
            document.body.classList.remove('dark-mode');
            if (this.themeToggle) this.themeToggle.textContent = '\u263e';
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMenu() {
        const isOpen = this.navLinks?.classList.toggle('open');
        this.menuToggle?.classList.toggle('open', Boolean(isOpen));
        this.menuToggle?.setAttribute('aria-expanded', String(Boolean(isOpen)));
        this.menuToggle?.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    }

    /**
     * Close mobile menu after navigation
     */
    closeMenu() {
        this.navLinks?.classList.remove('open');
        this.menuToggle?.classList.remove('open');
        this.menuToggle?.setAttribute('aria-expanded', 'false');
        this.menuToggle?.setAttribute('aria-label', 'Open menu');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const existingToast = document.getElementById('toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = `toast show ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Escape HTML special characters
     */
    escapeHTML(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    formatPrice(value) {
        const amount = Number.parseFloat(value || 0);
        return `\u20b9${Number.isFinite(amount) ? amount.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        }) : '0'}`;
    }

    /**
     * Calculate discount percentage
     */
    calculateDiscountPercentage(originalPrice, offerPrice) {
        const original = Number.parseFloat(originalPrice) || 0;
        const offer = Number.parseFloat(offerPrice) || 0;
        
        if (original <= 0 || offer >= original) return 0;
        
        const discount = ((original - offer) / original) * 100;
        return Math.round(discount);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SahaPicks();
});
