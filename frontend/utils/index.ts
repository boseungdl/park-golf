/**
 * utils/index.ts - 공통 유틸리티 함수
 * 
 * 🚧 현재 구현 단계: 기본 구조
 * 📅 다음 확장 예정: 지도 계산, 분석 헬퍼 함수들
 * 📊 복잡도: ⭐ (입문)
 * 
 * 💡 사용 예시:
 * ```typescript
 * import { formatNumber } from '@/utils';
 * const formatted = formatNumber(1234.56);
 * ```
 */

// 🔄 현재 구현: 기본 공통 함수들

/** 숫자를 한국어 형식으로 포맷팅 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

/** 좌표를 문자열로 포맷팅 */
export function formatCoordinate(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/** 객체가 비어있는지 확인 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

// 🚧 미래 확장 예정:
// - calculateDistance() - 두 좌표 간 거리 계산
// - validateCoordinate() - 좌표 유효성 검사
// - debounce() - 함수 실행 지연
// - formatAnalysisResult() - 분석 결과 포맷팅