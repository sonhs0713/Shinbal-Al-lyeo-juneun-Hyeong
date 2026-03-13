import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import '../MainPage.css';
import '../AdminPage.css';
import '../AdminProductRegisterPage.css';

// TODO: Cloudinary 대시보드에서 값 확인 후 아래 상수 변경
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;

/** 제품끼리 겹치지 않도록 SKU 자동 생성 (접두사 + 타임스탬프 + 랜덤) */
function generateSku() {
  return `VELO-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_SHOE_SIZES = '220, 230, 240, 250, 260, 270, 280, 290';

const INITIAL_FORM = {
  sku: '',
  product_id: '',
  price: '',
  category: '',
  image: '',
  shoe_size: DEFAULT_SHOE_SIZES,
  color: '',
  gender: '',
  brand: '',
  description: '',
};

export default function AdminProductRegisterPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [images, setImages] = useState([]); // Cloudinary로 업로드된 이미지 URL들
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

  // 페이지 로드 후 SKU 자동 생성하여 입력칸에 채움
  useEffect(() => {
    if (!loading) {
      setForm((prev) => (prev.sku ? prev : { ...prev, sku: generateSku() }));
    }
  }, [loading]);

  // Cloudinary 위젯 스크립트 로딩 & 위젯 생성
  useEffect(() => {
    const scriptId = 'cloudinary-widget-script';

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
        (error, result) => {
          if (!error && result && result.event === 'success') {
            const url = result.info.secure_url;
            setImages((prev) => [...prev, url]);
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

  const handleGenerateSku = useCallback(() => {
    setForm((prev) => ({ ...prev, sku: generateSku() }));
  }, []);

  const handleOpenImageWidget = useCallback(() => {
    setError('');
    setSuccessMessage('');
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_API_KEY) {
      setError('Cloudinary 설정(CLOUD_NAME, UPLOAD_PRESET)을 먼저 확인해 주세요.');
      return;
    }
    if (widgetRef.current) {
      widgetRef.current.open();
    } else {
      setError('이미지 업로더를 준비 중입니다. 잠시 후 다시 시도해 주세요.');
    }
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

        // Cloudinary로 업로드한 이미지들 사용
        if (images.length > 0) {
          body.image = images;
        }

        if (form.shoe_size.trim()) {
          body.shoe_size = form.shoe_size
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => !Number.isNaN(n));
        }
        if (form.color.trim()) body.color = form.color.trim();
        if (form.gender) body.gender = form.gender;

        const res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError('제품 등록에 실패했습니다.');
          return;
        }
        setSuccessMessage('제품 등록에 성공했습니다.');
        setForm({ ...INITIAL_FORM, sku: generateSku() });
        setImages([]);
      } catch (err) {
        setError('제품 등록에 실패했습니다.');
      } finally {
        setSubmitLoading(false);
      }
    },
    [form, images]
  );

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
      <div className="admin-body admin-product-register">
        <header className="admin-header">
          <h1 className="admin-title">상품 등록</h1>
          <p className="admin-desc">새 상품을 등록합니다.</p>
        </header>

        <form className="admin-product-form" onSubmit={handleSubmit}>
          {error && <p className="admin-product-error">{error}</p>}
          {successMessage && <p className="admin-product-success">{successMessage}</p>}
          <div className="admin-form-row">
            <label>
              <span>SKU *</span>
              <div className="admin-sku-row">
                <input
                  type="text"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  placeholder="VELO-001"
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline admin-sku-btn"
                  onClick={handleGenerateSku}
                >
                  SKU 자동 생성
                </button>
              </div>
            </label>
            <label>
              <span>상품 ID *</span>
              <input
                type="text"
                name="product_id"
                value={form.product_id}
                onChange={handleChange}
                placeholder="phantom-x-black"
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
                placeholder="189000"
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
                placeholder="런닝화"
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
                placeholder="VELO"
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
                placeholder="블랙"
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

          {/* Cloudinary 이미지 업로드 + 미리보기 */}
          <div className="admin-form-row admin-form-full">
            <label>
              <span>이미지 업로드 (Cloudinary)</span>
              <div className="admin-image-upload">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleOpenImageWidget}
                >
                  이미지 업로드
                </button>
                {images.length > 0 && (
                  <div className="admin-image-preview-list">
                    {images.map((url) => (
                      <div key={url} className="admin-image-preview-wrap">
                        <img
                          src={url}
                          alt="상품 이미지 미리보기"
                          className="admin-image-preview"
                        />
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
                placeholder="상품 설명을 입력하세요"
                rows={4}
              />
            </label>
          </div>
          <div className="admin-actions">
            <button type="submit" className="btn btn-primary" disabled={submitLoading}>
              {submitLoading ? '등록 중...' : '등록하기'}
            </button>
            <Link to="/admin" className="btn btn-outline">
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
