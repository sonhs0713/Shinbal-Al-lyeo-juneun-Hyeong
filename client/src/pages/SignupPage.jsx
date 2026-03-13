import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignupPage.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    user_id: '',
    email: '',
    password: '',
    passwordConfirm: '',
    user_type: 'buyer',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // 가입하기 버튼 클릭 → POST /api/users/signup → 서버에서 DB 저장
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: form.user_id.trim(),
          email: form.email.trim(),
          password: form.password,
          user_type: form.user_type,
          address: form.address.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error ? `${data.message}: ${data.error}` : (data.message || '회원가입에 실패했습니다.');
        setError(msg);
        return;
      }
      // 저장 성공 시 메인으로 이동
      navigate('/', { state: { signedUp: true } });
    } catch (err) {
      setError('네트워크 오류입니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <header className="signup-header">
        <Link to="/" className="signup-logo">
          VELO
        </Link>
        <nav className="signup-nav">
          <Link to="/">HOME</Link>
        </nav>
      </header>

      <main className="signup-main">
        <div className="signup-tag">JOIN US</div>
        <h1 className="signup-title">
          회원가입
          <span className="signup-title-accent">.</span>
        </h1>
        <p className="signup-desc">
          서비스 이용을 위해 아래 정보를 입력해 주세요.
        </p>

        <form className="signup-form" onSubmit={handleSubmit}>
          {error && <p className="signup-error">{error}</p>}
          <label className="signup-label">
            <span>아이디</span>
            <input
              type="text"
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              placeholder="user_id"
              required
              autoComplete="username"
            />
          </label>
          <label className="signup-label">
            <span>이메일</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@example.com"
              required
              autoComplete="email"
            />
          </label>
          <label className="signup-label">
            <span>비밀번호</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label className="signup-label">
            <span>비밀번호 확인</span>
            <input
              type="password"
              name="passwordConfirm"
              value={form.passwordConfirm}
              onChange={handleChange}
              placeholder="비밀번호를 한 번 더 입력하세요"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <label className="signup-label">
            <span>회원 유형</span>
            <select
              name="user_type"
              value={form.user_type}
              onChange={handleChange}
            >
              <option value="buyer">구매자</option>
              <option value="seller">판매자</option>
            </select>
          </label>
          <label className="signup-label">
            <span>주소</span>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="주소를 입력하세요"
              required
            />
          </label>
          <div className="signup-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '처리 중...' : '가입하기 →'}
            </button>
            <Link to="/" className="btn btn-outline">
              취소
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
