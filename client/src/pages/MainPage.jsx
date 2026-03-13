import { useCallback, useEffect, useRef, useState, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './MainPage.css';

const BRAND_MARQUEE_ITEMS = [
  { name: 'NIKE', accent: 'JUST DO IT' },
  { name: 'adidas', accent: 'THREE STRIPES' },
  { name: 'PUMA', accent: 'FOREVER FASTER' },
  { name: 'ASICS', accent: 'SOUND MIND SOUND BODY' },
  { name: 'New Balance', accent: 'RUN YOUR WAY' },
  { name: 'JORDAN', accent: 'FLIGHT' },
  { name: 'SALOMON', accent: 'SPORTSTYLE' },
  { name: 'Reebok', accent: 'CLASSIC' },
];

// 정적 콘텐츠: 토스트/유저 상태와 무관하게 리렌더 방지
const MainHeroContent = memo(function MainHeroContent({ isAuthenticated }) {
  return (
    <main className="main-hero">
      <div className="hero-content">
        <span className="hero-tag">NEW DROP / SS26</span>
        <h2 className="hero-title">
          HYEONG KNOWS
          <br />
          <span className="hero-title-accent">THE BEST.</span>
        </h2>
        <p className="hero-desc">
          Hyeong's choice is the best. Ask anything about shoes!
        </p>
        <div className="hero-actions">
          {!isAuthenticated && (
            <>
              <Link to="/login" className="btn btn-primary">
                로그인 →
              </Link>
              <Link to="/signup" className="btn btn-outline">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="hero-visual" />
    </main>
  );
});

export default function MainPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toastTimeoutRef = useRef(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState(false);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    if (location.state?.loggedIn) {
      setLoginSuccessMessage(true);
      navigate(location.pathname, { replace: true, state: {} });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setLoginSuccessMessage(false);
        toastTimeoutRef.current = null;
      }, 3000);
    }
  }, [location.state?.loggedIn, location.pathname, navigate]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setUser(data))
      .catch(() => setUser(null));
  }, []);

  // 상품 전체 조회 (메인 페이지용, limit 100)
  useEffect(() => {
    setProductsLoading(true);
    fetch('/api/products?limit=100')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      })
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user);

  return (
    <div className="main-page">
      {loginSuccessMessage && (
        <div className="main-toast main-toast-success" role="alert">
          로그인에 성공했습니다.
        </div>
      )}
      <Navbar user={user} onLogout={handleLogout} />
      <section className="main-campaign-banner" aria-label="브랜드 캠페인 배너">
        <img
          src="https://res.cloudinary.com/do9xtbp6g/image/upload/v1773290092/c4797245-ebb0-47ca-b060-78e6331a46eb_f295jt.jpg"
          alt=""
          className="main-campaign-banner-image"
        />
        <div className="main-campaign-banner-overlay">
          <span className="main-campaign-banner-eyebrow">NEW SEASON / PERFORMANCE EDIT</span>
          <h2 className="main-campaign-banner-title">
            Shinbal
            <br />
            Al lyeo juneun
            <br />
            Hyeong
          </h2>
          <p className="main-campaign-banner-desc">
            Bro! Buy some shoes today!
          </p>
        </div>
      </section>
      <section className="brand-marquee" aria-label="브랜드 로고 배너">
        <div className="brand-marquee-fade brand-marquee-fade-left" aria-hidden="true" />
        <div className="brand-marquee-fade brand-marquee-fade-right" aria-hidden="true" />
        <div className="brand-marquee-track">
          {[...BRAND_MARQUEE_ITEMS, ...BRAND_MARQUEE_ITEMS].map((brand, index) => (
            <div className="brand-marquee-item" key={`${brand.name}-${index}`}>
              <span className="brand-marquee-name">{brand.name}</span>
              <span className="brand-marquee-accent">{brand.accent}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="main-products">
        <h2 className="main-products-title">HYEONG'S CHOICE</h2>
        {productsLoading ? (
          <p className="main-products-muted">상품을 불러오는 중...</p>
        ) : products.length === 0 ? (
          <p className="main-products-muted">등록된 상품이 없습니다.</p>
        ) : (
          <div className="main-products-grid">
            {products.map((p) => {
              const thumbUrl = Array.isArray(p.image) && p.image.length > 0 ? p.image[0] : null;
              const priceStr = p.price != null && !Number.isNaN(p.price)
                ? new Intl.NumberFormat('ko-KR').format(p.price) + '원'
                : '';
              return (
                <Link
                  key={p.sku || p.product_id}
                  to={`/products/${encodeURIComponent(p.product_id)}`}
                  className="main-product-card"
                >
                  <div className="main-product-card-image-wrap">
                    {thumbUrl ? (
                      <img src={thumbUrl} alt="" className="main-product-card-image" />
                    ) : (
                      <span className="main-product-card-no-image">No Image</span>
                    )}
                  </div>
                  <div className="main-product-card-body">
                    <span className="main-product-card-brand">{p.brand || '-'}</span>
                    <span className="main-product-card-id">{p.product_id || '-'}</span>
                    {priceStr && <span className="main-product-card-price">{priceStr}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
      <MainHeroContent isAuthenticated={isAuthenticated} />
      <Footer />
    </div>
  );
}
