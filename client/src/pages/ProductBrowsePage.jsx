import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './MainPage.css';

const GENDER_LABELS = {
  male: 'Men',
  female: 'Women',
  unisex: 'Unisex',
};

const FILTER_PARAM_KEYS = ['category', 'gender', 'brand', 'color'];

function parseFilterValues(searchParams, key) {
  return (searchParams.get(key) || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeFilterValues(values) {
  return values.map((value) => value.toLowerCase());
}

function colorNameToHex(name) {
  const n = String(name || '').trim().toLowerCase();
  const colorMap = {
    black: '#171717',
    white: '#f5f5f5',
    grey: '#6b7280',
    gray: '#6b7280',
    red: '#dc2626',
    blue: '#2563eb',
    green: '#22c55e',
    yellow: '#facc15',
    orange: '#f97316',
    purple: '#8b5cf6',
    pink: '#ec4899',
    brown: '#8b5e3c',
    navy: '#1e3a8a',
    beige: '#d6c6a5',
    silver: '#9ca3af',
    gold: '#ca8a04',
    검정: '#171717',
    흰색: '#f5f5f5',
    회색: '#6b7280',
    빨강: '#dc2626',
    파랑: '#2563eb',
    초록: '#22c55e',
    노랑: '#facc15',
    주황: '#f97316',
    보라: '#8b5cf6',
    분홍: '#ec4899',
    갈색: '#8b5e3c',
    네이비: '#1e3a8a',
    베이지: '#d6c6a5',
    실버: '#9ca3af',
    골드: '#ca8a04',
  };

  return colorMap[n] || '#888';
}

export default function ProductBrowsePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

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

  const keywordFilter = (searchParams.get('q') || '').trim().toLowerCase();
  const selectedCategoryValues = useMemo(() => parseFilterValues(searchParams, 'category'), [searchParams]);
  const selectedGenderValues = useMemo(() => parseFilterValues(searchParams, 'gender'), [searchParams]);
  const selectedBrandValues = useMemo(() => parseFilterValues(searchParams, 'brand'), [searchParams]);
  const selectedColorValues = useMemo(() => parseFilterValues(searchParams, 'color'), [searchParams]);

  const normalizedCategoryFilters = useMemo(
    () => normalizeFilterValues(selectedCategoryValues),
    [selectedCategoryValues]
  );
  const normalizedGenderFilters = useMemo(
    () => normalizeFilterValues(selectedGenderValues),
    [selectedGenderValues]
  );
  const normalizedBrandFilters = useMemo(
    () => normalizeFilterValues(selectedBrandValues),
    [selectedBrandValues]
  );
  const normalizedColorFilters = useMemo(
    () => normalizeFilterValues(selectedColorValues),
    [selectedColorValues]
  );

  const filterOptions = useMemo(() => ({
    categories: [...new Set(products.map((product) => String(product.category || '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    genders: ['male', 'female', 'unisex'].filter((gender) => products.some((product) => product.gender === gender)),
    brands: [...new Set(products.map((product) => String(product.brand || '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    colors: [...new Set(products.map((product) => String(product.color || '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
  }), [products]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesKeyword = !keywordFilter || [
      product.product_id,
      product.sku,
      product.brand,
      product.category,
      product.description,
      product.color,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keywordFilter));

    const productCategory = String(product.category || '').toLowerCase();
    const productGender = String(product.gender || '').toLowerCase();
    const productBrand = String(product.brand || '').toLowerCase();
    const productColor = String(product.color || '').toLowerCase();

    const matchesCategory = normalizedCategoryFilters.length === 0
      || normalizedCategoryFilters.includes(productCategory);
    const matchesGender = normalizedGenderFilters.length === 0
      || normalizedGenderFilters.includes(productGender);
    const matchesBrand = normalizedBrandFilters.length === 0
      || normalizedBrandFilters.includes(productBrand);
    const matchesColor = normalizedColorFilters.length === 0
      || normalizedColorFilters.includes(productColor);

    return matchesKeyword && matchesCategory && matchesGender && matchesBrand && matchesColor;
  }), [
    keywordFilter,
    normalizedBrandFilters,
    normalizedCategoryFilters,
    normalizedColorFilters,
    normalizedGenderFilters,
    products,
  ]);

  const hasActiveFilters = Boolean(
    keywordFilter
    || selectedCategoryValues.length > 0
    || selectedGenderValues.length > 0
    || selectedBrandValues.length > 0
    || selectedColorValues.length > 0
  );

  const activeFilterLabel = useMemo(() => {
    const labels = [];
    if (keywordFilter) labels.push(`검색: ${searchParams.get('q')}`);
    if (selectedCategoryValues.length > 0) labels.push(`유형: ${selectedCategoryValues.join(', ')}`);
    if (selectedGenderValues.length > 0) {
      labels.push(`대상: ${selectedGenderValues.map((value) => GENDER_LABELS[value] || value).join(', ')}`);
    }
    if (selectedBrandValues.length > 0) labels.push(`브랜드: ${selectedBrandValues.join(', ')}`);
    if (selectedColorValues.length > 0) labels.push(`색상: ${selectedColorValues.join(', ')}`);
    return labels.join(' · ');
  }, [
    keywordFilter,
    searchParams,
    selectedBrandValues,
    selectedCategoryValues,
    selectedColorValues,
    selectedGenderValues,
  ]);

  const pageTitle = useMemo(() => {
    if (selectedBrandValues.length > 0) return selectedBrandValues.join(' / ').toUpperCase();
    if (selectedCategoryValues.length > 0) return selectedCategoryValues.join(' / ');
    if (selectedGenderValues.length > 0) return selectedGenderValues.map((value) => GENDER_LABELS[value] || value).join(' / ');
    if (keywordFilter) return 'SEARCH RESULTS';
    return 'ALL PRODUCTS';
  }, [keywordFilter, selectedBrandValues, selectedCategoryValues, selectedGenderValues]);

  const handleResetFilters = useCallback(() => {
    navigate('/browse', { replace: false });
  }, [navigate]);

  const updateMultiSelectFilter = useCallback((key, value) => {
    const nextParams = new URLSearchParams(location.search);
    const currentValues = parseFilterValues(nextParams, key);
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    if (nextValues.length === 0) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, nextValues.join(','));
    }

    navigate(`/browse${nextParams.toString() ? `?${nextParams.toString()}` : ''}`, { replace: false });
  }, [location.search, navigate]);

  return (
    <div className="main-page">
      <Navbar user={user} onLogout={handleLogout} />
      <section className="main-products">
        <div className="main-products-header">
          <div>
            <h2 className="main-products-title">{pageTitle}</h2>
            {hasActiveFilters && (
              <p className="main-products-active-filter">{activeFilterLabel}</p>
            )}
          </div>
          {hasActiveFilters && (
            <button type="button" className="btn btn-outline main-products-reset-btn" onClick={handleResetFilters}>
              필터 초기화
            </button>
          )}
        </div>
        <div className="browse-layout">
          <aside className="browse-sidebar">
            <div className="browse-sidebar-header">
              <h3>필터</h3>
              <span>{filteredProducts.length}개 결과</span>
            </div>

            <div className="browse-filter-group">
              <h4>유형</h4>
              <div className="browse-filter-options">
                {filterOptions.categories.map((category) => (
                  <label key={category} className="browse-filter-option">
                    <input
                      type="checkbox"
                      checked={selectedCategoryValues.includes(category)}
                      onChange={() => updateMultiSelectFilter('category', category)}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="browse-filter-group">
              <h4>성별</h4>
              <div className="browse-filter-options">
                {filterOptions.genders.map((gender) => (
                  <label key={gender} className="browse-filter-option">
                    <input
                      type="checkbox"
                      checked={selectedGenderValues.includes(gender)}
                      onChange={() => updateMultiSelectFilter('gender', gender)}
                    />
                    <span>{GENDER_LABELS[gender] || gender}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="browse-filter-group">
              <h4>브랜드</h4>
              <div className="browse-filter-options">
                {filterOptions.brands.map((brand) => (
                  <label key={brand} className="browse-filter-option">
                    <input
                      type="checkbox"
                      checked={selectedBrandValues.includes(brand)}
                      onChange={() => updateMultiSelectFilter('brand', brand)}
                    />
                    <span>{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="browse-filter-group">
              <h4>색상</h4>
              <div className="browse-filter-options">
                {filterOptions.colors.map((color) => (
                  <label key={color} className="browse-filter-option">
                    <input
                      type="checkbox"
                      checked={selectedColorValues.includes(color)}
                      onChange={() => updateMultiSelectFilter('color', color)}
                    />
                    <span className="browse-filter-color">
                      <span
                        className="browse-filter-color-dot"
                        style={{ backgroundColor: colorNameToHex(color) }}
                        aria-hidden="true"
                      />
                      {color}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div className="browse-content">
        {productsLoading ? (
          <p className="main-products-muted">상품을 불러오는 중...</p>
        ) : products.length === 0 ? (
          <p className="main-products-muted">등록된 상품이 없습니다.</p>
        ) : filteredProducts.length === 0 ? (
          <p className="main-products-muted">선택한 조건에 맞는 상품이 없습니다.</p>
        ) : (
          <div className="main-products-grid">
            {filteredProducts.map((p) => {
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
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
