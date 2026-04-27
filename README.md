# FE - Online Eyewear

Frontend của hệ thống Online Eyewear, xây dựng bằng React + Vite.
README này mô tả kiến trúc thực tế đang dùng trong source code và luồng chạy dữ liệu từ giao diện đến backend (và xuống DB thông qua backend).

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## 1. Mục tiêu của kiến trúc hiện tại

Project frontend hiện tại đang được tổ chức theo hướng:

- Tách rõ phần hiển thị, điều hướng, state dùng chung và lớp gọi API.
- Giữ `pages` là nơi điều phối nghiệp vụ của từng màn hình.
- Giữ `components` là nơi tái sử dụng UI.
- Giữ `hooks` là nơi đóng gói logic tương tác theo màn hình/domain.
- Giữ `store` là nơi quản lý state toàn cục bằng Redux Toolkit.
- Dùng thêm Context cho một số concern UI (`AuthProvider`, `CartProvider`, `CartDrawerProvider`).
- Giữ `services` là lớp gọi backend và chuẩn hóa dữ liệu trả về.

Lưu ý quan trọng:

- Project hiện tại **đã dùng Redux Toolkit**, không còn là mô hình “chỉ Context”.
- Thư mục `services` **đã có nhiều API thật** (auth, cart, catalog, orders, payments, admin...).

## 2. Công nghệ chính

- React 18
- Vite
- React Router
- Redux Toolkit + React Redux
- TailwindCSS
- Sonner (toast notification)
- Vitest (test)

## 3. Cấu trúc thư mục hiện tại

```text
src/
|- assets/                    # CSS global, ảnh, static assets
|- components/
|  |- common/                 # Component dùng chung (bao gồm ProtectedRoute, UI primitives)
|  |- layout/                 # Header, Footer, CartDrawer...
|  `- ...
|- constants/                 # Hằng số dùng chung
|- hooks/
|  |- auth/                   # useLoginPage, useRegisterPage...
|  |- cart/
|  |- order/
|  |- admin/
|  |- profile/
|  |- shop/
|  `- ...
|- layouts/                   # Layout public/dashboard
|- pages/
|  |- customer/
|  |- admin/
|  |- staff/
|  |- manager/
|  `- shared/
|- routes/                    # Router toàn app
|- services/                  # API layer + normalize response
|- store/
|  |- app/store.js            # Configure Redux store
|  |- auth/
|  |- cart/
|  |- catalog/
|  |- order/
|  |- admin/
|  |- profile/
|  |- prescription/
|  `- providers/AppProviders.jsx
|- tests/
|- types/
|- utils/
|- App.jsx
`- main.jsx
```

## 4. Vai trò của từng layer

### 4.1 `main.jsx`

Điểm khởi động của ứng dụng.

- Mount React app vào DOM.
- Import CSS global.

Flow:

1. Browser load `index.html`.
2. Vite chạy `src/main.jsx`.
3. `main.jsx` render `<App />`.

### 4.2 `App.jsx`

Là root component của ứng dụng.

- Gắn `AppProviders`.
- Gắn `RouterProvider`.
- Gắn `Toaster`.

Nói ngắn gọn:

- `main.jsx` lo boot app.
- `App.jsx` lo dựng runtime shell cho app.

### 4.3 `store/providers/AppProviders.jsx`

Nơi gom provider toàn app theo thứ tự:

1. Redux `Provider`.
2. `AuthProvider`.
3. `CartProvider`.
4. `CartDrawerProvider`.

Ý nghĩa:

- Toàn bộ page/component bên dưới có thể dùng state Redux + auth/cart context.

### 4.4 `routes/index.jsx`

Trung tâm điều hướng của app.

File này:

- Khai báo route public.
- Khai báo route cần đăng nhập.
- Khai báo route cần role cụ thể.
- Chọn layout phù hợp theo từng nhóm route.

Hiện có 3 nhánh chính:

- Public + customer area dùng `Layout`.
- Admin area dùng `DashboardLayout`.
- Staff area dùng `DashboardLayout`.

### 4.5 `components/common/ProtectedRoute.jsx`

Vai trò:

- Chờ auth state `isReady` trước khi quyết định render.
- Nếu chưa đăng nhập hoặc không có access token, điều hướng về `/login`.
- Nếu có `allowedRoles` mà user không thuộc role hợp lệ, redirect về landing page đúng role.

### 4.6 `layouts/`

Lớp layout chịu trách nhiệm bọc page bằng các phần giao diện khung.

- `Layout`: khung public/customer.
- `DashboardLayout`: khung admin/staff (sidebar/topbar/dashboard shell).

### 4.7 `pages/`

`pages` là layer gần nghiệp vụ nhất của frontend.

- Chứa cấu trúc màn hình.
- Dùng hooks/store/services để xử lý dữ liệu.
- Truyền xuống component con để render UI.

### 4.8 `hooks/`

Custom hooks theo domain/màn hình, ví dụ:

- Auth: `useLoginPage`, `useRegisterPage`.
- Shop: `useProductListingPage`, `useProductDetailPage`.
- Order: `useCheckout`, `useOrdersPage`.
- Admin: `useAdminOrdersPage`, `useAdminInventoryPage`, ...

Mục tiêu:

- Giữ page component gọn.
- Tách logic state/event/fetch khỏi JSX render.

### 4.9 `store/`

Store hiện tại là mô hình “Redux Toolkit làm trục chính”.

Các phần chính:

- `app/store.js`: cấu hình reducers.
- Slices: `auth`, `cart`, `catalog`, `order`, `profile`, `admin`, `prescription`.
- `store.subscribe` để persist auth/cart-view-cache vào localStorage.

Auth startup flow:

- Khi app mở, `AuthProvider` dispatch `initializeAuth`.
- Nếu có token cũ, app gọi `/api/auth/me` để xác thực phiên.

### 4.10 `services/`

Đây là API layer thật của project.

Chức năng:

- Gọi endpoint backend.
- Attach token.
- Xử lý refresh token.
- Chuẩn hóa lỗi.
- Normalize response thành format FE cần dùng.

File quan trọng:

- `apiClient.js`: HTTP wrapper chung.
- `authService.js`, `catalogService.js`, `cartService.js`, `orderService.js`, `paymentService.js`, `adminService.js`, ...

### 4.11 `constants/`, `types/`, `utils/`

- `constants`: hằng số frontend.
- `types`: hợp đồng dữ liệu FE muốn sử dụng.
- `utils`: helper dùng chung.

## 5. Flow chạy của app hiện tại

### 5.1 Flow tổng quát runtime

```text
main.jsx
  -> App.jsx
    -> AppProviders
      -> RouterProvider
        -> route match
          -> Layout / DashboardLayout / ProtectedRoute
            -> Page
              -> Hook
                -> Redux thunk / Service
                  -> API client
                    -> Backend
```

### 5.2 Flow auth (login/register/google)

```text
Login/Register Page
  -> useLoginPage / useRegisterPage
  -> useAuth() actions
  -> dispatch auth thunk (authSlice)
  -> authService gọi /api/auth/*
  -> nhận accessToken + refreshToken + user
  -> lưu store + localStorage
  -> redirect theo role
```

Google login flow:

```text
load Google script
  -> nhận credential từ Google
  -> gọi /api/auth/google-login
  -> backend verify credential
  -> trả session JWT
  -> FE lưu session + redirect
```

### 5.3 Flow refresh token tự động

Trong `apiClient.js`:

1. Request API kèm bearer token.
2. Nếu nhận `401` và endpoint cho phép retry.
3. Gọi `/api/auth/refresh-tokens`.
4. Cập nhật access token mới.
5. Retry request cũ.
6. Nếu refresh fail, clear auth local và phát event `auth:expired`.

### 5.4 Flow catalog

```text
ProductListingPage
  -> useProductListingPage đọc query params
  -> dispatch fetchCatalogProducts/fetchCatalogCategories
  -> catalogService gọi /api/products, /api/categories
  -> normalize response
  -> catalogSlice update state
  -> UI render list/filter/pagination
```

### 5.5 Flow cart

```text
Cart actions (add/update/delete/clear)
  -> cartSlice thunk
  -> cartService gọi /api/carts/*
  -> load lại snapshot giỏ hàng
  -> normalize cart cho UI
  -> update cart state
```

### 5.6 Flow checkout

```text
CheckoutPage/useCheckout
  -> gom item từ cart state
  -> build payload checkout
  -> dispatch checkoutReadyOrder
  -> orderService gọi /api/orders/checkout
  -> nhận kết quả order/payment
  -> update order state
  -> điều hướng success/failure theo payment flow
```

## 6. FE chạy xuống DB như thế nào

FE **không truy cập DB trực tiếp**.

Luồng chuẩn:

```text
React FE
  -> HTTP API (/api/*)
    -> ControllerLayer (BE)
      -> ServiceLayer (business logic)
        -> RepositoryLayer + EF Core
          -> SQL Server
```

Nghĩa là FE chỉ gọi API, còn toàn bộ thao tác DB nằm ở backend.

## 7. Endpoint map FE đang dùng (rút gọn)

- Auth: `/api/auth/*`
- Catalog: `/api/products`, `/api/categories`, `/api/promotions`
- Cart: `/api/carts/*`, `/api/variants/*`
- Order: `/api/orders/*`
- Payment: `/api/payments/*`
- Prescription: `/api/prescriptions/*`, `/api/prescription-images`, `/api/prescription-pricings/*`
- Shipping: `/api/shipping/*`
- Profile/User: `/api/users/*`
- Admin: users/orders/products/variants/inventory/lens-types/policies/reports + `/api/admin/promotions`

## 8. Biến môi trường

Tạo `.env` từ `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5188
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Ghi chú:

- Nếu không set `VITE_API_BASE_URL`, app fallback về `http://localhost:5188`.

## 9. Chạy local

Yêu cầu:

- Node.js 18+ (khuyên dùng Node 20+).
- Backend đang chạy ở `http://localhost:5188`.

Cài dependencies:

```bash
npm i
```

Chạy dev:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run tests:

```bash
npm run test
```

## 10. Quy ước code team nên giữ

- Không gọi `fetch` trực tiếp rải rác trong page/component; gọi qua `services`.
- Async business flow nên đi qua thunk trong `store` khi có shared state.
- `components` giữ thiên về presentation.
- `hooks/pages` giữ logic orchestration.
- Normalize dữ liệu API ở `services` trước khi đẩy vào UI/store.
- Ưu tiên giữ contract dữ liệu ổn định ở frontend để giảm ảnh hưởng khi backend đổi DTO.

## 11. Những lỗi hiểu nhầm thường gặp (đã sửa trong README này)

- Hiểu nhầm 1: “Project chưa dùng Redux”.
  - Thực tế: đã dùng Redux Toolkit làm state trung tâm.
- Hiểu nhầm 2: “services còn trống/chưa map API”.
  - Thực tế: nhiều service đã gọi API thật.
- Hiểu nhầm 3: “Auth chỉ là mock context”.
  - Thực tế: auth dùng API thật + JWT + refresh token.

---

Nếu muốn tách tài liệu cho dễ maintain, có thể chia thêm:

- `README.architecture.md` (kiến trúc + sơ đồ flow chi tiết).
- `README.onboarding.md` (checklist cho dev mới).
- `README.api-mapping.md` (bảng endpoint FE <-> BE).
