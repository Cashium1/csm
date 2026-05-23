# 캐쉬움 관리자 페이지 요구사항 명세서

| 항목 | 내용 |
|---|---|
| 문서명 | 캐쉬움 관리자 페이지 SRS (Software Requirements Specification) |
| 버전 | 1.0 |
| 기준일 | 2026-05-23 |
| 대상 코드 | `app/admin/*`, `app/api/admin/*`, 관련 `lib/*` |
| 작성 근거 | 현재 구현된 1차·2차·3차 관리자 기능 일체 |

---

## 1. 개요

### 1.1 목적
캐쉬움(사용자 맞춤형 부업 추천 및 학습 플랫폼) 운영자가 강의·회원·결제·콘텐츠·정책을 관리할 수 있도록 제공되는 관리자 콘솔의 기능 요구사항을 정의한다.

### 1.2 범위
- **포함**: `/admin/*` 경로의 모든 페이지, `/api/admin/*` 의 모든 API 라우트, 관리자 권한 검증·활동 로그·쿠폰 검증 등 보조 시스템, 관리자 설정값이 반영되는 사용자 화면 영역(푸터·메타·FAQ·정책 등).
- **제외**: 사용자 측 일반 기능(추천 설문, 강의 카탈로그 등 사용자 전용 화면), 결제·이메일 외부 서비스의 자체 운영 영역.

### 1.3 용어 정의
| 용어 | 정의 |
|---|---|
| 관리자(Admin) | `USER.role` 이 `super_admin` / `admin` / `content_manager` / `support_manager` / `finance_manager` 중 하나인 사용자 |
| 수강권(Course Access) | `course_purchases.access_status = 'active'` 인 상태. 결제 완료 시 부여, 환불 완료 시 회수 |
| 활성/비활성 콘텐츠 | `is_published` / `is_active` 플래그가 1인지 여부 |
| 활동 로그(Activity Log) | 관리자가 수행한 작업 이력. `admin_logs` 테이블에 기록 |
| Mock 모드 | `TOSS_SECRET_KEY` 미설정 또는 `TOSS_MOCK=1` 환경에서 실제 외부 API 호출 없이 성공으로 처리하는 동작 |

### 1.4 기술 스택
| 영역 | 사용 기술 |
|---|---|
| 프론트엔드 | Next.js 16.2.6 App Router, React 19.2.4, TypeScript 5, Tailwind CSS v4 |
| 백엔드 | Next.js Route Handlers (Node.js runtime), `node:sqlite` (DatabaseSync), `node:crypto` |
| 데이터베이스 | SQLite (WAL 모드, 파일 기반) |
| 결제 | 토스페이먼츠 v2 (결제창 SDK + 결제 승인 API + 결제 취소 API) |
| 이메일 | Resend HTTP API (구조만 준비, 실발송 미연동) |
| 인증 | 자체 세션 (httpOnly 쿠키 + token_hash + scrypt 비밀번호) |

---

## 2. 사용자 / 권한 (Roles & Permissions)

### 2.1 역할 정의
| Role | 한국어 | 설명 |
|---|---|---|
| `super_admin` | 최고관리자 | 모든 기능 + 관리자 권한 변경 가능 |
| `admin` | 관리자 | 권한 변경 외 거의 모든 기능 |
| `content_manager` | 콘텐츠 매니저 | 강의/카테고리/공지/리뷰/FAQ/배너/파일만 관리 |
| `support_manager` | 고객지원 매니저 | 문의 관리 + 회원/리뷰 조회 |
| `finance_manager` | 재무 매니저 | 결제/환불/쿠폰/매출 통계 |
| `user` | 일반 사용자 | 관리자 페이지 접근 불가 |

### 2.2 권한 키 목록 (`Permission`)
| Permission | 설명 |
|---|---|
| `view:dashboard` | 대시보드 조회 |
| `view:stats` | 매출 통계 조회 |
| `view:logs` | 활동 로그 조회 |
| `view:members` | 회원 목록/상세 조회 |
| `view:reviews` | 리뷰 조회 |
| `manage:courses` | 강의 등록·수정·공개/판매 상태 변경 |
| `manage:categories` | 카테고리 관리 (구현 보류 표시) |
| `manage:notices` | 공지사항 등록·수정·삭제 |
| `manage:reviews` | 리뷰 노출/숨김 변경 |
| `manage:faqs` | FAQ CRUD |
| `manage:banners` | 배너 CRUD |
| `manage:files` | 파일/PDF 자료 관리 |
| `manage:inquiries` | 문의 답변 |
| `manage:members_status` | 회원 상태(활성/차단/탈퇴) 변경 |
| `manage:admin_roles` | 관리자 권한 변경 (super_admin 전용) |
| `manage:payments` | 결제 상태 변경 |
| `manage:refunds` | 환불 요청/완료 처리, 환불 실행 |
| `manage:coupons` | 쿠폰 CRUD/활성화 |
| `manage:settings` | 사이트 설정 변경 |
| `manage:policies` | 약관/정책 버전 등록·활성화 |
| `manage:email_templates` | 이메일 템플릿 수정 |

### 2.3 권한 검증 메커니즘
- 페이지: `requirePermissionPage(permission)` → 권한 없으면 `/admin/no-access`로 redirect.
- API: `requirePermissionFromRequest(req, permission)` → 권한 없으면 **HTTP 403** 반환.
- 클라이언트: 사이드바는 권한이 있는 메뉴만 노출. 단, 어떤 URL로 직접 접근해도 서버에서 차단된다.

### 2.4 관리자 승격
- 환경변수 `ADMIN_EMAILS=email1,email2` (콤마 구분)에 명시된 이메일은 DB 부팅 시 자동으로 `role='admin'`으로 승격.
- 더 세분화된 역할(`super_admin` 등)은 별도 DB 수정 또는 super_admin이 회원 상세 페이지에서 변경.

---

## 3. 공통 / 비기능 요구사항 (NFR)

### 3.1 보안
1. 모든 관리자 페이지·API는 로그인 + 역할 + 권한 3단계 검증을 거친다.
2. 차단(`blocked`) 또는 탈퇴(`deleted`) 상태의 회원은 로그인 시 즉시 거절(403), 활성 세션 전부 삭제.
3. 토스페이먼츠 시크릿 키(`TOSS_SECRET_KEY`)는 서버 코드에만 존재하며, 클라이언트 번들에 절대 포함되지 않는다.
4. 쿠폰 할인 금액은 클라이언트 입력값을 신뢰하지 않고 서버에서 재검증·재계산한다.
5. 결제 승인 시 토스가 전달한 `amount`를 서버 주문 금액과 대조해 위변조를 차단한다.
6. PDF 파일은 직접 URL을 노출하지 않고, 수강권(`access_status='active'`) 검증 후 서버가 스트리밍/제공한다.

### 3.2 데이터 보존
- 결제 내역(`orders`)은 어떤 작업에서도 삭제하지 않는다. 상태(`status`, `refund_status`)만 변경한다.
- 구매 이력이 있는 강의는 삭제 대신 `is_published=0`, `is_on_sale=0`으로 전환한다.
- 리뷰는 삭제 대신 `status='hidden'`으로 숨김 처리한다.
- 파일은 삭제 대신 `is_active=0`으로 비활성화한다.
- 정책 문서는 수정 시 새 버전을 생성하고 기존 버전을 보존한다(`policies.version`).
- 활동 로그(`admin_logs`)는 어떤 경로로도 삭제할 수 없다.

### 3.3 UI/UX 공통
- **레이아웃**: 좌측 사이드바(그룹별 분류) + 상단 헤더(관리자 이름/이메일/역할 + "사용자 사이트" / "마이페이지" 링크).
- **디자인 톤**: 흰색 / 연회색 기반, 카드 + 표 중심, 노란색(`#ffd84d`)은 브랜드 액센트로 제한적 사용.
- **상태 표시**: 텍스트 대신 상태 배지(`rounded-full` + 색상) 사용. 긍정(공개·결제완료·답변완료·노출·활성)은 emerald, 비공개·숨김·비활성은 zinc, 위험(환불요청·차단·실패)은 red/amber.
- **모든 폼**: 필수 입력 표시(`*`), 저장 중 로딩 상태(`isSubmitting`), 성공/실패 알림(인라인 노티스).
- **위험 작업**(삭제, 환불 완료, 차단, 권한 변경, 강의 판매중지, 쿠폰 비활성화, 정책 활성화, 파일 비활성화)은 반드시 `window.confirm` 모달.
- **반응형**: PC 우선, 태블릿(sm:) 까지 깨지지 않도록 grid·flex 사용. 모바일은 미지원/제한적 지원.
- **빈 데이터**: 모든 테이블이 빈 경우 친화적 안내 텍스트 표시.

### 3.4 활동 로그
다음 작업은 자동으로 `admin_logs`에 기록된다:
- 사이트 설정 변경, 배너 CRUD, 쿠폰 CRUD/상태 변경, FAQ CRUD, 정책 등록/활성화, 파일 등록/수정/비활성화, 이메일 템플릿 수정, 환불 실행.
- (보류 영역) 강의/공지/리뷰/문의/회원 상태 변경 등 1·2차 라우트는 후속 단계에서 동일하게 로그 retrofit 예정.
- 로그에는 IP 주소(`x-forwarded-for`), User-Agent, 변경 전/후 JSON이 함께 기록된다.

---

## 4. 기능 요구사항 (Functional Requirements)

### FR-1. 인증 / 접근 제어
- **목적**: 관리자만 콘솔에 접근 가능.
- **경로**: `/admin/*` 전 영역.
- **구현**:
  - 비로그인 → `/login` 으로 redirect.
  - 일반 사용자 → `/` 로 redirect.
  - 권한 부족 → `/admin/no-access` 로 redirect.
  - 헤더 우측 "관리자" 노란 배지는 `user.role === admin`(또는 5개 역할 중 하나)일 때만 노출.

### FR-2. 대시보드
- **경로**: `/admin/dashboard`
- **필요 권한**: `view:dashboard`
- **요약 카드 (운영 현황 6개)**: 총 회원 수, 총 강의 수, 판매 중 강의, 총 결제 건수, 총 매출, 오늘 매출.
- **운영 지표 카드 (6개)**: 답변 대기 문의, 환불 요청, 숨김 리뷰, 이번 달 매출, 이번 달 환불, 이번 달 실매출.
- **표 영역**: 최근 가입 회원 5건, 최근 결제 5건, 최근 문의 5건, 최근 환불 요청 5건, 최근 리뷰 5건, 인기 강의 TOP 5(결제완료 수 기준).
- **계산**:
  - 총 매출 = `SUM(orders.amount) WHERE status='paid'`
  - 환불 금액 = `SUM(COALESCE(refund_amount, amount)) WHERE status='refunded'`
  - 실매출 = 매출 − 환불 금액
  - 이번 달 = `substr(approved_at, 1, 7) = 현재 YYYY-MM`

### FR-3. 강의 관리
- **경로**: `/admin/courses`, `/admin/courses/new`, `/admin/courses/[slug]`
- **필요 권한**: `manage:courses`
- **목록**: 제목, 슬러그, 대분류, 세부 카테고리, 가격(+할인가), 공개 토글, 판매 토글, 수정/삭제 버튼.
- **등록/수정 필드**:
  - 기본: 슬러그(영문 소문자/숫자/하이픈, 등록 시에만 입력), 제목, 한 줄 소개, 상세 설명
  - 분류·학습: 대분류(5종 고정), 세부 카테고리, 난이도(입문/기초/실전), 예상 학습 시간, 추천 대상, 학습 후 결과
  - 가격·자료: 가격(원), 할인 가격(원, 0이면 미적용), 썸네일 URL, PDF URL
  - 상태: 공개 여부, 판매 여부
- **토글**: 목록에서 공개/판매 즉시 변경 (API: `PATCH /api/admin/courses/[slug]` with `{ isPublished }` 또는 `{ isOnSale }` 단일 키).
- **삭제 정책**: 구매 이력(`course_purchases`)이 있으면 **소프트 삭제**(공개=OFF, 판매=OFF), 없으면 완전 삭제.
- **사용자 화면 연동**:
  - 비공개 강의는 `/courses/[slug]` 에서 `notFound()` (관리자는 미리보기 가능).
  - 판매중지 강의는 `createOrder` 단계에서 거부.

### FR-4. 강의별 판매 통계 (강의 상세 내 탭)
- **경로**: `/admin/courses/[slug]` 상단 패널
- **카드 6종**: 총 판매 건수, 총 매출, 환불 건수, 환불 금액, 실매출, 구매 회원 수(중복 제거).
- **차트**: 월별 매출 추이 (최근 12개월) 막대 그래프 + 동일 데이터 표.
- **표**: 최근 구매 내역 10건 (구매자/이메일/금액/상태/일시).

### FR-5. 회원 관리
- **경로**: `/admin/members`, `/admin/members/[id]`
- **필요 권한**: `view:members`
- **목록 컬럼**: 이름, 이메일, 가입일, 구매 강의 수, 총 결제 금액, 권한 배지, 상태 배지, 상세보기.
- **상세 페이지**:
  - 기본 정보: ID, 이름, 이메일, 권한, 상태, 가입일, 최근 로그인일.
  - 구매한 강의: 제목, 구매일, 결제 금액, 수강 권한 상태(active/revoked), 결제 상태.
  - 결제 내역: 주문번호, 강의, 금액, 수단, 상태, 결제일.
  - 문의 내역: 제목, 유형, 답변 상태, 작성일.
  - 리뷰 내역: 강의, 별점, 내용 일부, 노출 상태, 작성일.
- **계정 상태 변경** (`manage:members_status` 필요): 정상(`active`) / 차단(`blocked`) / 탈퇴(`deleted`).
  - 차단·탈퇴 시 활성 세션 모두 즉시 삭제.
  - 본인 계정은 변경 불가(서버 가드).
- **차단/탈퇴 영향**:
  - 로그인 시도 → 403 + 명확한 메시지.
  - 결제 시도 → 403.
  - 강의 자료 접근 → 403.
  - 기존 구매/결제 데이터는 보존.

### FR-6. 결제 관리
- **경로**: `/admin/payments`, `/admin/payments/[id]`
- **필요 권한**: `manage:payments`
- **목록 컬럼**: 주문번호, 회원, 강의, 금액, 결제 수단, 상태(드롭다운으로 변경 가능), 결제일, 상세보기.
- **상태값**: `paid`(결제완료) · `failed`(결제실패) · `refund_requested`(환불요청) · `refunded`(환불완료) · `pending`(결제대기) · `canceled`(주문취소).
- **상세 페이지**:
  - 주문 정보: 주문번호, 상품, 금액, 결제 수단, 결제 시각, 주문 생성, `paymentKey`, 영수증 링크.
  - 회원 / 강의 카드 + 각각 어드민 상세 페이지로 링크.
  - 환불 정보 카드: 환불 상태, 환불 금액, 요청일, 처리일, 사유, 관리자 메모.
- **결제 데이터는 절대 삭제하지 않는다.**

### FR-7. 환불 관리
- **경로**: `/admin/payments/[id]` (환불 폼)
- **필요 권한**: `manage:refunds`
- **환불 필드**: `refund_status` (`none`/`requested`/`completed`), `refund_reason`, `refund_amount`, `refund_requested_at`, `refunded_at`, `admin_memo`.
- **3개 액션**:
  1. **메모만 저장** — `admin_memo`만 갱신.
  2. **환불 요청으로 변경** — `status='refund_requested'`, `refund_status='requested'`, `refund_requested_at=now`. (paid 상태에서만 가능)
  3. **환불 완료 처리** — `status='refunded'`, `refund_status='completed'`, `refunded_at=now` + **수강권 자동 비활성화** (`course_purchases.access_status='revoked'`). 확인 모달 필수.
- **실제 토스 API 호출 (`POST /api/admin/payments/[id]/refund-execute`)**:
  - `paymentKey` 존재 검증, 환불 금액 범위 검증 (1원 ~ 주문 금액).
  - 토스 `POST /v1/payments/{paymentKey}/cancel` 호출.
  - **Mock 모드**: `TOSS_SECRET_KEY` 미설정 또는 `TOSS_MOCK=1`이면 실제 API 호출 없이 성공 처리.
  - 성공 시 환불 완료 + 수강권 회수 + 활동 로그 기록.
  - 실패 시 `admin_memo` 에 오류 코드/메시지 저장 + 활동 로그 기록 + HTTP 502.

### FR-8. 공지사항 관리
- **경로**: `/admin/notices`, `/admin/notices/new`, `/admin/notices/[id]`
- **필요 권한**: `manage:notices`
- **필드**: 제목, 내용(공백 줄로 단락 구분), 공개 여부, 상단 고정 여부, 작성일.
- **사용자 화면 (`/notices`)**: 공개 상태 공지만 상단 고정 → 작성일 역순으로 표시.

### FR-9. 문의 관리
- **경로**: `/admin/inquiries`, `/admin/inquiries/[id]`
- **필요 권한**: `manage:inquiries`
- **목록 컬럼**: 제목, 문의자(이름/이메일), 유형, 관련 강의·주문, 상태 배지, 작성일, 상세.
- **유형**: `course`/`payment`/`refund`/`account`/`general`.
- **답변 상태**: `pending`(답변대기) → `answered`(답변완료).
- **상세 페이지**: 문의 본문, 작성자/유형/작성일, 관련 강의·주문 링크, **답변 작성 폼**.
- **답변 저장**: `answer`/`answered_at`/`answered_by`(관리자 이메일) 기록 + 상태 `answered` 로 자동 변경.
- **사용자 제출 (`/contact`)**: 이름·이메일·유형(5종)·제목·내용·관련 강의·관련 주문 입력 폼. 로그인 시 이름·이메일 자동 채움. `POST /api/contact`로 저장.

### FR-10. 리뷰 관리
- **경로**: `/admin/reviews`, `/admin/reviews/[id]`
- **필요 권한**: `view:reviews` (조회), `manage:reviews` (숨김/노출 변경)
- **목록**: 강의, 작성자, 별점, 내용 일부, 노출 상태 배지, 작성일, 상세보기 + 숨김/노출 토글.
- **숨김 처리**: 완전 삭제 X. `course_reviews.status='hidden'`.
- **사용자 영향**: `getCourseReviews` 가 `status='visible'`인 행만 반환 → 강의 상세 페이지 평균 별점 계산에서도 자동 제외.

### FR-11. 사이트 설정
- **경로**: `/admin/settings`
- **필요 권한**: `manage:settings`
- **단일 행 패턴**: `site_settings.id = 1`.
- **탭 구성 (4개)**:
  1. **기본**: 사이트명, 한 줄 소개, OG 이미지 URL, 파비콘 URL.
  2. **고객센터**: 이메일, 운영 시간, 대표 연락처.
  3. **푸터/사업자**: 회사명, 대표자, 사업자등록번호, 통신판매업 신고번호, 사업장 주소, 푸터 저작권, 약관/개인정보/환불정책 링크.
  4. **SEO**: 메타 타이틀, 메타 설명, 키워드(콤마).
- **사용자 화면 연동**:
  - 푸터(`components/site-footer.tsx`)가 모든 회사·고객센터 정보 표시.
  - 루트 layout `generateMetadata`가 메타·OG·파비콘에 반영.

### FR-12. 메인/배너 관리
- **경로**: `/admin/banners`, `/admin/banners/new`, `/admin/banners/[id]`
- **필요 권한**: `manage:banners`
- **필드**: 제목, 설명, 이미지 URL, 버튼 문구, 버튼 링크, 노출 위치(`main` 등), 노출 순서, 공개 여부.
- **사용자 측 사용**: `listPublicBanners(position)` → 공개 배너만 `display_order` 순으로 반환. 메인 페이지 등에서 사용 가능 (현재 시점에서 메인 페이지 노출 위치는 별도 작업으로 추가 가능).

### FR-13. 쿠폰 관리
- **경로**: `/admin/coupons`, `/admin/coupons/new`, `/admin/coupons/[id]`
- **필요 권한**: `manage:coupons`
- **필드**:
  - 쿠폰명, 코드(고유, 영문 대문자 권장)
  - 할인 방식(`fixed_amount` / `percentage`), 할인 값, 최대 할인 금액(선택), 최소 결제 금액
  - 적용 대상: 전체 강의 / 특정 강의 슬러그 목록
  - 사용 제한: 전체 사용 한도, 사용자별 사용 횟수
  - 기간: 시작일, 종료일
  - 상태: `active` / `inactive` / `expired`
- **사용 흐름**:
  1. 결제 페이지 사용자가 쿠폰 코드 입력 → `POST /api/coupons/validate` (서버 검증).
  2. 검증 통과 시 클라이언트에 할인 후 금액 표시.
  3. 결제 시 `POST /api/checkout/create-order`에 `couponCode` 포함 → **서버에서 다시 검증** → 주문 금액 갱신 + `coupon_usages` 기록 + `coupons.used_count` 증가.
- **서버 검증 항목**: 존재 여부, 상태=`active`, 기간 내, 최소 결제 금액 충족, 강의 적용 가능, 전체/사용자별 사용 한도 미초과.

### FR-14. FAQ 관리
- **경로**: `/admin/faqs`, `/admin/faqs/new`, `/admin/faqs/[id]`
- **필요 권한**: `manage:faqs`
- **필드**: 카테고리(`강의`/`결제`/`환불`/`계정`/`수강`/`기타`), 질문, 답변, 공개 여부, 노출 순서.
- **사용자 측 (`/faq`)**: 공개 FAQ만 카테고리별 그룹 + 아코디언(`<details>`).

### FR-15. 약관/정책 관리
- **경로**: `/admin/policies`, `/admin/policies/new`, `/admin/policies/[id]`
- **필요 권한**: `manage:policies`
- **5종 정책 유형**: `terms`(이용약관), `privacy`(개인정보처리방침), `refund`(환불정책), `content`(콘텐츠 이용 정책), `marketing`(마케팅 수신 동의).
- **버전 관리**:
  - 새 버전 등록은 기존을 덮어쓰지 않고 `version+1` 로 추가.
  - 활성화는 동일 `policy_type` 의 다른 모든 행을 `is_active=0`으로 만들고 해당 행만 `is_active=1`.
- **사용자 측**: `/terms`, `/privacy`, `/refund-policy` 페이지가 `getActivePolicy(type)` 결과를 표시.

### FR-16. 파일 / PDF 자료 관리
- **경로**: `/admin/files`, `/admin/files/new`, `/admin/files/[id]`
- **필요 권한**: `manage:files`
- **필드**: 파일명, 유형(`pdf`/`thumbnail`/`detail_image`/`banner_image`/`etc`), URL, 크기(Byte), 연결된 강의 ID/제목, 활성 여부.
- **목록**: 파일 정보 + 크기 표시(`KB`/`MB` 환산) + 활성 배지.
- **삭제 정책**: 완전 삭제 대신 `is_active=0` 비활성화. 연결된 강의가 있으면 **추가 경고 모달**.
- **PDF 접근 제어**: `/api/courses/[slug]/material` 라우트가 수강권 검증(`access_status='active'`) 후 파일을 스트리밍하여 직접 URL 노출을 방지.

### FR-17. 이메일 템플릿
- **경로**: `/admin/emails`, `/admin/emails/[id]`
- **필요 권한**: `manage:email_templates`
- **이벤트 12종 기본 시드**: 회원가입/결제 완료/결제 실패/환불 요청/환불 완료/문의 답변/강의 구매/관리자 신규 결제·문의·환불·가입·리뷰.
- **필드**: `event_type`(고유), 템플릿명, 제목, 본문, `is_active`.
- **본문 변수**: `{{userName}}`, `{{courseTitle}}`, `{{amount}}`, `{{orderId}}`, `{{inquiryTitle}}`, `{{answer}}`.
- **발송 로그**: `email_logs`(eventType, recipient, subject, status, error, sentAt). 어드민 페이지 하단에 최근 20건 표시.
- **현재 상태**: 실제 발송은 미구현. `lib/email.ts` 의 `sendEmail()` 이 `RESEND_API_KEY` 있으면 Resend HTTP API 호출, 없으면 콘솔 출력으로 폴백.

### FR-18. 활동 로그
- **경로**: `/admin/logs`, `/admin/logs/[id]`
- **필요 권한**: `view:logs`
- **테이블 컬럼**: `admin_logs.id`, 관리자 이름/이메일, 작업 유형(`create`/`update`/`delete`/`enable`/`disable`/`publish`/`unpublish`/`refund_*`/`status_change`/`role_change`/`answer`), 대상 유형(강의/공지/문의/주문/회원/리뷰/쿠폰/사이트 설정/정책/배너/FAQ/파일/이메일 템플릿/카테고리), 대상 ID·이름, 설명, 변경 전/후 JSON, IP, User-Agent, 시각.
- **필터**: 관리자 이메일(부분 일치), 작업 유형, 대상 유형, 시작일/종료일.
- **상세 페이지**: 메타 정보 + 변경 전/후 JSON 비교(side-by-side, 다크 톤 코드 블록).
- **삭제 불가** (테이블 정의에 삭제 라우트 없음).

### FR-19. 매출 통계 (전체 영역)
- **경로**: `/admin/stats`
- **필요 권한**: `view:stats`
- **기간 필터**: 오늘 / 최근 7일 / 최근 30일 / 이번 달 / 지난 달 / 전체.
- **요약 카드 8종**: 총 매출, 총 환불 금액, 실매출, 총 결제 건수, 총 환불 건수, 평균 결제 금액, 이번 달 매출, 이번 달 실매출.
- **차트**: 일별 매출 추이(최근 30일, 막대), 월별 매출 추이(최근 12개월, 막대 + 라벨).
- **표**: 강의별 매출 TOP 10, 카테고리(대분류)별 매출, 최근 결제 10건, 최근 환불 10건.

---

## 5. 데이터 모델

### 5.1 변경된 기존 테이블
| 테이블 | 추가 컬럼 |
|---|---|
| `USER` | `role` (기본 `user`), `status` (기본 `active`, 값: `active`/`blocked`/`deleted`), `last_login_at` |
| `orders` | `refund_status`, `refund_reason`, `refund_amount`, `refund_requested_at`, `refunded_at`, `admin_memo` |
| `course_purchases` | `access_status` (기본 `active`), `access_granted_at`, `access_revoked_at`, `revoked_reason` |
| `course_reviews` | `status` (기본 `visible`, 값: `visible`/`hidden`) |
| `courses` | `description`, `discount_price`, `recommended_for`, `outcomes`, `is_published` (기본 1), `is_on_sale` (기본 1) |

### 5.2 신규 테이블 (3차 작업 기준)
| 테이블 | 핵심 컬럼 |
|---|---|
| `notices` | id, title, content, is_published, is_pinned, created_at, updated_at |
| `inquiries` | id, user_id, user_name, user_email, title, content, type, related_course_id, related_course_title, related_order_id, status(`pending`/`answered`), answer, answered_at, answered_by, created_at, updated_at |
| `site_settings` | 단일 행(id=1) — 사이트명, 메타, 사업자, 푸터 정보 등 |
| `banners` | id, title, description, image_url, button_text, button_link, position, display_order, is_published |
| `coupons` | id, name, code(UNIQUE NOCASE), discount_type, discount_value, max_discount_amount, min_order_amount, applies_to_all_courses, applicable_course_ids(JSON), applicable_category_ids(JSON), usage_limit, used_count, user_limit, starts_at, ends_at, status |
| `coupon_usages` | id, coupon_id, coupon_code, user_id, course_id, order_id, discount_amount, used_at |
| `admin_logs` | id, admin_user_id, admin_name, admin_email, action_type, target_type, target_id, target_name, description, before_data(JSON), after_data(JSON), ip_address, user_agent, created_at |
| `email_templates` | id, event_type(UNIQUE), template_name, subject, body, is_active |
| `email_logs` | id, event_type, recipient_email, subject, status, error_message, sent_at, created_at |
| `faqs` | id, category, question, answer, is_published, display_order |
| `policies` | id, policy_type, title, content, version, is_active |
| `files` | id, file_name, file_type, file_url, file_size, related_course_id, related_course_title, is_active |

### 5.3 마이그레이션 정책
- 모든 신규 테이블은 `CREATE TABLE IF NOT EXISTS` 로 멱등 생성.
- 컬럼 추가는 `migrateSchema()` 에서 `PRAGMA table_info` 로 존재 여부 검사 후 `ALTER TABLE ADD COLUMN`.
- 시드(`seedDatabase()`)는 1회만 수행: 단일 사이트 설정 행, 12개 이메일 템플릿, 5개 정책 초안, 기본 공지 3개.

---

## 6. API 엔드포인트 요약 (관리자 영역)

### 6.1 권한 보호 패턴
모든 어드민 API는 다음 패턴을 따른다:
```ts
const admin = requirePermissionFromRequest(req, "manage:...");
if (!admin) return 403;
```

### 6.2 엔드포인트 목록
| Method | Path | 필요 권한 | 설명 |
|---|---|---|---|
| `PATCH` | `/api/admin/settings` | `manage:settings` | 사이트 설정 전체 갱신 (with log) |
| `POST` | `/api/admin/banners` | `manage:banners` | 배너 등록 |
| `PATCH` | `/api/admin/banners/[id]` | `manage:banners` | 배너 수정 |
| `DELETE` | `/api/admin/banners/[id]` | `manage:banners` | 배너 삭제 |
| `POST` | `/api/admin/coupons` | `manage:coupons` | 쿠폰 등록 |
| `PATCH` | `/api/admin/coupons/[id]` | `manage:coupons` | 쿠폰 수정 / 상태 토글 |
| `POST` | `/api/admin/faqs` | `manage:faqs` | FAQ 등록 |
| `PATCH` | `/api/admin/faqs/[id]` | `manage:faqs` | FAQ 수정 |
| `DELETE` | `/api/admin/faqs/[id]` | `manage:faqs` | FAQ 삭제 |
| `POST` | `/api/admin/policies` | `manage:policies` | 정책 새 버전 등록 |
| `PATCH` | `/api/admin/policies/[id]/activate` | `manage:policies` | 정책 버전 활성화 |
| `POST` | `/api/admin/files` | `manage:files` | 파일 등록 |
| `PATCH` | `/api/admin/files/[id]` | `manage:files` | 파일 수정 |
| `DELETE` | `/api/admin/files/[id]` | `manage:files` | 파일 비활성화 |
| `PATCH` | `/api/admin/emails/[id]` | `manage:email_templates` | 이메일 템플릿 수정 |
| `POST` | `/api/admin/courses` | `manage:courses` | 강의 등록 |
| `PATCH` | `/api/admin/courses/[slug]` | `manage:courses` | 강의 수정 / 공개·판매 토글 |
| `DELETE` | `/api/admin/courses/[slug]` | `manage:courses` | 강의 삭제 (구매 이력 있으면 소프트) |
| `POST` | `/api/admin/notices` | `manage:notices` | 공지 등록 |
| `PATCH` | `/api/admin/notices/[id]` | `manage:notices` | 공지 수정 |
| `DELETE` | `/api/admin/notices/[id]` | `manage:notices` | 공지 삭제 |
| `PATCH` | `/api/admin/inquiries/[id]` | `manage:inquiries` | 문의 답변 작성 |
| `PATCH` | `/api/admin/reviews/[id]` | `manage:reviews` | 리뷰 노출/숨김 변경 |
| `PATCH` | `/api/admin/members/[id]` | `manage:members_status` | 회원 상태 변경 |
| `PATCH` | `/api/admin/payments/[id]` | `manage:payments` | 결제 상태 변경 |
| `PATCH` | `/api/admin/payments/[id]/refund` | `manage:refunds` | 환불 요청/완료/메모 |
| `POST` | `/api/admin/payments/[id]/refund-execute` | `manage:refunds` | 토스 환불 API 호출 |

### 6.3 공개/사용자 API (관리자 설정값과 연동)
| Method | Path | 설명 |
|---|---|---|
| `POST` | `/api/contact` | 문의 접수 (비로그인 가능) |
| `POST` | `/api/coupons/validate` | 쿠폰 코드 서버 검증 (로그인 필요) |
| `POST` | `/api/checkout/create-order` | 결제 주문 생성 (쿠폰 자동 적용) |
| `GET` | `/api/courses/[slug]/material` | PDF 자료 (수강권 검증 후 스트리밍) |

---

## 7. 외부 연동 / 환경변수

### 7.1 환경변수
| 변수명 | 용도 | 미설정 시 동작 |
|---|---|---|
| `ADMIN_EMAILS` | 자동 관리자 승격 이메일(콤마 구분) | 자동 승격 안 함 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스 결제창 클라이언트 키 | 결제 페이지에 키 설정 안내 표시, 결제 불가 |
| `TOSS_SECRET_KEY` | 토스 시크릿 키 (승인/취소 API) | 결제 승인 불가, 환불 실행은 mock |
| `TOSS_MOCK` | `1` 이면 환불 API mock 강제 | (선택) |
| `RESEND_API_KEY` | 이메일 발송용 Resend 키 | `sendEmail` 이 콘솔 출력으로 폴백 |
| `EMAIL_FROM` | 발신 주소 | `캐쉬움 <onboarding@resend.dev>` |

### 7.2 외부 서비스
- **토스페이먼츠**: 결제창 SDK(`https://js.tosspayments.com/v2/standard`), 승인 API(`POST /v1/payments/confirm`), 취소 API(`POST /v1/payments/{paymentKey}/cancel`). 시크릿 키 Basic 인증.
- **Resend**: HTTPS POST `https://api.resend.com/emails`. Bearer 인증.

---

## 8. 제약사항 / 가정

1. **단일 SQLite 파일** — 멀티 인스턴스 운영 불가. 향후 PostgreSQL 등으로 마이그레이션 시 일부 `PRAGMA`/구문 수정 필요.
2. **카테고리 동적 관리 미구현** — 대분류(`COURSE_GROUPS`) 5종은 `lib/admin-constants.ts` 에 하드코딩.
3. **검색/필터/페이지네이션은 신규 페이지 일부에만 적용** — 활동 로그 페이지에는 적용, 기존 1·2차 페이지는 후속 작업.
4. **활동 로그 retrofit 미완료** — 3차에서 추가한 라우트는 모두 로그 기록. 1·2차에서 만든 일부 라우트(강의/공지/리뷰/문의/회원 상태 등)는 후속 작업에서 동일 패턴 적용 예정.
5. **이메일 자동 발송 미구현** — 템플릿·로그 구조만 준비. 각 이벤트 발생 지점에서 `sendEmail()` 호출 추가가 후속 작업.
6. **카테고리별 매출 통계의 카테고리는 `courses.group_key`** 기준.
7. **클라이언트 컴포넌트는 `lib/db.ts` 를 직접·간접 import 할 수 없다.** 클라이언트에서 필요한 순수 상수는 반드시 `lib/admin-constants.ts` 에서 import.

---

## 9. 향후 작업 (Out of scope for current iteration)

| 항목 | 비고 |
|---|---|
| 카테고리 동적 CRUD | 사이드바에 `SOON` 배지로 표시됨 |
| 1·2차 라우트에 활동 로그 retrofit | 동일 패턴(`logAdminAction`)으로 추가 |
| 기존 어드민 목록 페이지에 검색·필터·페이지네이션 | 회원/결제/강의/공지/문의/리뷰 페이지 |
| 토스트 알림 컴포넌트화 | 현재는 인라인 노티스 |
| 실제 이메일 자동 발송 | 이벤트별 `sendEmail()` 호출 |
| 메인 페이지 배너 영역 | `listPublicBanners('main')` 결과를 사용자 메인에 렌더 |
| `super_admin` 의 관리자 권한 변경 UI | 회원 상세에 role 선택 추가 |
| 이메일 발송 로그 자동 기록 | `email_logs` 에 모든 이벤트 자동 INSERT |
| 파일 실제 업로드 | 현재는 URL 입력 방식 |

---

## 10. 검증 체크리스트 (운영 인수 기준)

- [x] 관리자가 아닌 사용자는 모든 `/admin/*` 경로에 접근 불가
- [x] 모든 어드민 API는 권한 미충족 시 403 반환
- [x] 결제 데이터는 어떤 액션으로도 삭제되지 않음
- [x] 환불 완료 시 수강권이 자동으로 비활성화됨
- [x] 차단/탈퇴 회원은 로그인·결제·자료 접근 불가
- [x] 숨김 리뷰는 사용자 화면 + 평균 별점 계산에서 제외됨
- [x] 비공개 강의는 사용자 강의 상세에서 404
- [x] 판매중지 강의는 결제 거부
- [x] 쿠폰 할인 금액은 서버에서 재계산
- [x] 토스 시크릿 키가 클라이언트 번들에 포함되지 않음
- [x] 위험 작업에 확인 모달이 있음
- [x] 활동 로그는 IP와 User-Agent를 함께 기록
- [x] 정책 수정 시 새 버전이 생성됨 (기존 버전 보존)
- [x] 사이트 설정 변경이 푸터/메타 태그에 즉시 반영됨

---

*문서 끝.*
