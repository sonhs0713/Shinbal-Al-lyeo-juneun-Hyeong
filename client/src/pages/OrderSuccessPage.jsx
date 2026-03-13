import { Link, useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import './MainPage.css';
import './CartPage.css';

export default function OrderSuccessPage() {
  const location = useLocation();
  const order = location.state?.order;
  const status = location.state?.status || 'success';
  const errorMessage = location.state?.message || '';
  const retryState = location.state?.retryState;
  const isSuccess = status === 'success';

  const formatPrice = (n) => {
    if (n == null || Number.isNaN(n)) return '-';
    return new Intl.NumberFormat('ko-KR').format(n);
  };

  const items = order?.items || [];

  return (
    <div className="main-page">
      <div className="cart-page order-result-page">
        <div className="order-result-card">
          <span className={`order-result-badge ${isSuccess ? 'is-success' : 'is-failed'}`}>
            {isSuccess ? 'ORDER COMPLETE' : 'ORDER FAILED'}
          </span>
          <h1 className="cart-title order-result-title">
            {isSuccess ? '주문이 완료되었습니다.' : '주문에 실패했습니다.'}
          </h1>
          <p className="order-result-message">
            {isSuccess
              ? (order?.order_number
                  ? `주문번호: ${order.order_number}`
                  : '주문 정보가 정상적으로 접수되었습니다.')
              : (errorMessage || '결제 또는 주문 처리 중 문제가 발생했습니다.')}
          </p>
          {isSuccess && (
            <div className="order-result-meta">
              <div className="order-result-meta-row">
                <span>주문번호</span>
                <strong>{order?.order_number || '-'}</strong>
              </div>
              <div className="order-result-meta-row">
                <span>결제금액</span>
                <strong>{formatPrice(order?.pricing?.final_total)}원</strong>
              </div>
            </div>
          )}

          {isSuccess && items.length > 0 && (
            <div className="order-result-products">
              <h2 className="order-result-products-title">구매한 상품</h2>
              <ul className="order-result-product-list">
                {items.map((item, index) => {
                  const optionParts = [];
                  if (item.selected_size) optionParts.push(`사이즈 ${item.selected_size}`);
                  if (item.selected_color) optionParts.push(`색상 ${item.selected_color}`);
                  optionParts.push(`수량 ${item.quantity || 1}개`);

                  return (
                    <li
                      key={`${item.product_id || item.sku || 'item'}-${index}`}
                      className="order-result-product-item"
                    >
                      <div className="order-result-product-image">
                        {item.image ? (
                          <img src={item.image} alt={item.product_id || item.sku || '주문 상품'} />
                        ) : (
                          <span className="cart-item-no-image">No Image</span>
                        )}
                      </div>
                      <div className="order-result-product-info">
                        <strong className="order-result-product-name">
                          {(item.product_id || item.sku || '주문 상품').toUpperCase()}
                        </strong>
                        <p className="order-result-product-brand">{item.brand || '-'}</p>
                        <p className="order-result-product-option">
                          {optionParts.join(' · ')}
                        </p>
                      </div>
                      <div className="order-result-product-price">
                        {formatPrice(item.line_total ?? (item.unit_price || 0) * (item.quantity || 1))}원
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="cart-actions order-result-actions">
            {isSuccess ? (
              <>
                <Link to="/" className="btn btn-primary">쇼핑 계속하기</Link>
                <Link to="/orders" className="btn btn-outline">주문 목록 보기</Link>
                <Link to="/cart" className="btn btn-outline">장바구니 보기</Link>
              </>
            ) : (
              <>
                <Link
                  to="/order"
                  state={retryState}
                  className="btn btn-primary"
                >
                  주문 페이지로 돌아가기
                </Link>
                <Link to="/cart" className="btn btn-outline">장바구니 보기</Link>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
