# Utils 폴더

**역할**: 공통으로 사용하는 유틸리티 함수들

## 🚧 현재 구현 단계: 기본 구조
📅 다음 확장 예정: 지도 계산, 분석 헬퍼, API 유틸리티 등

## 📂 파일 구조 (미래 계획)

```
utils/
├── index.ts        # 모든 유틸리티 통합 export
├── map.ts         # 지도 관련 계산 함수
├── analysis.ts    # 분석 관련 헬퍼 함수
├── format.ts      # 데이터 포맷팅 함수
└── api.ts         # API 호출 관련 함수
```

## 📋 네이밍 규칙

- **함수명**: camelCase + 동사로 시작 (예: `calculateDistance`, `formatCoordinate`)
- **상수**: UPPER_SNAKE_CASE (예: `SEOUL_CENTER_COORDINATES`)
- **클래스**: PascalCase (예: `MapCalculator`)

## 💡 사용 예시 (미래)

```typescript
import { calculateDistance, formatCoordinate } from '@/utils';

const distance = calculateDistance(point1, point2);
const formatted = formatCoordinate(37.5665, 126.9780);
```

## 🔄 확장 시점

- **Task 3.x**: 지도 계산 함수 (거리, 좌표 변환 등)
- **Task 7.x**: 분석 헬퍼 함수 (MCLP 계산 등) 
- **Task 10.x**: API 유틸리티 (요청, 응답 처리 등)