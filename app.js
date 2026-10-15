/**
 * app.js (확장 버전)
 * CloudFront, ElastiCache, WAF, Multi-AZ, DDoS 공격 시뮬레이션 및 11대 AWS 서비스 도감 연동
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 상태 변수
  let currentUsers = 50;
  let currentStorageGB = 15;
  let currentArchId = 'single';
  let isAutoRecommended = true;
  let soundEnabled = false;

  // 파워 툴킷 옵션
  const toolkitOptions = {
    enableCloudFront: false,
    enableElastiCache: false,
    enableWAF: false,
    enableMultiAZ: false,
    isUnderDDoS: false
  };

  let ddosTimer = null;

  // 2. 캔버스 시뮬레이터 인스턴스
  const simulator = new CloudArchitectureSimulator('cloudCanvas');

  // 노드 클릭 시 도감 모달 연결
  simulator.onNodeClick = (serviceId) => {
    openServiceModal(serviceId);
  };

  // 3. Web Audio 효과음 엔진
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq = 440, type = 'sine', duration = 0.08) {
    if (!soundEnabled) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  }

  // 4. DOM 요소 참조
  const usersSlider = document.getElementById('usersSlider');
  const usersValueDisplay = document.getElementById('usersValueDisplay');
  const usersAnalogy = document.getElementById('usersAnalogy');

  const storageSlider = document.getElementById('storageSlider');
  const storageValueDisplay = document.getElementById('storageValueDisplay');
  const storageAnalogy = document.getElementById('storageAnalogy');

  const simToggleBtn = document.getElementById('simToggleBtn');
  const simStatusBadge = document.getElementById('simStatusBadge');
  const ddosBtn = document.getElementById('ddosBtn');

  // 툴킷 스위치들
  const toggleCloudFront = document.getElementById('toggleCloudFront');
  const toggleElastiCache = document.getElementById('toggleElastiCache');
  const toggleWAF = document.getElementById('toggleWAF');
  const toggleMultiAZ = document.getElementById('toggleMultiAZ');

  const archTabs = document.querySelectorAll('.arch-tab-btn');
  const archTitle = document.getElementById('archTitle');
  const archBadge = document.getElementById('archBadge');
  const archSummary = document.getElementById('archSummary');

  // 결과 카드 3단계
  const resultStep1 = document.getElementById('resultStep1');
  const resultStep2Pros = document.getElementById('resultStep2Pros');
  const resultStep2Cons = document.getElementById('resultStep2Cons');
  const resultStep3 = document.getElementById('resultStep3');

  // 지표 대시보드
  const metricCpuBar = document.getElementById('metricCpuBar');
  const metricCpuText = document.getElementById('metricCpuText');
  const metricCostUsd = document.getElementById('metricCostUsd');
  const metricCostKrw = document.getElementById('metricCostKrw');
  const metricLatency = document.getElementById('metricLatency');
  const latencySubText = document.getElementById('latencySubText');
  const metricHealth = document.getElementById('metricHealth');
  const healthSubText = document.getElementById('healthSubText');
  const serverCountBadge = document.getElementById('serverCountBadge');

  // 모달 요소들
  const serviceModal = document.getElementById('serviceModal');
  const quizModal = document.getElementById('quizModal');
  const costBreakdownModal = document.getElementById('costBreakdownModal');

  // 5. 슬라이더 지수/로그 변환
  function sliderToUsers(val) {
    const minLog = Math.log(10);
    const maxLog = Math.log(100000);
    const scale = (maxLog - minLog) / 100;
    const users = Math.round(Math.exp(minLog + scale * val));
    if (users < 100) return Math.round(users / 5) * 5;
    if (users < 1000) return Math.round(users / 50) * 50;
    if (users < 10000) return Math.round(users / 200) * 200;
    return Math.round(users / 1000) * 1000;
  }

  function usersToSlider(users) {
    const minLog = Math.log(10);
    const maxLog = Math.log(100000);
    const scale = (maxLog - minLog) / 100;
    return Math.round((Math.log(users) - minLog) / scale);
  }

  function sliderToStorage(val) {
    const minLog = Math.log(1);
    const maxLog = Math.log(10240);
    const scale = (maxLog - minLog) / 100;
    const gb = Math.round(Math.exp(minLog + scale * val));
    if (gb < 50) return gb;
    if (gb < 500) return Math.round(gb / 10) * 10;
    if (gb < 2048) return Math.round(gb / 50) * 50;
    return Math.round(gb / 256) * 256;
  }

  function storageToSlider(gb) {
    const minLog = Math.log(1);
    const maxLog = Math.log(10240);
    const scale = (maxLog - minLog) / 100;
    return Math.round((Math.log(gb) - minLog) / scale);
  }

  // 6. 비유 텍스트
  function getUsersAnalogy(users) {
    if (users <= 60) return '🏫 1개 학급 학생 규모 (아주 한산함)';
    if (users <= 350) return '🎒 한 개 학년 전체 학생 규모 (평상시)';
    if (users <= 1200) return '🏫 전교생 및 학부모 동시 접속 (교내 축제)';
    if (users <= 8000) return '🏟️ 종합 실내체육관 관중 만석 규모';
    if (users <= 35000) return '⚽ 대형 프로 축구 경기장 관중 규모';
    return '🎆 여의도 불꽃축제 인파 급증 (폭발적 대규모 트래픽!)';
  }

  function getStorageAnalogy(gb) {
    if (gb <= 15) return '📄 교과서 PDF 및 과제 문서 수천 건';
    if (gb <= 80) return '📸 고화질 수업 사진 및 동아리 앨범 약 3만 장';
    if (gb <= 300) return '💻 풀HD 동아리 축제 영상 약 150편';
    if (gb <= 1500) return '🎬 4K 초고화질 영화 약 80편 분량 (1TB 돌파)';
    if (gb <= 5000) return '🗄️ 전교생 3년 치 모든 활동 영상 및 백업 데이터';
    return '🏢 대형 미디어 방송국 수준의 초거대 스토리지 (10TB)';
  }

  // 7. 메인 UI 갱신 루틴
  function updateAll() {
    usersValueDisplay.textContent = `${currentUsers.toLocaleString()} 명`;
    usersAnalogy.textContent = getUsersAnalogy(currentUsers);

    if (currentStorageGB >= 1024) {
      storageValueDisplay.textContent = `${(currentStorageGB / 1024).toFixed(1)} TB (${currentStorageGB.toLocaleString()} GB)`;
    } else {
      storageValueDisplay.textContent = `${currentStorageGB} GB`;
    }
    storageAnalogy.textContent = getStorageAnalogy(currentStorageGB);

    // 자동 추천 평가
    if (isAutoRecommended) {
      const recommended = determineRecommendedArchitecture(currentUsers, currentStorageGB);
      if (recommended !== currentArchId) {
        currentArchId = recommended;
        showToast(`✨ 규모 변화 감지: [${ARCHITECTURES[recommended].title}]로 자동 전환되었습니다!`);
        playBeep(587, 'triangle', 0.12);
      }
    }

    // 탭 UI
    archTabs.forEach(btn => {
      const arch = btn.getAttribute('data-arch');
      if (arch === currentArchId) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    // 메트릭 계산
    const metrics = calculateMetrics(currentUsers, currentStorageGB, currentArchId, toolkitOptions);

    renderResultCards(currentArchId, metrics);
    renderMetricsDashboard(metrics);

    // 캔버스 반영
    simulator.setArchitecture(currentArchId, currentUsers, currentStorageGB, metrics.ec2Count, toolkitOptions);
  }

  // 8. 결과 카드 렌더링
  function renderResultCards(archId, metrics) {
    const arch = ARCHITECTURES[archId];
    if (!arch) return;

    archTitle.textContent = arch.title;
    archBadge.textContent = arch.badge;
    archBadge.style.backgroundColor = arch.badgeColor;
    archSummary.textContent = arch.summary;

    resultStep1.innerHTML = arch.steps.step1_desc;
    resultStep2Pros.innerHTML = arch.steps.step2_pros_cons.pros
      .map(p => `<li><span class="icon">✅</span> <span>${p}</span></li>`).join('');
    resultStep2Cons.innerHTML = arch.steps.step2_pros_cons.cons
      .map(c => `<li><span class="icon">⚠️</span> <span>${c}</span></li>`).join('');
    resultStep3.innerHTML = arch.steps.step3_suitable;
  }

  // 9. 메트릭 대시보드 렌더링
  function renderMetricsDashboard(metrics) {
    metricCpuText.textContent = `${metrics.cpuPercent}%`;
    metricCpuBar.style.width = `${metrics.cpuPercent}%`;

    if (metrics.cpuPercent > 85) {
      metricCpuBar.style.backgroundColor = '#EF4444';
      metricCpuText.style.color = '#EF4444';
    } else if (metrics.cpuPercent > 60) {
      metricCpuBar.style.backgroundColor = '#F59E0B';
      metricCpuText.style.color = '#F59E0B';
    } else {
      metricCpuBar.style.backgroundColor = '#10B981';
      metricCpuText.style.color = '#10B981';
    }

    metricCostUsd.textContent = `$${metrics.totalUSD.toLocaleString()}`;
    metricCostKrw.textContent = `(약 ₩${metrics.totalKRW.toLocaleString()})`;

    metricLatency.textContent = `${metrics.latencyMs} ms`;
    if (metrics.latencyMs > 500) {
      metricLatency.className = 'metric-val warning';
      latencySubText.textContent = '⚠️ 심각한 지연 발생 (서버 과부하)';
    } else if (metrics.latencyMs <= 15) {
      metricLatency.className = 'metric-val good';
      latencySubText.textContent = '🚀 캐시(CloudFront/Redis) 초고속 응답';
    } else {
      metricLatency.className = 'metric-val good';
      latencySubText.textContent = '쾌적한 응답 속도';
    }

    metricHealth.textContent = metrics.healthStatus;
    if (metrics.healthStatus.includes('Critical')) {
      metricHealth.className = 'status-tag critical';
      healthSubText.textContent = '서버 마비 위기 - 긴급 대응 필요';
    } else if (metrics.healthStatus.includes('Degraded')) {
      metricHealth.className = 'status-tag degraded';
      healthSubText.textContent = '성능 저하 - 스케일아웃/보안 권장';
    } else {
      metricHealth.className = 'status-tag healthy';
      healthSubText.textContent = 'SLA 99.99% 고가용성 유지 중';
    }

    if (currentArchId === 'serverless') {
      serverCountBadge.textContent = '서버리스 (Lambda 가동)';
      serverCountBadge.style.color = '#EC4899';
    } else {
      serverCountBadge.textContent = `EC2 가상서버 ${metrics.ec2Count}대 가동 중`;
      serverCountBadge.style.color = '#FF9900';
    }
  }

  // 10. 슬라이더 이벤트
  usersSlider.addEventListener('input', (e) => {
    isAutoRecommended = true;
    presetButtons.forEach(b => b.classList.remove('active-preset'));
    currentUsers = sliderToUsers(Number(e.target.value));
    updateAll();
  });

  storageSlider.addEventListener('input', (e) => {
    isAutoRecommended = true;
    presetButtons.forEach(b => b.classList.remove('active-preset'));
    currentStorageGB = sliderToStorage(Number(e.target.value));
    updateAll();
  });

  // 11. 툴킷 스위치 이벤트 리스너
  toggleCloudFront.addEventListener('change', (e) => {
    toolkitOptions.enableCloudFront = e.target.checked;
    playBeep(e.target.checked ? 580 : 380, 'sine', 0.08);
    showToast(e.target.checked 
      ? '⚡ Amazon CloudFront(CDN) 활성화! 엣지 캐싱으로 원본 부하가 65% 줄어듭니다.' 
      : 'CloudFront가 비활성화되었습니다.');
    updateAll();
  });

  toggleElastiCache.addEventListener('change', (e) => {
    toolkitOptions.enableElastiCache = e.target.checked;
    playBeep(e.target.checked ? 600 : 380, 'sine', 0.08);
    showToast(e.target.checked 
      ? '🚀 Amazon ElastiCache(Redis) 가동! RAM 캐시로 DB 응답 속도가 0.005초로 빨라집니다.' 
      : 'ElastiCache가 비활성화되었습니다.');
    updateAll();
  });

  toggleWAF.addEventListener('change', (e) => {
    toolkitOptions.enableWAF = e.target.checked;
    playBeep(e.target.checked ? 620 : 380, 'sine', 0.08);
    showToast(e.target.checked 
      ? '🛡️ AWS WAF & Shield 웹 방화벽 탑재! 악성 공격과 DDoS 패킷을 사전 차단합니다.' 
      : 'AWS WAF 방화벽이 해제되었습니다.');
    updateAll();
  });

  toggleMultiAZ.addEventListener('change', (e) => {
    toolkitOptions.enableMultiAZ = e.target.checked;
    playBeep(e.target.checked ? 550 : 380, 'sine', 0.08);
    showToast(e.target.checked 
      ? '🔁 Amazon RDS Multi-AZ 이중화 활성화! 대기 DB가 실시간 동기 복제됩니다.' 
      : 'Multi-AZ 복제가 비활성화되었습니다.');
    updateAll();
  });

  // 12. 프리셋 버튼 바인딩
  const presetButtons = document.querySelectorAll('.preset-card-btn');
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active-preset'));
      btn.classList.add('active-preset');

      const presetId = btn.getAttribute('data-preset');
      const preset = PRESETS.find(p => p.id === presetId);
      if (!preset) return;

      playBeep(520, 'sine', 0.1);

      currentUsers = preset.users;
      currentStorageGB = preset.storage;
      usersSlider.value = usersToSlider(currentUsers);
      storageSlider.value = storageToSlider(currentStorageGB);

      // 프리셋 옵션 동기화
      if (preset.options) {
        toolkitOptions.enableCloudFront = preset.options.cloudfront;
        toolkitOptions.enableElastiCache = preset.options.elasticache;
        toolkitOptions.enableWAF = preset.options.waf;
        toolkitOptions.enableMultiAZ = preset.options.multiAZ;

        toggleCloudFront.checked = preset.options.cloudfront;
        toggleElastiCache.checked = preset.options.elasticache;
        toggleWAF.checked = preset.options.waf;
        toggleMultiAZ.checked = preset.options.multiAZ;
      }

      isAutoRecommended = true;
      updateAll();

      showToast(`🎯 사례 적용됨: '${preset.title}' 시나리오로 변수와 클라우드 옵션이 설정되었습니다.`);
    });
  });

  // 13. 아키텍처 탭 수동 선택
  archTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedArch = btn.getAttribute('data-arch');
      playBeep(440, 'triangle', 0.08);
      currentArchId = selectedArch;
      isAutoRecommended = false;
      showToast(`🔍 수동 아키텍처 실험: [${ARCHITECTURES[selectedArch].title}]를 선택했습니다.`);
      updateAll();
    });
  });

  // 14. 시뮬레이션 시작/정지 토글
  simToggleBtn.addEventListener('click', () => {
    const isRunning = simulator.toggleSimulation();
    if (isRunning) {
      simToggleBtn.innerHTML = '<span>⏹️</span> 시뮬레이션 정지';
      simToggleBtn.classList.add('running');
      simStatusBadge.textContent = '🟢 트래픽 전송 중';
      simStatusBadge.className = 'sim-status-badge active';
      showToast('🚀 트래픽 시뮬레이션 시작! 가상 패킷이 아키텍처를 타고 이동합니다.');
      playBeep(660, 'sine', 0.15);
    } else {
      simToggleBtn.innerHTML = '<span>▶️</span> 트래픽 시뮬레이션 시작';
      simToggleBtn.classList.remove('running');
      simStatusBadge.textContent = '⚪ 대기 중';
      simStatusBadge.className = 'sim-status-badge';
      showToast('⏹️ 트래픽 시뮬레이션이 정지되었습니다.');
      playBeep(330, 'sine', 0.1);
    }
  });

  // 15. DDoS 공격 시뮬레이션 버튼
  if (ddosBtn) {
    ddosBtn.addEventListener('click', () => {
      if (toolkitOptions.isUnderDDoS) {
        // 공격 중지
        toolkitOptions.isUnderDDoS = false;
        ddosBtn.classList.remove('active');
        ddosBtn.innerHTML = '🚨 DDoS 공격 시뮬레이션';
        showToast('🛡️ DDoS 공격이 종료되었습니다.');
        updateAll();
        return;
      }

      // 공격 시작
      toolkitOptions.isUnderDDoS = true;
      ddosBtn.classList.add('active');
      ddosBtn.innerHTML = '⏹️ 공격 중단하기';
      playBeep(220, 'sawtooth', 0.25);

      if (toolkitOptions.enableWAF) {
        showToast('🚨 [DDoS 공격 발생] AWS WAF 방화벽이 빨간색 악성 패킷을 성공적으로 차단(Drop)하고 있습니다!');
      } else {
        showToast('💥 [DDoS 경고!] WAF 방화벽이 꺼져 있어 악성 패킷이 서버로 침투 중입니다! 파워 툴킷에서 WAF를 켜보세요.');
      }

      simulator.startSimulation();
      simToggleBtn.innerHTML = '<span>⏹️</span> 시뮬레이션 정지';
      simToggleBtn.classList.add('running');
      simStatusBadge.textContent = '🚨 DDoS 공격 중';
      simStatusBadge.className = 'sim-status-badge critical';

      updateAll();
    });
  }

  // 스트레스 테스트 버튼
  const stressBtn = document.getElementById('stressBtn');
  if (stressBtn) {
    stressBtn.addEventListener('click', () => {
      currentUsers = 85000;
      usersSlider.value = usersToSlider(currentUsers);
      currentArchId = 'single';
      isAutoRecommended = false;
      updateAll();

      simulator.startSimulation();
      simToggleBtn.innerHTML = '<span>⏹️</span> 시뮬레이션 정지';
      simToggleBtn.classList.add('running');
      simStatusBadge.textContent = '🔥 과부하 발생!';
      simStatusBadge.className = 'sim-status-badge critical';

      playBeep(220, 'sawtooth', 0.3);
      showToast('⚠️ [실험] 단일 서버에 85,000명이 몰려 서버가 마비되었습니다! 로드밸런서와 오토스케일링의 필요성을 확인해 보세요.');
    });
  }

  // 16. AWS 11대 서비스 도감 모달 & 퀵 내비게이션 바
  function openServiceModal(serviceId = 'ec2') {
    renderServiceQuickNav(serviceId);
    showServiceDetail(serviceId);
    serviceModal.classList.add('open');
    playBeep(490, 'sine', 0.08);
  }

  function renderServiceQuickNav(activeId) {
    const nav = document.getElementById('serviceQuickNav');
    if (!nav) return;

    nav.innerHTML = Object.values(AWS_SERVICES).map(s => `
      <button class="quick-nav-pill ${s.id === activeId ? 'active' : ''}" onclick="window.selectServiceModal('${s.id}')">
        <span>${s.icon}</span> ${s.name}
      </button>
    `).join('');
  }

  function showServiceDetail(serviceId) {
    const s = AWS_SERVICES[serviceId];
    if (!s) return;

    document.getElementById('serviceModalTitle').innerHTML = `${s.icon} ${s.name} <span class="sub">(${s.fullName})</span>`;
    document.getElementById('serviceCategory').textContent = s.category;
    document.getElementById('serviceCategory').style.backgroundColor = s.color;
    document.getElementById('serviceAnalogy').textContent = `💡 학생 눈높이 비유: ${s.analogy}`;
    document.getElementById('serviceShortDesc').textContent = s.shortDesc;
    document.getElementById('serviceDetail').textContent = s.detail;
  }

  window.selectServiceModal = (id) => {
    renderServiceQuickNav(id);
    showServiceDetail(id);
    playBeep(520, 'sine', 0.05);
  };

  // 모달 닫기
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      serviceModal.classList.remove('open');
      quizModal.classList.remove('open');
      costBreakdownModal.classList.remove('open');
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target === serviceModal) serviceModal.classList.remove('open');
    if (e.target === quizModal) quizModal.classList.remove('open');
    if (e.target === costBreakdownModal) costBreakdownModal.classList.remove('open');
  });

  const openCatalogBtn = document.getElementById('openCatalogBtn');
  if (openCatalogBtn) {
    openCatalogBtn.addEventListener('click', () => {
      openServiceModal('route53');
    });
  }

  // 17. 비용 상세 보기
  const viewCostBtn = document.getElementById('viewCostBtn');
  if (viewCostBtn) {
    viewCostBtn.addEventListener('click', () => {
      const metrics = calculateMetrics(currentUsers, currentStorageGB, currentArchId, toolkitOptions);
      document.getElementById('costBreakdownContent').innerHTML = `
        <div class="cost-row">
          <span>🌐 Amazon Route 53 (DNS 호스팅):</span>
          <strong>$${metrics.route53CostUSD} /월</strong>
        </div>
        <div class="cost-row">
          <span>💻 Amazon EC2 (가상 서버 ${metrics.ec2Count}대):</span>
          <strong>$${metrics.ec2CostUSD} /월</strong>
        </div>
        <div class="cost-row">
          <span>⚖️ Application Load Balancer (ALB):</span>
          <strong>$${metrics.albCostUSD} /월</strong>
        </div>
        <div class="cost-row">
          <span>⚡ AWS Lambda (서버리스 연산):</span>
          <strong>$${metrics.lambdaCostUSD} /월</strong>
        </div>
        <div class="cost-row">
          <span>⚡ Amazon CloudFront (글로벌 CDN 캐시):</span>
          <strong>$${metrics.cloudfrontCostUSD} /월</strong>
        </div>
        <div class="cost-row">
          <span>🚀 Amazon ElastiCache (Redis 인메모리 DB):</span>
          <strong>$${metrics.elasticacheCostUSD} /월</strong>
        </div>
        <div class="cost-row">
          <span>🛡️ AWS WAF & Shield (웹 보안 방화벽):</span>
          <strong>$${metrics.wafCostUSD} /월</strong>
        </div>
        <div class="cost-row">
          <span>🪣 Amazon S3 (데이터 저장 ${currentStorageGB.toLocaleString()} GB):</span>
          <strong>$${metrics.s3CostUSD} /월</strong>
        </div>
        <div class="cost-row">
          <span>🗄️ Amazon RDS (관계형 데이터베이스 관리):</span>
          <strong>$${metrics.rdsCostUSD} /월</strong>
        </div>
        <hr style="border:0; border-top:1px solid #334155; margin:14px 0;">
        <div class="cost-row total">
          <span>총 예상 요금 합계:</span>
          <strong style="color:#FF9900; font-size:1.25rem;">$${metrics.totalUSD} (약 ₩${metrics.totalKRW.toLocaleString()}원)</strong>
        </div>
      `;
      costBreakdownModal.classList.add('open');
    });
  }

  // 18. 사운드 토글
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      if (soundEnabled) {
        soundToggleBtn.textContent = '🔊 효과음 켬';
        soundToggleBtn.classList.add('active');
        playBeep(520, 'sine', 0.1);
        showToast('🔊 효과음이 켜졌습니다.');
      } else {
        soundToggleBtn.textContent = '🔇 효과음 끔';
        soundToggleBtn.classList.remove('active');
        showToast('🔇 효과음이 꺼졌습니다.');
      }
    });
  }

  // 19. 확장 퀴즈 시스템 (5문항)
  const openQuizBtn = document.getElementById('openQuizBtn');
  if (openQuizBtn) {
    openQuizBtn.addEventListener('click', () => {
      quizModal.classList.add('open');
      renderQuiz();
    });
  }

  const QUIZ_DATA = [
    {
      q: 'Q1. 수강신청 오픈처럼 트래픽이 평소보다 수십 배 급증할 때, 여러 대의 EC2 서버로 유저 요청을 골고루 나누어주는 AWS 서비스는 무엇일까요?',
      options: ['Amazon S3', 'Application Load Balancer (ALB)', 'Amazon VPC'],
      correct: 1,
      exp: '정답입니다! ALB는 마치 급식실 안내원처럼 몰려드는 유저 트래픽을 건강한 서버들에 균등하게 분산시켜 서버 다운을 방지합니다.'
    },
    {
      q: 'Q2. 전 세계 엣지 서버에 사진이나 동영상을 미리 복사해 두고, 원본 서버(EC2/S3)에 매번 가지 않고도 초고속으로 전송해 주는 CDN 서비스는?',
      options: ['Amazon CloudFront', 'Amazon Route 53', 'AWS Lambda'],
      correct: 0,
      exp: '정답입니다! CloudFront는 글로벌 CDN으로서 원본 서버의 부하를 60~80% 이상 줄여주고 전송 지연 시간을 극적으로 단축합니다.'
    },
    {
      q: 'Q3. 디스크 기반 DB(RDS)에 매번 쿼리하지 않고, 자주 찾는 데이터를 초고속 메모리(RAM)에 저장하여 조회 속도를 획기적으로 높이는 서비스는?',
      options: ['Amazon ElastiCache (Redis)', 'Amazon S3', 'AWS WAF'],
      correct: 0,
      exp: '정답입니다! ElastiCache는 책상 위 책받침처럼 자주 조회하는 데이터를 메모리에 캐시하여 DB 과부하를 막아줍니다.'
    },
    {
      q: 'Q4. 24시간 켜져 있는 컴퓨터 없이, 코드가 실행된 시간(밀리초)만큼만 요금을 내고 서버 관리가 전혀 필요 없는 AWS의 대표 서버리스 서비스는?',
      options: ['Amazon EC2', 'AWS Lambda', 'Amazon RDS'],
      correct: 1,
      exp: '정답입니다! AWS Lambda는 서버 관리 부담 없이 이벤트가 들어올 때만 실행되므로 대용량 미디어 처리나 가변 트래픽에 매우 유용합니다.'
    },
    {
      q: 'Q5. 대규모 악성 트래픽 공격(DDoS)이나 해킹 시도를 웹 서버 앞단에서 미리 걸러내어 차단하는 AWS 보안 방화벽 서비스는?',
      options: ['AWS WAF & Shield', 'Amazon CloudWatch', 'Amazon Route 53'],
      correct: 0,
      exp: '정답입니다! AWS WAF는 보안 검색대처럼 정상적인 사용자의 요청만 통과시키고 악성 패킷을 서버 도달 전에 드롭(Drop)합니다.'
    }
  ];

  function renderQuiz() {
    const container = document.getElementById('quizQuestions');
    container.innerHTML = QUIZ_DATA.map((item, qIdx) => `
      <div class="quiz-item" id="qBox_${qIdx}">
        <p class="quiz-q">${item.q}</p>
        <div class="quiz-options">
          ${item.options.map((opt, optIdx) => `
            <button class="quiz-opt-btn" onclick="selectQuizOption(${qIdx}, ${optIdx})">${opt}</button>
          `).join('')}
        </div>
        <div class="quiz-feedback" id="feedback_${qIdx}"></div>
      </div>
    `).join('');
  }

  window.selectQuizOption = (qIdx, optIdx) => {
    const item = QUIZ_DATA[qIdx];
    const qBox = document.getElementById(`qBox_${qIdx}`);
    const fb = document.getElementById(`feedback_${qIdx}`);
    const btns = qBox.querySelectorAll('.quiz-opt-btn');

    btns.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === item.correct) btn.classList.add('correct');
      else if (idx === optIdx) btn.classList.add('wrong');
    });

    if (optIdx === item.correct) {
      fb.className = 'quiz-feedback correct-msg';
      fb.innerHTML = `🎉 <strong>정답!</strong> ${item.exp}`;
      playBeep(659, 'sine', 0.15);
    } else {
      fb.className = 'quiz-feedback wrong-msg';
      fb.innerHTML = `❌ <strong>오답입니다.</strong> 정답은 '${item.options[item.correct]}'입니다.<br>${item.exp}`;
      playBeep(260, 'sine', 0.15);
    }
  };

  // 20. 토스트 메시지
  function showToast(msg) {
    let toast = document.getElementById('toastContainer');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastContainer';
      toast.className = 'toast-container';
      document.body.appendChild(toast);
    }

    const item = document.createElement('div');
    item.className = 'toast-item';
    item.textContent = msg;
    toast.appendChild(item);

    setTimeout(() => item.classList.add('show'), 10);
    setTimeout(() => {
      item.classList.remove('show');
      setTimeout(() => item.remove(), 300);
    }, 3200);
  }

  // 초기화
  usersSlider.value = usersToSlider(currentUsers);
  storageSlider.value = storageToSlider(currentStorageGB);
  updateAll();

  setTimeout(() => {
    simulator.startSimulation();
    simToggleBtn.innerHTML = '<span>⏹️</span> 시뮬레이션 정지';
    simToggleBtn.classList.add('running');
    simStatusBadge.textContent = '🟢 트래픽 전송 중';
    simStatusBadge.className = 'sim-status-badge active';
  }, 400);
});
