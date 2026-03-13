import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './MainPage.css';
import './CartPage.css';

const PORTONE_IMP_CODE = 'imp70170832';
const PORTONE_SCRIPT_SRC = 'https://cdn.iamport.kr/v1/iamport.js';
const PORTONE_PG_CONFIG = {
  card: import.meta.env.VITE_PORTONE_PG_CARD || 'html5_inicis.INIpayTest',
  bank_transfer:
    import.meta.env.VITE_PORTONE_PG_BANK_TRANSFER || 'html5_inicis.INIpayTest',
  kakao_pay: import.meta.env.VITE_PORTONE_PG_KAKAO_PAY || '',
  naver_pay: import.meta.env.VITE_PORTONE_PG_NAVER_PAY || '',
};

function getPortOnePaymentRequest({
  paymentMethod,
  totalAmount,
  buyerName,
  buyerTel,
  buyerEmail,
  buyerAddr,
  buyerPostcode,
  productName,
}) {
  const merchantUid = `order_${Date.now()}`;

  const methodConfig = {
    card: {
      pg: PORTONE_PG_CONFIG.card,
      pay_method: 'card',
    },
    bank_transfer: {
      pg: PORTONE_PG_CONFIG.bank_transfer,
      pay_method: 'trans',
    },
    kakao_pay: {
      pg: PORTONE_PG_CONFIG.kakao_pay,
      pay_method: 'card',
    },
    naver_pay: {
      pg: PORTONE_PG_CONFIG.naver_pay,
      pay_method: 'card',
    },
  }[paymentMethod];

  if (!methodConfig?.pg) {
    throw new Error('선택한 결제수단의 포트원 PG 설정이 없습니다.');
  }

  return {
    pg: methodConfig.pg,
    pay_method: methodConfig.pay_method,
    merchant_uid: merchantUid,
    name: productName,
    amount: totalAmount,
    buyer_email: buyerEmail,
    buyer_name: buyerName,
    buyer_tel: buyerTel,
    buyer_addr: buyerAddr,
    buyer_postcode: buyerPostcode,
  };
}

function requestPortOnePayment(requestData) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.IMP) {
      reject(new Error('포트원 결제 모듈을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'));
      return;
    }

    window.IMP.request_pay(requestData, (response) => {
      if (response?.success) {
        resolve(response);
        return;
      }

      reject(new Error(response?.error_msg || '결제가 취소되었거나 실패했습니다.'));
    });
  });
}

function loadPortOneSdk() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('브라우저 환경에서만 결제를 진행할 수 있습니다.'));
      return;
    }

    if (window.IMP) {
      resolve(window.IMP);
      return;
    }

    const existingScript = document.querySelector(`script[src="${PORTONE_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.IMP) resolve(window.IMP);
        else reject(new Error('포트원 결제 모듈 초기화에 실패했습니다.'));
      }, { once: true });
      existingScript.addEventListener('error', () => {
        reject(new Error('포트원 결제 스크립트를 불러오지 못했습니다.'));
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = PORTONE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.IMP) resolve(window.IMP);
      else reject(new Error('포트원 결제 모듈 초기화에 실패했습니다.'));
    };
    script.onerror = () => {
      reject(new Error('포트원 결제 스크립트를 불러오지 못했습니다.'));
    };
    document.head.appendChild(script);
  });
}

function getAccountProfile(user) {
  const emailPrefix = user?.email?.split('@')[0] || '';
  const name =
    user?.name ||
    user?.username ||
    user?.user_name ||
    user?.nickname ||
    user?.user_id ||
    emailPrefix ||
    '';
  const phone = user?.phone || user?.phone_number || user?.tel || user?.mobile || '';
  const address1 = user?.address || '';
  const zipcode = user?.zipcode || user?.postal_code || '';

  return {
    name,
    phone,
    address1,
    zipcode,
  };
}

export default function OrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const retryState = location.state || {};
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    customerName: retryState.form?.customerName || '',
    customerPhone: retryState.form?.customerPhone || '',
    recipientName: retryState.form?.recipientName || '',
    recipientPhone: retryState.form?.recipientPhone || '',
    address1: retryState.form?.address1 || '',
    address2: retryState.form?.address2 || '',
    zipcode: retryState.form?.zipcode || '',
    deliveryMemo: retryState.form?.deliveryMemo || '',
    paymentMethod: retryState.form?.paymentMethod || 'card',
    notes: retryState.form?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [portOneReady, setPortOneReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadPortOneSdk()
      .then((IMP) => {
        IMP.init(PORTONE_IMP_CODE);
        if (mounted) {
          setPortOneReady(true);
        }
      })
      .catch((err) => {
        if (mounted) {
          setPortOneReady(false);
          setErrorMessage(err.message || '포트원 결제 모듈을 불러오지 못했습니다.');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          navigate('/login', { replace: true });
          return;
        }
        const accountProfile = getAccountProfile(data);
        setUser(data);
        setForm((prev) => ({
          ...prev,
          customerName: prev.customerName || accountProfile.name,
          customerPhone: prev.customerPhone || accountProfile.phone,
          address1: prev.address1 || accountProfile.address1,
          zipcode: prev.zipcode || accountProfile.zipcode,
        }));
      })
      .catch(() => navigate('/login', { replace: true }));
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  }, [navigate]);

  const items = retryState.items || [];
  const itemsTotal = items.reduce(
    (sum, it) => sum + (it.product?.price ?? 0) * (it.quantity || 0),
    0
  );
  const shippingFee = 0;
  const discountAmount = 0;
  const totalAmount = itemsTotal + shippingFee - discountAmount;

  const formatPrice = (n) => {
    if (n == null || Number.isNaN(n)) return '-';
    return new Intl.NumberFormat('ko-KR').format(n);
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCopyCustomerToRecipient = useCallback(() => {
    const accountProfile = getAccountProfile(user);

    setForm((prev) => ({
      ...prev,
      recipientName: accountProfile.name,
      recipientPhone: accountProfile.phone,
      address1: accountProfile.address1 || prev.address1,
      zipcode: accountProfile.zipcode || prev.zipcode,
    }));
  }, [user]);

  const handleSubmitOrder = useCallback(async () => {
    if (items.length === 0 || submitting) return;

    const requiredFields = [
      ['customerName', '주문자 이름을 입력해 주세요.'],
      ['customerPhone', '주문자 연락처를 입력해 주세요.'],
      ['recipientName', '수령인 이름을 입력해 주세요.'],
      ['recipientPhone', '수령인 연락처를 입력해 주세요.'],
      ['address1', '배송 주소를 입력해 주세요.'],
      ['zipcode', '우편번호를 입력해 주세요.'],
    ];

    const firstMissing = requiredFields.find(([key]) => !form[key].trim());
    if (firstMissing) {
      setErrorMessage(firstMissing[1]);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const IMP = await loadPortOneSdk();
      IMP.init(PORTONE_IMP_CODE);
      setPortOneReady(true);

      const firstItemName = items[0]?.product?.product_id || items[0]?.product?.sku || '주문 상품';
      const productName =
        items.length > 1 ? `${firstItemName} 외 ${items.length - 1}건` : firstItemName;

      const paymentRequest = getPortOnePaymentRequest({
        paymentMethod: form.paymentMethod,
        totalAmount,
        buyerName: form.customerName.trim(),
        buyerTel: form.customerPhone.trim(),
        buyerEmail: user?.email || '',
        buyerAddr: `${form.address1.trim()} ${form.address2.trim()}`.trim(),
        buyerPostcode: form.zipcode.trim(),
        productName,
      });

      const paymentResult = await requestPortOnePayment(paymentRequest);
      // #region agent log
      console.log('[agent-debug][H11][payment-result-shape]', {
        hasImpUid: Boolean(paymentResult?.imp_uid),
        hasMerchantUid: Boolean(paymentResult?.merchant_uid),
        selectedTransactionSource: paymentResult?.imp_uid ? 'imp_uid' : paymentResult?.merchant_uid ? 'merchant_uid' : 'none',
        impUidPrefix: paymentResult?.imp_uid ? String(paymentResult.imp_uid).slice(0, 6) : '',
        merchantUidPrefix: paymentResult?.merchant_uid ? String(paymentResult.merchant_uid).slice(0, 10) : '',
      });
      // #endregion

      const payload = {
        items: items.map((it) => ({
          product: it.product?._id,
          product_id: it.product?.product_id,
          sku: it.product?.sku,
          brand: it.product?.brand,
          category: it.product?.category,
          image: Array.isArray(it.product?.image) ? it.product.image[0] || '' : '',
          selected_size: it.selected_size,
          selected_color: it.selected_color,
          quantity: it.quantity,
          unit_price: it.product?.price ?? 0,
        })),
        customer: {
          name: form.customerName.trim(),
          phone: form.customerPhone.trim(),
        },
        shipping: {
          recipient_name: form.recipientName.trim(),
          phone: form.recipientPhone.trim(),
          address1: form.address1.trim(),
          address2: form.address2.trim(),
          zipcode: form.zipcode.trim(),
          delivery_memo: form.deliveryMemo.trim(),
        },
        pricing: {
          shipping_fee: shippingFee,
          discount_amount: discountAmount,
        },
        payment: {
          method: form.paymentMethod,
          status: 'paid',
          transaction_id: paymentResult.imp_uid || paymentResult.merchant_uid,
          imp_uid: paymentResult.imp_uid || '',
          merchant_uid: paymentResult.merchant_uid || paymentRequest.merchant_uid,
          approved_at: new Date().toISOString(),
        },
        status: 'paid',
        paid_at: new Date().toISOString(),
        notes: form.notes.trim(),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // #region agent log
        console.log('[agent-debug][H10][order-create-response-not-ok]', {
          status: res.status,
          errorMessage: data?.error || data?.message || null,
          paymentMethod: form.paymentMethod,
          totalAmount,
        });
        // #endregion
        throw new Error(data?.error || data?.message || '주문 생성에 실패했습니다.');
      }

      await fetch('/api/carts', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      window.dispatchEvent(new Event('cartUpdated'));
      navigate('/order/success', {
        replace: true,
        state: {
          status: 'success',
          order: data,
        },
      });
    } catch (err) {
      // #region agent log
      console.log('[agent-debug][H10][handleSubmitOrder-catch]', {
        errorMessage: err.message,
        paymentMethod: form.paymentMethod,
        totalAmount,
      });
      // #endregion
      const message = err.message || '주문 처리 중 오류가 발생했습니다.';
      setErrorMessage(message);
      navigate('/order/success', {
        replace: true,
        state: {
          status: 'failed',
          message,
          retryState: {
            items,
            form,
          },
        },
      });
    } finally {
      setSubmitting(false);
    }
  }, [discountAmount, form, items, navigate, shippingFee, submitting, totalAmount, user]);

  if (!user) {
    return null;
  }

  return (
    <div className="main-page">
      <Navbar user={user} onLogout={handleLogout} />
      <div className="cart-page">
        <h1 className="cart-title">주문하기</h1>
        {items.length === 0 ? (
          <div className="cart-empty">
            <p>주문할 상품이 없습니다.</p>
            <Link to="/cart" className="btn btn-primary">장바구니로 돌아가기</Link>
          </div>
        ) : (
          <>
            <div className="order-panel">
              <h2 className="order-panel-title">결제할 상품</h2>
              <ul className="cart-list">
                {items.map((it) => {
                  const thumb = Array.isArray(it.product?.image) && it.product.image[0]
                    ? it.product.image[0]
                    : null;
                  const price = it.product?.price ?? 0;
                  const qty = it.quantity || 1;

                  return (
                    <li key={it._id} className="cart-item">
                      <div className="cart-item-image">
                        {thumb ? (
                          <img src={thumb} alt="" />
                        ) : (
                          <span className="cart-item-no-image">No Image</span>
                        )}
                      </div>
                      <div className="cart-item-info">
                        <p className="cart-item-name">
                          {(it.product?.product_id || it.product?.sku || '').toUpperCase()}
                        </p>
                        <p className="cart-item-meta">
                          {it.product?.brand} · {formatPrice(price)}원
                        </p>
                        {it.selected_size && (
                          <span className="cart-item-size">치수: {it.selected_size}</span>
                        )}
                      </div>
                      <div className="cart-item-right">
                        <span className="cart-item-total">{formatPrice(price * qty)}원</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="order-layout">
              <section className="order-form-section">
                <div className="order-panel">
                  <h2 className="order-panel-title">주문자 정보</h2>
                  <div className="order-field-grid">
                    <label className="order-field">
                      <span>주문자 이름</span>
                      <input
                        name="customerName"
                        value={form.customerName}
                        onChange={handleChange}
                        placeholder="이름을 입력해 주세요"
                      />
                    </label>
                    <label className="order-field">
                      <span>주문자 연락처</span>
                      <input
                        name="customerPhone"
                        value={form.customerPhone}
                        onChange={handleChange}
                        placeholder="010-0000-0000"
                      />
                    </label>
                  </div>
                  <label className="order-field">
                    <span>이메일</span>
                    <input value={user.email || ''} disabled />
                  </label>
                </div>

                <div className="order-panel">
                  <div className="order-panel-header">
                    <h2 className="order-panel-title">배송 정보</h2>
                    <button
                      type="button"
                      className="order-copy-button"
                      onClick={handleCopyCustomerToRecipient}
                    >
                      주문자와 동일
                    </button>
                  </div>
                  <div className="order-field-grid">
                    <label className="order-field">
                      <span>수령인 이름</span>
                      <input
                        name="recipientName"
                        value={form.recipientName}
                        onChange={handleChange}
                        placeholder="수령인 이름을 입력해 주세요"
                      />
                    </label>
                    <label className="order-field">
                      <span>수령인 연락처</span>
                      <input
                        name="recipientPhone"
                        value={form.recipientPhone}
                        onChange={handleChange}
                        placeholder="010-0000-0000"
                      />
                    </label>
                  </div>
                  <div className="order-field-grid">
                    <label className="order-field">
                      <span>우편번호</span>
                      <input
                        name="zipcode"
                        value={form.zipcode}
                        onChange={handleChange}
                        placeholder="우편번호"
                      />
                    </label>
                    <label className="order-field">
                      <span>기본 주소</span>
                      <input
                        name="address1"
                        value={form.address1}
                        onChange={handleChange}
                        placeholder="기본 주소를 입력해 주세요"
                      />
                    </label>
                  </div>
                  <label className="order-field">
                    <span>상세 주소</span>
                    <input
                      name="address2"
                      value={form.address2}
                      onChange={handleChange}
                      placeholder="상세 주소를 입력해 주세요"
                    />
                  </label>
                  <label className="order-field">
                    <span>배송 메모</span>
                    <textarea
                      name="deliveryMemo"
                      value={form.deliveryMemo}
                      onChange={handleChange}
                      placeholder="부재 시 문 앞에 놓아주세요 등"
                      rows="3"
                    />
                  </label>
                </div>

                <div className="order-panel">
                  <h2 className="order-panel-title">결제 정보</h2>
                  <div className="order-payment-options">
                    <label className="order-radio">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={form.paymentMethod === 'card'}
                        onChange={handleChange}
                      />
                      <span>신용카드</span>
                    </label>
                    <label className="order-radio">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank_transfer"
                        checked={form.paymentMethod === 'bank_transfer'}
                        onChange={handleChange}
                      />
                      <span>무통장입금</span>
                    </label>
                    <label className="order-radio">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="kakao_pay"
                        checked={form.paymentMethod === 'kakao_pay'}
                        onChange={handleChange}
                      />
                      <span>카카오페이</span>
                    </label>
                    <label className="order-radio">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="naver_pay"
                        checked={form.paymentMethod === 'naver_pay'}
                        onChange={handleChange}
                      />
                      <span>네이버페이</span>
                    </label>
                  </div>
                  <label className="order-field">
                    <span>주문 메모</span>
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      placeholder="판매자에게 전달할 메모가 있으면 입력해 주세요"
                      rows="3"
                    />
                  </label>
                </div>
              </section>

              <aside className="order-summary-panel">
                <div className="order-panel">
                  <h2 className="order-panel-title">결제 요약</h2>
                  <div className="order-summary-rows">
                    <div className="order-summary-row">
                      <span>상품 금액</span>
                      <strong>{formatPrice(itemsTotal)}원</strong>
                    </div>
                    <div className="order-summary-row">
                      <span>배송비</span>
                      <strong>{formatPrice(shippingFee)}원</strong>
                    </div>
                    <div className="order-summary-row">
                      <span>할인 금액</span>
                      <strong>{formatPrice(discountAmount)}원</strong>
                    </div>
                    <div className="order-summary-row order-summary-row-total">
                      <span>총 결제예정금액</span>
                      <strong>{formatPrice(totalAmount)}원</strong>
                    </div>
                  </div>
                  {errorMessage && <p className="order-error-message">{errorMessage}</p>}
                  <div className="order-submit-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSubmitOrder}
                      disabled={submitting || !portOneReady}
                    >
                      {submitting
                        ? '주문 처리 중...'
                        : !portOneReady
                          ? '결제 모듈 준비 중...'
                          : '주문 완료하기'}
                    </button>
                  </div>
                </div>
              </aside>
            </div>
            <div className="cart-actions">
              <Link to="/cart" className="btn btn-outline">장바구니로 돌아가기</Link>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
