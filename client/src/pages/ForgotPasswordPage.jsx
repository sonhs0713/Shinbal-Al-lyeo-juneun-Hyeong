import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error
          ? `${data.message}: ${data.error}`
          : (data.message || '요청 처리에 실패했습니다.');
        setError(msg);
        return;
      }
      setSuccess(data.message || '요청이 완료되었습니다. 메일함을 확인해 주세요.');
    } catch (err) {
      setError('네트워크 오류입니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <header className="forgot-header">
        <Link to="/" className="forgot-logo">
          VELO
        </Link>
        <nav className="forgot-nav">
          <Link to="/login">LOGIN</Link>
          <Link to="/signup">SIGN UP</Link>
        </nav>
      </header>

      <main className="forgot-main">
        <div className="forgot-tag">RESET</div>
        <h1 className="forgot-title">
          비밀번호 찾기
          <span className="forgot-title-accent">.</span>
        </h1>
        <p className="forgot-desc">
          가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
        </p>

        <form className="forgot-form" onSubmit={handleSubmit}>
          {error && <p className="forgot-error">{error}</p>}
          {success && <p className="forgot-success">{success}</p>}
          <label className="forgot-label">
            <span>이메일</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              autoComplete="email"
            />
          </label>

          <div className="forgot-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '전송 중...' : '확인 →'}
            </button>
            <Link to="/login" className="btn btn-outline">
              돌아가기
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

