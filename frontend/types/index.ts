/**
 * types/index.ts - 공통 타입 정의
 * 
 * 🚧 현재 구현 단계: 기본 구조  
 * 📅 다음 확장 예정: 지도, 분석, API 타입
 * 📊 복잡도: ⭐ (입문)
 * 
 * 💡 사용 예시:
 * ```typescript
 * import type { Coordinates } from '@/types';
 * ```
 */

// 🔄 현재 구현: 기본 공통 타입들

/** 좌표 타입 - 지도에서 사용 */
export interface Coordinates {
  lat: number;
  lng: number;
}

/** 기본 ID 타입 */
export type ID = string;

/** 로딩 상태 타입 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// 🚧 미래 확장 예정:
// - District, Park, GolfCourse (지도 관련)
// - MCLPParameters, AnalysisResult (분석 관련) 
// - APIResponse, APIError (API 관련)