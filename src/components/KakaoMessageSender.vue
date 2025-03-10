<template>
  <div class="container">
    <h1>Kakao Message Sender</h1>
    <div>
      <label for="apiKey">Kakao API Key:</label>
      <input
        type="text"
        id="apiKey"
        v-model="kakaoApiKey"
        placeholder="Enter your Kakao API key"
      />
    </div>
    <div>
      <label for="message">Message:</label>
      <input
        type="text"
        id="message"
        v-model="message"
        placeholder="Enter your message"
      />
    </div>
    <div>
      <label for="receiver">Receiver:</label>
      <input
        type="text"
        id="receiver"
        v-model="receiver"
        placeholder="Enter receiver"
      />
    </div>
    <button @click="initializeAndSend">Send Message</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      kakaoApiKey: "",
      message: "",
      receiver: "",
      isInitialized: false
    };
  },
  methods: {
    initializeAndSend() {
      if (!this.kakaoApiKey) {
        alert("Please enter a Kakao API key.");
        return;
      }
      if (!window.Kakao) {
        alert("Kakao SDK is not loaded. Please check that the SDK script is included in index.html.");
        return;
      }
      // 초기화되지 않은 경우에만 API 키로 초기화합니다.
      if (!this.isInitialized) {
        window.Kakao.init(this.kakaoApiKey);
        this.isInitialized = true;
      }
      if (!this.message) {
        alert("Please enter a message to send.");
        return;
      }

    fetch("http://localhost:3000/run-selenium?userKey="+this.kakaoApiKey+"&userMessage="+this.message+"&friendName="+this.receiver)
    .then(response => response.text())
    .then(data => console.log("Selenium 결과:", data))
    .catch(error => console.error("API 호출 오류:", error))

    }
  }
};
</script>

<style scoped>
.container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}
input {
  width: 100%;
  padding: 8px;
  margin: 10px 0;
  box-sizing: border-box;
}
button {
  padding: 10px 20px;
  background-color: #FEE500;
  border: none;
  cursor: pointer;
  font-size: 16px;
}
button:hover {
  opacity: 0.9;
}
</style>
