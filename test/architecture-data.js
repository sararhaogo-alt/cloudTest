/**
 * architecture-data.js
 * 확장된 AWS 클라우드 아키텍처 데이터, 신규 AWS 서비스 및 고급 시뮬레이션 파라미터
 */

const AWS_SERVICES = {
  route53: {
    id: 'route53',
    name: 'Amazon Route 53',
    fullName: 'Route 53 (클라우드 DNS 웹 서비스)',
    category: '네트워크 / DNS',
    color: '#8C4FFF',
    icon: '🌐',
    shortDesc: '전 세계 사용자를 가장 가까운 서버로 안전하게 연결해 주는 클라우드 주소록(DNS)',
    analogy: '친구 이름을 입력하면 바로 전화번호를 찾아 연결해 주는 스마트폰 초고속 연락처',
    detail: '도메인 이름(example.com)을 IP 주소로 변환하고, 헬스 체크(Health Check)를 통해 건강한 서버로만 사용자를 보내는 고가용성 글로벌 DNS 서비스입니다.'
  },
  cloudfront: {
    id: 'cloudfront',
    name: 'Amazon CloudFront',
    fullName: 'Amazon CloudFront (CDN)',
    category: '콘텐츠 전송 네트워크 (CDN)',
    color: '#8C4FFF',
    icon: '⚡',
    shortDesc: '전 세계 엣지 서버에 콘텐츠를 미리 복사해 두고 초고속으로 전송하는 글로벌 CDN',
    analogy: '본사 공장까지 가지 않아도 집 앞 편의점에서 물건을 바로 살 수 있도록 해주는 물류 창고망',
    detail: '이미지, 비디오, 웹페이지 정적 리소스를 전 세계 수백 개 엣지 로케이션에 캐싱하여 원본 서버(EC2/S3)의 부하를 80% 이상 줄이고 로딩 속도를 밀리초 단위로 단축합니다.'
  },
  waf: {
    id: 'waf',
    name: 'AWS WAF & Shield',
    fullName: 'Web Application Firewall & Shield',
    category: '보안 및 규정 준수',
    color: '#DD344C',
    icon: '🛡️',
    shortDesc: '해킹, SQL 인젝션, 대규모 디도스(DDoS) 공격을 사전에 걸러내는 웹 방화벽 방패',
    analogy: '학교 정문에서 위험한 물품을 소지하거나 초대받지 않은 불청객을 걸러내는 철통 보안 검색대',
    detail: 'HTTP 트래픽을 검사하여 SQL 인젝션, 크로스 사이트 스크립팅(XSS), 봇넷의 대량 비정상 접속을 서버에 닿기도 전에 차단(Drop)하여 서비스를 안전하게 보호합니다.'
  },
  vpc: {
    id: 'vpc',
    name: 'Amazon VPC',
    fullName: 'Virtual Private Cloud',
    category: '네트워크',
    color: '#8C4FFF',
    icon: '🏰',
    shortDesc: '외부 인터넷과 격리된 나만의 안전한 독립 가상 네트워크 공간',
    analogy: '학교 캠퍼스를 둘러싼 안전한 외벽과 인가된 사람만 통과하는 정문 경비실',
    detail: '사설 IP 대역을 지정하고, 서브넷(Subnet)과 라우팅 테이블, 보안 그룹(Security Group)을 통해 승인된 트래픽만 내부 서버로 접근할 수 있게 합니다.'
  },
  alb: {
    id: 'alb',
    name: 'Application Load Balancer',
    fullName: 'Application Load Balancer (ALB)',
    category: '트래픽 분산',
    color: '#00A4A6',
    icon: '⚖️',
    shortDesc: '수만 명의 유저 요청을 여러 대의 서버로 골고루 나누어주는 지능형 교통경찰',
    analogy: '급식실이나 놀이공원에서 줄이 길어질 때 여러 배식구/창구로 사람들을 유도하는 안내원',
    detail: 'HTTP/HTTPS 계층에서 요청 URL이나 헤더를 분석하여 여러 EC2 인스턴스로 균등하게 라우팅하고, 특정 서버가 다운되면 자동으로 트래픽을 차단합니다.'
  },
  ec2: {
    id: 'ec2',
    name: 'Amazon EC2',
    fullName: 'Elastic Compute Cloud',
    category: '컴퓨팅',
    color: '#FF9900',
    icon: '💻',
    shortDesc: '클라우드 상에서 필요할 때마다 사양을 바꾸어 빌려 쓰는 가상 컴퓨터(서버)',
    analogy: '내가 원하는 성능(CPU, 메모리)을 골라 원격으로 사용하는 고성능 가상 PC방',
    detail: '웹 서버, 백엔드 API, 복잡한 비즈니스 로직을 구동하며 오토스케일링과 연계하여 필요에 따라 수십 대로 자동 복제(Scale-Out)될 수 있습니다.'
  },
  lambda: {
    id: 'lambda',
    name: 'AWS Lambda',
    fullName: 'AWS Lambda (서버리스 연산)',
    category: '컴퓨팅 (서버리스)',
    color: '#ED7100',
    icon: '⚡',
    shortDesc: '24시간 켜진 컴퓨터 없이 코드가 실행된 시간(밀리초)만큼만 비용을 내는 서버리스 엔진',
    analogy: '손님이 올 때만 불이 켜지고 음료를 제조한 후 바로 꺼지는 초절전 무인 자판기',
    detail: 'OS 패치나 인프라 관리가 전혀 필요 없으며, 요청이 0개일 때는 비용이 0원이고, 1만 개가 동시에 들어오면 1만 개의 함수가 1초 만에 병렬 실행됩니다.'
  },
  elasticache: {
    id: 'elasticache',
    name: 'Amazon ElastiCache',
    fullName: 'Amazon ElastiCache (Redis / Memcached)',
    category: '인메모리 캐시',
    color: '#C925D1',
    icon: '🚀',
    shortDesc: '자주 찾는 데이터를 초고속 메모리(RAM)에 저장하여 DB의 부하를 획기적으로 줄이는 캐시',
    analogy: '매번 책장에 가서 책을 찾는 대신 책상 위에 자주 보는 참고서를 올려두고 0.1초 만에 펴보는 책받침',
    detail: '디스크 기반 DB(RDS)에 매번 쿼리하지 않고 초고속 RAM에서 응답(마이크로초 단위)하여 대규모 동시 접속 환경에서도 DB가 다운되지 않도록 지켜줍니다.'
  },
  s3: {
    id: 's3',
    name: 'Amazon S3',
    fullName: 'Simple Storage Service',
    category: '스토리지',
    color: '#3F8624',
    icon: '🪣',
    shortDesc: '인터넷 어디서나 용량 걱정 없이 무제한 파일을 안전하게 보관하는 객체 스토리지',
    analogy: '용량이 절대 가득 차지 않고 잃어버릴 염려가 전혀 없는 인터넷 무한 사물함',
    detail: '99.999999999%(11 9s) 내구성을 지원하며, 대용량 미디어 파일이나 정적 웹사이트(HTML/CSS/JS)를 서버 없이 직접 전 세계로 배포할 수 있습니다.'
  },
  rds: {
    id: 'rds',
    name: 'Amazon RDS',
    fullName: 'Relational Database Service',
    category: '데이터베이스',
    color: '#3B82F6',
    icon: '🗄️',
    shortDesc: '회원 정보, 결제 내역 등 중요한 데이터를 안전하게 보관하고 자동 백업해 주는 관계형 DB',
    analogy: '금고 관리와 자동 백업, 재난 복구까지 전담 사서가 철저하게 관리해 주는 안심 문서고',
    detail: 'MySQL, PostgreSQL 등을 지원하며 다중 가용영역(Multi-AZ) 동기 복제를 통해 한 데이터센터에 정전/화재가 나도 데이터 유실 없이 자동 페일오버(Failover)됩니다.'
  },
  cloudwatch: {
    id: 'cloudwatch',
    name: 'Amazon CloudWatch',
    fullName: 'Amazon CloudWatch (모니터링 & 알람)',
    category: '관리 및 거버넌스',
    color: '#E05344',
    icon: '📈',
    shortDesc: '서버의 CPU, 네트워크, 에러 로그를 24시간 실시간 감시하고 경보를 울려주는 관제탑',
    analogy: '환자의 심박수와 체온을 모니터링하다 이상 수치가 나오면 삐- 소리를 내며 의사를 부르는 의료 모니터',
    detail: '시스템 지표를 실시간 수집하여 대시보드에 시각화하고, CPU가 70%를 넘으면 Auto Scaling을 트리거하여 서버를 증설하도록 명령을 내립니다.'
  }
};

const ARCHITECTURES = {
  single: {
    id: 'single',
    title: '단일 EC2 서버형 아키텍처',
    badge: '초심자·소규모 추천',
    badgeColor: '#10B981',
    summary: '하나의 가상 서버(EC2)에 웹 서버와 데이터베이스를 함께 또는 단순 연결하여 운영하는 기본형 구조',
    targetUsers: '10 ~ 1,000명',
    targetStorage: '1GB ~ 100GB',
    services: ['route53', 'ec2', 's3', 'rds'],
    steps: {
      step1_desc: `
        <strong>구성 설명:</strong><br>
        사용자가 도메인(Route 53)으로 접속하면 요청이 <strong>단 1대의 Amazon EC2 가상 서버</strong>로 직접 전달됩니다.<br>
        정적 파일은 <strong>Amazon S3</strong>에 저장하고 회원 정보는 <strong>Amazon RDS</strong>가 처리합니다.
        구조가 매우 단순하여 학교 동아리나 개인 포트폴리오 사이트 실습에 가장 이상적인 입문 아키텍처입니다.
      `,
      step2_pros_cons: {
        pros: [
          '설정 및 배포가 매우 단순하고 직관적 (초보자 친화적)',
          '운영 구성 요소가 적어 월 고정 비용이 가장 저렴 ($25 ~ $40 내외)',
          '복잡한 로드밸런서나 네트워킹 라우팅 설정이 필요 없음'
        ],
        cons: [
          '단일 장애점(SPOF): 해당 EC2 서버 1대가 다운되면 사이트 전체가 마비됨',
          '갑작스러운 트래픽 폭증(1,000명 이상) 시 CPU 부하 100%로 접속 불가 발생',
          '서버 정기 점검이나 업데이트 시 서비스 중단 불가피'
        ]
      },
      step3_suitable: `
        <strong>실제 적합한 서비스 상황:</strong><br>
        • <strong>학급 학예회/동아리 홈페이지</strong>, 교내 축제 안내 웹페이지<br>
        • 학생 포트폴리오 사이트, 소규모 블로그, 개발 초기 프로토타입 단계<br>
        <span class="highlight-text">💡 인과관계:</span> 동시 접속자가 수십~수백 명 수준일 때는 여러 대의 서버나 로드밸런서를 유지하는 비용이 낭비이므로, 단일 인스턴스로 최소 비용을 실현하는 것이 가장 합리적입니다.
      `
    }
  },
  loadbalancer: {
    id: 'loadbalancer',
    title: '로드밸런서 + 오토스케일링형 아키텍처',
    badge: '대규모·엔터프라이즈 표준',
    badgeColor: '#3B82F6',
    summary: 'ALB로 트래픽을 분산하고, 접속자 수에 따라 EC2 서버가 자동으로 늘어나고 줄어드는 탄력적 고가용성 구조',
    targetUsers: '1,000 ~ 100,000명',
    targetStorage: '100GB ~ 2TB',
    services: ['route53', 'waf', 'vpc', 'alb', 'ec2', 'elasticache', 'rds', 's3', 'cloudwatch'],
    steps: {
      step1_desc: `
        <strong>구성 설명:</strong><br>
        <strong>Route 53</strong>과 <strong>AWS WAF 방화벽</strong>을 통과한 트래픽이 <strong>Application Load Balancer(ALB)</strong>로 유입됩니다.<br>
        트래픽이 급증하면 <strong>Auto Scaling Group</strong>이 감지하여 EC2 서버를 2대에서 최대 10대까지 즉시 자동 증설(Scale-Out)합니다.
        자주 찾는 데이터는 <strong>ElastiCache(Redis)</strong>가 캐싱하고, 데이터베이스는 <strong>Amazon RDS Multi-AZ</strong>로 이중화되어 장애 시에도 무중단 서비스를 유지합니다.
      `,
      step2_pros_cons: {
        pros: [
          '고가용성(High Availability): 서버 1~2대가 고장 나도 정상 서버가 즉시 트래픽을 인수하여 무중단 운영',
          '탄력성(Elasticity): 트래픽이 몰릴 때 자동으로 확장되고, 새벽에는 축소되어 유연한 비용 관리',
          'ElastiCache와 ALB 분산으로 수만 명의 동시 접속자도 30~50ms의 초고속 응답 속도 유지'
        ],
        cons: [
          'ALB 기본 운용비 + 다중 EC2 + Multi-AZ RDS로 인해 기본 인프라 유지 비용 증가',
          'VPC 서브넷 설계, 보안 그룹, 헬스 체크 등 아키텍처 구성 및 모니터링 난이도 높음'
        ]
      },
      step3_suitable: `
        <strong>실제 적합한 서비스 상황:</strong><br>
        • <strong>전국 고등학교 수강신청 시스템, 수능 성적 발표 사이트, 대형 콘서트 티켓팅</strong><br>
        • 블랙프라이데이 e-커머스 쇼핑몰, 실시간 금융 거래 시스템, 대규모 모바일 게임 백엔드<br>
        <span class="highlight-text">💡 인과관계:</span> 수만 명이 동시에 접속할 때는 단일 서버가 즉시 멈추므로, 로드밸런서가 교통정리를 하고 EC2를 실시간 복제하며, Redis 캐시로 DB 부하를 차단해야만 서비스가 다운되지 않습니다.
      `
    }
  },
  serverless: {
    id: 'serverless',
    title: '서버리스 (Lambda + S3)형 아키텍처',
    badge: '현대적 클라우드 네이티브',
    badgeColor: '#EC4899',
    summary: '24시간 켜져 있는 가상 서버 없이, 이벤트 요청 시에만 실행되는 Lambda와 대용량 S3 스토리지를 결합한 최신 구조',
    targetUsers: '가변 트래픽 (10 ~ 100,000명)',
    targetStorage: '1TB ~ 10TB+',
    services: ['route53', 'cloudfront', 's3', 'lambda', 'rds', 'cloudwatch'],
    steps: {
      step1_desc: `
        <strong>구성 설명:</strong><br>
        대용량 미디어 파일과 웹 프론트엔드는 <strong>Amazon S3 + CloudFront CDN</strong>을 통해 전 세계 엣지에서 초고속으로 서빙됩니다.<br>
        사용자의 동적 API 요청은 <strong>AWS Lambda</strong>가 밀리초(ms) 단위로 깨어나 코드를 실행하고 즉시 사라집니다.
        서버를 계속 켜둘 필요가 없어 손님이 없는 시간대에는 컴퓨팅 비용이 0원에 수렴합니다!
      `,
      step2_pros_cons: {
        pros: [
          '서버 관리 제로(NoOps): OS 보안 패치, 서버 하드웨어 용량 산정이 전혀 필요 없음',
          '호출된 횟수와 실행 시간(ms)만큼만 요금 발생 (유휴 시간 비용 0원)',
          'Amazon S3와 CloudFront를 통해 테라바이트(TB) 단위의 대용량 동영상/에셋을 저비용 초고속 전송'
        ],
        cons: [
          '콜드 스타트(Cold Start): 한동안 요청이 없다가 처음 실행될 때 미세한 지연(0.1~0.4초) 발생 가능',
          '단일 실행 시간 15분 제한이 있어 장시간 복잡한 빅데이터 연산에는 부적합'
        ]
      },
      step3_suitable: `
        <strong>실제 적합한 서비스 상황:</strong><br>
        • <strong>대용량 동영상/미디어 스트리밍 및 파일 공유 플랫폼</strong> (넷플릭스/유튜브 스타일)<br>
        • 이미지 리사이징 자동화 시스템, IoT 센서 데이터 수집기, 챗봇 및 서버리스 웹앱<br>
        <span class="highlight-text">💡 인과관계:</span> 데이터 용량이 테라바이트(TB) 단위로 크거나 트래픽 변동이 불규칙할 때 상시 가동 서버에 비싼 하드디스크를 달면 비용이 폭증합니다. S3 객체 스토리지와 CloudFront 캐시, 필요할 때만 호출되는 Lambda를 결합하는 것이 압도적인 비용 절감의 정답입니다.
      `
    }
  }
};

const PRESETS = [
  {
    id: 'class_home',
    title: '학급 홈페이지',
    sub: '소규모 트래픽',
    icon: '🏫',
    users: 50,
    storage: 15,
    tag: '단일 EC2 권장',
    options: { cloudfront: false, elasticache: false, waf: false, multiAZ: false }
  },
  {
    id: 'ticket_rush',
    title: '수강신청 / 티켓팅 오픈',
    sub: '급증하는 트래픽',
    icon: '⚡',
    users: 65000,
    storage: 250,
    tag: '로드밸런서+오토스케일 권장',
    options: { cloudfront: true, elasticache: true, waf: true, multiAZ: true }
  },
  {
    id: 'media_stream',
    title: '대용량 미디어 스트리밍',
    sub: '안정적 대용량 스토리지',
    icon: '🎬',
    users: 15000,
    storage: 8192, // 8TB
    tag: '서버리스(Lambda+S3) 권장',
    options: { cloudfront: true, elasticache: false, waf: true, multiAZ: false }
  },
  {
    id: 'black_friday',
    title: '블랙프라이데이 쇼핑몰',
    sub: 'DDoS 보안 & 극한 부하',
    icon: '🛍️',
    users: 92000,
    storage: 1500,
    tag: '풀스택 엔터프라이즈',
    options: { cloudfront: true, elasticache: true, waf: true, multiAZ: true }
  }
];

// 비용 및 시스템 상태 계산기 (고급 파라미터 반영)
function calculateMetrics(users, storageGB, currentArchId, options = {}) {
  const {
    enableCloudFront = false,
    enableElastiCache = false,
    enableWAF = false,
    enableMultiAZ = false,
    isUnderDDoS = false
  } = options;

  const EXCHANGE_RATE = 1350;

  let ec2Count = 1;
  let ec2CostUSD = 0;
  let albCostUSD = 0;
  let rdsCostUSD = 0;
  let lambdaCostUSD = 0;
  let s3CostUSD = storageGB * 0.023; // S3 표준 $0.023/GB
  let cloudfrontCostUSD = enableCloudFront ? Math.max(8.5, (users * 0.0006) + (storageGB * 0.005)) : 0;
  let elasticacheCostUSD = enableElastiCache ? 25.0 : 0; // cache.t3.medium
  let wafCostUSD = enableWAF ? 15.0 : 0; // WAF 기본 WebACL + 규칙 요금
  let route53CostUSD = 0.5; // Hosted Zone 기본 요금

  let effectiveUsers = users;
  // CloudFront 활성화 시 엣지 캐싱으로 원본 유입 트래픽 65% 절감!
  if (enableCloudFront) {
    effectiveUsers = Math.round(users * 0.35);
  }

  let cpuPercent = 10;
  let latencyMs = 25;
  let healthStatus = 'Healthy (안정적 운영)';

  if (currentArchId === 'single') {
    ec2Count = 1;
    ec2CostUSD = 18.0;
    rdsCostUSD = enableMultiAZ ? 35.0 : 15.0;

    const loadFactor = effectiveUsers / 700;
    cpuPercent = Math.min(100, Math.max(10, Math.round(12 + loadFactor * 85)));
    latencyMs = Math.round(25 + Math.pow(loadFactor, 2.3) * 280);

    // ElastiCache 활성화 시 DB 및 서버 부하 35% 완화
    if (enableElastiCache) {
      cpuPercent = Math.max(10, Math.round(cpuPercent * 0.65));
      latencyMs = Math.max(8, Math.round(latencyMs * 0.5));
    }

    // DDoS 공격 상황
    if (isUnderDDoS) {
      if (enableWAF) {
        // WAF가 차단함
        healthStatus = 'Healthy (WAF 방화벽이 악성 공격 차단)';
      } else {
        cpuPercent = 100;
        latencyMs = 4500;
        healthStatus = 'Critical (DDoS 공격으로 서버 마비!)';
      }
    } else {
      if (users > 4500) {
        cpuPercent = 100;
        latencyMs = 3800;
        healthStatus = 'Critical (서버 과부하 마비)';
      } else if (users > 1200) {
        healthStatus = 'Degraded (응답 지연 주의)';
      }
    }
  } else if (currentArchId === 'loadbalancer') {
    albCostUSD = 22.0;
    rdsCostUSD = enableMultiAZ ? 75.0 : 45.0;

    // 인스턴스 자동 스케일
    if (effectiveUsers < 2000) ec2Count = 2;
    else if (effectiveUsers < 8000) ec2Count = 3;
    else if (effectiveUsers < 25000) ec2Count = 4;
    else if (effectiveUsers < 50000) ec2Count = 6;
    else ec2Count = 8;

    ec2CostUSD = ec2Count * 18.0;
    const loadPerServer = effectiveUsers / (ec2Count * 1100);
    cpuPercent = Math.min(85, Math.max(22, Math.round(28 + loadPerServer * 32)));
    latencyMs = Math.round(28 + loadPerServer * 22);

    if (enableElastiCache) {
      cpuPercent = Math.max(15, Math.round(cpuPercent * 0.7));
      latencyMs = Math.max(6, Math.round(latencyMs * 0.45)); // 캐시 히트로 6~15ms 달성
    }

    if (isUnderDDoS) {
      if (enableWAF) {
        healthStatus = 'Healthy (WAF가 수만 건 악성 트래픽 완벽 필터링)';
      } else {
        cpuPercent = 95;
        latencyMs = 1200;
        healthStatus = 'Degraded (WAF 미탑재로 부하 급증)';
      }
    } else {
      healthStatus = 'Healthy (오토스케일링 무중단 분산)';
    }
  } else if (currentArchId === 'serverless') {
    ec2Count = 0;
    ec2CostUSD = 0;
    albCostUSD = 0;
    rdsCostUSD = enableMultiAZ ? 45.0 : 25.0;

    const monthlyRequests = (effectiveUsers * 25 * 30);
    lambdaCostUSD = Math.max(2, (monthlyRequests / 1000000) * 0.20 + (monthlyRequests * 0.0000002));

    cpuPercent = Math.min(60, Math.max(15, Math.round(16 + (effectiveUsers / 100000) * 30)));
    latencyMs = enableCloudFront ? Math.round(12 + (users / 100000) * 8) : Math.round(24 + (users / 100000) * 15);

    if (isUnderDDoS && !enableWAF) {
      healthStatus = 'Degraded (요청 급증으로 Lambda 동시성 한도 접근)';
    } else {
      healthStatus = 'Healthy (서버리스 자동 탄력 확장)';
    }
  }

  const totalUSD = ec2CostUSD + albCostUSD + rdsCostUSD + lambdaCostUSD + s3CostUSD +
                   cloudfrontCostUSD + elasticacheCostUSD + wafCostUSD + route53CostUSD;
  const totalKRW = Math.round(totalUSD * EXCHANGE_RATE);

  return {
    ec2Count,
    ec2CostUSD: Math.round(ec2CostUSD),
    albCostUSD: Math.round(albCostUSD),
    rdsCostUSD: Math.round(rdsCostUSD),
    lambdaCostUSD: Math.round(lambdaCostUSD),
    s3CostUSD: Math.round(s3CostUSD),
    cloudfrontCostUSD: Math.round(cloudfrontCostUSD),
    elasticacheCostUSD: Math.round(elasticacheCostUSD),
    wafCostUSD: Math.round(wafCostUSD),
    route53CostUSD: Math.round(route53CostUSD),
    totalUSD: Math.round(totalUSD),
    totalKRW,
    cpuPercent,
    latencyMs,
    healthStatus
  };
}

// 자동 추천 판별 로직
function determineRecommendedArchitecture(users, storageGB) {
  if (storageGB >= 2048) {
    return 'serverless';
  }
  if (users >= 1000) {
    return 'loadbalancer';
  }
  return 'single';
}
