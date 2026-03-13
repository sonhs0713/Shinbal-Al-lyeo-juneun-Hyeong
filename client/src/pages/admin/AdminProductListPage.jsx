import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import '../MainPage.css';
import '../AdminPage.css';

export default function AdminProductListPage() {
  const navigate = useNavigate();
  const PAGE_SIZE = 2;
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

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

  const fetchProductsPage = useCallback((pageNum) => {
    const token = localStorage.getItem('token');
    setProductsLoading(true);
    fetch(
      `/api/products?page=${Number(pageNum)}&limit=${PAGE_SIZE}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data.products)) {
          setProducts([]);
          setTotalPages(1);
          setTotal(0);
          return;
        }
        setProducts(data.products);
        setTotalPages(Math.max(1, data.totalPages ?? 1));
        setTotal(data.total ?? 0);
        setPage(data.page ?? pageNum);
      })
      .catch(() => {
        setProducts([]);
        setTotalPages(1);
        setTotal(0);
      })
      .finally(() => setProductsLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchProductsPage(page);
  }, [user, page, fetchProductsPage]);

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

  const handleDelete = useCallback(
    (productId) => {
      if (!window.confirm('이 상품을 삭제하시겠습니까?')) return;
      const token = localStorage.getItem('token');
      fetch(`/api/products/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) fetchProductsPage(page);
        })
        .catch(() => {});
    },
    [page, fetchProductsPage]
  );

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
          <h1 className="admin-title">상품 조회</h1>
          <p className="admin-desc">등록된 상품 목록입니다.</p>
        </header>

        <section className="admin-section">
          <h2 className="admin-section-title">상품 목록</h2>
          {productsLoading ? (
            <p className="admin-muted">불러오는 중...</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>대표 이미지</th>
                    <th>SKU</th>
                    <th>상품 ID</th>
                    <th>가격</th>
                    <th>카테고리</th>
                    <th>브랜드</th>
                    <th>색상</th>
                    <th>성별</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="admin-table-empty">
                        등록된 상품이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const thumbUrl = Array.isArray(p.image) && p.image.length > 0 ? p.image[0] : null;
                      return (
                        <tr key={p.sku}>
                          <td>
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt=""
                                className="admin-product-thumb"
                              />
                            ) : (
                              <span className="admin-product-no-image">없음</span>
                            )}
                          </td>
                          <td>{p.sku}</td>
                          <td>{p.product_id}</td>
                          <td>{formatPrice(p.price)}</td>
                          <td>{p.category || '-'}</td>
                          <td>{p.brand || '-'}</td>
                          <td>{p.color || '-'}</td>
                          <td>
                            {p.gender === 'male'
                              ? '남성'
                              : p.gender === 'female'
                                ? '여성'
                                : p.gender === 'unisex'
                                  ? '공용'
                                  : '-'}
                          </td>
                          <td>
                            <div className="admin-product-actions">
                              <Link
                                to={`/admin/products/edit/${encodeURIComponent(p.product_id)}`}
                                className="btn btn-outline admin-table-btn"
                              >
                                수정
                              </Link>
                              <button
                                type="button"
                                className="btn btn-outline admin-table-btn admin-table-btn-danger"
                                onClick={() => handleDelete(p.product_id)}
                              >
                                삭제
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

          {!productsLoading && total > 0 && (
            <div className="admin-pagination">
              <span className="admin-pagination-info">
                전체 {total}건 · {page} / {totalPages} 페이지
              </span>
              <div className="admin-pagination-btns">
                <button
                  type="button"
                  className="btn btn-outline admin-table-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  이전
                </button>
                <button
                  type="button"
                  className="btn btn-outline admin-table-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </section>

        <div className="admin-actions">
          <Link to="/admin/products/new" className="btn btn-primary">
            새 상품 등록하기
          </Link>
          <Link to="/admin" className="btn btn-outline">
            관리자로
          </Link>
          <Link to="/" className="btn btn-outline">
            메인으로
          </Link>
        </div>
      </div>
    </div>
  );
}
