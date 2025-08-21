/**
 * mapStore.ts - 지도 상태 관리 (2017년 데이터 통합)
 * 
 * 🚧 현재 구현 단계: 2017년 데이터 통합
 * 📅 다음 확장 예정: 뷰 모드, 마커 표시 기능
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: zustand, districtMapping
 * - 📤 Export: useMapStore
 * - 🔄 사용처: 지도 컴포넌트
 * 
 * 📋 현재 포함 기능:
 * - ✅ 지도 중심 좌표 관리
 * - ✅ 줌 레벨 관리
 * - ✅ 2017년 GeoJSON 데이터 로딩
 * - ✅ 구-행정동 매핑 테이블
 * - ✅ 선택된 구 상태 관리
 * 
 * 💡 사용 예시:
 * ```typescript
 * const mapStore = useMapStore();
 * await mapStore.loadData();
 * mapStore.selectDistrict("종로구");
 * ```
 */

import { create } from 'zustand';
import type { Coordinates, LoadingState } from '../types';
import { 
  generateDistrictDongMapping, 
  type DistrictDongMapping 
} from '../utils/districtMapping';

interface MapState {
  // 지도 화면 상태 - 사용자가 보고 있는 것들
  center: Coordinates;    // 지도 중심 좌표
  zoom: number;           // 확대/축소 레벨
  
  // 데이터 상태
  loadingState: LoadingState;              // 데이터 로딩 상태
  districtsData: any | null;               // 2017년 자치구 GeoJSON 데이터
  dongsData: any | null;                   // 2017년 행정동 GeoJSON 데이터
  districtDongMapping: DistrictDongMapping | null; // 구-행정동 매핑 테이블
  imbalanceData: Record<string, number> | null;    // 구별 불균형 지수 데이터
  
  // 선택 상태
  selectedDistrict: string | null;         // 선택된 구명
  selectedDongs: string[];                 // 선택된 구의 행정동 코드들
  
  // 시각화 모드
  showImbalance: boolean;                  // 불균형 지수 시각화 여부
  
  // 기본 액션 함수들
  setCenter: (lat: number, lng: number) => void;
  setZoom: (zoom: number) => void;
  reset: () => void;
  
  // 데이터 로딩 액션
  loadData: () => Promise<void>;
  loadImbalanceData: () => Promise<void>;  // 불균형 데이터 로딩
  
  // 선택 액션들
  selectDistrict: (districtName: string) => void;
  clearSelection: () => void;
  
  // 시각화 모드 토글
  toggleImbalanceView: () => void;
}

// 서울시 중심 좌표
const SEOUL_CENTER = {
  lat: 37.5665,
  lng: 126.9780,
};

export const useMapStore = create<MapState>()((set, get) => ({
  // 초기 상태
  center: SEOUL_CENTER,
  zoom: 10,
  
  // 데이터 초기 상태
  loadingState: 'idle',
  districtsData: null,
  dongsData: null,
  districtDongMapping: null,
  imbalanceData: null,
  
  // 선택 초기 상태
  selectedDistrict: null,
  selectedDongs: [],
  
  // 시각화 모드 초기 상태
  showImbalance: true,  // 기본적으로 불균형 지수 표시
  
  // 기본 액션 함수들
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
      selectedDistrict: null,
      selectedDongs: [],
    });
  },
  
  // 데이터 로딩 액션
  loadData: async () => {
    set({ loadingState: 'loading' });
    
    try {
      // 2017년 자치구 데이터 로딩
      const districtsResponse = await fetch('/data/seoul-districts-2017.geojson');
      if (!districtsResponse.ok) throw new Error('Failed to load districts data');
      const districtsData = await districtsResponse.json();
      
      // 2017년 행정동 데이터 로딩
      const dongsResponse = await fetch('/data/seoul-dongs-2017.geojson');
      if (!dongsResponse.ok) throw new Error('Failed to load dongs data');
      const dongsData = await dongsResponse.json();
      
      // 구-행정동 매핑 테이블 생성
      const mapping = generateDistrictDongMapping(dongsData);
      
      set({
        loadingState: 'success',
        districtsData,
        dongsData,
        districtDongMapping: mapping,
      });
      
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
      set({ loadingState: 'error' });
    }
  },
  
  // 구 선택 액션
  selectDistrict: (districtName: string) => {
    const { districtDongMapping } = get();
    
    if (!districtDongMapping || !districtDongMapping[districtName]) {
      console.warn(`구를 찾을 수 없음: ${districtName}`);
      return;
    }
    
    // 선택된 구의 행정동 코드들 추출
    const dongCodes = districtDongMapping[districtName].dongList.map(dong => dong.adm_cd);
    
    set({
      selectedDistrict: districtName,
      selectedDongs: dongCodes,
    });
  },
  
  // 선택 해제 액션
  clearSelection: () => {
    set({
      selectedDistrict: null,
      selectedDongs: [],
      showImbalance: true, // 선택 해제 시 불균형 표시를 다시 ON
    });
  },
  
  // 불균형 데이터 로딩 액션
  loadImbalanceData: async () => {
    try {
      const response = await fetch('/data/seoul-districts-imbalance.json');
      if (!response.ok) throw new Error('Failed to load imbalance data');
      const imbalanceData = await response.json();
      
      set({ imbalanceData });
      console.log('📊 불균형 지수 데이터 로드 완료');
      
    } catch (error) {
      console.error('불균형 데이터 로딩 실패:', error);
    }
  },
  
  // 불균형 시각화 토글
  toggleImbalanceView: () => {
    set((state) => ({ showImbalance: !state.showImbalance }));
  },
  
  // 불균형 시각화 직접 설정
  setImbalanceView: (show: boolean) => {
    set({ showImbalance: show });
  },
}));