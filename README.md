# Running the code
Run npm i to install the dependencies.

Run npm run dev to start the development server.

# Kiến trúc hiện tại của project FE

## 1. Mục tiêu của kiến trúc hiện tại

Project frontend hiện tại đang được tổ chức theo hướng:

- Tách rõ phần hiển thị, điều hướng, state dùng chung và dữ liệu mock.
- Giữ `pages` là nơi điều phối nghiệp vụ của từng màn hình.
- Giữ `components` là nơi tái sử dụng UI.
- Giữ `store` là nơi quản lý state dùng chung toàn app bằng React Context.
- Chuẩn bị sẵn `services` để map API thật từ backend vào sau này.

Hiện tại project **chưa dùng Redux**. Thư mục `store` đang chứa các `Context Provider` cho state toàn cục.

## 2. Cấu trúc thư mục hiện tại

```text
src/
├─ assets/
│  ├─ styles/               # CSS global, theme, tailwind source
│  └─ ...images             # Ảnh tĩnh, import từ Figma, asset khác
│
├─ components/
│  ├─ common/               # Component dùng chung và UI primitives
│  │  ├─ ui/                # shadcn/radix-style UI components
│  │  ├─ figma/             # helper render từ source figma
│  │  ├─ ProtectedRoute.tsx
│  │  └─ StepProgress.tsx
│  │
│  ├─ layout/               # Component bố cục tổng
│  │  ├─ Header.tsx
│  │  ├─ Footer.tsx
│  │  ├─ Logo.tsx
│  │  └─ CartDrawer.tsx
│  │
│  └─ product/              # Component theo domain sản phẩm
│     ├─ ProductCard.tsx
│     └─ FilterSidebar.tsx
│
├─ constants/
│  └─ products.ts           # Mock data sản phẩm, lens pricing, delivery config
│
├─ hooks/
│  └─ use-mobile.ts         # Hook dùng lại
│
├─ layouts/
│  ├─ Layout.tsx            # Layout public
│  └─ DashboardLayout.tsx   # Layout dashboard admin/staff
│
├─ pages/
│  ├─ customer/             # Page phía customer/public storefront
│  ├─ admin/                # Page dành riêng cho admin
│  ├─ staff/                # Page dành riêng cho staff
│  ├─ manager/              # Page nghiệp vụ manager hoặc dùng chung trong dashboard
│  └─ shared/               # Page dùng chung như NotFound
│
├─ routes/
│  └─ index.tsx             # Khai báo router toàn app
│
├─ services/                # Chưa map API thật, để trống cho lớp gọi backend
│
├─ store/
│  ├─ auth/
│  │  └─ AuthContext.tsx
│  ├─ cart/
│  │  ├─ CartContext.tsx
│  │  └─ CartDrawerContext.tsx
│  ├─ providers/
│  │  └─ AppProviders.tsx
│  └─ index.ts
│
├─ types/
│  ├─ product.ts
│  └─ order.ts
│
├─ utils/
│  └─ cn.ts                 # Utility merge className
│
├─ App.tsx
└─ main.tsx
```

## 3. Vai trò của từng layer

### 3.1 `main.tsx`

Điểm khởi động của ứng dụng.

- Mount React app vào DOM.
- Import CSS global từ `src/assets/styles/index.css`.

Flow:

1. Browser load `index.html`
2. Vite chạy `src/main.tsx`
3. `main.tsx` render `<App />`

### 3.2 `App.tsx`

File này là lớp root của React app.

- Gắn `AppProviders`
- Gắn `RouterProvider`
- Gắn `Toaster` cho notification

Nói ngắn gọn:

- `main.tsx` lo boot app
- `App.tsx` lo dựng khung runtime chung

### 3.3 `store/providers/AppProviders.tsx`

Đây là nơi gom tất cả provider toàn app theo thứ tự:

1. `AuthProvider`
2. `CartProvider`
3. `CartDrawerProvider`

Ý nghĩa:

- Bất kỳ page/component nào bên dưới đều có thể dùng `useAuth`, `useCart`, `useCartDrawer`.

### 3.4 `routes/index.tsx`

Là trung tâm điều hướng của app.

File này:

- Khai báo route public
- Khai báo route cần đăng nhập
- Khai báo route cần role cụ thể
- Chọn layout phù hợp theo từng nhóm route

Hiện có 3 nhánh chính:

- Public + user area dùng `Layout`
- Admin dashboard dùng `DashboardLayout`
- Staff dashboard dùng `DashboardLayout`

### 3.5 `layouts/`

Lớp layout chịu trách nhiệm bọc page bằng header/footer/sidebar.

#### `Layout.tsx`

Dùng cho phần public.

- Hiển thị `Header`
- Hiển thị `Footer`
- Render page bằng `<Outlet />`
- Ẩn header/footer ở một số route đặc biệt như login hoặc dashboard

#### `DashboardLayout.tsx`

Dùng cho admin/staff.

- Sidebar trái
- Topbar dashboard
- Footer dashboard
- Điều hướng theo role hiện tại

### 3.6 `pages/`

`pages` là nơi chứa logic của từng màn hình.

Đây là layer gần nghiệp vụ nhất.

Hiện tại `pages` đã được tách theo vai trò để dễ phân biệt:

- `pages/customer`: toàn bộ màn hình customer/public như home, shop, cart, checkout, profile
- `pages/admin`: màn hình chỉ dành cho admin
- `pages/staff`: màn hình chỉ dành cho staff
- `pages/manager`: màn hình nghiệp vụ manager hoặc màn hình được tái sử dụng trong dashboard admin/staff
- `pages/shared`: màn hình dùng chung như `NotFoundPage`

Ví dụ:

- `pages/customer/HomePage.tsx`: lấy dữ liệu từ `constants/products` và render sản phẩm nổi bật
- `pages/customer/ProductListingPage.tsx`: hiển thị danh sách sản phẩm
- `pages/customer/ProductDetailPage.tsx`: lấy `id` từ URL, tìm sản phẩm tương ứng rồi render chi tiết
- `pages/customer/LoginPage.tsx`: gọi `login()` từ `AuthContext`
- `pages/customer/CheckoutPage.tsx`: lấy giỏ hàng từ `CartContext`, tạo form thanh toán, xử lý submit
- `pages/customer/PrescriptionFlow.tsx`: xử lý flow nhập đơn kính

Quy ước nên giữ:

- `page` điều phối nghiệp vụ
- `component` chỉ nhận props và render UI

### 3.7 `components/`

#### `components/common`

Chứa component tái sử dụng nhiều nơi.

- `ProtectedRoute.tsx`: chặn route nếu chưa login hoặc sai role
- `StepProgress.tsx`: progress cho các flow nhiều bước
- `ui/`: thư viện UI chung

#### `components/layout`

Chứa các component bố cục dùng lặp lại.

- `Header`
- `Footer`
- `CartDrawer`
- `Logo`

#### `components/product`

Chứa component thuộc nghiệp vụ sản phẩm.

- `ProductCard`
- `FilterSidebar`

### 3.8 `store/`

Hiện tại `store` là nơi chứa **global state bằng Context**, chưa phải Redux.

#### `store/auth/AuthContext.tsx`

Đang quản lý:

- `user`
- `login`
- `logout`
- `isAuthenticated`

Hiện tại nguồn dữ liệu là `mockUsers` + `localStorage`.

#### `store/cart/CartContext.tsx`

Đang quản lý:

- danh sách item trong giỏ
- thêm item
- xóa item
- đổi số lượng
- clear giỏ
- tính tổng tiền
- đếm số lượng item

Giỏ hàng hiện được persist bằng `localStorage`.

#### `store/cart/CartDrawerContext.tsx`

Quản lý trạng thái mở/đóng cart drawer.

### 3.9 `constants/`

Hiện đang chứa mock data phục vụ UI/demo.

Quan trọng nhất là:

- `constants/products.ts`

Trong file này hiện có:

- `products`
- `lensPricing`
- `deliveryTimeConfig`

Sau khi map API thật, các giá trị này có thể:

- bị thay bằng API response
- hoặc chỉ giữ lại những config thuần frontend

### 3.10 `types/`

Là lớp hợp đồng dữ liệu của app.

Quan trọng:

- `types/product.ts`
- `types/order.ts`

Các file này nên được giữ làm chuẩn domain model cho frontend.

Khi nối API thật, nếu response backend khác format UI cần dùng, nên map từ DTO sang các type này thay vì để page xử lý trực tiếp response thô.

### 3.11 `services/`

Thư mục này hiện đang là chỗ trống để gắn backend vào.

Đây sẽ là nơi:

- gọi API
- map response
- xử lý token header
- chuẩn hóa lỗi mạng

## 4. Flow chạy của app hiện tại

## 4.1 Flow tổng quát

```text
main.tsx
  -> App.tsx
    -> AppProviders
      -> RouterProvider
        -> routes/index.tsx
          -> Layout / DashboardLayout
            -> Page
              -> Components
                -> đọc store / constants / types
```

## 4.2 Flow đăng nhập hiện tại

```text
LoginPage
  -> lấy email/password từ form
  -> gọi useAuth().login(email, password)
  -> AuthContext kiểm tra mockUsers
  -> nếu đúng:
       setUser(...)
       lưu localStorage("auth_user")
  -> LoginPage đọc role và navigate dashboard phù hợp
```

## 4.3 Flow route bảo vệ hiện tại

```text
User truy cập route protected
  -> routes/index.tsx bọc bằng ProtectedRoute
  -> ProtectedRoute đọc useAuth()
  -> nếu chưa login: chuyển sang /login
  -> nếu sai role: chuyển sang dashboard đúng role
  -> nếu hợp lệ: render page
```

## 4.4 Flow sản phẩm hiện tại

```text
Page sản phẩm
  -> import products từ constants/products.ts
  -> transform data nếu cần
  -> truyền vào ProductCard
  -> ProductCard render UI
  -> Add to cart gọi useCart().addItem(...)
```

## 4.5 Flow checkout hiện tại

```text
CheckoutPage
  -> đọc items từ useCart()
  -> người dùng nhập shipping info + payment
  -> submit form
  -> giả lập xử lý bằng setTimeout
  -> clearCart()
  -> navigate sang order tracking
```

## 5. Khi map API vào thì code nên đi như thế nào

## 5.1 Nguyên tắc quan trọng

- Không gọi `fetch` hoặc `axios` rải rác trong quá nhiều page/component con.
- Không để `components` biết chi tiết API endpoint.
- Page hoặc custom hook là nơi điều phối dữ liệu.
- `services` là nơi duy nhất biết endpoint, method, headers, token và format response.
- `types` là hợp đồng dữ liệu frontend muốn dùng.
- Nếu response backend khác format UI, hãy map ở `services`, không map loạn ở page.

## 5.2 Kiến trúc đề xuất khi gắn API

```text
Page / Context / Hook
  -> gọi Service
    -> Service gọi apiClient
      -> Backend API
    -> Service map response DTO -> Frontend type
  -> trả data sạch cho page/context
  -> page render UI
```

## 5.3 Nên thêm những file nào trong `src/services`

Đề xuất:

```text
src/services/
├─ apiClient.ts
├─ authService.ts
├─ productService.ts
├─ orderService.ts
└─ userService.ts
```

### `apiClient.ts`

Chứa phần dùng chung:

- base URL
- headers mặc định
- token attach vào request
- helper parse JSON
- helper chuẩn hóa lỗi

### `authService.ts`

Chứa các hàm:

- `login`
- `logout` nếu cần gọi backend
- `getMe`
- `refreshToken` nếu hệ thống có refresh token

### `productService.ts`

Chứa các hàm:

- `getProducts`
- `getProductById`
- `getFeaturedProducts`
- `getRelatedProducts`

### `orderService.ts`

Chứa các hàm:

- `createOrder`
- `getMyOrders`
- `getOrderById`
- `cancelOrder`

## 5.4 Flow map API cho từng nhóm chính

### A. Auth flow

Hiện tại:

- `AuthContext` dùng `mockUsers`

Khi map API:

```text
LoginPage
  -> useAuth().login(email, password)
  -> AuthContext gọi authService.login(...)
  -> backend trả token + user
  -> AuthContext lưu token/user
  -> ProtectedRoute dùng user hiện tại để check quyền
```

Nên chuyển logic trong `AuthContext` như sau:

- bỏ `mockUsers`
- gọi `authService.login`
- lưu `accessToken`, `refreshToken` nếu có
- gọi `authService.getMe` để lấy profile chuẩn nếu backend tách endpoint

### B. Product listing flow

Hiện tại:

- `HomePage`, `ProductListingPage`, `ProductDetailPage`, `ShopPage` đang đọc `constants/products.ts`

Khi map API:

```text
ProductListingPage
  -> gọi productService.getProducts(query)
  -> service gọi backend
  -> service map response -> Product[]
  -> page setState(data)
  -> page render ProductCard
```

Nên thay theo từng bước:

1. Tạo `productService.ts`
2. Chuyển `products` mock thành fallback hoặc bỏ dần
3. Ở page, thêm `loading`, `error`, `data`
4. Dữ liệu render vẫn giữ format `Product`

### C. Product detail flow

Hiện tại:

- `ProductDetailPage` lấy `id` từ route rồi `find()` trong `constants/products.ts`

Khi map API:

```text
ProductDetailPage
  -> đọc id từ useParams()
  -> gọi productService.getProductById(id)
  -> backend trả detail
  -> service map DTO -> Product
  -> page render
```

### D. Cart flow

Cart hiện tại là state frontend-local, và điều này vẫn hợp lý ngay cả khi đã có API.

Có 2 hướng:

#### Hướng 1: cart local

- vẫn dùng `CartContext`
- chỉ gửi cart sang backend ở bước checkout

Phù hợp nếu:

- app chưa cần đồng bộ giỏ giữa nhiều thiết bị

#### Hướng 2: cart sync server

```text
ProductCard / ProductDetailPage
  -> useCart().addItem(...)
  -> CartContext gọi cartService.addItem(...)
  -> backend lưu cart
  -> đồng bộ state local với server response
```

Nếu chưa bắt buộc, nên đi hướng 1 để ít rủi ro hơn.

### E. Checkout flow

Hiện tại:

- `CheckoutPage` đang giữ form local state và giả lập submit

Khi map API:

```text
CheckoutPage
  -> đọc cart từ useCart()
  -> đọc shipping info + payment method
  -> tạo payload
  -> gọi orderService.createOrder(payload)
  -> backend trả order id
  -> clearCart()
  -> navigate /orders/:orderId
```

Payload đề xuất nên gồm:

- customer info
- shipping address
- payment method
- cart items
- prescription details nếu có

### F. Orders flow

Hiện tại:

- `OrdersPage` đang dùng mock data cứng trong page

Khi map API:

```text
OrdersPage
  -> gọi orderService.getMyOrders()
  -> backend trả danh sách order
  -> page filter/search trên data nhận về
```

## 5.5 Nên đặt phần loading/error ở đâu

Quy ước dễ maintain:

- `services`: throw lỗi chuẩn hóa
- `page`: giữ `loading`, `error`, `data`
- `components`: chỉ render theo props

Ví dụ:

- `ProductListingPage` giữ `loadingProducts`
- `LoginPage` giữ `loading` và `error`
- `CheckoutPage` giữ `isProcessing`

Nếu sau này nhiều page cùng fetch một kiểu dữ liệu, hãy tách sang `hooks/`.

Ví dụ:

- `hooks/useProducts.ts`
- `hooks/useProductDetail.ts`
- `hooks/useOrders.ts`

## 5.6 Nên map response DTO ở đâu

Không nên để page tự xử lý response backend kiểu:

```ts
const data = await fetch(...)
const mapped = data.items.map(...)
```

Nên làm ở `services`:

```ts
export async function getProducts(): Promise<Product[]> {
  const res = await apiClient.get("/products");
  return res.data.map(mapProductDtoToProduct);
}
```

Lợi ích:

- Page gọn
- Thay đổi backend ít ảnh hưởng UI
- Dễ test

## 6. Lộ trình map API an toàn cho project này

## Giai đoạn 1: Tạo service layer

- Tạo `apiClient.ts`
- Tạo `authService.ts`
- Tạo `productService.ts`
- Tạo `orderService.ts`

## Giai đoạn 2: Thay auth mock trước

- Sửa `AuthContext` gọi backend thật
- Giữ nguyên `LoginPage`, `ProtectedRoute`, `Header`, `DashboardLayout`

Đây là bước an toàn vì thay ít file nhưng mở đường cho toàn bộ role flow.

## Giai đoạn 3: Thay product data mock

- `HomePage`
- `ProductListingPage`
- `ProductDetailPage`
- `ShopPage`

Thay nguồn dữ liệu từ `constants/products.ts` sang `productService`

## Giai đoạn 4: Thay orders/checkout

- `CheckoutPage`
- `OrdersPage`
- `OrderTrackingPage`
- `InvoicePage`

## Giai đoạn 5: Tách custom hooks nếu cần

Khi số page gọi API nhiều lên, hãy thêm:

- `useProducts`
- `useProductDetail`
- `useOrders`
- `useProfile`

## 7. Quy ước team nên giữ để code sạch

- Không gọi API trực tiếp trong `components/layout` và `components/product`
- Không để `ProductCard` tự fetch dữ liệu
- Không để `Header` giữ business logic quá nặng
- Không lưu response backend thô vào toàn bộ app nếu chưa map type
- Dùng `types/` làm chuẩn frontend
- Dùng `services/` làm cổng duy nhất đi ra backend
- Dùng `store/` cho state dùng chung
- Dùng `pages/` để orchestration

## 8. Tóm tắt ngắn

Kiến trúc hiện tại đang đi đúng hướng cho một app FE tách lớp:

- `routes` điều hướng
- `layouts` dựng khung màn hình
- `pages` điều phối nghiệp vụ
- `components` render UI tái sử dụng
- `store` giữ global state
- `constants` giữ mock data hiện tại
- `services` là nơi sẽ gắn backend thật
- `types` là hợp đồng dữ liệu của frontend

Khi map API vào, mục tiêu là:

- thay nguồn dữ liệu, không thay UI flow
- dồn logic gọi backend vào `services`
- giữ `pages` là nơi phối hợp dữ liệu và render
- giữ `components` càng “dumb” càng tốt
