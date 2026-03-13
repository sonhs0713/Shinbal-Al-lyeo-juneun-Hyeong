import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  // 이미 유효한 토큰이 있으면 메인으로 이동
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCheckingToken(false);
      return;
    }
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) {
          navigate('/', { replace: true });
          return;
        }
        setCheckingToken(false);
      })
      .catch(() => setCheckingToken(false));
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // 로그인 연동: POST /api/users/login (routes/index.js → /users → users.js)
  // 서버 userController.login: body { email, password } → User 모델(email, password_hash)로 검증 후 token·user 반환
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error ? `${data.message}: ${data.error}` : (data.message || '로그인에 실패했습니다.');
        setError(msg);
        return;
      }
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
      navigate('/', { state: { loggedIn: true } });
    } catch (err) {
      setError('네트워크 오류입니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="login-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: 'var(--text-secondary, #666)' }}>확인 중...</p>
      </div>
    );
  }

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/" className="login-logo">
          VELO
        </Link>
        <nav className="login-nav">
          <Link to="/">HOME</Link>
          <Link to="/signup">회원가입</Link>
        </nav>
      </header>

      <main className="login-main">
        <div className="login-tag">SIGN IN</div>
        <h1 className="login-title">
          로그인
          <span className="login-title-accent">.</span>
        </h1>
        <p className="login-desc">
          이메일과 비밀번호를 입력해 주세요.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <p className="login-error">{error}</p>}
          <label className="login-label">
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
          <label className="login-label">
            <span>비밀번호</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>
          <div className="login-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '로그인 중...' : '로그인 →'}
            </button>
            <Link to="/" className="btn btn-outline">
              취소
            </Link>
          </div>
          <p className="login-helper">
            <Link to="/forgot-password">비밀번호 찾기</Link>
          </p>
          <p className="login-footer">
            계정이 없으신가요? <Link to="/signup">회원가입</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
