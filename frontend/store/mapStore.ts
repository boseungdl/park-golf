/**
 * mapStore.ts - 지도 상태 관리 (2017년 데이터 통합 + 공원 마커)
 * 
 * 🚧 현재 구현 단계: 공원 마커 표시 기능 추가
 * 📅 다음 확장 예정: 뷰 모드, 분석 기능
 * 📊 복잡도: ⭐⭐⭐ (고급)
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
 * - ✅ 공원 데이터 로딩 및 필터링
 * 
 * 💡 사용 예시:
 * ```typescript
 * const mapStore = useMapStore();
 * await mapStore.loadData();
 * await mapStore.loadParksData();
 * mapStore.selectDistrict("종로구");
 * const parks = mapStore.getSelectedDistrictParks();
 * ```
 */

import { create } from 'zustand';
import type { Coordinates, LoadingState } from '../types';
import { 
  generateDistrictDongMapping, 
  type DistrictDongMapping 
} from '../utils/districtMapping';

// MCLP 분석 데이터 타입 정의
export interface MclpData {
  총수요지수: number;        // 총 수요지수 (기존 score)
  포함행정동수: number;      // 포함 행정동 수 (기존 coveredDongs)
  originalName: string;     // 원본 공원명
  매칭유사도: number;       // 디버깅용 매칭 유사도
}

// 공원 데이터 타입 정의 (MCLP 통합)
export interface ParkData {
  구: string;                    // 구명 (예: "종로", "강남")
  공원종류: string;              // 공원 유형
  "공 원 명": string;          // 공원명
  "위    치": string;          // 위치
  "면 적 합 계(㎡)": number;   // 면적
  질의주소: string;             // 전체 주소
  위도: string | number;        // 위도 (빈 문자열 또는 숫자)
  경도: string | number;        // 경도 (빈 문자열 또는 숫자)
  지오코딩메모: string;         // 지오코딩 상태
  mclpData?: MclpData | null;   // MCLP 분석 데이터 (통합)
}

// 유효한 공원 데이터 (좌표가 있는 것만)
export interface ValidParkData extends Omit<ParkData, '위도' | '경도'> {
  위도: number;
  경도: number;
}

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
  parksData: ParkData[] | null;            // 서울시 공원 데이터
  validParks: ValidParkData[];             // 좌표가 유효한 공원들만
  
  // 선택 상태
  selectedDistrict: string | null;         // 선택된 구명
  selectedDongs: string[];                 // 선택된 구의 행정동 코드들
  selectedPark: ValidParkData | null;      // 선택된 공원 (버퍼 표시용)
  
  // 시각화 모드
  showImbalance: boolean;                  // 불균형 지수 시각화 여부
  
  // 기본 액션 함수들
  setCenter: (lat: number, lng: number) => void;
  setZoom: (zoom: number) => void;
  reset: () => void;
  
  // 데이터 로딩 액션
  loadData: () => Promise<void>;
  loadImbalanceData: () => Promise<void>;  // 불균형 데이터 로딩
  loadParksData: () => Promise<void>;      // 공원 데이터 로딩
  
  // 선택 액션들
  selectDistrict: (districtName: string) => void;
  clearSelection: () => void;
  selectPark: (park: ValidParkData) => void;     // 공원 선택 (버퍼 표시)
  clearParkSelection: () => void;                // 공원 선택 해제
  
  // 시각화 모드 토글
  toggleImbalanceView: () => void;
  setImbalanceView: (show: boolean) => void;
  
  // 공원 데이터 관련 액션
  getSelectedDistrictParks: () => ValidParkData[];  // 선택된 구의 공원들 반환
  getParksWithinBuffer: (centerLat: number, centerLng: number, radiusKm: number) => ValidParkData[];  // 버퍼 내 공원들 반환
}

// 서울시 중심 좌표
const SEOUL_CENTER = {
  lat: 37.5365,
  lng: 126.9780,
};

// 두 지점 간의 거리 계산 (Haversine formula) - km 단위
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // km 단위 거리
}

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
  parksData: null,
  validParks: [],
  
  // 선택 초기 상태
  selectedDistrict: null,
  selectedDongs: [],
  selectedPark: null,
  
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
      selectedPark: null,
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
    const { districtDongMapping, selectedPark } = get();
    
    console.log(`🏛️ selectDistrict 호출됨: ${districtName}, 현재 selectedPark:`, selectedPark?.["공 원 명"] || 'null');
    
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
    
    console.log(`🏛️ selectDistrict 완료: ${districtName}, selectedPark는 변경되지 않음`);
  },
  
  // 선택 해제 액션
  clearSelection: () => {
    set({
      selectedDistrict: null,
      selectedDongs: [],
      selectedPark: null,   // 공원 선택도 함께 해제
      showImbalance: true, // 선택 해제 시 불균형 표시를 다시 ON
    });
  },

  // 공원 선택 액션
  selectPark: (park: ValidParkData) => {
    set({ selectedPark: park });
    console.log('🏞️ 공원 선택:', park["공 원 명"]);
  },

  // 공원 선택 해제 액션
  clearParkSelection: () => {
    set({ selectedPark: null });
    console.log('🏞️ 공원 선택 해제');
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
  
  // 공원 데이터 로딩 액션
  loadParksData: async () => {
    try {
      const response = await fetch('/data/park-mclp-integrated.json');
      if (!response.ok) throw new Error('Failed to load parks data');
      const parksData: ParkData[] = await response.json();
      
      // 좌표가 유효한 공원들만 필터링 (서울 지역 범위 검증 추가)
      const validParks: ValidParkData[] = parksData.filter((park): park is ValidParkData => {
        const lat = Number(park.위도);
        const lng = Number(park.경도);
        
        // 1. 기본 숫자 검증
        if (isNaN(lat) || isNaN(lng) || park.위도 === '' || park.경도 === '') {
          return false;
        }
        
        // 2. 서울 지역 좌표 범위 검증 (더 정확한 범위)
        const isInSeoulBounds = 
          lat >= 37.4 && lat <= 37.7 &&     // 서울 위도 범위
          lng >= 126.7 && lng <= 127.3;     // 서울 경도 범위
          
        if (!isInSeoulBounds) {
          console.warn(`⚠️ 서울 범위를 벗어난 공원: ${park["공 원 명"]} (${lat}, ${lng}) - ${park["위    치"]}`);
          return false;
        }
        
        return true;
      }).map(park => ({
        ...park,
        위도: Number(park.위도),
        경도: Number(park.경도)
      }));
      
      set({ 
        parksData,
        validParks 
      });
      
      console.log(`🏞️ 공원 데이터 로드 완료: 전체 ${parksData.length}개, 유효 좌표 ${validParks.length}개`);
      
    } catch (error) {
      console.error('공원 데이터 로딩 실패:', error);
    }
  },
  
  // 선택된 구의 공원들 반환
  getSelectedDistrictParks: (): ValidParkData[] => {
    const { selectedDistrict, validParks, dongsData } = get();
    
    if (!selectedDistrict || !validParks.length) {
      return [];
    }
    
    // 구명 매핑: "종로구" → "종로" (구 suffix 제거)
    const districtNameForParks = selectedDistrict.replace(/구$/, '');
    
    // 해당 구의 공원들만 필터링
    let districtParks = validParks.filter(park => park.구 === districtNameForParks);
    
    // 추가 검증: 공원이 실제로 선택된 구의 경계 내에 있는지 확인 (Point-in-Polygon)
    if (dongsData) {
      const validatedParks = districtParks.filter(park => {
        // 해당 구에 속한 행정동들 찾기
        const dongFeatures = dongsData.features.filter((feature: any) => {
          const dongName = feature.properties.adm_nm;
          return dongName && dongName.includes(selectedDistrict);
        });
        
        // Point-in-Polygon 검증 함수
        const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
          const [x, y] = point;
          let inside = false;
          
          for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];
            
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
              inside = !inside;
            }
          }
          
          return inside;
        };
        
        // 공원이 어느 행정동 내에 있는지 확인 (정확한 Point-in-Polygon 체크)
        const isWithinDistrict = dongFeatures.some((feature: any) => {
          const geometry = feature.geometry;
          const parkPoint: [number, number] = [park.경도, park.위도]; // [lng, lat] 순서
          
          if (geometry.type === 'Polygon') {
            return isPointInPolygon(parkPoint, geometry.coordinates[0]);
          } else if (geometry.type === 'MultiPolygon') {
            return geometry.coordinates.some((polygon: [number, number][][]) => 
              isPointInPolygon(parkPoint, polygon[0])
            );
          }
          
          return false;
        });
        
        if (!isWithinDistrict) {
          console.warn(`⚠️ 공원 "${park["공 원 명"]}"이 ${selectedDistrict} 경계를 벗어남 (${park.위도}, ${park.경도}) - ${park["위    치"]}`);
        }
        
        return isWithinDistrict;
      });
      
      districtParks = validatedParks;
    }
    
    console.log(`🏞️ ${selectedDistrict} 공원: ${districtParks.length}개`);
    return districtParks;
  },

  // 버퍼 내 공원들 반환
  getParksWithinBuffer: (centerLat: number, centerLng: number, radiusKm: number): ValidParkData[] => {
    const { validParks } = get();
    
    return validParks.filter(park => {
      const distance = calculateDistance(centerLat, centerLng, park.위도, park.경도);
      return distance <= radiusKm;
    });
  },

}));