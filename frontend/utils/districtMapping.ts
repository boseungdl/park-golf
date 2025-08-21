/**
 * districtMapping.ts - 구-행정동 매핑 유틸리티
 * 
 * 🚧 현재 구현 단계: 2017년 데이터 매핑 로직
 * 📅 다음 확장 예정: 성능 최적화, 캐싱
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: 2017년 GeoJSON 데이터
 * - 📤 Export: 매핑 함수들
 * - 🔄 사용처: mapStore.ts, 지도 컴포넌트
 * 
 * 📋 현재 포함 기능:
 * - ✅ 행정동명에서 구명 추출
 * - ✅ 구-행정동 매핑 테이블 생성
 * - 🚧 매핑 테이블 캐싱
 * - ⏳ 성능 최적화
 * 
 * 💡 사용 예시:
 * ```typescript
 * const districtName = extractDistrictFromDongName("서울특별시 종로구 사직동"); // "종로구"
 * const mapping = await generateDistrictDongMapping();
 * ```
 */

// 🔄 현재 구현: 기본 매핑 로직들

/**
 * 행정동명에서 구명 추출
 * @param dongName 행정동명 (예: "서울특별시 종로구 사직동")
 * @returns 구명 (예: "종로구") 또는 null
 */
export function extractDistrictFromDongName(dongName: string): string | null {
  // "서울특별시 {구명} {동명}" 패턴 분석
  // 수정: 구로구처럼 '로'가 들어간 구명을 위한 패턴 개선
  const match = dongName.match(/서울특별시\s+([가-힣]+구)\s+/);
  return match ? match[1] : null;
}

/**
 * 구-행정동 매핑 테이블 타입
 */
export interface DistrictDongMapping {
  [districtName: string]: {
    dongList: Array<{
      adm_cd: string;
      adm_nm: string;
    }>;
    count: number;
  };
}

/**
 * GeoJSON 데이터에서 구-행정동 매핑 테이블 생성
 * @param dongGeoJSON 행정동 GeoJSON 데이터
 * @returns 구-행정동 매핑 테이블
 */
export function generateDistrictDongMapping(dongGeoJSON: any): DistrictDongMapping {
  const mapping: DistrictDongMapping = {};
  
  // 행정동 데이터 순회
  dongGeoJSON.features.forEach((feature: any) => {
    const { adm_cd, adm_nm } = feature.properties;
    const districtName = extractDistrictFromDongName(adm_nm);
    
    if (districtName) {
      // 구가 처음 나타나면 초기화
      if (!mapping[districtName]) {
        mapping[districtName] = {
          dongList: [],
          count: 0
        };
      }
      
      // 행정동 추가
      mapping[districtName].dongList.push({ adm_cd, adm_nm });
      mapping[districtName].count = mapping[districtName].dongList.length;
    }
  });
  
  return mapping;
}

/**
 * 특정 구에 속한 행정동 코드 목록 반환
 * @param districtName 구명 (예: "종로구")
 * @param mapping 구-행정동 매핑 테이블
 * @returns 행정동 코드 배열
 */
export function getDongCodesByDistrict(
  districtName: string, 
  mapping: DistrictDongMapping
): string[] {
  const district = mapping[districtName];
  return district ? district.dongList.map(dong => dong.adm_cd) : [];
}

/**
 * 특정 구에 속한 행정동 명 목록 반환
 * @param districtName 구명 (예: "종로구") 
 * @param mapping 구-행정동 매핑 테이블
 * @returns 행정동명 배열
 */
export function getDongNamesByDistrict(
  districtName: string,
  mapping: DistrictDongMapping
): string[] {
  const district = mapping[districtName];
  return district ? district.dongList.map(dong => dong.adm_nm) : [];
}

/**
 * 매핑 테이블 검증 (개발용)
 * @param mapping 구-행정동 매핑 테이블
 * @returns 검증 결과
 */
export function validateMapping(mapping: DistrictDongMapping): {
  totalDistricts: number;
  totalDongs: number;
  districts: string[];
  errors: string[];
} {
  const districts = Object.keys(mapping);
  const totalDongs = districts.reduce((sum, district) => sum + mapping[district].count, 0);
  const errors: string[] = [];
  
  // 기본 검증
  if (districts.length !== 25) {
    errors.push(`서울시 25개 구가 아님: ${districts.length}개`);
  }
  
  // 각 구별 행정동 수 체크 (너무 적으면 오류)
  districts.forEach(district => {
    if (mapping[district].count < 1) {
      errors.push(`${district}: 행정동이 없음`);
    }
  });
  
  return {
    totalDistricts: districts.length,
    totalDongs,
    districts,
    errors
  };
}

// 🚧 미래 확장 예정:
// - 매핑 테이블 로컬 스토리지 캐싱
// - 행정동 검색 기능
// - 역방향 매핑 (행정동 → 구)