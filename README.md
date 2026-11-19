# TESDA NEXUS – Front end

React (Vite) app for TESDA NEXUS. It replaces the PHP views that used to live in
`Back-End/app/views`. The LavaLust backend now only serves JSON under `/api/app/*`
(see `Back-End/app/config/routes.php`).

## Run it

1. Start the backend (Laragon Apache + MySQL).
2. Copy `.env.example` to `.env` and set `VITE_BACKEND_URL` to the URL of
   `Back-End/public` (default: `http://localhost/TesdaNexus/Back-End/public`).
3. `npm install`, then `npm run dev` and open http://localhost:5173.

The Vite dev server forwards every `/api` request to the backend, so the browser
talks to a single origin and the LavaLust session cookie handles login.

## Production

`npm run build` writes static files to `dist/`. Serve them from the same host as the
backend, with `/api` routed to `Back-End/public/index.php` and every other path
falling back to `dist/index.html` (client-side routing).

## Layout

```
src/
  assets/        images, logos, icons, fonts (imported by components and CSS)
  components/
    common/      Button, Input, Modal, SearchBar, DataTable, StatusBadge, LoadingSpinner, ...
    layout/      PublicLayout, AdminLayout, LearningCenterLayout, StudentLayout,
                 InstructorLayout, DeliveryLayout, RoleLayout (picks one by role), AppShell
    navigation/  Navbar (public), Sidebar, PageHeader
    documents/   archive document card and the archive chat assistant
  pages/         public, auth, admin, learning-center, instructor, student, delivery,
                 courses (course details, shared by every role)
  services/      api.js (HTTP client) and one service per area
  hooks/         useAuth, useFetch, useFlash, usePageTitle, useBasePath
  context/       AuthContext (signed-in user from the session)
  routes/        AppRoutes, ProtectedRoute, RoleBasedRoute
  utils/         constants, formatters, validators
  styles/        variables.css (tokens), global.css, responsive.css (breakpoints)
```

Each role has its own URL prefix: `/admin`, `/center`, `/instructor`, `/student`,
`/delivery`. `/dashboard` sends a signed-in user to their own home.

Pages marked "Coming soon" (allowance, inventory requests, requirements, delivery,
password reset) have no backend yet. Their services in `src/services` return a
"not available yet" error until the API exists. The delivery role does not exist
in the backend, so nobody can open `/delivery` yet.
