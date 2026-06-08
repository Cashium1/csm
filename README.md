# 캐쉬움 (CSM)

부업 추천 · 강의 판매 플랫폼. Next.js 16(App Router) 기반의 풀스택 웹 애플리케이션입니다.

이 문서는 로컬 환경에서 프로젝트를 내려받아 실행하기까지의 전 과정을 다룹니다.
실제 서버 배포 및 외부 키 발급은 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고하세요.

---

## 기술 스택

| 구분 | 내용 |
|---|---|
| 프레임워크 | Next.js 16 (App Router), React 19 |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 데이터베이스 | SQLite (Node.js 내장 `node:sqlite`) |
| 결제 | 토스페이먼츠 v2 |
| 이메일 | Resend |

---

## 사전 요구 사항

| 도구 | 버전 | 비고 |
|---|---|---|
| **Node.js** | **22.5 이상** | `node:sqlite`(내장 DB) 사용으로 필수 |
| **npm** | Node.js에 포함 | 패키지 관리 |
| **Git** | 최신 | 소스 코드 내려받기 |

### 설치 및 버전 확인
- **Node.js**: https://nodejs.org 에서 22.5 이상(LTS 또는 Current) 설치.
- **Git**: https://git-scm.com/downloads 에서 설치.

설치 후 터미널에서 버전을 확인합니다.
```bash
node -v   # v22.5.0 이상이어야 함
git --version
```

---

## 터미널(명령어 입력 창) 실행 방법

이후 모든 작업은 터미널에서 수행합니다.

- **Windows**
  - `Win + R` → `cmd` 입력 → Enter (명령 프롬프트), 또는 `powershell` 입력 (PowerShell 권장).
  - 또는 대상 폴더를 파일 탐색기에서 연 뒤, 주소창에 `cmd` 또는 `powershell`을 입력하고 Enter 하면 **해당 폴더에서** 터미널이 열립니다.
- **macOS**
  - `Cmd + Space` → `Terminal` 검색 → Enter.

---

## 1. 소스 코드 내려받기 (Git)

### 최초 1회 — 저장소 복제(clone)
원하는 작업 폴더로 이동한 뒤 저장소를 복제합니다.
```bash
# 예: 사용자 폴더 아래에 받기
cd %USERPROFILE%            # Windows (macOS는 cd ~)
git clone https://github.com/Cashium1/csm.git
cd csm
```

> 비공개(private) 저장소라면 GitHub 로그인 인증이 필요합니다. 사용자명과 **Personal Access Token**(비밀번호 대신)을 입력하거나, GitHub CLI(`gh auth login`)로 인증하세요.

### 이후 — 최신 변경 사항 가져오기(pull)
이미 복제한 프로젝트를 최신 상태로 업데이트할 때:
```bash
cd csm            # 프로젝트 폴더로 이동
git pull origin main
```

> 로컬에서 수정한 내용이 있어 충돌이 발생하면, 변경분을 커밋하거나 `git stash`로 임시 보관한 뒤 다시 `git pull` 하세요.

---

## 2. 의존성 설치

프로젝트 폴더(`csm`)에서 실행합니다. 최초 1회, 그리고 `git pull`로 의존성이 바뀐 경우 다시 실행합니다.
```bash
npm install
```

---

## 3. 환경 변수 설정

결제·이메일 등 외부 연동 기능은 환경 변수(키)가 필요합니다. 템플릿을 복사해 `.env.local`을 생성한 뒤 값을 채웁니다.
```bash
# Windows (PowerShell)
Copy-Item .env.example .env.local

# Windows (cmd)
copy .env.example .env.local

# macOS
cp .env.example .env.local
```

- 각 변수의 의미와 발급 방법은 [.env.example](.env.example) 및 [DEPLOYMENT.md](DEPLOYMENT.md)에 정리돼 있습니다.
- `.env.local`은 비밀 값을 포함하므로 **절대 커밋하지 않습니다**(`.gitignore`에 포함됨).
- 키 없이 실행해도 UI는 정상 동작하며, 결제·실제 메일 발송만 비활성화됩니다(메일은 서버 콘솔로 출력). 누락된 키는 서버 시작 시 `[env]` 경고로 표시됩니다.

---

## 4. 개발 서버 실행

```bash
npm run dev
```
- 터미널에 표시된 주소(기본 `http://localhost:3000`)를 브라우저에서 엽니다.
- 소스 수정 시 자동으로 반영됩니다(HMR).
- 종료: 터미널에서 `Ctrl + C`.
- 3000 포트가 사용 중이면 자동으로 다른 포트로 실행되니, 터미널에 출력된 실제 주소를 확인하세요.

---

## 5. 관리자 페이지 접근

1. `.env.local`의 `ADMIN_EMAILS`에 관리자 이메일을 지정합니다(쉼표로 복수 지정 가능).
2. 해당 이메일로 사이트에서 회원가입(이메일 인증 포함)합니다.
3. 가입과 동시에 관리자 권한이 부여되며 `/admin` 경로로 접근할 수 있습니다.

관리자 콘솔에서 강의·회원·결제·문의·쿠폰·배너·정책 등을 관리합니다.

---

## 명령어 레퍼런스

| 명령어 | 설명 |
|---|---|
| `npm install` | 의존성 설치(최초/업데이트 시) |
| `npm run dev` | 개발 서버 실행(HMR) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행(프로덕션 모드) |
| `npm run lint` | ESLint 검사 |

---

## 프로젝트 구조

```
csm/
├─ app/            # 라우트(페이지·API). App Router 기반
│  ├─ admin/       # 관리자 콘솔 페이지
│  └─ api/         # 서버 API 라우트
├─ components/     # 공용 UI 컴포넌트
├─ lib/            # 도메인 로직(인증·결제·주문·쿠폰·DB 등)
├─ private/        # 비공개 강의 자료(PDF) — 권한 확인 후 제공
├─ public/         # 정적 자산
├─ data/           # SQLite 데이터 파일(자동 생성, git 제외)
├─ instrumentation.ts  # 서버 시작 시 환경 변수 점검
└─ .env.example    # 환경 변수 템플릿
```

---

## 트러블슈팅

- **`node`/`npm`/`git`을 찾을 수 없음**
  설치가 누락됐거나 PATH 미적용 상태입니다. 설치 후 터미널을 새로 열어 `node -v`, `git --version`으로 재확인하세요.

- **`git clone` 시 인증 실패**
  비공개 저장소는 Personal Access Token 또는 `gh auth login` 인증이 필요합니다.

- **`git pull` 충돌(conflict)**
  로컬 변경분을 커밋하거나 `git stash` 후 다시 시도하세요.

- **`node:sqlite` 관련 오류**
  Node.js 버전이 22.5 미만입니다. 최신 버전으로 업그레이드 후 `node -v`로 확인하세요.

- **서버 로그에 `[env] 필수 환경변수 누락` 경고**
  결제 키 등이 비어 있다는 의미입니다. `.env.local`에 값을 채우면 사라집니다(화면 확인만 할 경우 무시 가능).

- **`http://localhost:3000` 접속 불가**
  `npm run dev`가 실행 중인지, 터미널에 오류가 없는지 확인하고, 출력된 실제 포트 주소로 접속하세요.

---

## 참고 문서

- 배포 및 외부 키 발급/삽입: [DEPLOYMENT.md](DEPLOYMENT.md)
- 환경 변수 목록: [.env.example](.env.example)
