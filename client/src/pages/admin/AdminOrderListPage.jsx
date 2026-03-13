import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import '../MainPage.css';
import '../AdminPage.css';

const ORDER_STATUS_LABELS = {
  pending: '주문 접수',
  paid: '주문 완료',
  preparing: '배송 준비 중',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancelled: '주문 취소',
  refunded: '환불 완료',
};

const ORDER_STATUS_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '주문 접수' },
  { key: 'paid', label: '주문 완료' },
  { key: 'preparing', label: '배송 준비 중' },
  { key: 'shipped', label: '배송 중' },
  { key: 'delivered', label: '배송 완료' },
  { key: 'cancelled', label: '주문 취소' },
  { key: 'refunded', label: '환불 완료' },
];

export default function AdminOrderListPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [statusDrafts, setStatusDrafts] = useState({});
  const [savingOrderId, setSavingOrderId] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || data.user_type !== 'admin') {
          navigate('/', { replace: true });
          return;
        }
        setUser(data);
      })
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }, [navigate]);

  const handleStatusDraftChange = (orderId, nextStatus) => {
    setStatusDrafts((prev) => ({
      ...prev,
      [orderId]: nextStatus,
    }));
  };

  const handleStatusUpdate = async (orderId) => {
    const targetOrder = orders.find((order) => order._id === orderId);
    const nextStatus = statusDrafts[orderId] || targetOrder?.status;

    if (!targetOrder || !nextStatus || nextStatus === targetOrder.status) {
      return;
    }

    try {
      setSavingOrderId(orderId);
      setSaveMessage('');
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || data?.message || '주문 상태 수정에 실패했습니다.');
      }

      setOrders((prev) => prev.map((order) => (
        order._id === orderId ? { ...order, ...data } : order
      )));
      setStatusDrafts((prev) => ({
        ...prev,
        [orderId]: data.status,
      }));
      setSaveMessage('주문 상태가 변경되었습니다.');
    } catch (error) {
      setSaveMessage(error.message || '주문 상태 수정에 실패했습니다.');
    } finally {
      setSavingOrderId('');
    }
  };

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
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const filteredOrders = orders.filter((order) => (
    selectedStatus === 'all' ? true : order.status === selectedStatus
  ));

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">확인 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="admin-body">
        <header className="admin-header">
          <h1 className="admin-title">주문 관리</h1>
          <p className="admin-desc">전체 주문 내역을 확인하는 관리자 페이지입니다.</p>
        </header>

        <section className="admin-section">
          <h2 className="admin-section-title">전체 주문 목록</h2>
          {!ordersLoading && orders.length > 0 && (
            <div className="admin-filter-row">
              {ORDER_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`admin-filter-btn ${selectedStatus === option.key ? 'is-active' : ''}`}
                  onClick={() => setSelectedStatus(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {saveMessage ? <p className="admin-muted">{saveMessage}</p> : null}
          {ordersLoading ? (
            <p className="admin-muted">불러오는 중...</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>주문번호</th>
                    <th>주문자</th>
                    <th>대표 상품</th>
                    <th>주문 상태</th>
                    <th>결제금액</th>
                    <th>주문일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="admin-table-empty">
                        {orders.length === 0
                          ? '등록된 주문이 없습니다.'
                          : '선택한 상태의 주문이 없습니다.'}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const firstItem = order.items?.[0];
                      const productSummary = firstItem
                        ? `${(firstItem.product_id || firstItem.sku || '주문 상품').toUpperCase()}${order.items?.length > 1 ? ` 외 ${order.items.length - 1}건` : ''}`
                        : '-';
                      const customerName = order.customer?.name || '-';
                      const customerEmail = order.customer?.email || order.customer?.user_id || '-';

                      return (
                        <tr key={order._id || order.order_number}>
                          <td>{order.order_number}</td>
                          <td>{`${customerName} (${customerEmail})`}</td>
                          <td>{productSummary}</td>
                          <td>
                            <span className="admin-badge admin-badge-buyer">
                              {ORDER_STATUS_LABELS[order.status] || order.status || '-'}
                            </span>
                          </td>
                          <td>{formatPrice(order.pricing?.final_total)}원</td>
                          <td>{formatDate(order.ordered_at)}</td>
                          <td>
                            <div className="admin-order-actions">
                              <select
                                className="admin-order-select"
                                value={statusDrafts[order._id] || order.status || 'pending'}
                                onChange={(event) => handleStatusDraftChange(order._id, event.target.value)}
                                disabled={savingOrderId === order._id}
                              >
                                {ORDER_STATUS_OPTIONS.filter((option) => option.key !== 'all').map((option) => (
                                  <option key={option.key} value={option.key}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="admin-table-btn"
                                onClick={() => handleStatusUpdate(order._id)}
                                disabled={
                                  savingOrderId === order._id
                                  || (statusDrafts[order._id] || order.status) === order.status
                                }
                              >
                                {savingOrderId === order._id ? '저장 중...' : '상태 저장'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="admin-actions">
          <Link to="/admin" className="btn btn-outline">
            관리자 홈
          </Link>
          <Link to="/admin/products" className="btn btn-primary">
            상품관리
          </Link>
        </div>
      </div>
    </div>
  );
}
