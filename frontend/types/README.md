# Types 폴더

**역할**: 프로젝트 전체에서 사용하는 TypeScript 타입 정의

## 🚧 현재 구현 단계: 기본 구조
📅 다음 확장 예정: 지도, 분석, API 타입 등

## 📂 파일 구조 (미래 계획)

```
types/
├── index.ts        # 모든 타입 통합 export
├── map.ts         # 지도 관련 타입
├── analysis.ts    # 분석 관련 타입  
├── api.ts         # API 응답 타입
└── common.ts      # 공통 타입
```

## 📋 네이밍 규칙

- **Interface**: PascalCase + 명확한 이름 (예: `District`, `AnalysisResult`)
- **Type Alias**: PascalCase (예: `MapViewMode`)
- **Enum**: PascalCase (예: `AnalysisStatus`)

## 💡 사용 예시 (미래)

```typescript
// 🎯 실제 세상의 데이터 타입들 정의
import type { District, Park, Coordinates } from '@/types';

// 서울시 강남구 데이터
const gangnam: District = {
  name: "강남구",
  population: 12345,
  location: { lat: 37.5172, lng: 127.0473 }
};

// 공원 데이터
const park: Park = {
  name: "선릉공원", 
  district: "강남구",
  coordinates: { lat: 37.5042, lng: 127.0493 }
};
```

## 🔄 확장 시점

- **Task 3.x**: 지도 관련 타입 (District, Park 등)
- **Task 7.x**: 분석 관련 타입 (MCLP, Result 등)
- **Task 10.x**: API 관련 타입