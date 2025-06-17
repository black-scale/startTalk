<script>
export default {
  data() {
    return {
      userKey: new URLSearchParams(window.location.search).get('key'),
      message: new URLSearchParams(window.location.search).get('message'),
      id: new URLSearchParams(window.location.search).get('id')|| "",
      receiver : new URLSearchParams(window.location.search).get('receiver') || ""
    };
  },
  mounted() {
    if (this.userKey && this.message) {
      this.executeShare(this.message);
    } else {
      console.error("필요한 파라미터('key'와 'message')가 제공되지 않았습니다.");
    }
  },
  methods: {
    executeShare(message) {
      if (!Kakao.isInitialized()) {
        Kakao.init(this.userKey);
        console.log("Kakao SDK 초기화 완료:", this.userKey);
      }

      const url = `${import.meta.env.VITE_APP_RECEIVE_DEFAULT_URL}?id=${this.id}&receiver=${this.receiver}`;

      Kakao.Link.sendDefault({
        objectType: "text",
        text: message,
        link: {
          mobileWebUrl: url,
          webUrl: url
        },
        installTalk: true
      });
    }
  }
};
</script>
