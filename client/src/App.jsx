import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminPage from './pages/admin/AdminPage';
import AdminOrderListPage from './pages/admin/AdminOrderListPage';
import AdminProductListPage from './pages/admin/AdminProductListPage';
import AdminProductRegisterPage from './pages/admin/AdminProductRegisterPage';
import AdminProductEditPage from './pages/admin/AdminProductEditPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductBrowsePage from './pages/ProductBrowsePage';
import CartPage from './pages/CartPage';
import OrderPage from './pages/OrderPage';
import OrderListPage from './pages/OrderListPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/browse" element={<ProductBrowsePage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/orders" element={<OrderListPage />} />
        <Route path="/order/success" element={<OrderSuccessPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/orders" element={<AdminOrderListPage />} />
        <Route path="/admin/products/new" element={<AdminProductRegisterPage />} />
        <Route path="/admin/products/edit/:productId" element={<AdminProductEditPage />} />
        <Route path="/admin/products" element={<AdminProductListPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
