import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './ResetPasswordPage.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [form, setForm] = useState({
    newPassword: '',
    newPasswordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setError('토큰이 필요합니다.');
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('토큰이 필요합니다.');
      return;
    }

    if (form.newPassword !== form.newPasswordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: form.newPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.message || '비밀번호 변경에 실패했습니다.';
        setError(msg);
        return;
      }

      setSuccess('비밀번호가 변경되었습니다. 로그인해 주세요.');
      setTimeout(() => {
        navigate('/login', { state: { resetSuccess: true } });
      }, 1200);
    } catch (err) {
      setError('네트워크 오류입니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <header className="reset-header">
        <Link to="/" className="reset-logo">
          VELO
        </Link>
        <nav className="reset-nav">
          <Link to="/login">LOGIN</Link>
          <Link to="/signup">SIGN UP</Link>
        </nav>
      </header>

      <main className="reset-main">
        <div className="reset-tag">RESET</div>
        <h1 className="reset-title">
          비밀번호 재설정
          <span className="reset-title-accent">.</span>
        </h1>
        <p className="reset-desc">새 비밀번호를 입력해 주세요.</p>

        <form className="reset-form" onSubmit={handleSubmit}>
          {error && <p className="reset-error">{error}</p>}
          {success && <p className="reset-success">{success}</p>}

          <label className="reset-label">
            <span>새 비밀번호</span>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <label className="reset-label">
            <span>새 비밀번호 확인</span>
            <input
              type="password"
              name="newPasswordConfirm"
              value={form.newPasswordConfirm}
              onChange={handleChange}
              placeholder="비밀번호를 한 번 더 입력하세요"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <div className="reset-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '변경 중...' : '변경하기 →'}
            </button>
            <Link to="/login" className="btn btn-outline">
              로그인으로
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

