import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import '../MainPage.css';
import '../AdminPage.css';

export default function AdminPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

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
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, [user]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }, [navigate]);

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
          <h1 className="admin-title">관리자</h1>
          <p className="admin-desc">사이트 관리 대시보드입니다.</p>
        </header>

        <section className="admin-section">
          <h2 className="admin-section-title">사용자 관리</h2>
          {usersLoading ? (
            <p className="admin-muted">불러오는 중...</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>아이디</th>
                    <th>이메일</th>
                    <th>유형</th>
                    <th>주소</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="admin-table-empty">
                        등록된 사용자가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.user_id}>
                        <td>{u.user_id}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`admin-badge admin-badge-${u.user_type || 'buyer'}`}>
                            {u.user_type || 'buyer'}
                          </span>
                        </td>
                        <td>{u.address || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="admin-actions">
          <Link to="/admin/orders" className="btn btn-primary">
            주문관리
          </Link>
          <Link to="/admin/products" className="btn btn-primary">
            상품관리
          </Link>
          <Link to="/admin/products/new" className="btn btn-primary">
            새 상품 등록하기
          </Link>
          <Link to="/" className="btn btn-outline">
            메인으로
          </Link>
        </div>
      </div>
    </div>
  );
}
