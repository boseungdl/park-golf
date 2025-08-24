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

// MCLP 분석 결과 타입 정의
export interface MclpOptimalPark {
  order: number;
  originalName: string;
  name: string;
  score: number;
  coveredDongs: number;
}

// allParksData의 개별 공원 정보 타입
export interface AllParkData {
  originalName: string;
  score: number;
  coveredDongs: number;
  coveredDongsList: {
    dong: string;
    demandIndex: number;
    ratio: number;
    contribution: number;
  }[];
}

export interface MclpResults {
  optimalParks: MclpOptimalPark[];
  allParksData: Record<string, AllParkData>;
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

// MCLP 분석 상태 타입 정의
export interface MclpAnalysisState {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  selectedParks: ValidParkData[];
  currentMessage: string;
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
  
  // MCLP 분석 상태
  mclpResults: MclpResults | null;         // MCLP 분석 결과 데이터
  mclpAnalysis: MclpAnalysisState;         // MCLP 분석 진행 상태
  
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
  
  // MCLP 분석 관련 액션
  loadMclpResults: () => Promise<void>;             // MCLP 결과 데이터 로딩
  startMclpAnalysis: () => void;                    // MCLP 분석 시작
  stopMclpAnalysis: () => void;                     // MCLP 분석 중단
  zoomToShowAllSelectedParks: () => void;           // 선택된 모든 공원이 보이도록 줌 조절
}

// 서울시 중심 좌표
const SEOUL_CENTER = {
  lat: 37.5365,
  lng: 126.9780,
};

// 공원명을 안전하게 가져오는 헬퍼 함수
const getParkName = (park: ValidParkData): string => {
  // MCLP 데이터의 originalName이 있으면 사용, 없으면 원본 공원명 사용
  return park.mclpData?.originalName || park["공 원 명"];
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

// 버퍼 크기에 따른 최적 줌 레벨 계산 함수
function calculateOptimalZoomForBuffer(radiusKm: number): number {
  // 5km 버퍼를 화면에 적절히 표시하기 위한 줌 레벨 계산
  // 서울 지역 기준으로 경험적 공식 사용
  
  // 버퍼 지름을 고려한 줌 레벨 (padding 포함)
  const diameterKm = radiusKm * 2;
  const paddingFactor = 1.4; // 40% 여백 추가
  const effectiveDiameter = diameterKm * paddingFactor;
  
  // 경험적 공식: 지름이 클수록 줌 레벨은 낮아짐
  // 5km 버퍼 → 10km 지름 → 14km 효과 지름 → 줄 레벨 11-12 정도
  let zoom: number;
  
  if (effectiveDiameter >= 20) {
    zoom = 10; // 매우 큰 버퍼
  } else if (effectiveDiameter >= 15) {
    zoom = 11; // 큰 버퍼 (5km 기본값)
  } else if (effectiveDiameter >= 10) {
    zoom = 12; // 중간 버퍼
  } else if (effectiveDiameter >= 5) {
    zoom = 13; // 작은 버퍼
  } else {
    zoom = 14; // 매우 작은 버퍼
  }
  
  console.log(`📐 버퍼 계산: ${radiusKm}km 반지름 → ${effectiveDiameter.toFixed(1)}km 효과 지름 → 줌 레벨 ${zoom}`);
  return zoom;
}

// 불균형 지수 기반 MCLP 알고리즘 - 불균형 지수 상위 3개 구에서 최적 공원 선정
function calculateDistrictBasedMCLP(
  allParksData: Record<string, AllParkData>, 
  validParks: ValidParkData[],
  imbalanceData: Record<string, number> | null
): ValidParkData[] {
  console.log('🚀 불균형 지수 기반 MCLP 알고리즘 시작');
  
  if (!imbalanceData) {
    console.error('❌ 불균형 지수 데이터가 없습니다');
    return [];
  }
  
  // 1. 불균형 지수가 가장 높은 구 3개 선정
  const sortedDistricts = Object.entries(imbalanceData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
    
  console.log('📊 불균형 지수 상위 3개 구:');
  sortedDistricts.forEach(([district, index], i) => {
    console.log(`  ${i + 1}. ${district}: ${index.toFixed(6)}`);
  });
  
  const topDistricts = sortedDistricts.map(([district]) => district.replace(/구$/, '')); // "성북구" → "성북"
  console.log('🎯 대상 구:', topDistricts);
  
  // 2. 해당 3개 구의 공원들만 필터링
  console.log('\n🔍 candidateParks 필터링 상세 분석:');
  console.log('topDistricts:', topDistricts);
  
  const candidateParks = validParks.filter(park => {
    const parkDistrict = park.구;
    const isIncluded = topDistricts.includes(parkDistrict);
    
    // 봉제산과 일자산 공원 특별 추적
    if (park["공 원 명"].includes('봉제산') || park["공 원 명"].includes('일자산')) {
      console.log(`   🔎 특별추적 - ${park["공 원 명"]}:`);
      console.log(`      park.구: "${parkDistrict}"`);
      console.log(`      topDistricts 포함: ${isIncluded}`);
      console.log(`      mclpData: ${park.mclpData ? 'O' : 'X'}`);
    }
    
    return isIncluded;
  });
  
  console.log(`\n🏞️ 대상 구 공원 수: ${candidateParks.length}개`);
  topDistricts.forEach(district => {
    const count = candidateParks.filter(p => p.구 === district).length;
    console.log(`  ${district}구: ${count}개 공원`);
    
    // 각 구의 공원들 상세 출력
    const districtParks = candidateParks.filter(p => p.구 === district);
    districtParks.slice(0, 3).forEach(park => {
      const parkName = park.mclpData?.originalName || park["공 원 명"];
      const hasScore = park.mclpData ? park.mclpData.총수요지수.toFixed(3) : 'N/A';
      console.log(`     - ${parkName} (${hasScore}점)`);
    });
  });
  
  // 봉제산 공원 디버깅
  const bongjePark = validParks.find(p => 
    p["공 원 명"].includes('봉제산') || 
    (p.mclpData?.originalName && p.mclpData.originalName.includes('봉제산'))
  );
  console.log('🔍 봉제산 공원 상태:', bongjePark ? {
    name: bongjePark["공 원 명"],
    district: bongjePark.구,
    lat: bongjePark.위도,
    lng: bongjePark.경도,
    mclpName: bongjePark.mclpData?.originalName
  } : '찾을 수 없음');
  
  // 모든 유효한 구 목록 출력
  const allDistricts = [...new Set(validParks.map(p => p.구))].sort();
  console.log('📍 전체 유효한 구 목록:', allDistricts);
  
  if (candidateParks.length === 0) {
    console.error('❌ 대상 구에 공원이 없습니다');
    return [];
  }
  
  // 3. 제한된 후보군에서 MCLP 그리디 알고리즘 적용
  console.log('\n🔍 제한된 후보군에서 MCLP 알고리즘 시작');
  
  const coveredDongs = new Set<string>();
  const selectedParks: ValidParkData[] = [];
  
  // 3번의 iteration으로 3개 공원 선정
  for (let iteration = 0; iteration < 3; iteration++) {
    console.log(`\n🔄 ${iteration + 1}번째 iteration 시작`);
    console.log(`   현재 커버된 동 수: ${coveredDongs.size}개`);
    
    // 4. 후보 공원들 중에서 현재 유효한 score 계산
    console.log(`\n🔎 현재 커버된 행정동들 (${coveredDongs.size}개):`);
    if (coveredDongs.size > 0) {
      const coveredList = Array.from(coveredDongs).slice(0, 10);
      console.log(`   ${coveredList.join(', ')}${coveredDongs.size > 10 ? ` 외 ${coveredDongs.size - 10}개` : ''}`);
    }
    
    const currentScores = candidateParks.map(park => {
      const parkName = park.mclpData?.originalName || park["공 원 명"];
      
      // parkData 찾기 - 더 안정적인 방법 사용
      let parkData = allParksData[parkName];
      if (!parkData) {
        // 백업: Object.values()로 찾기
        parkData = Object.values(allParksData).find(data => data.originalName === parkName);
      }
      
      if (!parkData) {
        console.log(`⚠️ MCLP 데이터 없음: ${parkName}`);
        return {
          park,
          parkData: null,
          currentScore: 0,
          remainingDongs: 0
        };
      }
      
      // 현재 iteration에서 이미 커버된 동들을 제외한 나머지 contribution 계산
      const totalDongs = parkData.coveredDongsList.length;
      const coveredInThisPark = parkData.coveredDongsList.filter(dongInfo => coveredDongs.has(dongInfo.dong));
      const remainingInThisPark = parkData.coveredDongsList.filter(dongInfo => !coveredDongs.has(dongInfo.dong));
      
      const remainingContribution = remainingInThisPark.reduce((sum, dongInfo) => sum + dongInfo.contribution, 0);
      
      // 디버깅: 원래 점수와 현재 점수 비교
      const originalScore = parkData.score || 0;
      const scoreDropRatio = originalScore > 0 ? (originalScore - remainingContribution) / originalScore : 0;
      
      // 상세 디버깅 로그
      console.log(`   🏞️ ${parkName} (${park.구}구):`);
      console.log(`      전체 행정동: ${totalDongs}개, 이미 커버됨: ${coveredInThisPark.length}개, 남은 것: ${remainingInThisPark.length}개`);
      console.log(`      원래 점수: ${originalScore.toFixed(3)} → 현재 점수: ${remainingContribution.toFixed(3)} (${(scoreDropRatio * 100).toFixed(1)}% 하락)`);
      
      if (coveredInThisPark.length > 0) {
        console.log(`      이미 커버된 동들:`, coveredInThisPark.slice(0, 5).map(d => d.dong).join(', ') + 
          (coveredInThisPark.length > 5 ? ` 외 ${coveredInThisPark.length - 5}개` : ''));
      }
      
      return {
        park,
        parkData,
        currentScore: remainingContribution,
        originalScore,
        scoreDropRatio,
        remainingDongs: remainingInThisPark.length,
        coveredDongs: coveredInThisPark.length,
        totalDongs
      };
    }).filter(item => item.parkData !== null); // MCLP 데이터가 있는 공원만
    
    // 5. 현재 score 기준으로 내림차순 정렬
    currentScores.sort((a, b) => b.currentScore - a.currentScore);
    
    console.log(`\n📊 상위 10개 후보 공원 현재 점수 (iteration ${iteration + 1}):`);
    currentScores.slice(0, 10).forEach(({park, currentScore, originalScore, scoreDropRatio, remainingDongs, coveredDongs, totalDongs}, index) => {
      const parkName = park.mclpData?.originalName || park["공 원 명"];
      console.log(`  ${index + 1}. ${parkName} (${park.구}구):`);
      console.log(`      점수: ${originalScore.toFixed(3)} → ${currentScore.toFixed(3)} (${(scoreDropRatio * 100).toFixed(1)}% 하락)`);
      console.log(`      행정동: ${totalDongs}개 중 ${coveredDongs}개 이미 커버됨, ${remainingDongs}개 남음`);
    });
    
    // 구별 후보 현황
    console.log(`📍 구별 후보 현황 (iteration ${iteration + 1}):`);
    topDistricts.forEach(district => {
      const districtCandidates = currentScores.filter(({park}) => park.구 === district);
      if (districtCandidates.length > 0) {
        const topScore = districtCandidates[0].currentScore;
        console.log(`  ${district}구: ${districtCandidates.length}개 후보, 최고점수: ${topScore.toFixed(3)}`);
      } else {
        console.log(`  ${district}구: 후보 없음`);
      }
    });
    
    // 6. 현재 가장 높은 score를 가진 공원 선택
    let selectedInThisIteration = false;
    
    for (const {park, parkData, currentScore} of currentScores) {
      if (currentScore <= 0) {
        console.log('⚠️ 더 이상 기여할 수 있는 공원이 없습니다');
        break;
      }
      
      // 이미 선택된 공원인지 확인
      const alreadySelected = selectedParks.some(selected => {
        const selectedName = selected.mclpData?.originalName || selected["공 원 명"];
        const currentName = park.mclpData?.originalName || park["공 원 명"];
        return selectedName === currentName;
      });
      
      if (alreadySelected) {
        const parkName = park.mclpData?.originalName || park["공 원 명"];
        console.log(`⏭️ 이미 선택된 공원으로 스킵: ${parkName}`);
        continue;
      }
      
      // 7. 조건을 만족하므로 선택
      selectedParks.push(park);
      selectedInThisIteration = true;
      
      // 8. 선정된 공원의 모든 동을 커버됨 처리
      const beforeCoveredSize = coveredDongs.size;
      const newlyCoveredDongs = parkData!.coveredDongsList.filter(
        dongInfo => !coveredDongs.has(dongInfo.dong)
      );
      
      console.log(`\n🔄 행정동 커버 처리 (${iteration + 1}번째 선정):`);
      console.log(`   선정 전 커버된 동: ${beforeCoveredSize}개`);
      console.log(`   선정 공원의 전체 동: ${parkData!.coveredDongsList.length}개`);
      console.log(`   새로 커버할 동: ${newlyCoveredDongs.length}개`);
      
      // 실제 coveredDongs에 추가
      parkData!.coveredDongsList.forEach(dongInfo => {
        const wasAlreadyCovered = coveredDongs.has(dongInfo.dong);
        coveredDongs.add(dongInfo.dong);
        if (!wasAlreadyCovered) {
          console.log(`     ➕ 새로 추가: ${dongInfo.dong} (기여도: ${dongInfo.contribution.toFixed(4)})`);
        }
      });
      
      const afterCoveredSize = coveredDongs.size;
      const actuallyAdded = afterCoveredSize - beforeCoveredSize;
      
      const parkName = park.mclpData?.originalName || park["공 원 명"];
      console.log(`\n✅ ${iteration + 1}번째 선정 완료: ${parkName} (${park.구}구)`);
      console.log(`   현재 점수: ${currentScore.toFixed(3)}`);
      console.log(`   행정동 변화: ${beforeCoveredSize}개 → ${afterCoveredSize}개 (실제 추가: ${actuallyAdded}개)`);
      console.log(`   검증: 새로 커버 예상 ${newlyCoveredDongs.length}개 vs 실제 추가 ${actuallyAdded}개`);
      
      // 커버되는 행정동 목록 (처음 10개만)
      console.log(`   커버되는 행정동들:`, newlyCoveredDongs.slice(0, 10).map(d => d.dong).join(', ') + 
        (newlyCoveredDongs.length > 10 ? ` 외 ${newlyCoveredDongs.length - 10}개` : ''));
      
      // 전체 행정동 목록 (상세 분석용)
      console.log(`   📋 전체 커버 행정동 목록 (${parkData!.coveredDongsList.length}개):`);
      parkData!.coveredDongsList.forEach((dongInfo, idx) => {
        const isNewlyCovered = newlyCoveredDongs.some(d => d.dong === dongInfo.dong);
        const status = isNewlyCovered ? '🆕' : '⏭️';
        console.log(`     ${idx + 1}. ${status} ${dongInfo.dong} (기여도: ${dongInfo.contribution.toFixed(4)})`);
      });
      
      // 선정된 공원들 간의 행정동 겹침 분석
      if (selectedParks.length > 1) {
        console.log(`\n🔄 공원간 행정동 겹침 분석:`);
        selectedParks.forEach((prevPark, prevIdx) => {
          if (prevIdx === selectedParks.length - 1) return; // 현재 선정된 공원 제외
          
          const prevParkName = prevPark.mclpData?.originalName || prevPark["공 원 명"];
          const prevParkData = Object.values(allParksData).find(data => data.originalName === prevParkName);
          
          if (prevParkData) {
            const overlappingDongs = parkData!.coveredDongsList.filter(dongInfo => 
              prevParkData.coveredDongsList.some(prevDong => prevDong.dong === dongInfo.dong)
            );
            
            console.log(`   ${prevParkName} vs ${parkName}: ${overlappingDongs.length}개 동 겹침`);
            if (overlappingDongs.length > 0) {
              console.log(`     겹치는 동들:`, overlappingDongs.slice(0, 5).map(d => d.dong).join(', ') + 
                (overlappingDongs.length > 5 ? ` 외 ${overlappingDongs.length - 5}개` : ''));
            }
          }
        });
      }
      break;
    }
    
    if (!selectedInThisIteration) {
      console.log(`⚠️ ${iteration + 1}번째 iteration에서 선택 가능한 공원이 없습니다`);
      break;
    }
  }
  
  console.log(`🎯 불균형 지수 기반 MCLP 완료: ${selectedParks.length}개 공원 선정`);
  console.log(`📍 선정된 공원들:`);
  selectedParks.forEach((park, index) => {
    const parkName = park.mclpData?.originalName || park["공 원 명"];
    console.log(`  ${index + 1}. ${parkName} (${park.구}구)`);
  });
  
  return selectedParks;
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
  
  // MCLP 분석 초기 상태
  mclpResults: null,
  mclpAnalysis: {
    isRunning: false,
    currentStep: 0,
    totalSteps: 3,
    selectedParks: [],
    currentMessage: ''
  },
  
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
    
    console.log(`🏛️ selectDistrict 호출됨: ${districtName}, 현재 selectedPark:`, selectedPark ? getParkName(selectedPark) : 'null');
    
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
    console.log('🏞️ 공원 선택:', getParkName(park));
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
          console.warn(`⚠️ 공원 "${getParkName(park)}"이 ${selectedDistrict} 경계를 벗어남 (${park.위도}, ${park.경도}) - ${park["위    치"]}`);
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

  // MCLP 결과 데이터 로딩
  loadMclpResults: async () => {
    try {
      const response = await fetch('/data/mclp-results.json');
      if (!response.ok) throw new Error('Failed to load MCLP results');
      const mclpResults: MclpResults = await response.json();
      
      set({ mclpResults });
      console.log('📊 MCLP 분석 결과 로드 완료:');
      console.log('  - optimalParks:', mclpResults.optimalParks.length, '개 후보');
      console.log('  - allParksData:', Object.keys(mclpResults.allParksData).length, '개 공원 데이터');
      
      // allParksData 상위 5개 공원 정보 출력
      const topParks = Object.entries(mclpResults.allParksData)
        .sort(([, a], [, b]) => b.score - a.score)
        .slice(0, 5);
      console.log('  - 상위 5개 공원:', topParks.map(([key, data]) => 
        `${data.originalName} (${data.score.toFixed(2)}점)`
      ));
      
    } catch (error) {
      console.error('MCLP 결과 로딩 실패:', error);
    }
  },

  // MCLP 분석 시작 (불균형 지수 기반 알고리즘 사용)
  startMclpAnalysis: () => {
    const { mclpResults, validParks, imbalanceData } = get();
    
    if (!mclpResults || !mclpResults.allParksData) {
      console.error('MCLP 결과 데이터가 없습니다');
      return;
    }

    if (!imbalanceData) {
      console.error('불균형 지수 데이터가 없습니다');
      return;
    }

    // 분석 시작 상태 설정 + 불균형 지수 표시 자동 ON + 선택된 구 해제
    set({
      showImbalance: true, // 불균형 지수 표시 자동 ON
      selectedDistrict: null, // 선택된 구 해제
      selectedDongs: [], // 선택된 행정동 해제
      selectedPark: null, // 선택된 공원도 해제
      mclpAnalysis: {
        isRunning: true,
        currentStep: 0,
        totalSteps: 3,
        selectedParks: [],
        currentMessage: '불균형 지수가 높은 구 3곳에서 MCLP 분석을 시작합니다...'
      }
    });

    // 불균형 지수 기반 MCLP 알고리즘으로 최적 공원 선정
    const optimalParks = calculateDistrictBasedMCLP(mclpResults.allParksData, validParks, imbalanceData);
    
    if (optimalParks.length === 0) {
      console.error('❌ 선정된 공원이 없습니다');
      set({
        mclpAnalysis: {
          isRunning: false,
          currentStep: 0,
          totalSteps: 3,
          selectedParks: [],
          currentMessage: '분석 실패: 불균형 지수 상위 구에서 조건을 만족하는 공원을 찾을 수 없습니다.'
        }
      });
      return;
    }

    console.log(`🎯 총 ${optimalParks.length}개 공원 선정됨, 순차 표시 시작`);

    // 순차적으로 공원 표시 및 포커스 이동
    let currentStep = 0;
    const selectedParks: ValidParkData[] = [];
    
    const processNextStep = () => {
      if (currentStep >= optimalParks.length) {
        // 분석 완료 - 부드럽게 마무리
        set({
          mclpAnalysis: {
            isRunning: false,
            currentStep: optimalParks.length,
            totalSteps: 3,
            selectedParks,
            currentMessage: `분석 완료! 불균형 지수 상위 구에서 최적 입지 ${selectedParks.length}곳이 선정되었습니다.`
          }
        });
        
        // 3초 후 부드럽게 전체 공원들이 보이도록 조정
        setTimeout(() => {
          get().zoomToShowAllSelectedParks();
        }, 3000);
        
        return;
      }

      const selectedPark = optimalParks[currentStep];
      selectedParks.push(selectedPark);
      
      // 🎯 선정된 공원으로 포커스 이동 (3km 버퍼에 맞는 줌 레벨 사용)
      const parkLat = Number(selectedPark.위도);
      const parkLng = Number(selectedPark.경도);
      
      if (!isNaN(parkLat) && !isNaN(parkLng)) {
        // 3km 버퍼에 맞는 적절한 줌 레벨 계산
        const bufferRadiusKm = 3;
        const optimalZoom = calculateOptimalZoomForBuffer(bufferRadiusKm);
        
        set({
          center: { lat: parkLat, lng: parkLng },
          zoom: optimalZoom
        });
        
        console.log(`📍 포커스 이동: ${getParkName(selectedPark)} (${parkLat.toFixed(4)}, ${parkLng.toFixed(4)}), 줌 레벨: ${optimalZoom}`);
      }
      
      // MCLP 데이터에서 점수 정보 가져오기
      const parkName = selectedPark.mclpData?.originalName || selectedPark["공 원 명"];
      const parkScore = Object.values(mclpResults.allParksData).find(
        data => data.originalName === parkName
      )?.score || 0;
      
      set({
        mclpAnalysis: {
          isRunning: true,
          currentStep: currentStep + 1,
          totalSteps: 3,
          selectedParks: [...selectedParks],
          currentMessage: `${currentStep + 1}번째 후보: ${getParkName(selectedPark)} (${selectedPark.구}구, 점수: ${parkScore.toFixed(2)})`
        }
      });
      
      console.log(`✅ ${currentStep + 1}번째 후보 표시 완료: ${getParkName(selectedPark)} (${selectedPark.구}구)`);

      currentStep++;
      
      // 다음 단계를 3초 후 실행 (포커스 이동을 볼 시간 확보)
      setTimeout(processNextStep, 3000);
    };

    // 첫 번째 단계 시작 (1초 후)
    setTimeout(processNextStep, 1000);
  },

  // MCLP 분석 중단
  stopMclpAnalysis: () => {
    set({
      mclpAnalysis: {
        isRunning: false,
        currentStep: 0,
        totalSteps: 3,
        selectedParks: [],
        currentMessage: ''
      }
    });
    console.log('🛑 MCLP 분석 중단');
  },

  // 선택된 모든 공원이 보이도록 줌 조절
  zoomToShowAllSelectedParks: () => {
    const { mclpAnalysis } = get();
    
    if (mclpAnalysis.selectedParks.length === 0) return;

    // 모든 선택된 공원의 좌표 추출
    const coords = mclpAnalysis.selectedParks
      .map(park => {
        const lat = Number(park.위도);
        const lng = Number(park.경도);
        return !isNaN(lat) && !isNaN(lng) ? [lng, lat] : null;
      })
      .filter(coord => coord !== null) as number[][];
    
    if (coords.length === 0) return;

    // 단일 공원인 경우 줌 레벨 12로 설정
    if (coords.length === 1) {
      set({
        center: { lat: coords[0][1], lng: coords[0][0] },
        zoom: 12
      });
      console.log(`🔍 단일 공원 포커스: (${coords[0][1].toFixed(4)}, ${coords[0][0].toFixed(4)}), 줌12`);
      return;
    }

    // 좌표들의 경계 계산
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // 중심점 계산
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // 경계 크기에 따른 적절한 줌 레벨 계산
    const latSpan = maxLat - minLat;
    const lngSpan = maxLng - minLng;
    const maxSpan = Math.max(latSpan, lngSpan);
    
    // 여유 공간을 위해 더 보수적으로 1.3배만 확장 (덜 급작스럽게)
    const paddedSpan = maxSpan * 1.3;
    
    // 줌 레벨 계산 (좀 더 보수적으로)
    let zoom = 12;
    if (paddedSpan > 0.4) zoom = 9;
    else if (paddedSpan > 0.25) zoom = 10;
    else if (paddedSpan > 0.12) zoom = 11;
    else if (paddedSpan > 0.06) zoom = 12;
    else zoom = 13;

    set({
      center: { lat: centerLat, lng: centerLng },
      zoom
    });

    console.log(`🔍 전체 공원 뷰: 중심(${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}), 줌${zoom}, ${mclpAnalysis.selectedParks.length}개 공원`);
  },

}));