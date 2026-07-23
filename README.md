# 🛍️ SahaPicks Website

SahaPicks is a curated electronics deals website built to help visitors discover useful gadgets, compare prices quickly, and jump to trusted ecommerce partners through affiliate links.

It is also a full-stack affiliate marketing website, with product storage, admin authentication, newsletter capture, and ad monetization all built into the workflow.

It is a lightweight static project made with:

- HTML5
- CSS3
- Vanilla JavaScript
- Firebase integration for optional remote data/auth
- Formspree for newsletter capture

The whole experience is designed to feel fast, simple, and easy to host.

## 🌐 Live Site

- Website: `https://sahapicks.online/`

## 🏷️ Domain & Hosting

- Domain purchased from Hostinger
- Hosting handled for free on Netlify
- GitHub is connected to Netlify for automatic updates when the codebase changes
- DNS propagation was used to point the Hostinger domain to the Netlify deployment

This setup makes the site easy to maintain because pushing code to GitHub can automatically update the live website after Netlify deploys the changes.

## ✨ What This Website Is

SahaPicks is a product discovery and referral platform.

It is not a checkout system.
It does not process payments.
It does not store customer card details.

Instead, it helps users browse handpicked electronics and then redirect to affiliate merchant pages with one click.

## 🚀 What Makes It Useful

- Users can quickly find trending and practical electronics
- Products are organized into clear categories
- Search helps find items by title, description, or tag
- Sorting helps compare by newest or price
- Quick view gives a richer look without leaving the page
- The experience is responsive on desktop, tablet, and mobile
- The admin panel makes product management straightforward

## 🧭 Main Pages

### 🏠 Storefront

The public shopping experience lives in [index.html](./index.html).

It includes:

- Sticky top navigation
- Brand logo and admin link
- Product search bar
- Theme toggle for light and dark mode
- Hero section with featured messaging
- Category filter chips
- Product grid
- Newsletter signup
- Quick view modal
- Guest and Google auth prompt
- Sponsored banner placements
- Footer with disclosure and social links

### 🛠️ Admin Dashboard

The management panel lives in [admin.html](./admin.html).

It includes:

- Client-side admin gate
- Product statistics
- Full product table
- Add product form
- Edit product form
- Product image preview
- Tag selectors
- Click counts
- JSON import and export
- PDF export
- Clear-all action with confirmation

### 🧱 Full-Stack Affiliate Marketing Setup

The project is more than a static showcase.

It includes the core pieces usually needed for an affiliate marketing stack:

- Product catalog management
- Authentication for admin access and user sessions
- Newsletter lead capture
- Ad monetization
- Affiliate link routing
- Remote database support

## 🎯 Feature Highlights

### 🔎 Search

Visitors can search products using:

- Product title
- Product description
- Product tags

This makes browsing smoother when the catalog grows.

### 🏷️ Category Filters

The site has a clean chip-based filter system for product discovery.

Categories include:

- Mobiles
- Audio
- Laptops & Desk Setup
- Wearables
- Content Creator Gadgets
- Budget Tech Gadgets
- Accessories
- Smart Home
- Gaming
- Trending
- Hot Deals

### 📊 Sorting

Users can sort by:

- Newest first
- Price low to high
- Price high to low

### 👀 Quick View

The quick view modal lets users inspect product details without opening a new page.

It shows:

- Product image
- Full title
- Offer price
- Original price
- Discount information
- Tags
- Full description
- Affiliate buy button

### 🌙 Light and Dark Mode

The website supports both light and dark mode.

Theme preference is saved in `localStorage` using the key `sahapicks_theme`, so the choice stays across sessions.

### 📩 Newsletter Capture

The newsletter form is connected through Formspree so email signups can be captured without building a custom backend.

This keeps the lead-capture flow lightweight while still allowing newsletter submissions from the public site.

### 👤 Login Experience

The storefront supports:

- Google login through Firebase Auth
- Guest browsing mode

This is mainly used for session personalization and a smoother user experience.

### 📈 Click Tracking

Every product card includes a Buy Now affiliate button.

Clicks are tracked and stored so the admin can see which products are getting attention.

### 🗄️ Firebase Storage + Authentication

Firebase is used for:

- Admin panel product storage
- Product syncing across sessions
- Authentication support

That means the admin dashboard is not just a visual editor. It can persist product data remotely and support authenticated access flows.

### 🧰 Product Management

The admin dashboard is built to support day-to-day store updates.

You can:

- Add products
- Edit products
- Delete products
- Sort and review products
- Import a JSON backup
- Export your catalog
- Track clicks
- Reset everything if needed

### 📢 Sponsored Ad Areas

The homepage includes dedicated ad placements that are separate from the core product experience.

Ad monetization is integrated through Adsterra, which allows the site to earn from traffic while keeping the affiliate storefront experience intact.

That makes them easier to keep, move, or remove later without affecting the rest of the site.

## 🏗️ How The Project Works

The project is intentionally framework-free.

It uses a simple flow:

```text
User action
  -> app.js or admin.js
  -> products.js
  -> storage.js
  -> localStorage or Firebase
  -> UI update
```

### Core JavaScript Files

- [js/app.js](./js/app.js) handles storefront interactions
- [js/admin.js](./js/admin.js) handles admin operations
- [js/products.js](./js/products.js) handles sorting, filtering, and search logic
- [js/storage.js](./js/storage.js) handles persistence and fallback storage
- [js/firebase.js](./js/firebase.js) bridges Firebase Auth and Firestore

### Storage Behavior

The site tries to use Firebase when available and configured.

If Firebase is not available, it falls back to localStorage so the site can still work in a lightweight preview or offline-friendly mode.

### Monetization Stack

- Affiliate income comes from product redirection links
- Display ads are integrated through Adsterra
- Newsletter growth is handled through Formspree
- Hosting is handled on Netlify with GitHub-based deployment automation

## 💡 Detailed Analysis

### ✅ Strengths

- Clean separation between UI, storage, and product logic
- Very fast because there is no frontend framework overhead
- Easy to host as a static website
- Good mobile and tablet layout behavior
- Theme choice is remembered
- Product management is simple and practical
- Works well as an affiliate-focused storefront

### 🎨 UX Notes

- The sticky header keeps navigation always available
- Search and filters reduce friction for shoppers
- Product cards are visually consistent and easy to scan
- Quick view reduces unnecessary page hops
- The admin panel is compact and operationally focused
- Newsletter signup is kept simple and visible

### ⚡ Performance Notes

- Product images use lazy loading
- Theme is applied early to reduce flash/flicker
- Sections are styled to reduce layout shift
- The site is static, so it can load very quickly on a good host
- External ads and third-party services can still affect speed

### 📱 Responsiveness Notes

The layout is tuned for:

- Large desktop screens with multi-column browsing
- Tablet layouts with stacked sections
- Mobile single-column browsing
- Admin table collapse into card-style rows on narrow screens

### 🔐 Security Notes

- The admin password check is client-side only
- Firebase security rules should be set properly if remote data is enabled
- Public config values are okay to expose in frontend code, but access control must still be enforced in Firebase rules
- External ad scripts are outside the control of this repository
- Netlify and GitHub deployment should be protected with proper repository access and branch control

## 🧰 Tech Stack

- HTML5 for structure
- CSS3 for the full UI and responsive layout
- Vanilla JavaScript for interactions
- Firebase Auth for Google sign-in and guest auth support
- Firestore for optional product storage
- Formspree for newsletter submissions
- Adsterra for ad monetization
- Hostinger for domain registration
- Netlify for free hosting and deployments
- GitHub for source control and automatic deployment triggers

## 📂 Project Structure

```text
.
├── admin.html
├── assets/
├── css/
│   └── style.css
├── favicon.ico
├── index.html
├── js/
│   ├── admin.js
│   ├── app.js
│   ├── firebase.js
│   ├── products.js
│   └── storage.js
├── package.json
└── README.md
```

## 🏃 Local Preview

There is no build step in this repo.

You can open the HTML files directly in the browser, or use a simple local server:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## 🚚 Deployment Notes

Since this is a static website, it can be hosted on:

- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages
- Any static host

Before going live, make sure:

- The domain points to the correct host
- Firebase config is valid if Firestore/Auth are being used
- Formspree endpoint is active
- Sponsored ad scripts are working as expected

## 📝 Important Files

- [index.html](./index.html) for the storefront and ad placements
- [admin.html](./admin.html) for the product dashboard
- [css/style.css](./css/style.css) for the full visual design
- [js/app.js](./js/app.js) for storefront behavior
- [js/admin.js](./js/admin.js) for admin behavior
- [js/storage.js](./js/storage.js) for persistence and theme storage
- [js/firebase.js](./js/firebase.js) for Firebase integration

## 🧾 Practical Summary

SahaPicks is a clean, fast, and mobile-friendly electronics affiliate storefront with:

- Curated product discovery
- Search, filter, and sort controls
- Quick view browsing
- Theme switching
- Newsletter signup
- Admin-side product management
- Optional Firebase support
- Static hosting compatibility

It is built to be easy to maintain, easy to deploy, and easy for visitors to use.
