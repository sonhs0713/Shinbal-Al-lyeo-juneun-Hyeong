import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const GENDER_LABELS = {
  male: 'Men',
  female: 'Women',
  unisex: 'Unisex',
};

function buildBrowseMenus(products) {
  const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const latestProducts = [...products]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 6);

  const genderMenus = ['male', 'female', 'unisex'].map((genderKey) => {
    const scopedProducts = products.filter((product) => product.gender === genderKey);
    return {
      key: genderKey,
      label: GENDER_LABELS[genderKey],
      viewAll: { gender: genderKey },
      sections: [
        {
          title: '유형',
          items: uniqueSorted(scopedProducts.map((product) => product.category)).map((category) => ({
            label: category,
            filters: { gender: genderKey, category },
          })),
        },
        {
          title: '브랜드',
          items: uniqueSorted(scopedProducts.map((product) => product.brand)).map((brand) => ({
            label: brand,
            filters: { gender: genderKey, brand },
          })),
        },
        {
          title: '추천 상품',
          items: latestProducts
            .filter((product) => product.gender === genderKey)
            .slice(0, 6)
            .map((product) => ({
              label: product.product_id || product.sku || '상품',
              productId: product.product_id || '',
              filters: { gender: genderKey, q: product.product_id || product.sku || '' },
            })),
        },
      ].filter((section) => section.items.length > 0),
    };
  });

  return [
    {
      key: 'all',
      label: 'New',
      viewAll: {},
      sections: [
        {
          title: '최신 상품',
          items: latestProducts.map((product) => ({
            label: product.product_id || product.sku || '상품',
            productId: product.product_id || '',
            filters: { q: product.product_id || product.sku || '' },
          })),
        },
        {
          title: '카테고리',
          items: uniqueSorted(products.map((product) => product.category)).map((category) => ({
            label: category,
            filters: { category },
          })),
        },
        {
          title: '브랜드',
          items: uniqueSorted(products.map((product) => product.brand)).map((brand) => ({
            label: brand,
            filters: { brand },
          })),
        },
      ].filter((section) => section.items.length > 0),
    },
    ...genderMenus.filter((menu) => menu.sections.length > 0),
    {
      key: 'brand',
      label: 'Brands',
      viewAll: {},
      sections: [
        {
          title: '브랜드별 보기',
          items: uniqueSorted(products.map((product) => product.brand)).map((brand) => ({
            label: brand,
            filters: { brand },
          })),
        },
      ],
    },
  ];
}

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const browseRef = useRef(null);
  const browseCloseTimeoutRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [activeBrowseTab, setActiveBrowseTab] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [browseProducts, setBrowseProducts] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);

  const fetchCartTotal = useCallback(() => {
    if (!user) {
      setCartTotal(0);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/carts', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCartTotal(data?.totalQuantity ?? 0))
      .catch(() => setCartTotal(0));
  }, [user]);

  useEffect(() => {
    fetchCartTotal();
  }, [fetchCartTotal]);

  useEffect(() => {
    fetch('/api/products?limit=100')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setBrowseProducts(Array.isArray(data?.products) ? data.products : []))
      .catch(() => setBrowseProducts([]));
  }, []);

  useEffect(() => {
    const onCartUpdate = () => fetchCartTotal();
    window.addEventListener('cartUpdated', onCartUpdate);
    return () => window.removeEventListener('cartUpdated', onCartUpdate);
  }, [fetchCartTotal]);

  const displayName = useMemo(
    () => (user ? (user.email?.split('@')[0] || user.user_id) : ''),
    [user]
  );
  const isAdmin = useMemo(() => user?.user_type === 'admin', [user]);
  const browseMenus = useMemo(() => buildBrowseMenus(browseProducts), [browseProducts]);
  const activeMenu = useMemo(
    () => browseMenus.find((menu) => menu.key === activeBrowseTab) || browseMenus[0] || null,
    [activeBrowseTab, browseMenus]
  );

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!browseOpen) return;
    const handleClickOutside = (e) => {
      if (browseRef.current && !browseRef.current.contains(e.target)) {
        setBrowseOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [browseOpen]);

  useEffect(() => () => {
    if (browseCloseTimeoutRef.current) {
      clearTimeout(browseCloseTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchKeyword(params.get('q') || '');
  }, [location.search]);

  const handleToggleDropdown = useCallback(() => {
    setDropdownOpen((prev) => !prev);
  }, []);

  const moveToProductSearch = useCallback((filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      const nextValue = String(value || '').trim();
      if (nextValue) params.set(key, nextValue);
    });

    navigate({
      pathname: '/browse',
      search: params.toString() ? `?${params.toString()}` : '',
    });
    setBrowseOpen(false);
  }, [navigate]);

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    moveToProductSearch({ q: searchKeyword });
  }, [moveToProductSearch, searchKeyword]);

  const handleBrowseItemClick = useCallback((item) => {
    if (item?.productId) {
      navigate(`/products/${encodeURIComponent(item.productId)}`);
      setBrowseOpen(false);
      return;
    }
    moveToProductSearch(item?.filters || {});
  }, [moveToProductSearch, navigate]);

  const handleMenuOpen = useCallback((menuKey) => {
    if (browseCloseTimeoutRef.current) {
      clearTimeout(browseCloseTimeoutRef.current);
      browseCloseTimeoutRef.current = null;
    }
    setActiveBrowseTab(menuKey);
    setBrowseOpen(true);
  }, []);

  const handleBrowseMouseEnter = useCallback(() => {
    if (browseCloseTimeoutRef.current) {
      clearTimeout(browseCloseTimeoutRef.current);
      browseCloseTimeoutRef.current = null;
    }
  }, []);

  const handleBrowseMouseLeave = useCallback(() => {
    if (browseCloseTimeoutRef.current) {
      clearTimeout(browseCloseTimeoutRef.current);
    }
    browseCloseTimeoutRef.current = setTimeout(() => {
      setBrowseOpen(false);
      browseCloseTimeoutRef.current = null;
    }, 220);
  }, []);

  const handleLogoutClick = useCallback(() => {
    setDropdownOpen(false);
    onLogout?.();
  }, [onLogout]);

  return (
    <header className="main-header-shell">
      <div className="main-header">
        <h1 className="main-logo header-logo-left">
          <Link to="/">SHIN AL HYEONG</Link>
        </h1>
        <div
          className="header-center"
          ref={browseRef}
          onMouseEnter={handleBrowseMouseEnter}
          onMouseLeave={handleBrowseMouseLeave}
        >
          <div className="header-browse-tabs">
            {browseMenus.map((menu) => (
              <button
                key={menu.key}
                type="button"
                className={`header-nav-tab ${activeBrowseTab === menu.key ? 'is-active' : ''}`}
                onMouseEnter={() => handleMenuOpen(menu.key)}
                onFocus={() => handleMenuOpen(menu.key)}
                onClick={() => handleMenuOpen(menu.key)}
              >
                {menu.label}
              </button>
            ))}
          </div>
          {browseOpen && activeMenu && (
            <div
              className="header-mega-menu"
              onMouseEnter={handleBrowseMouseEnter}
              onMouseLeave={handleBrowseMouseLeave}
            >
              <div className="header-mega-content">
                <button
                  type="button"
                  className="header-mega-view-all"
                  onClick={() => moveToProductSearch(activeMenu.viewAll)}
                >
                  전체 보기
                </button>
                <div className="header-mega-sections">
                  {activeMenu.sections.map((section) => (
                    <div key={section.title} className="header-mega-section">
                      <h4>{section.title}</h4>
                      <div className="header-mega-links">
                        {section.items.map((item) => (
                          <button
                            key={`${section.title}-${item.label}`}
                            type="button"
                            className="header-mega-link"
                            onClick={() => handleBrowseItemClick(item)}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <nav className="header-right">
          <form className="header-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              className="header-search-input"
              placeholder="제품 유형, 브랜드, 상품명 검색"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </form>
          {isAdmin && (
            <Link to="/admin" className="header-admin-btn">ADMIN</Link>
          )}
          {user ? (
            <>
              <div className="header-user-dropdown" ref={dropdownRef}>
                <button
                  type="button"
                  className="header-profile-btn"
                  onClick={handleToggleDropdown}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  aria-label="프로필 메뉴 열기"
                  title={displayName ? `${displayName} 님` : '프로필'}
                >
                  <span className="header-profile-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
                    </svg>
                  </span>
                </button>
                {dropdownOpen && (
                  <div className="header-dropdown">
                    <Link to="/orders" className="header-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      주문 목록
                    </Link>
                    <button type="button" className="header-dropdown-item" onClick={handleLogoutClick}>
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
              <Link to="/cart" className="header-cart-link" aria-label="장바구니">
                <span className="header-cart-icon">🛒</span>
                {cartTotal > 0 && (
                  <span className="header-cart-badge">{cartTotal > 99 ? '99+' : cartTotal}</span>
                )}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="header-login-btn">로그인</Link>
              <Link to="/cart" className="header-cart-link" aria-label="장바구니">
                <span className="header-cart-icon">🛒</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
