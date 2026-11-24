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

Pages marked "Coming soon" (requirements, password reset) have no backend yet. Their
services in `src/services` return a "not available yet" error until the API exists.

## Training management

- **Learning center**: Courses → a course page (Active and upcoming / History tabs) → a batch page
  (trainees, sessions and attendance, activity; edit, extend, suspend, complete, cancel; enroll,
  transfer, remove). Batch history and Student records (document review, print sheets) are in the sidebar.
- **Teacher**: Classrooms, one per assigned batch: Stream, Classwork, People, Grades and Attendance.
- **Student** (`/student`): My training (schedule, progress, attendance), Classrooms, My documents, Profile.
- **Print sheets** open in a new tab under `/print/...` without the portal frame.

Services are in `src/services/trainingService.js`, and shared parts are in `src/components/training/`.
Styles are in `src/styles/training.css`. Run `Back-End/database/training_management.sql` first
(see `Back-End/database/README.md`).

## Inventory requests and deliveries

- **Learning center**: Inventory requests (In progress, Delivery tracking, Drafts and History tabs), a new
  request page where you write or upload the letter, add photos and list items, and a request page where you confirm receipt or report a discrepancy.
- **Main office admin**: Request approvals (approve, disapprove, resolve discrepancies) and Main office staff.
- **Inventory personnel** (`/inventory`): Request processing. Check stock, generate the QR code and print its label.
- **Delivery personnel** (`/delivery`): Delivery management, the QR scanner (camera, with a manual reference
  number when there is no camera) and Delivery history.
- Every portal has a notification bell in the top bar.

The code is in `src/services/requestService.js`, `src/components/requests/` and `src/styles/requests.css`. QR codes
are drawn with `qrcode` and read with `jsqr`. DOCX letters are previewed with `mammoth`.
