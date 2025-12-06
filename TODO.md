Here’s an optimized, implementation‑ready TODO list for this project.

---

## Phase 0 – Audit & Setup

1. **Project Audit**
   - [ ] Open all key frontend files: `index.html`, `dashboard.html`, `links.html`, `analytics.html`, `login.html`, `signup.html`.
   - [ ] Open all key backend files: `server/app.js`, route files, controllers, models, config, `.env` usage.
   - [ ] Note current routes/endpoints: create link, get links, delete link, analytics, auth, etc.

2. **Local Environment**
   - [ ] Run the project locally.
   - [ ] Open browser dev tools (mobile view, console, network) to see current errors and layout issues.
   - [ ] List all 500/internal server errors with the exact endpoint + payload.

---

## Phase 1 – Backend Stabilization (Fix 500 Errors First)

3. **Fix Core API Endpoints**
   - [ ] Identify handlers for:
     - [ ] Create short link
     - [ ] Get all links (for user / guest)
     - [ ] Delete link
     - [ ] Get analytics
     - [ ] Auth: login, signup
   - [ ] Verify HTTP methods (GET/POST/DELETE/PATCH) match frontend calls.
   - [ ] Ensure request body parsing (JSON/urlencoded) is configured.
   - [ ] Fix DB queries and schema mismatches.
   - [ ] Add try/catch + meaningful error responses for each endpoint.

4. **Error Handling & Logging**
   - [ ] Global error handler middleware (Express or equivalent).
   - [ ] Standardize JSON error format (e.g. `{ success: false, message, details }`).
   - [ ] Log server errors (console or logger) without exposing stack traces to client in production.

---

## Phase 2 – Frontend Layout & Mobile-First Design

5. **Create a Shared Layout System**
   - [ ] Extract common header + navigation structure into a reusable pattern (even if copy-paste per HTML file).
   - [ ] Use `links.html` mobile navigation as design reference.

6. **Implement Mobile Navigation Pattern Across All Pages**
   - [ ] `index.html`: add mobile nav (hamburger / single button that expands to show all nav options).
   - [ ] `dashboard.html`: integrate same mobile nav.
   - [ ] `links.html`: keep existing mobile nav, refine styling if needed.
   - [ ] `analytics.html`: integrate same mobile nav.
   - [ ] Ensure desktop version shows full nav/options as boxes or sidebar.

7. **Responsive CSS (Mobile-First)**
   - [ ] Define base mobile styles: single-column layout, larger tap targets, readable fonts.
   - [ ] Add media queries for tablet and desktop breakpoints.
   - [ ] Test each page on mobile view: no horizontal scroll, elements not overlapping, buttons easily clickable.

---

## Phase 3 – Homepage Behavior & Guest Mode

8. **Transform `index.html` into Proper Home Page**
   - [ ] Main “Shorten your link” section visible on first load (no forced login).
   - [ ] Add clear `Login` & `Sign up` buttons/links in header.

9. **Add “Advanced Options” UI**
   - [ ] Add a button: `Advanced Options`.
   - [ ] When clicked:
     - [ ] Show panel/modal with all advanced link options currently available post-login.
     - [ ] Hide/disable “Custom Domain” option for guests (show message: “Login to use custom domains”).

10. **Guest Data Behavior**
    - [ ] Store guest session data (shortened links + analytics view) in `localStorage` or in-memory state.
    - [ ] On page load:
      - [ ] Load guest links from localStorage (if browser/tab not fully closed).
    - [ ] On browser/tab close:
      - [ ] Ensure UI resets to fresh state on next visit (no session links shown).
    - [ ] Confirm all created links are still stored in DB via API, regardless of guest state.

11. **Logged-In Behavior**
    - [ ] After login:
      - [ ] Fetch user’s full link history from backend.
      - [ ] Merge / sync any existing guest links if required (optional but ideal).
    - [ ] Ensure subsequent link creation is tied to user’s ID on backend.

---

## Phase 4 – Page Roles & Data Separation

12. **Home (`index.html`)**
    - [ ] Focus: Link creation + optional recent links section.
    - [ ] Wire “Shorten link” form to backend create endpoint.
    - [ ] Show small list of latest links (session/user specific).

13. **Links Page (`links.html`)**
    - [ ] Replace blank content with link list UI.
    - [ ] Fetch all relevant links (guest/session or user).
    - [ ] For each link show:
      - [ ] Original URL
      - [ ] Short URL
      - [ ] Click count
      - [ ] Creation date
      - [ ] Status (active/expired)
      - [ ] Actions: copy, open, delete, QR.
    - [ ] Implement pagination or lazy loading if list is long.

14. **Analytics Page**
    - [ ] Remove home-type content.
    - [ ] Fetch analytics data from backend:
      - [ ] Total clicks
      - [ ] Clicks over time
      - [ ] Top performing links
      - [ ] Device/browser distribution (if available).
    - [ ] Use charts (e.g. Chart.js) or clean counters/cards for visualization.

15. **Dashboard Page**
    - [ ] High-level overview:
      - [ ] Total links
      - [ ] Total clicks
      - [ ] Active vs expired
      - [ ] Small charts or summary widgets.
    - [ ] Use same APIs as links + analytics but aggregated.

---

## Phase 5 – Custom Domain Feature (Logged-In Users)

16. **Backend: Custom Domain Model & Routes**
    - [ ] Create `CustomDomain` model (userId, domain, status, verification fields).
    - [ ] Routes:
      - [ ] POST `/custom-domains` – add domain (auth required).
      - [ ] GET `/custom-domains` – list user’s domains.
      - [ ] (Optional) Verification route or flag.

17. **Frontend: Custom Domain Management UI**
    - [ ] In dashboard or a dedicated settings section:
      - [ ] Form to add custom domain.
      - [ ] Table/list of user’s domains with status.
    - [ ] Only show this section if user is logged in.

18. **Domain Selection on Link Creation**
    - [ ] For logged-in users:
      - [ ] Add a domain selector in Advanced Options:
        - [ ] Default: main domain (`abclinkshortner.com`)
        - [ ] Additional: user’s verified custom domains.
      - [ ] Send chosen domain to backend when creating link.
    - [ ] Backend should build short URL with correct domain (main or custom).

---

## Phase 6 – Polish, UX, and Testing

19. **UI/UX Enhancements**
    - [ ] Improve card styles, buttons, hover states, modals.
    - [ ] Ensure consistent color palette and typography across all pages.
    - [ ] Add loading states and error messages for network actions.

20. **Functional Testing**
    - [ ] Test as guest:
      - [ ] Create links, use advanced options, refresh page, close tab, reopen.
    - [ ] Test as logged-in user:
      - [ ] Create links, view them on Links page.
      - [ ] View analytics and dashboard.
      - [ ] Add custom domain and create short links with it.
    - [ ] Test delete, QR, copy, navigation on all pages.

21. **Responsive Testing**
    - [ ] Test on:
      - [ ] Mobile (320–428px)
      - [ ] Tablet (~768px)
      - [ ] Desktop (1024px+)
    - [ ] Check:
      - [ ] Navigation
      - [ ] Link creation
      - [ ] Links list
      - [ ] Analytics charts
      - [ ] Custom domain UI

---

This list is ordered to reduce rework:  
1) Stabilize backend → 2) Fix layout/navigation → 3) Implement correct behaviors → 4) Add advanced features → 5) Polish & test.