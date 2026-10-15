/**
 * auth.js
 * Google Identity Services (GIS) 기반 구글 계정 연동 및 학생 학습 세션 관리 모듈
 */

const GoogleAuthManager = (() => {
  const STORAGE_KEY = 'cloud_edu_student_user';
  let currentUser = null;
  let authListeners = [];

  // 초기화: 로컬스토리지에서 기존 로그인 정보 불러오기
  function init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        currentUser = JSON.parse(saved);
      }
    } catch (e) {
      currentUser = null;
    }
    notifyListeners();
  }

  function subscribe(callback) {
    authListeners.push(callback);
    callback(currentUser);
  }

  function notifyListeners() {
    authListeners.forEach(cb => {
      try { cb(currentUser); } catch (e) {}
    });
  }

  // Google Credential (JWT) 디코딩 유틸
  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  // 실제 구글 로그인 콜백 핸들러
  function handleGoogleCredentialResponse(response) {
    const payload = parseJwt(response.credential);
    if (payload) {
      const userData = {
        id: payload.sub,
        name: payload.name || '학생 아키텍트',
        email: payload.email,
        picture: payload.picture || '',
        school: '고등학교 정보과',
        loginType: 'google',
        loginTime: new Date().toISOString()
      };
      saveUser(userData);
      showToast(`🎉 환영합니다, ${userData.name} 학생! 구글 계정으로 연동되었습니다.`);
    }
  }

  // 학교 실습 환경용 간편 구글 로그인 (테스트/모의 학생 계정 선택)
  function quickLoginAsStudent(studentName = '김정보', email = 'student@school.hs.kr', role = '학생') {
    const userData = {
      id: 'demo_' + Date.now(),
      name: studentName,
      email: email,
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(studentName)}`,
      school: '한국IT고등학교 2학년',
      role: role,
      loginType: 'google_simulated',
      loginTime: new Date().toISOString()
    };
    saveUser(userData);
    showToast(`🎉 ${userData.name} (${role}) 님의 구글 계정으로 로그인되었습니다!`);
  }

  function saveUser(userData) {
    currentUser = userData;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {}
    notifyListeners();
  }

  function logout() {
    currentUser = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    notifyListeners();
    showToast('로그아웃되었습니다.');
  }

  function getUser() {
    return currentUser;
  }

  function isLoggedIn() {
    return !!currentUser;
  }

  return {
    init,
    subscribe,
    getUser,
    isLoggedIn,
    logout,
    quickLoginAsStudent,
    handleGoogleCredentialResponse
  };
})();

// 전역 Google GIS 콜백 노출
window.handleGoogleCredentialResponse = GoogleAuthManager.handleGoogleCredentialResponse;

// 헤더 UI 바인딩 헬퍼 함수
function setupAuthHeader(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  GoogleAuthManager.subscribe(user => {
    if (user) {
      // 로그인 상태 UI
      container.innerHTML = `
        <div class="user-profile-badge" id="userProfileBtn">
          <img src="${user.picture || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}" alt="Profile" class="user-avatar" />
          <div class="user-badge-text">
            <span class="user-name">${user.name}</span>
            <span class="user-school">${user.role || '학생'}</span>
          </div>
          <button class="btn-logout" id="headerLogoutBtn" title="로그아웃">⏏</button>
        </div>
      `;

      const profileBtn = document.getElementById('userProfileBtn');
      if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
          if (e.target.id === 'headerLogoutBtn') {
            GoogleAuthManager.logout();
            return;
          }
          openStudentCardModal(user);
        });
      }
    } else {
      // 미로그인 상태 UI (구글 로그인 버튼)
      container.innerHTML = `
        <button class="google-login-btn" id="openLoginModalBtn">
          <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>구글 계정 로그인</span>
        </button>
      `;

      const loginBtn = document.getElementById('openLoginModalBtn');
      if (loginBtn) {
        loginBtn.addEventListener('click', () => {
          openLoginModal();
        });
      }
    }
  });
}

// 로그인 모달 팝업
function openLoginModal() {
  let modal = document.getElementById('googleAuthModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'googleAuthModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-window login-window">
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-category-badge" style="background:#4285F4;">계정 연동</span>
          <h3>구글 계정으로 로그인</h3>
        </div>
        <button class="modal-close-btn" onclick="closeAuthModal()">&times;</button>
      </div>
      <div class="modal-body">
        <p class="login-desc">
          구글 계정으로 연동하면 <strong>학습 진도, 퀴즈 점수, 아키텍처 실기 수료증</strong>이 학생 계정에 안전하게 저장됩니다.
        </p>

        <!-- 원클릭 간편 학생 선택 계정 -->
        <div class="quick-login-section">
          <div class="quick-login-title">💡 실습실 / 학교 계정 빠른 선택</div>
          <div class="quick-login-list">
            <button class="quick-student-btn" onclick="GoogleAuthManager.quickLoginAsStudent('김정보 학생', 'kim.it@school.hs.kr', '고교 2학년 학생'); closeAuthModal();">
              <span class="avatar-emoji">👨‍🎓</span>
              <div class="student-info-col">
                <strong>김정보 (학생 계정)</strong>
                <span>kim.it@school.hs.kr</span>
              </div>
              <span class="badge-role">로그인</span>
            </button>

            <button class="quick-student-btn" onclick="GoogleAuthManager.quickLoginAsStudent('이클라우드 학생', 'cloud.lee@school.hs.kr', '고교 2학년 학생'); closeAuthModal();">
              <span class="avatar-emoji">👩‍🎓</span>
              <div class="student-info-col">
                <strong>이클라우드 (학생 계정)</strong>
                <span>cloud.lee@school.hs.kr</span>
              </div>
              <span class="badge-role">로그인</span>
            </button>

            <button class="quick-student-btn teacher" onclick="GoogleAuthManager.quickLoginAsStudent('박교사 선생님', 'teacher.park@school.hs.kr', '정보 교과 담당 교사'); closeAuthModal();">
              <span class="avatar-emoji">👨‍🏫</span>
              <div class="student-info-col">
                <strong>박교사 (정보 담당 교사)</strong>
                <span>teacher.park@school.hs.kr</span>
              </div>
              <span class="badge-role teacher">교사용</span>
            </button>
          </div>
        </div>

        <div class="or-divider"><span>또는 직접 이름 입력</span></div>

        <div class="custom-name-login">
          <input type="text" id="customStudentNameInput" placeholder="학생 본인 이름을 입력하세요 (예: 홍길동)" class="modern-input" />
          <button class="btn-custom-login" onclick="handleCustomNameLogin()">이 이름으로 시작하기</button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

window.handleCustomNameLogin = () => {
  const input = document.getElementById('customStudentNameInput');
  const name = input ? input.value.trim() : '';
  if (!name) {
    alert('이름을 입력해 주세요.');
    return;
  }
  GoogleAuthManager.quickLoginAsStudent(name, `${name.toLowerCase()}@school.hs.kr`, '고교 학생');
  closeAuthModal();
};

window.closeAuthModal = () => {
  const modal = document.getElementById('googleAuthModal');
  if (modal) modal.classList.remove('open');
};

// 학생 프로필 상세 카드 모달
function openStudentCardModal(user) {
  let modal = document.getElementById('studentProfileModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'studentProfileModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-window profile-window">
      <div class="modal-header">
        <div class="modal-title-group">
          <span class="modal-category-badge" style="background:#10B981;">학생 프로필</span>
          <h3>학생 클라우드 학습 대시보드</h3>
        </div>
        <button class="modal-close-btn" onclick="document.getElementById('studentProfileModal').classList.remove('open')">&times;</button>
      </div>
      <div class="modal-body profile-body">
        <div class="profile-card-top">
          <img src="${user.picture}" class="profile-big-avatar" alt="User Avatar" />
          <div class="profile-main-info">
            <h4>${user.name}</h4>
            <span class="profile-email">${user.email}</span>
            <span class="profile-school">${user.school} · ${user.role || '학생'}</span>
          </div>
        </div>

        <div class="student-achievement-grid">
          <div class="achieve-box">
            <span class="a-icon">💡</span>
            <div class="a-label">클라우드 원리 학습</div>
            <strong class="a-val">이수 중</strong>
          </div>
          <div class="achieve-box">
            <span class="a-icon">🎯</span>
            <div class="a-label">실기 챌린지 4문항</div>
            <strong class="a-val" id="profileCertStatus">도전 가능</strong>
          </div>
        </div>

        <div class="profile-actions">
          <a href="challenge.html" class="btn-goto-challenge">🎯 아키텍처 실기 평가 풀러 가기</a>
          <button class="btn-logout-full" onclick="GoogleAuthManager.logout(); document.getElementById('studentProfileModal').classList.remove('open');">로그아웃</button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

// 초기화
GoogleAuthManager.init();
