/**
 * Code.gs - Google Apps Script (구글 웹앱 배포용 스크립트)
 * 
 * [배포 방법]
 * 1. https://script.google.com 에 접속합니다.
 * 2. '새 프로젝트'를 만듭니다.
 * 3. 이 Code.gs 내용을 기본 Code.gs에 붙여넣습니다.
 * 4. 왼쪽 '+' 버튼 -> 'HTML' 선택 후 파일 이름을 'index'로 만듭니다.
 * 5. 같은 폴더의 'google_script_index.html' 파일 내용을 'index.html'에 붙여넣습니다.
 * 6. 우측 상단 '배포' -> '새 배포' -> 유형: '웹 앱' 선택
 *    - 다음 사용자 권한으로 실행: '나'
 *    - 액세스 권한이 있는 사용자: '모든 사용자(Anyone)' 선택!
 * 7. '배포' 버튼을 누르면 누구나 접속할 수 있는 인터넷 URL이 즉시 생성됩니다!
 */

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('AWS 클라우드 아키텍처 시뮬레이터 Pro')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}
