<template>
    <div class="bg-white shadow-lg rounded-lg p-6 w-96">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">지역 선택</h2>
        <button @click="close" class="text-gray-500 hover:text-gray-700">&times;</button>
      </div>
      <div class="space-x-2 mb-4">
            <!-- 지역 탭 -->
            <div class="overflow-x-auto whitespace-nowrap space-x-2 mb-4">
                <button 
                    v-for="region in regions" 
                    :key="region"
                    :class="[
                    'flex-none px-4 py-2 rounded', 
                    activeRegion === region ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    ]"
                    @click="selectRegion(region)"
                >
                    {{ region }}
                </button>
            </div>
            <!-- 가게 목록 -->
            <div class="overflow-y-auto grid grid-cols-2 gap-4 whitespace-nowrap h-40 mb-4">
                <div 
                    v-for="store in displayStores" 
                    :key="store.name" 
                    class="bg-gray-200 p-2 rounded cursor-pointer hover:bg-gray-300 mb-1 w-40 h-10 text-center flex items-center justify-center"
                    @click="selectRoom(store)"
                >
                    {{ store.region }} {{ store.name }}
                </div>
            </div>
        </div>
    </div>
</template>
  
<script>

    export default {
    data() {
        return {
        activeRegion: "전체",
        // '전체' 항목 없이 각 지역별로 데이터 정의
        stores: {
            "강남구": [
            { region: "강남구", name: "가게이름3" },
            { region: "강남구", name: "가게이름4" },
            { region: "강남구", name: "가게이름5" },
            { region: "강남구", name: "가게이름6" },
            { region: "강남구", name: "가게이름7" },
            { region: "강남구", name: "가게이름8" }
            ],
            "인천": [
            { region: "인천", name: "가게이름1" },
            { region: "인천", name: "가게이름2" }
            ],
            "수원": [
            { region: "수원", name: "가게이름3" },
            { region: "수원", name: "가게이름4" },
            { region: "수원", name: "가게이름5" },
            { region: "수원", name: "가게이름6" },
            { region: "수원", name: "가게이름7" },
            { region: "수원", name: "가게이름8" }
            ],
            "동작구": [
            { region: "동작구", name: "가게이름1" },
            { region: "동작구", name: "가게이름2" }
            ]

        }
        };
    },
    computed: {
        // 첫번째 탭은 "전체", 그 뒤로 각 지역 이름이 나옵니다.
        regions() {
        return ["전체", ...Object.keys(this.stores)];
        },
        // '전체' 선택 시에는 모든 지역의 가게 데이터를 합치고,
        // 특정 지역 선택 시 해당 지역의 데이터를 반환합니다.
        displayStores() {
        if (this.activeRegion === "전체") {
            return Object.values(this.stores).flat();
        } else {
            return this.stores[this.activeRegion] || [];
        }
        }
    },
    methods: {
        selectRegion(region) {
        this.activeRegion = region;
        },
        selectStore(store) {
        alert(`Selected: ${store.name}`);
        },
        close() {
        // 부모 컴포넌트에서 이 이벤트를 받아 팝업을 닫도록 합니다.
        this.$emit('close');
        },
        selectRoom(room) {
            // 선택된 채팅방 정보를 부모 컴포넌트에 전달
            this.$emit("chat-room-selected", room);
        }
    }
    };
</script>
  
  <style scoped>
  /* 추가적인 스타일 조정이 필요하면 이곳에 작성하세요. */
  </style>
  