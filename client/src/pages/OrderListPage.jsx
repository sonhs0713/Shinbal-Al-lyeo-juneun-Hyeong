import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './MainPage.css';
import './CartPage.css';

const ORDER_STATUS_LABELS = {
  pending: '주문 접수',
  paid: '주문 완료',
  preparing: '배송 준비 중',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancelled: '주문 취소',
  refunded: '환불 완료',
};

const ORDER_STATUS_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'paid', label: '주문 완료' },
  { key: 'preparing', label: '배송 준비 중' },
  { key: 'shipped', label: '배송 중' },
  { key: 'delivered', label: '배송 완료' },
  { key: 'cancelled', label: '주문 취소' },
  { key: 'refunded', label: '환불 완료' },
];

export default function OrderListPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

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

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }, [navigate]);

  const formatPrice = (n) => {
    if (n == null || Number.isNaN(n)) return '-';
    return new Intl.NumberFormat('ko-KR').format(n);
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  const filteredOrders = orders.filter((order) => (
    selectedStatus === 'all' ? true : order.status === selectedStatus
  ));

  const orderCountsByStatus = orders.reduce((acc, order) => {
    const status = order?.status;
    if (!status) return acc;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  if (!user) {
    return null;
  }

  return (
    <div className="main-page">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="cart-page">
        <h1 className="cart-title">내 주문 목록</h1>
        {!loading && orders.length > 0 && (
          <div className="order-status-filter-row">
            {ORDER_STATUS_FILTERS.map((filter) => (
              (() => {
                const count = filter.key === 'all'
                  ? orders.length
                  : (orderCountsByStatus[filter.key] || 0);
                const label = count > 0 ? `${filter.label} ${count}` : filter.label;

                return (
              <button
                key={filter.key}
                type="button"
                className={`order-status-filter-btn ${selectedStatus === filter.key ? 'is-active' : ''}`}
                onClick={() => setSelectedStatus(filter.key)}
              >
                {label}
              </button>
                );
              })()
            ))}
          </div>
        )}
        {loading ? (
          <p className="cart-muted">불러오는 중...</p>
        ) : orders.length === 0 ? (
          <div className="cart-empty">
            <p>주문 내역이 없습니다.</p>
            <Link to="/" className="btn btn-primary">쇼핑하러 가기</Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="cart-empty">
            <p>선택한 상태의 주문 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="order-result-products">
            <ul className="order-result-product-list">
              {filteredOrders.map((order) => {
                const firstItem = order.items?.[0];
                const productDetailPath = firstItem?.product_id
                  ? `/products/${encodeURIComponent(firstItem.product_id)}`
                  : null;
                const optionParts = [];
                if (firstItem?.selected_size) optionParts.push(`사이즈 ${firstItem.selected_size}`);
                if (firstItem?.selected_color) optionParts.push(`색상 ${firstItem.selected_color}`);
                if (firstItem?.quantity) optionParts.push(`수량 ${firstItem.quantity}개`);

                return (
                  <li key={order._id || order.order_number} className="order-result-product-item">
                    {productDetailPath ? (
                      <Link to={productDetailPath} className="order-result-product-image">
                        {firstItem?.image ? (
                          <img
                            src={firstItem.image}
                            alt={firstItem.product_id || firstItem.sku || '주문 상품'}
                          />
                        ) : (
                          <span className="cart-item-no-image">No Image</span>
                        )}
                      </Link>
                    ) : (
                      <div className="order-result-product-image">
                        {firstItem?.image ? (
                          <img
                            src={firstItem.image}
                            alt={firstItem.product_id || firstItem.sku || '주문 상품'}
                          />
                        ) : (
                          <span className="cart-item-no-image">No Image</span>
                        )}
                      </div>
                    )}
                    {productDetailPath ? (
                      <Link to={productDetailPath} className="order-result-product-main-link">
                        <div className="order-result-product-info">
                          <strong className="order-result-product-name">
                            {order.order_number}
                          </strong>
                          <p className="order-result-product-brand">
                            {firstItem
                              ? `${(firstItem.product_id || firstItem.sku || '주문 상품').toUpperCase()}${order.items?.length > 1 ? ` 외 ${order.items.length - 1}건` : ''}`
                              : '주문 상품 정보 없음'}
                          </p>
                          <p className="order-result-product-option">
                            {optionParts.length > 0 ? optionParts.join(' · ') : `주문일 ${formatDate(order.ordered_at)}`}
                          </p>
                          <p className="order-list-date-text">
                            주문일: {formatDate(order.ordered_at)}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="order-result-product-info">
                        <strong className="order-result-product-name">
                          {order.order_number}
                        </strong>
                        <p className="order-result-product-brand">
                          {firstItem
                            ? `${(firstItem.product_id || firstItem.sku || '주문 상품').toUpperCase()}${order.items?.length > 1 ? ` 외 ${order.items.length - 1}건` : ''}`
                            : '주문 상품 정보 없음'}
                        </p>
                        <p className="order-result-product-option">
                          {optionParts.length > 0 ? optionParts.join(' · ') : `주문일 ${formatDate(order.ordered_at)}`}
                        </p>
                        <p className="order-list-date-text">
                          주문일: {formatDate(order.ordered_at)}
                        </p>
                      </div>
                    )}
                    <div className="order-result-product-price">
                      {formatPrice(order.pricing?.final_total)}원
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
