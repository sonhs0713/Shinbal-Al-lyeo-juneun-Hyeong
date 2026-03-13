import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import '../MainPage.css';
import '../AdminPage.css';
import '../AdminProductRegisterPage.css';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;

export default function AdminProductEditPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    sku: '',
    product_id: '',
    price: '',
    category: '',
    shoe_size: '',
    color: '',
    gender: '',
    brand: '',
    description: '',
  });
  const [images, setImages] = useState([]);
  const widgetRef = useRef(null);

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
    if (!user || !productId) return;
    const token = localStorage.getItem('token');
    fetch(`/api/products/${encodeURIComponent(productId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          navigate('/admin/products', { replace: true });
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setForm({
          sku: data.sku || '',
          product_id: data.product_id || '',
          price: data.price ?? '',
          category: data.category || '',
          shoe_size: Array.isArray(data.shoe_size) && data.shoe_size.length > 0 ? data.shoe_size.join(', ') : '220, 230, 240, 250, 260, 270, 280, 290',
          color: data.color || '',
          gender: data.gender || '',
          brand: data.brand || '',
          description: data.description || '',
        });
        setImages(Array.isArray(data.image) ? data.image : []);
      })
      .catch(() => navigate('/admin/products', { replace: true }))
      .finally(() => setProductLoading(false));
  }, [user, productId, navigate]);

  useEffect(() => {
    const scriptId = 'cloudinary-widget-script-edit';
    const initWidget = () => {
      if (widgetRef.current || !window.cloudinary) return;
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) return;
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          apiKey: CLOUDINARY_API_KEY,
          multiple: true,
        },
        (err, result) => {
          if (!err && result && result.event === 'success') {
            setImages((prev) => [...prev, result.info.secure_url]);
          }
        }
      );
    };
    if (window.cloudinary) {
      initWidget();
      return;
    }
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
      script.async = true;
      script.onload = initWidget;
      document.body.appendChild(script);
    }
  }, []);

  const handleOpenImageWidget = useCallback(() => {
    setError('');
    setSuccessMessage('');
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_API_KEY) {
      setError('Cloudinary 설정을 확인해 주세요.');
      return;
    }
    if (widgetRef.current) widgetRef.current.open();
    else setError('이미지 업로더를 준비 중입니다.');
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMessage('');
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setSuccessMessage('');
      setSubmitLoading(true);
      try {
        const token = localStorage.getItem('token');
        const body = {
          sku: form.sku.trim(),
          product_id: form.product_id.trim(),
          price: Number(form.price),
          category: form.category.trim(),
          brand: form.brand.trim(),
          description: form.description.trim(),
        };
        if (images.length > 0) body.image = images;
        if (form.shoe_size.trim()) {
          body.shoe_size = form.shoe_size
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => !Number.isNaN(n));
        }
        if (form.color.trim()) body.color = form.color.trim();
        if (form.gender) body.gender = form.gender;

        const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.message || '상품 수정에 실패했습니다.');
          return;
        }
        setSuccessMessage('상품 수정에 성공했습니다.');
      } catch (err) {
        setError('상품 수정에 실패했습니다.');
      } finally {
        setSubmitLoading(false);
      }
    },
    [form, images, productId]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }, [navigate]);

  if (loading || productLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">확인 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="admin-body admin-product-register">
        <header className="admin-header">
          <h1 className="admin-title">상품 수정</h1>
          <p className="admin-desc">상품 정보를 수정합니다.</p>
        </header>

        <form className="admin-product-form" onSubmit={handleSubmit}>
          {error && <p className="admin-product-error">{error}</p>}
          {successMessage && <p className="admin-product-success">{successMessage}</p>}
          <div className="admin-form-row">
            <label>
              <span>SKU *</span>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              <span>상품 ID *</span>
              <input
                type="text"
                name="product_id"
                value={form.product_id}
                onChange={handleChange}
                required
              />
            </label>
          </div>
          <div className="admin-form-row">
            <label>
              <span>가격 *</span>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min="0"
                required
              />
            </label>
            <label>
              <span>카테고리 *</span>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              />
            </label>
          </div>
          <div className="admin-form-row">
            <label>
              <span>브랜드 *</span>
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              <span>색상</span>
              <input
                type="text"
                name="color"
                value={form.color}
                onChange={handleChange}
              />
            </label>
          </div>
          <div className="admin-form-row">
            <label>
              <span>성별</span>
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">선택</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="unisex">공용</option>
              </select>
            </label>
            <label>
              <span>신발 치수 (쉼표로 구분)</span>
              <input
                type="text"
                name="shoe_size"
                value={form.shoe_size}
                onChange={handleChange}
                placeholder="220, 230, 240, 250, 260, 270, 280, 290"
              />
            </label>
          </div>
          <div className="admin-form-row admin-form-full">
            <label>
              <span>이미지 (Cloudinary)</span>
              <div className="admin-image-upload">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenImageWidget}
                >
                  이미지 추가
                </button>
                {images.length > 0 && (
                  <div className="admin-image-preview-list">
                    {images.map((url) => (
                      <div key={url} className="admin-image-preview-wrap">
                        <img src={url} alt="" className="admin-image-preview" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </label>
          </div>
          <div className="admin-form-row admin-form-full">
            <label>
              <span>설명</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </label>
          </div>
          <div className="admin-actions">
            <button type="submit" className="btn btn-primary" disabled={submitLoading}>
              {submitLoading ? '수정 중...' : '수정하기'}
            </button>
            <Link to="/admin/products" className="btn btn-outline">
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
