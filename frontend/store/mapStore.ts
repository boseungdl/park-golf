/**
 * mapStore.ts - 지도 기본 상태 관리
 * 
 * 🚧 현재 구현 단계: 기본 구조
 * 📅 다음 확장 예정: 뷰 모드, 구 선택, 마커 표시 기능
 * 📊 복잡도: ⭐ (입문)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: zustand
 * - 📤 Export: useMapStore
 * - 🔄 사용처: 지도 컴포넌트 (미래 구현 예정)
 * 
 * 📋 현재 포함 기능:
 * - ✅ 지도 중심 좌표 관리
 * - ✅ 줌 레벨 관리
 * - ✅ 기본 액션 함수들
 * 
 * 💡 사용 예시:
 * ```typescript
 * const mapStore = useMapStore();
 * mapStore.setCenter(37.5665, 126.9780);
 * mapStore.setZoom(12);
 * ```
 */

import { create } from 'zustand';

interface MapState {
  // 지도 기본 설정
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  
  // 액션 함수들
  setCenter: (lat: number, lng: number) => void;
  setZoom: (zoom: number) => void;
  reset: () => void;
}

// 서울시 중심 좌표
const SEOUL_CENTER = {
  lat: 37.5665,
  lng: 126.9780,
};

export const useMapStore = create<MapState>()((set) => ({
  // 초기 상태
  center: SEOUL_CENTER,
  zoom: 10,
  
  // 액션 함수들
  setCenter: (lat, lng) => {
    set({ center: { lat, lng } });
  },
  
  setZoom: (zoom) => {
    set({ zoom: Math.max(8, Math.min(18, zoom)) }); // 8-18 범위 제한
  },
  
  reset: () => {
    set({
      center: SEOUL_CENTER,
      zoom: 10,
    });
  },
}));