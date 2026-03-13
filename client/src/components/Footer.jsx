import { Link } from 'react-router-dom';
import './Footer.css';

const FOOTER_GROUPS = [
  {
    title: 'PRODUCTS',
    items: [
      { label: '신발', to: '/browse' },
      { label: '의류', to: '/browse?q=%EC%9D%98%EB%A5%98' },
      { label: '용품', to: '/browse?q=%EC%9A%A9%ED%92%88' },
      { label: '신제품', to: '/browse?q=%EC%8B%A0%EC%A0%9C%ED%92%88' },
      { label: '베스트셀러', to: '/browse' },
    ],
  },
  {
    title: 'SPORTS',
    items: [
      { label: '러닝', to: '/browse?q=%EB%9F%AC%EB%8B%9D' },
      { label: '트레이닝', to: '/browse?q=%ED%8A%B8%EB%A0%88%EC%9D%B4%EB%8B%9D' },
      { label: '아웃도어', to: '/browse?q=%EC%95%84%EC%9B%83%EB%8F%84%EC%96%B4' },
      { label: '축구', to: '/browse?q=%EC%B6%95%EA%B5%AC' },
      { label: '농구', to: '/browse?q=%EB%86%8D%EA%B5%AC' },
    ],
  },
  {
    title: 'COLLECTIONS',
    items: [
      { label: 'New Arrivals', to: '/browse' },
      { label: 'Trending Now', to: '/browse' },
      { label: 'Men', to: '/browse?gender=male' },
      { label: 'Women', to: '/browse?gender=female' },
      { label: 'Unisex', to: '/browse?gender=unisex' },
    ],
  },
  {
    title: 'COMPANY INFO',
    items: [
      { label: '회사 소개' },
      { label: '채용 정보' },
      { label: '이용약관' },
      { label: '개인정보처리방침' },
      { label: '브랜드 스토리' },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      { label: '고객센터' },
      { label: '배송 안내' },
      { label: '반품 & 환불' },
      { label: '주문 조회', to: '/orders' },
      { label: '자주 묻는 질문' },
    ],
  },
];

const FOLLOW_LINKS = [
  { label: 'Facebook', short: 'f', href: 'https://www.facebook.com/' },
  { label: 'Instagram', short: 'IG', href: 'https://www.instagram.com/' },
  { label: 'X', short: 'X', href: 'https://x.com/' },
  { label: 'TikTok', short: 'TT', href: 'https://www.tiktok.com/' },
  { label: 'YouTube', short: 'YT', href: 'https://www.youtube.com/' },
];

const POLICY_LINKS = [
  '쿠키 설정',
  '구매 이용약관',
  '개인정보처리방침',
  '위치 기반 서비스 이용약관',
  '사업자정보확인',
];

function FooterItem({ item }) {
  if (item.to) {
    return (
      <Link to={item.to} className="site-footer-link">
        {item.label}
      </Link>
    );
  }

  if (item.href) {
    return (
      <a
        href={item.href}
        className="site-footer-link"
        target="_blank"
        rel="noreferrer"
      >
        {item.label}
      </a>
    );
  }

  return <span className="site-footer-text">{item.label}</span>;
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          {FOOTER_GROUPS.map((group) => (
            <section key={group.title} className="site-footer-group">
              <h2 className="site-footer-title">{group.title}</h2>
              <div className="site-footer-links">
                {group.items.map((item) => (
                  <FooterItem key={item.label} item={item} />
                ))}
              </div>
            </section>
          ))}

          <section className="site-footer-group site-footer-follow">
            <h2 className="site-footer-title">FOLLOW US</h2>
            <div className="site-footer-socials">
              {FOLLOW_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="site-footer-social"
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  title={item.label}
                >
                  <span aria-hidden="true">{item.short}</span>
                </a>
              ))}
            </div>
          </section>
        </div>

        <div className="site-footer-meta">
          <p className="site-footer-company">
            VIBE SHOP | 프리미엄 스포츠 슈즈와 스트리트웨어를 큐레이션하는 온라인 셀렉트 스토어
          </p>
          <p className="site-footer-company-sub">
            운영시간 10:00 - 18:00 | 고객 문의는 주문 내역 또는 로그인 후 고객센터를 이용해 주세요.
          </p>
        </div>

        <div className="site-footer-bottom">
          <div className="site-footer-policy-links">
            {POLICY_LINKS.map((label) => (
              <span key={label} className="site-footer-policy-link">
                {label}
              </span>
            ))}
          </div>
          <p className="site-footer-copyright">
            © 2026 VIBE SHOP. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
