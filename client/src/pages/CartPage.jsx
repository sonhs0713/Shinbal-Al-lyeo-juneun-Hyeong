import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './MainPage.css';
import './CartPage.css';

export default function CartPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          navigate('/login', { replace: true });
          return;
        }
        setUser(data);
      })
      .catch(() => navigate('/login', { replace: true }));
  }, [navigate]);

  const fetchCart = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/carts', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCart(data || { items: [], totalQuantity: 0 }))
      .catch(() => setCart({ items: [], totalQuantity: 0 }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchCart();
  }, [user, fetchCart]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }, [navigate]);

  const handleRemoveItem = useCallback(
    (itemId) => {
      const token = localStorage.getItem('token');
      if (!token) return;
      fetch(`/api/carts/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.ok && res.json())
        .then((data) => {
          if (data) {
            setCart(data);
            window.dispatchEvent(new Event('cartUpdated'));
          }
        })
        .catch(() => {});
    },
    []
  );

  const handleUpdateQuantity = useCallback(
    (itemId, newQuantity) => {
      const qty = Math.max(1, Math.min(99, Number(newQuantity) || 1));
      const token = localStorage.getItem('token');
      if (!token) return;
      fetch(`/api/carts/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: qty }),
      })
        .then((res) => res.ok && res.json())
        .then((data) => {
          if (data) {
            setCart(data);
            window.dispatchEvent(new Event('cartUpdated'));
          }
        })
        .catch(() => {});
    },
    []
  );

  const handleCheckout = useCallback(() => {
    const items = cart?.items || [];
    const totalAmount = items.reduce(
      (sum, it) => sum + (it.product?.price ?? 0) * (it.quantity || 0),
      0
    );

    navigate('/order', {
      state: {
        items,
        totalAmount,
      },
    });
  }, [cart, navigate]);

  const formatPrice = (n) => {
    if (n == null || Number.isNaN(n)) return '-';
    return new Intl.NumberFormat('ko-KR').format(n);
  };

  if (!user) {
    return null;
  }

  const items = cart?.items || [];
  const totalAmount = items.reduce(
    (sum, it) => sum + (it.product?.price ?? 0) * (it.quantity || 0),
    0
  );

  return (
    <div className="main-page">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="cart-page">
        <h1 className="cart-title">장바구니</h1>
        {loading ? (
          <p className="cart-muted">불러오는 중...</p>
        ) : items.length === 0 ? (
          <div className="cart-empty">
            <p>장바구니가 비어 있습니다.</p>
            <Link to="/" className="btn btn-primary">쇼핑하기</Link>
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {items.map((it) => {
                const thumb = Array.isArray(it.product?.image) && it.product.image[0]
                  ? it.product.image[0]
                  : null;
                const price = it.product?.price ?? 0;
                const qty = it.quantity || 1;
                return (
                  <li key={it._id} className="cart-item">
                    <div className="cart-item-image">
                      {thumb ? (
                        <img src={thumb} alt="" />
                      ) : (
                        <span className="cart-item-no-image">No Image</span>
                      )}
                    </div>
                    <div className="cart-item-info">
                      <Link to={`/products/${it.product?.product_id}`} className="cart-item-name">
                        {(it.product?.product_id || it.product?.sku || '').toUpperCase()}
                      </Link>
                      <p className="cart-item-meta">
                        {it.product?.brand} · {formatPrice(price)}원
                      </p>
                      {it.selected_size && (
                        <span className="cart-item-size">치수: {it.selected_size}</span>
                      )}
                    </div>
                    <div className="cart-item-quantity">
                      <span className="cart-item-quantity-label">수량</span>
                      <div className="cart-item-quantity-controls">
                        <button
                          type="button"
                          className="cart-item-quantity-btn"
                          onClick={() => handleUpdateQuantity(it._id, qty - 1)}
                          aria-label="수량 감소"
                        >
                          −
                        </button>
                        <span className="cart-item-quantity-value">{qty}</span>
                        <button
                          type="button"
                          className="cart-item-quantity-btn"
                          onClick={() => handleUpdateQuantity(it._id, qty + 1)}
                          aria-label="수량 증가"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-right">
                      <span className="cart-item-total">{formatPrice(price * qty)}원</span>
                      <button
                        type="button"
                        className="cart-item-remove"
                        onClick={() => handleRemoveItem(it._id)}
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="cart-summary">
              <p className="cart-summary-total">
                총 결제금액 <strong>{formatPrice(totalAmount)}원</strong>
              </p>
            </div>
            <div className="cart-actions">
              <Link to="/" className="btn btn-outline">쇼핑 계속하기</Link>
              <button type="button" className="btn btn-primary" onClick={handleCheckout}>
                결제하기
              </button>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
