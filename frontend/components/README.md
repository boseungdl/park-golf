# Components 폴더

**역할**: 재사용 가능한 React UI 컴포넌트 관리

## 🚧 현재 구현 단계: 기본 구조
📅 다음 확장 예정: 지도 컴포넌트, 사이드바, 모달 등

## 📂 폴더 구조 (미래 계획)

```
components/
├── common/          # 공통 UI 컴포넌트
│   ├── Button/
│   ├── Modal/
│   └── Loading/
├── map/            # 지도 관련 컴포넌트  
│   ├── MapContainer/
│   ├── DistrictLayer/
│   └── MarkerLayer/
└── analysis/       # 분석 관련 컴포넌트
    ├── AnalysisPanel/
    ├── ResultChart/
    └── ParameterForm/
```

## 📋 네이밍 규칙

- **파일명**: PascalCase (예: `MapContainer.tsx`)
- **폴더명**: PascalCase (예: `MapContainer/`)
- **Props 타입**: `ComponentNameProps` (예: `MapContainerProps`)

## 💡 사용 예시 (미래)

```typescript
import { MapContainer } from '@/components/map/MapContainer';
import { Button } from '@/components/common/Button';

export default function HomePage() {
  return (
    <div>
      <MapContainer />
      <Button onClick={handleClick}>분석 시작</Button>
    </div>
  );
}
```

## 🔄 확장 시점

- **Task 2.x**: 기본 UI 컴포넌트 (Button, Modal 등)
- **Task 3.x**: 지도 컴포넌트 
- **Task 7.x**: 분석 관련 컴포넌트