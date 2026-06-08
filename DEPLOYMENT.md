# 배포 & 운영 가이드 (캐쉬움 / CSM)

이 문서는 **코드 작업이 끝난 뒤** 실제 운영을 위해 사람이 직접 해야 하는 일(키 삽입, DB, 배포)을 순서대로 정리합니다.
코드 측 준비는 모두 완료되어 있으며, 아래는 "어디에 무엇을 넣는가"에 집중합니다.

---

## 0. 미리 알아둘 것 — 환경변수가 "키를 넣는 자리"입니다

이 앱은 비밀 키를 코드에 적지 않습니다. 대신 **환경변수**로 주입합니다.

- 어떤 변수가 필요한지: [`.env.example`](.env.example) 에 전부 정리돼 있습니다.
- 서버가 시작될 때 [`instrumentation.ts`](instrumentation.ts) → [`lib/env.ts`](lib/env.ts) 가 누락된 키를 **서버 로그에 경고**합니다.
- 넣는 위치는 두 곳뿐입니다:
  1. **로컬 개발**: 프로젝트 루트의 `.env.local` 파일
  2. **배포 환경**: 배포 플랫폼의 "Environment Variables" 설정 화면

> ⚠️ `.env.local` / `.env` 는 절대 git에 커밋하지 마세요. (이미 `.gitignore` 에 포함됨)

| 변수 | 필수 | 용도 | 노출 |
|---|---|---|---|
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | ✅ | 토스 결제창 호출 | 공개(브라우저) |
| `TOSS_SECRET_KEY` | ✅ | 토스 결제 승인·환불 | **비밀** |
| `RESEND_API_KEY` | 권장 | 이메일 실제 발송 | **비밀** |
| `EMAIL_FROM` | 권장 | 발신 주소 | 공개 |
| `ADMIN_EMAILS` | 권장 | 관리자 자동 지정 | 서버 |
| `DATA_DIR` | 선택 | SQLite 저장 경로 | 서버 |
| `TOSS_MOCK` | 선택 | 결제 흉내(개발용) | 서버 |

---

## 1. 로컬에서 먼저 확인하기

```bash
# 1) 템플릿을 복사해 실제 값 파일을 만든다
cp .env.example .env.local

# 2) .env.local 을 열어 값을 채운다 (아래 2~4단계에서 발급받은 키)

# 3) 실행
npm install
npm run dev
```

`http://localhost:3000` 접속 → 회원가입 → 결제 테스트(토스 테스트 키) 순으로 확인합니다.

---

## 2. 토스페이먼츠 키 발급 & 삽입

### 발급
1. https://www.tosspayments.com 가맹점 가입 → 사업자 심사.
2. 개발자센터 → **API 키**에서 두 개를 복사:
   - 클라이언트 키 (`test_ck_...` / 운영 `live_ck_...`)
   - 시크릿 키 (`test_sk_...` / 운영 `live_sk_...`)

### 삽입 위치
`.env.local`(로컬) 또는 배포 플랫폼 환경변수(운영):
```
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_xxxxxxxxxxxx
TOSS_SECRET_KEY=live_sk_xxxxxxxxxxxx
```
- 테스트 단계에서는 `test_` 키를, **실 오픈 시 `live_` 키**로 교체합니다.
- 운영에서는 `TOSS_MOCK` 을 **넣지 않습니다.** (넣으면 환불이 실제로 실행되지 않고 성공한 척만 합니다 — 코드가 운영에서는 이를 막도록 되어 있지만, 키 자체를 정확히 넣는 게 원칙입니다.)

---

## 3. 이메일(Resend) 키 발급 & 도메인 인증 & 삽입

### 발급 + 도메인 인증
1. https://resend.com 가입.
2. **API Keys** → 키 생성 (`re_...`).
3. **Domains** → 본인 도메인 추가 → 안내된 **DNS 레코드(SPF/DKIM/DMARC)** 를 도메인 DNS에 등록.
   - 이 인증을 안 하면 실제 메일이 발송되지 않습니다(테스트 주소는 본인에게만 발송 가능).

### 삽입 위치
```
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=캐쉬움 <noreply@yourdomain.com>
```
- `EMAIL_FROM` 의 도메인은 위에서 **인증한 도메인**이어야 합니다.
- 미설정 시: 메일이 발송되지 않고 서버 콘솔에 출력됩니다(개발 모드). 가입/결제/문의답변 알림이 실제로 안 갑니다.

---

## 4. 관리자 계정 지정

### 삽입 위치
```
ADMIN_EMAILS=admin@yourdomain.com,manager@yourdomain.com
```

### 적용 방법
1. 위 변수를 설정해 배포.
2. **해당 이메일로 일반 회원가입**(이메일 인증 포함)을 진행.
3. 가입과 동시에 자동으로 관리자 권한이 부여됩니다. → `/admin` 접속 가능.

---

## 5. 데이터베이스 — 배포 방식에 따라 선택

이 앱은 SQLite(`node:sqlite`)를 사용합니다. **배포 환경 선택에 따라 처리 방법이 다릅니다.**

### 선택 A — 단일 서버 + 영속 볼륨 (코드 변경 없음, 권장 시작점)
Fly.io / Render(유료) / 자체 VM 등 **디스크가 유지되는** 환경.
1. 영속 볼륨을 생성해 컨테이너에 마운트(예: `/data`).
2. 환경변수에 경로 지정:
   ```
   DATA_DIR=/data
   ```
3. 끝. 데이터가 볼륨에 영구 저장됩니다.
- 제약: **인스턴스 1개**에서만 동작(수평 확장 불가).

### 선택 B — 서버리스(Vercel 등) + 외부 Postgres (코드 이전 필요)
Vercel은 파일이 유지되지 않으므로 SQLite를 쓸 수 없습니다.
1. Neon / Supabase에서 Postgres 생성 → 접속 URL 확보.
2. **추가 코드 작업 필요**: `lib/db.ts` 및 각 쿼리를 Postgres 드라이버로 이전(별도 진행).
3. 환경변수:
   ```
   DATABASE_URL=postgres://...
   ```

> 어떤 방식이든 배포 런타임 **Node 22.5+** 가 필요합니다(`node:sqlite` 사용).

---

## 6. 도메인 & HTTPS

1. 도메인 구매(가비아/Cloudflare 등).
2. 배포 플랫폼에 도메인 연결(DNS A 또는 CNAME 레코드 — 플랫폼 안내대로).
3. HTTPS 인증서는 대부분 플랫폼이 자동 발급.
   - HTTPS가 적용돼야 코드의 보안쿠키(`secure`)·HSTS 설정이 정상 작동합니다.

---

## 7. 배포 실행

### 예: Vercel (선택 B)
1. GitHub에 푸시 → Vercel에서 저장소 import.
2. **Settings → Environment Variables** 에 2~5단계의 모든 값 입력.
3. Deploy. (`NODE_ENV=production` 은 자동)

### 예: Fly.io (선택 A)
1. `fly launch` 로 앱 생성, 영속 볼륨 추가.
2. 비밀 값은 `fly secrets set KEY=value` 로 주입:
   ```
   fly secrets set TOSS_SECRET_KEY=live_sk_... RESEND_API_KEY=re_... ADMIN_EMAILS=admin@...
   ```
   공개 값(`NEXT_PUBLIC_*`)은 빌드 시점에 필요하므로 빌드 환경변수로도 설정.
3. `fly deploy`.

---

## 8. 배포 직후 — 관리자 화면에서 입력해야 할 것

`/admin` 접속 후:
1. **사이트 설정**(`/admin/settings`) — 회사명·대표자·**사업자등록번호·통신판매업 신고번호**·주소·**고객센터 이메일**(← 관리자 알림 수신 주소).
2. **약관/정책**(`/admin/policies`) — 이용약관·개인정보처리방침·환불정책을 실제 내용으로 교체(현재는 초안 시드).
3. **이메일 템플릿**(`/admin/emails`) — 발송 문구·활성 상태 확인.
4. **강의**(`/admin/courses`) — 제목·가격·공개여부.
5. **강의 PDF 자료** — `private/course-materials/` 의 실제 PDF가 배포 서버에 포함돼야 함.
   - 선택 B(서버리스)면 파일이 유지되지 않으므로 **외부 스토리지(S3 등) URL 사용을 검토**.

---

## 9. 오픈 전 최종 점검

- [ ] 실 카드로 소액 결제 → 결제완료 메일·결제내역·수강권 부여 확인
- [ ] 관리자에서 실제 환불 1건 실행 → 토스 환불 정상 확인
- [ ] 회원가입/문의/문의답변 메일 실제 수신 확인
- [ ] 서버 로그에 `[env]` 누락 경고가 없는지 확인
- [ ] DB 백업 주기 설정(볼륨 스냅샷 또는 관리형 백업)
- [ ] (권장) Sentry 등 에러 모니터링 연동

---

## 빠른 요약: 직접 넣어야 하는 값

| 어디서 발급 | 무엇을 | 어디에 넣나 |
|---|---|---|
| 토스페이먼츠 | 클라이언트/시크릿 키 | `NEXT_PUBLIC_TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` |
| Resend | API 키 + 발신주소 | `RESEND_API_KEY`, `EMAIL_FROM` (+도메인 DNS 인증) |
| 직접 결정 | 관리자 이메일 | `ADMIN_EMAILS` |
| (선택 A) 서버 볼륨 | 마운트 경로 | `DATA_DIR` |
| (선택 B) Postgres | 접속 URL | `DATABASE_URL` (+코드 이전 필요) |

→ 넣는 위치는 **로컬은 `.env.local`, 배포는 플랫폼 환경변수 설정**. 변수 목록의 원본은 [`.env.example`](.env.example) 입니다.
