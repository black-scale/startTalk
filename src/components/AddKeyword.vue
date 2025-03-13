<script>
// 실제 카카오 API 호출 코드는 상황에 맞게 구현하세요.
// 여기서는 예시로, 임시 사용자 데이터를 사용합니다.
export default {
  name: "AddKeyword",
  data() {
    return {
      keyword: "",
      notifyTime: null, // 분 단위 (숫자)
      recipientUuid: "",
      kakaoUsers: [] // 카카오 API를 통해 받아온 사용자 리스트 (예: { uuid: "abc123", name: "홍길동" })
    };
  },
  mounted() {
    // 카카오 API를 사용해 사용자의 친구목록이나 대상자 목록을 가져오는 로직 추가
    // 예시: fetchKakaoUsers();
    this.kakaoUsers = [
      { uuid: "abc123def456", name: "홍길동" },
      { uuid: "ghi789jkl012", name: "김철수" }
    ];
  },
  methods: {
    saveKeyword() {
      if (!this.keyword || !this.notifyTime || !this.recipientUuid) {
        alert("모든 항목을 입력해주세요.");
        return;
      }
      // 기존에 저장된 키워드 배열 불러오기
      let keywords = [];
      const stored = localStorage.getItem("keywords");
      if (stored) {
        keywords = JSON.parse(stored);
      }
      // 새 키워드 데이터 객체 생성
      const newKeyword = {
        keyword: this.keyword,
        notifyTime: this.notifyTime, // 분 단위 숫자
        recipientUuid: this.recipientUuid
      };
      // 배열에 추가 후 localStorage에 저장
      keywords.push(newKeyword);
      localStorage.setItem("keywords", JSON.stringify(keywords));
      
      // 저장 후 기본 화면으로 돌아가기
      this.$router.push({ name: "KeywordList" });
    }
  }
};
</script>