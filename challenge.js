/**
 * challenge.js
 * 고등학교 정보 교과 연계 클라우드 시스템 구성 인터랙티브 실습 평가 시스템
 */

// 1. 문제 4개 정의
const CHALLENGES = [
  {
    id: 1,
    title: '동아리 학예회 웹사이트 구축 (저비용 & 입문)',
    level: '초급 (Level 1)',
    levelColor: '#10B981',
    scenario: `
      우리 학교 프로그래밍 동아리에서 <strong>'동아리 축제 홍보 및 작품 갤러리'</strong> 웹사이트를 개설하려고 합니다.<br>
      • <strong>예상 접속자:</strong> 평상시 30명, 축제 당일 최대 300명 내외 (소규모 트래픽)<br>
      • <strong>데이터:</strong> 학생 작품 사진 약 15GB<br>
      • <strong>핵심 제약 조건:</strong> 동아리 운영비 예산이 빠듯하여 <strong>월 비용 $40 이하</strong>로 유지되어야 합니다.
    `,
    goals: {
      maxCost: 45,
      minTraffic: 300,
      mustInclude: ['ec2_single', 's3', 'rds_single'],
      mustExclude: ['alb', 'ec2_asg'],
      recommendation: '단일 EC2 + S3 + 단일 RDS'
    },
    hints: [
      '트래픽이 수백 명 수준일 때는 비싼 ALB나 오토스케일링을 넣으면 예산($40)을 초과하게 됩니다.',
      '학생들의 고화질 사진은 EC2 하드디스크 대신 안전하고 저렴한 Amazon S3에 저장해야 합니다.',
      '서버는 t3.small 급의 단일 EC2 1대로 충분합니다.'
    ],
    explanation: `
      🎉 <strong>정답 해설:</strong> 소규모 트래픽(300명 이하)에는 고가의 로드밸런서(ALB)와 다중 서버를 둘 필요가 없습니다. 
      <strong>단일 EC2</strong>로 웹 서버를 띄우고, 사진은 <strong>Amazon S3</strong>에 저렴하게 저장하며, 방명록 데이터는 <strong>단일 RDS</strong>로 구성하는 것이 예산($40 이하)을 지키는 가장 경제적이고 올바른 설계입니다.
    `
  },
  {
    id: 2,
    title: '전교생 동시 수강신청 시스템 마비 방어 (고가용성 & 탄력성)',
    level: '중급 (Level 2)',
    levelColor: '#3B82F6',
    scenario: `
      2학기 교과목 수강신청 날 오전 9시 정각, <strong>전교생 및 학부모 50,000명</strong>이 동시에 로그인하여 신청 버튼을 연타합니다!<br>
      • <strong>예상 접속자:</strong> 순간 최대 50,000명 동시 폭증 (급격한 트래픽 스파이크)<br>
      • <strong>데이터:</strong> 신청 내역 및 학생 명단 80GB<br>
      • <strong>핵심 제약 조건:</strong> 서버 다운 0건, 응답 지연 100ms 이내, 서버 1대가 다운되어도 무중단 운영 필수!
    `,
    goals: {
      minTraffic: 50000,
      mustInclude: ['alb', 'ec2_asg', 'rds_multi', 'elasticache'],
      mustExclude: ['ec2_single', 'rds_single'],
      recommendation: 'ALB + EC2 Auto Scaling + ElastiCache + Multi-AZ RDS'
    },
    hints: [
      '단 1대의 단일 EC2로는 5만 명의 동시 요청을 감당하지 못하고 1초 만에 CPU 100%로 마비됩니다.',
      '수만 명의 트래픽을 골고루 나누려면 ALB가 필수이며, 트래픽에 따라 서버가 복제되는 Auto Scaling이 필요합니다.',
      '수강 과목 잔여석 조회가 반복되므로, DB 앞단에 ElastiCache(Redis)를 두어야 데이터베이스가 뻗지 않습니다.'
    ],
    explanation: `
      🎉 <strong>정답 해설:</strong> 5만 명의 폭발적 스파이크 트래픽은 <strong>ALB</strong>를 최전방에 배치하여 트래픽을 분산하고, <strong>Auto Scaling</strong>으로 EC2를 6~8대 이상 자동 증설해야 합니다. 또한 수강 신청 잔여석 확인 요청이 폭주하므로 <strong>ElastiCache(Redis)</strong>로 반복 조회를 캐싱하고, <strong>RDS Multi-AZ</strong>로 데이터 안전성을 확보해야 완벽한 무중단 서비스를 달성할 수 있습니다!
    `
  },
  {
    id: 3,
    title: '전국 고교 축제 4K 미디어 스트리밍 (대용량 & 서버리스)',
    level: '심화 (Level 3)',
    levelColor: '#EC4899',
    scenario: `
      전국 고등학교 밴드/댄스 축제 4K 초고화질 영상 플랫폼을 운영합니다.<br>
      • <strong>예상 접속자:</strong> 하루 2만 명, 간헐적 유휴 시간 존재 (새벽에는 접속자 0명)<br>
      • <strong>데이터 용량:</strong> 4K 동영상 원본 총 <strong>8TB (8,192GB)</strong> 이상<br>
      • <strong>핵심 제약 조건:</strong> 상시 가동 서버의 비싼 대용량 디스크 유지비를 낭비하지 말고, 전 세계 어디서든 버퍼링 없이 재생되어야 합니다.
    `,
    goals: {
      minStorage: 5000,
      mustInclude: ['cloudfront', 's3', 'lambda'],
      mustExclude: ['ec2_single'],
      recommendation: 'CloudFront (CDN) + Amazon S3 + AWS Lambda (서버리스)'
    },
    hints: [
      '8TB의 동영상을 일반 EC2 가상서버 하드디스크에 저장하면 비용이 천문학적으로 발생합니다.',
      '용량이 무제한이고 가장 저렴한 객체 스토리지는 Amazon S3입니다.',
      '동영상을 전 세계 유저에게 끊김 없이 초고속 스트리밍하려면 Amazon CloudFront(CDN)가 필수입니다.',
      '손님이 없을 때 비용을 0원으로 아끼려면 상시 켜져 있는 EC2 대신 호출 시에만 작동하는 AWS Lambda를 선택하세요.'
    ],
    explanation: `
      🎉 <strong>정답 해설:</strong> 8TB 이상의 초거대 미디어 파일을 상시 EC2 서버에 두는 것은 비용적 재앙입니다. 
      무제한 객체 스토리지 <strong>Amazon S3</strong>에 영상을 저장하고, 전 세계 엣지 캐시인 <strong>Amazon CloudFront(CDN)</strong>를 연결하여 버퍼링을 없앱니다. 동적 로그인 및 댓글 처리는 <strong>AWS Lambda</strong>로 서버리스 처리하여 유휴 시간 비용을 0원으로 최적화하는 것이 정답입니다!
    `
  },
  {
    id: 4,
    title: '전교 학생회장 전자 투표 및 성적 조회 (철통 보안 & 재난 복구)',
    level: '최고급 (Level 4)',
    levelColor: '#DD344C',
    scenario: `
      전교생의 민감한 성적 조회와 학생회장 전자 투표가 동시에 진행됩니다.<br>
      • <strong>보안 위협:</strong> 악의적인 학생의 <strong>대규모 DDoS 트래픽 공격 및 SQL 인젝션</strong> 시도 감지<br>
      • <strong>안정성 요구:</strong> 데이터센터 한 곳에 정전이나 화재가 발생해도 투표 데이터가 1초도 유실되지 않아야 함<br>
      • <strong>핵심 제약 조건:</strong> 악성 패킷은 서버 도달 전 100% 차단, DB 실시간 이중화 복제, 24시간 실시간 이상 징후 알람 필수!
    `,
    goals: {
      mustInclude: ['waf', 'alb', 'ec2_asg', 'rds_multi', 'cloudwatch'],
      mustExclude: ['rds_single'],
      recommendation: 'AWS WAF + ALB + Auto Scaling EC2 + RDS Multi-AZ + CloudWatch'
    },
    hints: [
      '해킹 및 DDoS 공격 패킷을 사전에 걸러내려면 웹 방화벽(AWS WAF & Shield)이 필수입니다.',
      '데이터센터 정전 시에도 투표 데이터를 지키려면 일반 RDS가 아닌 다른 가용영역에 대기 DB를 두는 RDS Multi-AZ가 필수입니다.',
      '24시간 이상 징후를 감시하고 관리자에게 경보를 울리려면 Amazon CloudWatch가 필요합니다.'
    ],
    explanation: `
      🎉 <strong>정답 해설:</strong> 보안과 무결성이 생명인 시스템입니다! 
      최전방에 <strong>AWS WAF</strong>를 두어 DDoS와 해킹 공격을 사전 차단하고, <strong>ALB</strong>와 <strong>EC2 Auto Scaling</strong>으로 부하를 분산합니다. 데이터는 <strong>Amazon RDS Multi-AZ</strong>로 다른 데이터센터에 실시간 동기 복제하여 재해에 대비하고, <strong>Amazon CloudWatch</strong>로 시스템 이상을 24시간 감시해야 엔터프라이즈급 완벽한 신뢰성을 보장할 수 있습니다!
    `
  }
];

// 2. 사용 가능한 AWS 서비스 블록 팔레트
const PALETTE_SERVICES = [
  { id: 'route53', name: 'Amazon Route 53', icon: '🌐', cat: 'DNS', cost: 1, desc: '도메인 해석 및 지연 시간 기반 라우팅' },
  { id: 'cloudfront', name: 'Amazon CloudFront', icon: '⚡', cat: 'CDN', cost: 12, desc: '전 세계 엣지 캐싱 및 미디어 가속' },
  { id: 'waf', name: 'AWS WAF & Shield', icon: '🛡️', cat: '보안', cost: 15, desc: 'DDoS 공격 및 해킹 패킷 사전 차단' },
  { id: 'alb', name: 'Application Load Balancer', icon: '⚖️', cat: '트래픽', cost: 22, desc: '대규모 유저 요청을 다중 서버로 분산' },
  { id: 'ec2_single', name: 'Amazon EC2 (단일 1대)', icon: '💻', cat: '컴퓨팅', cost: 18, desc: '소규모 웹/앱을 위한 단일 가상 컴퓨터' },
  { id: 'ec2_asg', name: 'EC2 Auto Scaling 그룹', icon: '🚀', cat: '컴퓨팅', cost: 72, desc: '트래픽에 따라 2~8대 자동 증설 및 복제' },
  { id: 'lambda', name: 'AWS Lambda (서버리스)', icon: '⚡', cat: '컴퓨팅', cost: 8, desc: '호출 시에만 실행되는 서버리스 함수' },
  { id: 'elasticache', name: 'Amazon ElastiCache (Redis)', icon: '🧠', cat: '캐시', cost: 25, desc: '반복 쿼리를 초고속 RAM에서 5ms 만에 반환' },
  { id: 's3', name: 'Amazon S3 (객체 스토리지)', icon: '🪣', cat: '스토리지', cost: 10, desc: '용량 무제한의 저비용 안전 파일 보관소' },
  { id: 'rds_single', name: 'Amazon RDS (단일 인스턴스)', icon: '🗄️', cat: '데이터베이스', cost: 16, desc: '소규모 데이터 관리를 위한 단일 관계형 DB' },
  { id: 'rds_multi', name: 'Amazon RDS (Multi-AZ 이중화)', icon: '🔁', cat: '데이터베이스', cost: 55, desc: '재해 복구를 위해 대기 DB에 실시간 동기 복제' },
  { id: 'cloudwatch', name: 'Amazon CloudWatch', icon: '📈', cat: '모니터링', cost: 5, desc: '24시간 시스템 지표 감시 및 실시간 경보' }
];

// 3. 상태 관리
let currentQuestionIndex = 0;
let userArchitectures = { 0: [], 1: [], 2: [], 3: [] }; // 문제별 선택된 서비스 ID 배열
let challengeScores = { 0: false, 1: false, 2: false, 3: false };

document.addEventListener('DOMContentLoaded', () => {
  renderQuestionNav();
  renderPalette();
  loadQuestion(0);
  bindGlobalEvents();
});

function bindGlobalEvents() {
  document.getElementById('verifyBtn').addEventListener('click', () => {
    verifyCurrentArchitecture();
  });

  document.getElementById('resetArchBtn').addEventListener('click', () => {
    userArchitectures[currentQuestionIndex] = [];
    renderMyArchitecture();
    updateLiveMetrics();
    clearFeedback();
  });

  document.getElementById('showHintBtn').addEventListener('click', () => {
    const q = CHALLENGES[currentQuestionIndex];
    const hintBox = document.getElementById('hintBox');
    hintBox.classList.toggle('open');
    if (hintBox.classList.contains('open')) {
      hintBox.innerHTML = `
        <div class="hint-header">💡 아키텍트 힌트 가이드</div>
        <ul>${q.hints.map(h => `<li>${h}</li>`).join('')}</ul>
      `;
    }
  });
}

function renderQuestionNav() {
  const nav = document.getElementById('questionTabs');
  nav.innerHTML = CHALLENGES.map((ch, idx) => `
    <button class="q-tab-btn ${idx === 0 ? 'active' : ''} ${challengeScores[idx] ? 'passed' : ''}" 
            id="qTab_${idx}" onclick="switchQuestion(${idx})">
      <span class="q-num">Q${idx + 1}</span>
      <span class="q-title-short">${ch.title.split(' ')[0]} ${challengeScores[idx] ? '✅' : ''}</span>
    </button>
  `).join('');
}

window.switchQuestion = (index) => {
  currentQuestionIndex = index;
  document.querySelectorAll('.q-tab-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx === index);
  });
  loadQuestion(index);
};

function loadQuestion(index) {
  const q = CHALLENGES[index];
  document.getElementById('qBadge').textContent = q.level;
  document.getElementById('qBadge').style.backgroundColor = q.levelColor;
  document.getElementById('qTitle').textContent = `[문제 ${index + 1}] ${q.title}`;
  document.getElementById('qScenario').innerHTML = q.scenario;

  const hintBox = document.getElementById('hintBox');
  hintBox.classList.remove('open');
  hintBox.innerHTML = '';

  clearFeedback();
  renderMyArchitecture();
  updateLiveMetrics();
}

// 팔레트 렌더링
function renderPalette() {
  const container = document.getElementById('paletteGrid');
  container.innerHTML = PALETTE_SERVICES.map(s => `
    <div class="palette-card" id="palette_${s.id}" onclick="toggleServiceSelection('${s.id}')">
      <div class="p-icon-box">${s.icon}</div>
      <div class="p-info">
        <div class="p-name">${s.name}</div>
        <div class="p-desc">${s.desc}</div>
        <div class="p-cost">예상 비용: 약 $${s.cost}/월</div>
      </div>
      <button class="p-add-btn" aria-label="추가 또는 제거">+</button>
    </div>
  `).join('');
}

// 서비스 선택 토글
window.toggleServiceSelection = (serviceId) => {
  const currentList = userArchitectures[currentQuestionIndex];
  const idx = currentList.indexOf(serviceId);

  // 단일 EC2와 오토스케일링 EC2 상호 배타적 선택 제어
  if (serviceId === 'ec2_single' && currentList.includes('ec2_asg')) {
    currentList.splice(currentList.indexOf('ec2_asg'), 1);
  } else if (serviceId === 'ec2_asg' && currentList.includes('ec2_single')) {
    currentList.splice(currentList.indexOf('ec2_single'), 1);
  }

  // 단일 RDS와 Multi-AZ RDS 상호 배타적 제어
  if (serviceId === 'rds_single' && currentList.includes('rds_multi')) {
    currentList.splice(currentList.indexOf('rds_multi'), 1);
  } else if (serviceId === 'rds_multi' && currentList.includes('rds_single')) {
    currentList.splice(currentList.indexOf('rds_single'), 1);
  }

  if (idx > -1) {
    currentList.splice(idx, 1);
  } else {
    currentList.push(serviceId);
  }

  renderMyArchitecture();
  updateLiveMetrics();
};

// 내가 조립한 아키텍처 캔버스/리스트 렌더링
function renderMyArchitecture() {
  const currentList = userArchitectures[currentQuestionIndex];
  const container = document.getElementById('myArchSlotContainer');

  // 팔레트 카드 선택 하이라이트 동기화
  PALETTE_SERVICES.forEach(s => {
    const el = document.getElementById(`palette_${s.id}`);
    if (el) {
      if (currentList.includes(s.id)) {
        el.classList.add('selected');
        el.querySelector('.p-add-btn').textContent = '✓';
      } else {
        el.classList.remove('selected');
        el.querySelector('.p-add-btn').textContent = '+';
      }
    }
  });

  if (currentList.length === 0) {
    container.innerHTML = `
      <div class="empty-arch-msg">
        <span class="empty-icon">🏗️</span>
        <p>왼쪽 팔레트에서 문제 요구사항에 맞는 AWS 서비스를 클릭하여 배치하세요.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = currentList.map(id => {
    const s = PALETTE_SERVICES.find(item => item.id === id);
    if (!s) return '';
    return `
      <div class="my-arch-card" onclick="toggleServiceSelection('${s.id}')">
        <span class="m-icon">${s.icon}</span>
        <div class="m-text">
          <strong>${s.name}</strong>
          <span class="m-cat">${s.cat}</span>
        </div>
        <button class="m-remove-btn" title="제거">&times;</button>
      </div>
    `;
  }).join('');
}

// 실시간 지표 HUD 업데이트
function updateLiveMetrics() {
  const currentList = userArchitectures[currentQuestionIndex];
  const q = CHALLENGES[currentQuestionIndex];

  let totalCost = 0;
  let maxTrafficCapacity = 100;
  let hasHighAvailability = false;
  let hasSecurityWAF = false;

  currentList.forEach(id => {
    const s = PALETTE_SERVICES.find(item => item.id === id);
    if (s) totalCost += s.cost;

    if (id === 'alb') maxTrafficCapacity += 10000;
    if (id === 'ec2_asg') maxTrafficCapacity += 70000;
    if (id === 'ec2_single') maxTrafficCapacity += 800;
    if (id === 'lambda') maxTrafficCapacity += 50000;
    if (id === 'cloudfront') maxTrafficCapacity += 30000;
    if (id === 'elasticache') maxTrafficCapacity += 20000;

    if (id === 'rds_multi' || id === 'ec2_asg') hasHighAvailability = true;
    if (id === 'waf') hasSecurityWAF = true;
  });

  // HUD 요소 갱신
  document.getElementById('hudCostVal').textContent = `$${totalCost} /월`;
  document.getElementById('hudCapacityVal').textContent = `약 ${maxTrafficCapacity.toLocaleString()}명`;
  document.getElementById('hudHaVal').textContent = hasHighAvailability ? '보장 (다중 AZ)' : '취약 (단일 장애점)';
  document.getElementById('hudHaVal').className = hasHighAvailability ? 'hud-val good' : 'hud-val warn';

  document.getElementById('hudSecVal').textContent = hasSecurityWAF ? '안전 (WAF 탑재)' : '기본 방화벽';
  document.getElementById('hudSecVal').className = hasSecurityWAF ? 'hud-val good' : 'hud-val neutral';
}

// 아키텍처 검증 & 채점 엔진
function verifyCurrentArchitecture() {
  const currentList = userArchitectures[currentQuestionIndex];
  const q = CHALLENGES[currentQuestionIndex];
  const resultBox = document.getElementById('feedbackResultBox');

  if (currentList.length === 0) {
    showFeedback(false, '⚠️ 서비스를 하나 이상 선택한 후 검증 버튼을 눌러주세요.');
    return;
  }

  // 1. 필수 포함 서비스 검사
  const missingServices = q.goals.mustInclude.filter(reqId => !currentList.includes(reqId));
  if (missingServices.length > 0) {
    const missingNames = missingServices.map(id => PALETTE_SERVICES.find(s => s.id === id)?.name).join(', ');
    showFeedback(false, `❌ <strong>필수 핵심 서비스 누락:</strong> 현재 아키텍처에 <strong>[${missingNames}]</strong>이(가) 포함되어 있지 않아 요구조건을 충족할 수 없습니다.`);
    return;
  }

  // 2. 포함 금지 서비스 검사 (비용 낭비나 잘못된 구조)
  const forbiddenServices = (q.goals.mustExclude || []).filter(forbId => currentList.includes(forbId));
  if (forbiddenServices.length > 0) {
    const forbNames = forbiddenServices.map(id => PALETTE_SERVICES.find(s => s.id === id)?.name).join(', ');
    showFeedback(false, `❌ <strong>비효율적/부적절한 구성:</strong> 이 시나리오에서는 <strong>[${forbNames}]</strong>이(가) 적절하지 않습니다. (비용 낭비 또는 트래픽 처리 한계)`);
    return;
  }

  // 3. 예산 검사 (최대 비용 초과 여부)
  let totalCost = 0;
  currentList.forEach(id => {
    const s = PALETTE_SERVICES.find(item => item.id === id);
    if (s) totalCost += s.cost;
  });

  if (q.goals.maxCost && totalCost > q.goals.maxCost) {
    showFeedback(false, `❌ <strong>예산 초과:</strong> 총 예상 비용이 $${totalCost}로 목표 예산인 $${q.goals.maxCost}를 초과했습니다! 불필요하게 비싼 고사양 서비스를 제외해 보세요.`);
    return;
  }

  // 4. 모든 조건 통과 -> 합격!
  challengeScores[currentQuestionIndex] = true;
  document.getElementById(`qTab_${currentQuestionIndex}`).classList.add('passed');
  renderQuestionNav();

  showFeedback(true, `
    <div class="pass-title">🏆 축하합니다! 완벽한 아키텍처 구성입니다!</div>
    <p>${q.explanation}</p>
    <div class="next-action-row">
      ${currentQuestionIndex < 3 
        ? `<button class="btn-next-q" onclick="switchQuestion(${currentQuestionIndex + 1})">다음 문제 도전하기 ➔</button>`
        : `<button class="btn-view-cert" onclick="openCertModal()">🎖️ 최종 아키텍트 인증서 발급받기</button>`}
    </div>
  `);
}

function showFeedback(isSuccess, htmlContent) {
  const box = document.getElementById('feedbackResultBox');
  box.className = `feedback-box ${isSuccess ? 'success' : 'fail'}`;
  box.innerHTML = htmlContent;
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearFeedback() {
  const box = document.getElementById('feedbackResultBox');
  box.className = 'feedback-box hidden';
  box.innerHTML = '';
}

// 최종 인증서 모달
window.openCertModal = () => {
  const passedCount = Object.values(challengeScores).filter(Boolean).length;
  document.getElementById('certScore').textContent = `${passedCount} / 4 문제 완벽 통과`;

  // 로그인된 학생 이름 연동
  const user = typeof GoogleAuthManager !== 'undefined' ? GoogleAuthManager.getUser() : null;
  const nameEl = document.getElementById('certStudentName');
  if (nameEl) {
    if (user && user.name) {
      nameEl.textContent = `${user.name} (${user.school || '고교 정보과'}) 귀하`;
    } else {
      nameEl.textContent = '정보과 학생 귀하 (구글 미로그인)';
    }
  }

  document.getElementById('certModal').classList.add('open');
};

window.closeCertModal = () => {
  document.getElementById('certModal').classList.remove('open');
};
