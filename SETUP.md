# 대응관계 수학 챗봇 - 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com) 접속
2. **새 프로젝트 만들기** → 프로젝트 이름 입력 (예: `math-chatbot-5th`)
3. **Authentication** 설정
   - 왼쪽 메뉴 → Authentication → 시작하기
   - Sign-in method → **Google** 활성화
   - 프로젝트의 공개 이름, 지원 이메일 입력 후 저장
4. **Firestore Database** 설정
   - 왼쪽 메뉴 → Firestore Database → 데이터베이스 만들기
   - **프로덕션 모드**로 시작 (규칙은 아래에서 설정)
   - 위치: `asia-northeast3` (서울)
5. **앱 등록**
   - 프로젝트 설정(⚙️) → 앱 추가 → 웹(</>) 선택
   - 앱 닉네임 입력 후 등록 → **firebaseConfig 값 복사**

## 2. Firestore 보안 규칙 배포

Firebase Console → Firestore → 규칙 탭에 붙여넣기:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chatSessions/{docId} {
      allow read, write: if request.auth != null;
    }
    match /practiceAttempts/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 3. Anthropic API 키 발급

1. [Anthropic Console](https://console.anthropic.com) 접속
2. API Keys → **Create Key** → 키 복사

## 4. 환경변수 설정 (.env.local)

프로젝트 루트의 `.env.local` 파일을 아래 값으로 수정:

```
ANTHROPIC_API_KEY=sk-ant-...

NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc

NEXT_PUBLIC_TEACHER_PASSWORD=원하는비밀번호
```

## 5. Vercel 배포

### 방법 A: Vercel CLI (권장)
```bash
npm install -g vercel
vercel login
vercel --prod
```
배포 시 환경변수를 입력하라는 프롬프트가 뜨면 위의 값들을 하나씩 입력합니다.

### 방법 B: Vercel 웹사이트
1. [vercel.com](https://vercel.com) → GitHub에 이 프로젝트 push
2. New Project → 레포지토리 선택
3. Environment Variables에 위 값들 입력
4. Deploy 클릭

## 6. Firebase Authorized Domains 설정

배포 후 Vercel URL을 Firebase에 등록해야 구글 로그인이 작동합니다:
- Firebase Console → Authentication → Settings → Authorized domains
- **Add domain** → Vercel URL 추가 (예: `math-chatbot.vercel.app`)

## 페이지 구성

| URL | 설명 |
|-----|------|
| `/` | 홈 (단원 소개, 메뉴) |
| `/chat` | AI 챗봇 대화 (구글 로그인 필요) |
| `/practice` | 대응관계 연습 문제 10개 (구글 로그인 필요) |
| `/teacher` | 교사용 대시보드 (비밀번호 인증) |

## 교사용 페이지 기능

- **학생 현황**: 전체 학생 점수, 정답률, 챗봇 대화 횟수
- **상세 보기**: 개별 학생의 문제별 정오답 현황
- **문제별 분석**: 학급 전체 문제별 정답률 차트
