<script>
  // 사용자가 입력한 key를 예를 들어 URL 쿼리 파라미터 또는 다른 방식으로 받아옴
  const userKey = new URLSearchParams(window.location.search).get('key')
  const message = new URLSearchParams(window.location.search).get('message')

  
  // 이후 sendDefault 호출
  function executeShare(message) {
    if (!Kakao.isInitialized()) {
    Kakao.init(userKey);
    console.log("Kakao SDK 초기화 완료:", userKey);
  }
    Kakao.Link.sendDefault({
      objectType: "text",
      text: message,
      link: {
        mobileWebUrl: "https://sju0924.github.io/",
        webUrl: "https://sju0924.github.io/"
      },
      installTalk: true
    });
  }

  window.onload = function() {    
    if (userKey && message) {
      executeShare(message);
    } else {
      console.error("필요한 파라미터('key'와 'message')가 제공되지 않았습니다.");
    }
  };
</script>
