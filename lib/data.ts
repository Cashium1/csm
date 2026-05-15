export type TrackKey = "content" | "sales" | "marketing" | "service";

export type CategoryGroup = {
  key: TrackKey;
  title: string;
  description: string;
  categories: string[];
};

export type Course = {
  slug: string;
  title: string;
  category: string;
  group: TrackKey;
  summary: string;
  target: string;
  level: "입문" | "기초" | "실전";
  duration: string;
  minutes: number;
  price: string;
  priceNumber: number;
  tags: string[];
  thumbnail: string;
  heroImage?: string;
  materialPdf: string;
  badge: string;
  cardCategory: string;
  originalPrice: string;
  rating: number;
  reviewCount: number;
  intro: string;
  recommendedFor: string[];
  learnings: string[];
  curriculum: string[];
  formats: string[];
  outcomes: string[];
  caution: string;
  relatedSlugs: string[];
};

export const categoryGroups: CategoryGroup[] = [
  {
    key: "content",
    title: "콘텐츠 수익형",
    description: "글, 영상, 숏폼처럼 꾸준히 쌓이는 콘텐츠를 기반으로 수익 구조를 이해합니다.",
    categories: [
      "유튜브 수익 구조",
      "릴스 / 쇼츠 수익 구조",
      "블로그 수익화",
      "네이버 블로그",
      "티스토리",
      "워드프레스 콘텐츠 운영",
    ],
  },
  {
    key: "sales",
    title: "판매 / 유통형",
    description: "상품 소싱, 운영, 판매 흐름을 중심으로 온라인 판매의 기본 구조를 배웁니다.",
    categories: ["이커머스", "위탁판매", "온라인 상품 판매 구조"],
  },
  {
    key: "marketing",
    title: "마케팅 / 연결형",
    description: "콘텐츠와 상품을 연결해 수익이 만들어지는 링크 기반 모델을 살펴봅니다.",
    categories: ["제휴 마케팅", "SNS 기반 링크 수익 구조"],
  },
  {
    key: "service",
    title: "서비스 / 실행형",
    description: "AI 도구, 체험단, 대행 업무처럼 실행 역량을 수익화하는 방식을 이해합니다.",
    categories: ["AI 활용 기반 서비스 제작", "리뷰어 / 체험단 구조 이해", "대행형 온라인 부업 구조"],
  },
];

export const courses: Course[] = [
  {
    slug: "youtube-revenue",
    title: "유튜브 수익 구조 입문",
    category: "유튜브 수익 구조",
    group: "content",
    summary: "조회수, 광고, 협찬, 상품 연결이 어떻게 수익으로 이어지는지 정리합니다.",
    target: "영상 콘텐츠에 관심 있는 초보자",
    level: "입문",
    duration: "45분",
    minutes: 45,
    price: "19,000원",
    priceNumber: 19000,
    tags: ["입문자용", "추천", "콘텐츠형"],
    thumbnail: "/course-thumbnails/youtube-revenue.webp",
    materialPdf: "/course-materials/youtube-revenue.pdf",
    badge: "베스트셀러",
    cardCategory: "유튜브",
    originalPrice: "49,000원",
    rating: 4.8,
    reviewCount: 1284,
    intro: "유튜브를 시작하기 전 꼭 알아야 할 수익 구조와 채널 운영 감각을 짧게 정리한 강의입니다.",
    recommendedFor: [
      "유튜브가 어떻게 수익을 만드는지 궁금한 분",
      "장비나 편집보다 먼저 구조를 알고 싶은 분",
      "콘텐츠 주제를 정하기 전 기준이 필요한 분",
    ],
    learnings: [
      "광고 수익과 조회수의 관계",
      "협찬, 제휴, 자체 상품 연결 구조",
      "채널 주제 선택 시 확인할 지표",
      "초기 운영에서 피해야 할 흔한 착각",
    ],
    curriculum: [
      "유튜브 수익의 기본 흐름",
      "조회수만으로 판단하면 안 되는 이유",
      "초보자가 확인할 주제 검증 체크리스트",
      "첫 채널 기획 전 준비할 것",
    ],
    formats: ["PDF 18p", "텍스트 요약", "수익 흐름 도식"],
    outcomes: [
      "유튜브 수익 모델을 큰 그림으로 이해할 수 있습니다.",
      "내가 만들 콘텐츠가 어떤 수익 구조에 가까운지 판단할 수 있습니다.",
    ],
    caution: "채널 성장은 시간이 필요합니다. 이 강의는 수익 보장이 아니라 시작 전 구조 이해를 돕는 자료입니다.",
    relatedSlugs: ["shorts-reels", "affiliate-marketing"],
  },
  {
    slug: "shorts-reels",
    title: "릴스 / 쇼츠 수익 구조",
    category: "릴스 / 쇼츠 수익 구조",
    group: "content",
    summary: "짧은 영상이 광고, 제휴, 유입 채널로 작동하는 방식을 배웁니다.",
    target: "짧은 콘텐츠를 빠르게 실험하고 싶은 분",
    level: "입문",
    duration: "35분",
    minutes: 35,
    price: "15,000원",
    priceNumber: 15000,
    tags: ["인기", "빠른 학습", "콘텐츠형"],
    thumbnail: "/course-thumbnails/shorts-reels.webp",
    materialPdf: "/course-materials/shorts-reels.pdf",
    badge: "신규",
    cardCategory: "숏폼",
    originalPrice: "39,000원",
    rating: 4.7,
    reviewCount: 936,
    intro: "숏폼 콘텐츠가 직접 수익과 간접 수익으로 연결되는 방식을 사례 중심으로 이해합니다.",
    recommendedFor: [
      "릴스나 쇼츠를 자주 보지만 수익 구조가 궁금한 분",
      "얼굴 노출 없이 가능한 방향을 살펴보고 싶은 분",
      "짧게 테스트할 콘텐츠 주제가 필요한 분",
    ],
    learnings: [
      "플랫폼 보상과 외부 수익의 차이",
      "링크, 프로필, 랜딩 페이지 연결 방식",
      "반복 가능한 숏폼 포맷 만들기",
      "조회수보다 중요한 전환 지표",
    ],
    curriculum: [
      "숏폼 수익화의 기본 구조",
      "콘텐츠 포맷별 장단점",
      "제휴와 상품 연결 흐름",
      "7일 테스트 설계 예시",
    ],
    formats: ["PDF 14p", "이미지 예시", "실험 체크리스트"],
    outcomes: [
      "숏폼이 어떤 역할로 수익에 기여하는지 이해할 수 있습니다.",
      "작은 테스트를 설계할 수 있는 기준을 얻습니다.",
    ],
    caution: "숏폼은 반응 편차가 큽니다. 빠른 검증에는 좋지만 안정적인 수익까지는 반복 실험이 필요합니다.",
    relatedSlugs: ["affiliate-marketing", "youtube-revenue"],
  },
  {
    slug: "blog-monetization",
    title: "블로그 수익화 구조",
    category: "블로그 수익화",
    group: "content",
    summary: "네이버 블로그, 티스토리, 워드프레스의 수익화 차이를 한 번에 비교합니다.",
    target: "글쓰기에 익숙하거나 검색 유입을 배우고 싶은 분",
    level: "기초",
    duration: "55분",
    minutes: 55,
    price: "무료",
    priceNumber: 0,
    tags: ["무료", "검색형", "기초"],
    thumbnail: "/course-thumbnails/blog-monetization.webp",
    heroImage: "/course-hero/blog-monetization-hero.webp",
    materialPdf: "/course-materials/blog-monetization.pdf",
    badge: "무료",
    cardCategory: "블로그",
    originalPrice: "22,000원",
    rating: 4.8,
    reviewCount: 1822,
    intro: "블로그 플랫폼별 특징과 광고, 제휴, 체험단, 자체 상품 연결 방식을 비교합니다.",
    recommendedFor: [
      "블로그를 시작하려는데 플랫폼 선택이 어려운 분",
      "검색 유입이 수익으로 이어지는 과정을 알고 싶은 분",
      "글 기반 부업의 현실적인 장단점을 보고 싶은 분",
    ],
    learnings: [
      "플랫폼별 수익 모델 차이",
      "검색 키워드와 콘텐츠 기획의 연결",
      "광고, 체험단, 제휴 수익의 기본 구조",
      "초기 블로그 운영 체크리스트",
    ],
    curriculum: [
      "블로그 수익화의 큰 그림",
      "네이버 블로그와 티스토리 비교",
      "워드프레스가 필요한 경우",
      "첫 10개 글 주제 잡는 방법",
    ],
    formats: ["PDF 22p", "플랫폼 비교표", "키워드 예시"],
    outcomes: [
      "나에게 맞는 블로그 플랫폼을 선택하는 기준을 세울 수 있습니다.",
      "글이 수익으로 연결되는 흐름을 구조적으로 이해합니다.",
    ],
    caution: "검색 기반 콘텐츠는 누적 시간이 필요합니다. 단기간 결과보다 방향 검증에 초점을 맞추는 것이 좋습니다.",
    relatedSlugs: ["affiliate-marketing", "reviewer-program"],
  },
  {
    slug: "affiliate-marketing",
    title: "제휴 마케팅 첫 구조 이해",
    category: "제휴 마케팅",
    group: "marketing",
    summary: "추천 링크, 콘텐츠, 전환율이 어떻게 수익으로 연결되는지 설명합니다.",
    target: "콘텐츠와 상품 연결에 관심 있는 분",
    level: "입문",
    duration: "40분",
    minutes: 40,
    price: "18,000원",
    priceNumber: 18000,
    tags: ["입문자용", "실전형", "마케팅형"],
    thumbnail: "/course-thumbnails/affiliate-marketing.webp",
    materialPdf: "/course-materials/affiliate-marketing.pdf",
    badge: "추천",
    cardCategory: "제휴",
    originalPrice: "49,000원",
    rating: 4.7,
    reviewCount: 987,
    intro: "제휴 마케팅을 과장 없이 이해할 수 있도록 링크 수익의 기본 흐름과 주의점을 정리합니다.",
    recommendedFor: [
      "링크를 통해 수익이 생기는 방식이 궁금한 분",
      "블로그, SNS, 숏폼을 수익화하고 싶은 분",
      "광고 느낌을 줄이고 신뢰를 지키는 기준이 필요한 분",
    ],
    learnings: [
      "제휴 링크와 전환 추적의 기본",
      "상품 선택과 콘텐츠 주제의 연결",
      "신뢰를 해치지 않는 추천 방식",
      "성과를 판단하는 기본 지표",
    ],
    curriculum: [
      "제휴 마케팅의 수익 흐름",
      "콘텐츠 채널별 적용 방식",
      "추천 글과 비교 글의 차이",
      "초보자가 지켜야 할 표시와 안내",
    ],
    formats: ["PDF 16p", "전환 흐름 도식", "체크리스트"],
    outcomes: [
      "제휴 마케팅을 시작하기 전 필요한 기본 용어를 이해합니다.",
      "내 채널에 맞는 상품 연결 방식을 판단할 수 있습니다.",
    ],
    caution: "제휴는 신뢰가 핵심입니다. 무리한 추천이나 과장 표현은 장기적으로 채널 가치를 낮출 수 있습니다.",
    relatedSlugs: ["blog-monetization", "shorts-reels"],
  },
  {
    slug: "ecommerce-basic",
    title: "이커머스 시작 전 구조 이해",
    category: "이커머스",
    group: "sales",
    summary: "상품 선정, 마진, CS, 물류 흐름을 초보자 눈높이로 정리합니다.",
    target: "판매와 운영형 부업이 궁금한 분",
    level: "기초",
    duration: "60분",
    minutes: 60,
    price: "24,000원",
    priceNumber: 24000,
    tags: ["실전형", "판매형", "추천"],
    thumbnail: "/course-thumbnails/ecommerce-basic.webp",
    materialPdf: "/course-materials/ecommerce-basic.pdf",
    badge: "베스트셀러",
    cardCategory: "이커머스",
    originalPrice: "69,000원",
    rating: 4.9,
    reviewCount: 1842,
    intro: "온라인 판매를 시작하기 전 상품과 운영, 비용 구조를 먼저 이해하도록 돕는 강의입니다.",
    recommendedFor: [
      "스마트스토어, 오픈마켓 판매가 궁금한 분",
      "위탁판매와 사입의 차이를 알고 싶은 분",
      "마진 계산과 운영 부담을 먼저 확인하고 싶은 분",
    ],
    learnings: [
      "온라인 판매의 비용과 마진 구조",
      "위탁판매, 사입, 자체 제작의 차이",
      "상품 페이지와 CS의 기본 역할",
      "초보자가 확인해야 할 리스크",
    ],
    curriculum: [
      "이커머스 수익 구조 한눈에 보기",
      "상품 소싱 방식 비교",
      "마진 계산 예시",
      "첫 상품 검증 체크리스트",
    ],
    formats: ["PDF 24p", "마진 계산표", "운영 체크리스트"],
    outcomes: [
      "판매형 부업의 실제 업무 흐름을 이해할 수 있습니다.",
      "시작 전 필요한 비용과 운영 부담을 현실적으로 가늠할 수 있습니다.",
    ],
    caution: "판매형 모델은 재고, 환불, 고객 응대가 함께 따라옵니다. 구조를 이해한 뒤 작게 검증하는 것을 권장합니다.",
    relatedSlugs: ["agency-sidejob", "ai-service-builder"],
  },
  {
    slug: "ai-service-builder",
    title: "AI 활용 기반 서비스 제작",
    category: "AI 활용 기반 서비스 제작",
    group: "service",
    summary: "AI 도구로 작은 서비스나 자동화 산출물을 만들 때 필요한 흐름을 배웁니다.",
    target: "AI 툴로 실행형 부업을 탐색하는 분",
    level: "기초",
    duration: "50분",
    minutes: 50,
    price: "21,000원",
    priceNumber: 21000,
    tags: ["추천", "AI", "서비스형"],
    thumbnail: "/course-thumbnails/ai-service-builder.webp",
    materialPdf: "/course-materials/ai-service-builder.pdf",
    badge: "신규",
    cardCategory: "AI 서비스",
    originalPrice: "59,000원",
    rating: 4.8,
    reviewCount: 1234,
    intro: "AI 도구를 활용해 작은 문제를 해결하고 서비스형 산출물로 연결하는 흐름을 설명합니다.",
    recommendedFor: [
      "AI 툴은 써봤지만 수익화 방향이 막막한 분",
      "자동화, 문서, 콘텐츠 제작을 서비스로 만들고 싶은 분",
      "혼자 작게 테스트할 수 있는 모델을 찾는 분",
    ],
    learnings: [
      "AI 활용 부업의 대표 유형",
      "문제 정의와 산출물 설계 방식",
      "작은 서비스 제안서 구성",
      "품질 확인과 윤리적 안내 기준",
    ],
    curriculum: [
      "AI 서비스형 부업의 큰 그림",
      "도구보다 먼저 정할 문제",
      "산출물 패키징 예시",
      "첫 고객 검증 흐름",
    ],
    formats: ["PDF 20p", "서비스 기획 템플릿", "프로세스 도식"],
    outcomes: [
      "AI 도구를 단순 사용이 아니라 문제 해결 흐름으로 바라볼 수 있습니다.",
      "작은 서비스 제안의 기본 구조를 만들 수 있습니다.",
    ],
    caution: "AI 결과물은 검수와 책임 있는 사용이 중요합니다. 자동화만으로 품질이 보장되지는 않습니다.",
    relatedSlugs: ["agency-sidejob", "ecommerce-basic"],
  },
  {
    slug: "reviewer-program",
    title: "리뷰어 / 체험단 구조 이해",
    category: "리뷰어 / 체험단 구조 이해",
    group: "service",
    summary: "체험단, 협찬, 리뷰 콘텐츠가 어떤 조건에서 운영되는지 알아봅니다.",
    target: "작게 시작 가능한 실행형 활동이 궁금한 분",
    level: "입문",
    duration: "30분",
    minutes: 30,
    price: "12,000원",
    priceNumber: 12000,
    tags: ["입문자용", "가벼운 시작", "실행형"],
    thumbnail: "/course-thumbnails/reviewer-program.webp",
    materialPdf: "/course-materials/reviewer-program.pdf",
    badge: "입문추천",
    cardCategory: "체험단",
    originalPrice: "29,000원",
    rating: 4.7,
    reviewCount: 721,
    intro: "리뷰어와 체험단 활동의 기본 조건, 콘텐츠 기준, 주의사항을 현실적으로 정리합니다.",
    recommendedFor: [
      "큰 초기 비용 없이 온라인 활동을 경험하고 싶은 분",
      "블로그나 SNS 계정 운영을 작게 시작하는 분",
      "체험단 활동의 구조와 기준이 궁금한 분",
    ],
    learnings: [
      "체험단과 협찬의 기본 구조",
      "선정 기준과 계정 준비 방법",
      "리뷰 콘텐츠 작성 시 유의할 점",
      "활동을 수익 모델로 확장하는 방향",
    ],
    curriculum: [
      "리뷰어 활동의 기본 흐름",
      "플랫폼별 신청 방식",
      "리뷰 작성 체크리스트",
      "장기적으로 확장 가능한 방향",
    ],
    formats: ["PDF 12p", "신청 체크리스트", "예시 이미지"],
    outcomes: [
      "체험단 활동이 어떤 조건으로 운영되는지 이해합니다.",
      "내 계정을 준비할 때 필요한 기본 요소를 확인할 수 있습니다.",
    ],
    caution: "제공받은 상품과 광고성 표시 기준을 명확히 지켜야 합니다. 무리한 후기 작성은 권장하지 않습니다.",
    relatedSlugs: ["blog-monetization", "shorts-reels"],
  },
  {
    slug: "agency-sidejob",
    title: "대행형 온라인 부업 구조",
    category: "대행형 온라인 부업 구조",
    group: "service",
    summary: "콘텐츠 제작, 운영 보조, 마케팅 대행이 어떤 업무로 구성되는지 정리합니다.",
    target: "실행력과 커뮤니케이션으로 시작하고 싶은 분",
    level: "실전",
    duration: "65분",
    minutes: 65,
    price: "29,000원",
    priceNumber: 29000,
    tags: ["실전형", "서비스형", "운영"],
    thumbnail: "/course-thumbnails/agency-sidejob.webp",
    materialPdf: "/course-materials/agency-sidejob.pdf",
    badge: "실전",
    cardCategory: "대행",
    originalPrice: "79,000원",
    rating: 4.9,
    reviewCount: 654,
    intro: "대행형 부업의 업무 범위, 견적, 커뮤니케이션 흐름을 이해할 수 있도록 구성했습니다.",
    recommendedFor: [
      "콘텐츠 운영이나 마케팅 업무를 대신해주는 모델이 궁금한 분",
      "고객과 소통하며 실행하는 일이 가능한 분",
      "작은 서비스 패키지를 만들고 싶은 분",
    ],
    learnings: [
      "대행형 부업의 대표 업무 범위",
      "간단한 서비스 패키지 구성법",
      "견적과 작업 범위 안내 방식",
      "초기 고객 대응에서 필요한 기준",
    ],
    curriculum: [
      "대행형 모델의 수익 구조",
      "업무 범위와 책임선 정하기",
      "제안서와 견적 예시",
      "작게 시작하는 고객 검증",
    ],
    formats: ["PDF 26p", "제안서 샘플", "업무 범위표"],
    outcomes: [
      "대행형 모델이 실제 어떤 일로 구성되는지 이해합니다.",
      "작은 서비스 패키지의 형태를 잡을 수 있습니다.",
    ],
    caution: "대행형 모델은 일정 관리와 소통이 중요합니다. 작업 범위를 명확히 정하지 않으면 부담이 커질 수 있습니다.",
    relatedSlugs: ["ai-service-builder", "ecommerce-basic"],
  },
];

export const notices = [
  {
    title: "캐쉬움 베타 서비스 안내",
    date: "2026.05.13",
    summary: "추천 설문과 핵심 구조형 강의 페이지를 먼저 제공합니다.",
  },
  {
    title: "강의 자료 업데이트 기준 안내",
    date: "2026.05.10",
    summary: "플랫폼 정책이나 시장 변화가 큰 주제는 자료를 주기적으로 점검합니다.",
  },
  {
    title: "문의 채널 운영 시간 안내",
    date: "2026.05.01",
    summary: "평일 오전 10시부터 오후 6시까지 접수된 문의를 순차적으로 확인합니다.",
  },
];

export function getCourse(slug: string) {
  return courses.find((course) => course.slug === slug);
}

export function getRelatedCourses(slugs: string[]) {
  return slugs.map((slug) => getCourse(slug)).filter((course): course is Course => Boolean(course));
}
