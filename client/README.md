# Shopping Mall Client

Vite + React 클라이언트입니다.

## 실행

```bash
cd client
npm run dev
```

개발 서버: **http://localhost:5173**

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (HMR) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 실행 |

## 백엔드 연동

개발 시에는 `vite.config.js`의 proxy 설정으로 `/api` 요청이 `http://localhost:5000`으로 전달됩니다.  
백엔드 서버(`server` 폴더)를 먼저 실행한 뒤 클라이언트를 띄우면 됩니다.

```javascript
// 예: fetch('/api/health') → http://localhost:5000/api/health
fetch('/api/health').then(res => res.json()).then(console.log)
```

## 폴더 구조

```
client/
├── public/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```
