import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './MainPage.css';
import './ProductDetailPage.css';

const IMAGE_ZOOM_SCALE = 2.2;

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [addToCartMessage, setAddToCartMessage] = useState('');
  const [isImageZoomActive, setIsImageZoomActive] = useState(false);
  const [imageZoomPosition, setImageZoomPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => data && setUser(data))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    fetch(`/api/products/${encodeURIComponent(productId)}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data) {
          setProduct(data);
          setSelectedImageIndex(0);
          setSelectedSize(null);
          setSelectedColor(data.color || null);
          setQuantity(1);
        } else if (!notFound) setProduct(null);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }, [navigate]);

  const handleMainImageMouseMove = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setImageZoomPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  }, []);

  const handleMainImageMouseEnter = useCallback(() => {
    setIsImageZoomActive(true);
  }, []);

  const handleMainImageMouseLeave = useCallback(() => {
    setIsImageZoomActive(false);
  }, []);

  const formatPrice = (n) => {
    if (n == null || Number.isNaN(n)) return '-';
    return new Intl.NumberFormat('ko-KR').format(n);
  };

  const colorNameToHex = (name) => {
    if (!name || typeof name !== 'string') return '#888';
    const n = name.trim().toLowerCase();
    const map = {
      빨강: '#dc2626', 빨간: '#dc2626', red: '#dc2626',
      초록: '#22c55e', 녹색: '#22c55e', green: '#22c55e',
      노랑: '#eab308', yellow: '#eab308',
      파랑: '#2563eb', blue: '#2563eb',
      검정: '#171717', black: '#171717',
      화이트: '#f5f5f5', white: '#f5f5f5', 흰색: '#f5f5f5',
      회색: '#737373', gray: '#737373', grey: '#737373',
      베이지: '#d4b896', beige: '#d4b896',
      네이비: '#1e3a5f', navy: '#1e3a5f',
      오렌지: '#ea580c', orange: '#ea580c',
      핑크: '#ec4899', pink: '#ec4899',
      보라: '#7c3aed', purple: '#7c3aed',
    };
    return map[n] || map[name.trim()] || '#888';
  };

  const handleAddToCart = useCallback(() => {
    if (!product?.product_id) return;
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: false });
      return;
    }

    const hasSizeOption = true;
    const hasColorOption = !!(product.color || (Array.isArray(product.colors) && product.colors.length > 0));
    const missing = [];
    if (hasSizeOption && selectedSize == null) missing.push('치수');
    if (hasColorOption && !selectedColor) missing.push('색상');
    if (quantity < 1) missing.push('수량');

    if (missing.length > 0) {
      setAddToCartMessage(`${missing.join(', ')}을(를) 선택해 주세요.`);
      return;
    }

    setAddToCartMessage('');
    setAddToCartLoading(true);
    fetch('/api/carts/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId: product.product_id,
        quantity,
        selected_size: selectedSize ?? undefined,
        selected_color: selectedColor ?? undefined,
      }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data.items !== undefined) {
          setAddToCartMessage('장바구니에 담았습니다.');
          window.dispatchEvent(new Event('cartUpdated'));
        } else {
          setAddToCartMessage(data.message || '장바구니 담기에 실패했습니다.');
        }
      })
      .catch(() => setAddToCartMessage('장바구니 담기에 실패했습니다.'))
      .finally(() => setAddToCartLoading(false));
  }, [product, quantity, selectedSize, selectedColor, navigate]);

  if (loading) {
    return (
      <div className="main-page">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="product-detail product-detail-loading">불러오는 중...</div>
        <Footer />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="main-page">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="product-detail product-detail-empty">
          <p>상품을 찾을 수 없습니다.</p>
          <Link to="/" className="btn btn-outline">메인으로</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = Array.isArray(product.image) && product.image.length > 0 ? product.image : [];
  const shoeSizes = [220, 230, 240, 250, 260, 270, 280, 290];
  const colorOptions = Array.isArray(product.colors) && product.colors.length > 0
    ? product.colors
    : (product.color ? [product.color] : []);
  const selectedImageUrl = images[selectedImageIndex] || '';
  const genderLabel =
    product.gender === 'male' ? '남성' : product.gender === 'female' ? '여성' : product.gender === 'unisex' ? '공용' : null;

  return (
    <div className="main-page">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="product-detail">
        <div className="product-detail-grid">
          <div className="product-detail-images">
            {images.length > 0 ? (
              <>
                <div className="product-detail-thumbnails">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`product-detail-thumbnail ${selectedImageIndex === i ? 'selected' : ''}`}
                      onClick={() => setSelectedImageIndex(i)}
                      aria-label={`이미지 ${i + 1} 보기`}
                    >
                      <img src={url} alt="" />
                    </button>
                  ))}
                </div>
                <div
                  className={`product-detail-main-image-wrap ${isImageZoomActive ? 'is-zoom-active' : ''}`}
                  onMouseEnter={handleMainImageMouseEnter}
                  onMouseMove={handleMainImageMouseMove}
                  onMouseLeave={handleMainImageMouseLeave}
                >
                  <img
                    src={selectedImageUrl}
                    alt=""
                    className="product-detail-main-image"
                  />
                  {isImageZoomActive && selectedImageUrl && (
                    <div
                      className="product-detail-main-image-zoom"
                      aria-hidden="true"
                      style={{
                        backgroundImage: `url("${selectedImageUrl}")`,
                        backgroundPosition: `${imageZoomPosition.x}% ${imageZoomPosition.y}%`,
                        backgroundSize: `${IMAGE_ZOOM_SCALE * 100}%`,
                      }}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="product-detail-no-image">이미지 없음</div>
            )}
          </div>
          <div className="product-detail-info">
            <p className="product-detail-brand">{product.brand || '-'}</p>
            <h1 className="product-detail-title">
              {String(product.product_id || product.sku || '').toUpperCase()}
            </h1>
            <p className="product-detail-price">{formatPrice(product.price)}원</p>
            <div className="product-detail-tags">
              {product.category && (
                <span className="product-detail-tag">{product.category}</span>
              )}
              {genderLabel && (
                <span className="product-detail-tag">{genderLabel}</span>
              )}
              {colorOptions.length > 0 && (
                <span className="product-detail-tag">
                  {selectedColor || colorOptions[0]}
                </span>
              )}
            </div>
            <dl className="product-detail-meta">
              {product.category && (
                <>
                  <dt>카테고리</dt>
                  <dd>{product.category}</dd>
                </>
              )}
              {colorOptions.length > 0 && (
                <>
                  <dt>색상</dt>
                  <dd className="product-detail-color-dd">
                    <div className="product-detail-color-buttons">
                      {colorOptions.map((colorName) => (
                        <button
                          key={colorName}
                          type="button"
                          className={`product-detail-color-btn ${selectedColor === colorName ? 'selected' : ''}`}
                          style={{ backgroundColor: colorNameToHex(colorName) }}
                          onClick={() => setSelectedColor(colorName)}
                          title={colorName}
                          aria-label={`색상 ${colorName}`}
                        />
                      ))}
                    </div>
                  </dd>
                </>
              )}
              {genderLabel && (
                <>
                  <dt>성별</dt>
                  <dd>{genderLabel}</dd>
                </>
              )}
              {shoeSizes.length > 0 && (
                <>
                  <dt>치수</dt>
                  <dd className="product-detail-size-dd">
                    <div className="product-detail-size-buttons">
                      {shoeSizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`product-detail-size-btn ${selectedSize === size ? 'selected' : ''}`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </dd>
                </>
              )}
            </dl>
            <div className="product-detail-desc">
              {product.description?.trim() ||
                '프리미엄 소재로 제작된 러닝화입니다. 가벼운 착용감과 뛰어난 쿠셔닝으로 장시간 운동에 최적화되었습니다. 편안한 착용감을 선사합니다.'}
            </div>
            <div className="product-detail-quantity">
              <span className="product-detail-quantity-label">수량</span>
              <div className="product-detail-quantity-controls">
                <button
                  type="button"
                  className="product-detail-quantity-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="수량 감소"
                >
                  −
                </button>
                <span className="product-detail-quantity-value">{quantity}</span>
                <button
                  type="button"
                  className="product-detail-quantity-btn"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  aria-label="수량 증가"
                >
                  +
                </button>
              </div>
            </div>
            <div className="product-detail-total-row">
              <p className="product-detail-total">
                총 금액 <strong>{formatPrice((product.price || 0) * quantity)}원</strong>
              </p>
              <button
                type="button"
                className="btn btn-primary product-detail-add-cart"
                onClick={handleAddToCart}
                disabled={addToCartLoading}
              >
                {addToCartLoading ? '담는 중...' : '장바구니에 담기'}
              </button>
            </div>
            {addToCartMessage && (
              <p className="product-detail-add-cart-message">{addToCartMessage}</p>
            )}
            <div className="product-detail-actions">
              <Link to="/" className="btn btn-outline">목록으로</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
