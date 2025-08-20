'use client';

import { useMapStore } from '../../store/mapStore';

export default function TestPage() {
  const mapStore = useMapStore();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🗺️ 간단한 지도 스토어 테스트</h1>
      
      <div className="p-6 border border-gray-200 rounded-lg bg-blue-50">
        <h2 className="text-lg font-semibold mb-4">📍 현재 지도 상태</h2>
        
        <div className="space-y-2 mb-4">
          <p><strong>중심 좌표:</strong> {mapStore.center.lat.toFixed(4)}, {mapStore.center.lng.toFixed(4)}</p>
          <p><strong>줌 레벨:</strong> {mapStore.zoom}</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            onClick={() => mapStore.setCenter(37.5665, 126.9780)}
          >
            서울 중심으로
          </button>
          
          <button 
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            onClick={() => mapStore.setCenter(37.5642, 127.0016)}
          >
            강남으로
          </button>
          
          <button 
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
            onClick={() => mapStore.setZoom(mapStore.zoom + 1)}
          >
            줌 인 (+1)
          </button>
          
          <button 
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
            onClick={() => mapStore.setZoom(mapStore.zoom - 1)}
          >
            줌 아웃 (-1)
          </button>
          
          <button 
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            onClick={() => mapStore.reset()}
          >
            초기화
          </button>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-sm">
        <h3 className="font-semibold mb-2">💡 이 단계에서 배울 수 있는 것들:</h3>
        <ul className="space-y-1 text-gray-700">
          <li>• Zustand의 기본 create() 함수 사용법</li>
          <li>• 상태 읽기 및 업데이트 방법</li>
          <li>• 액션 함수 정의 및 사용</li>
          <li>• React 컴포넌트에서 스토어 사용하기</li>
        </ul>
      </div>
      
      <div className="mt-4 p-4 bg-green-50 rounded-lg text-sm">
        <h3 className="font-semibold mb-2">🚧 다음 단계에서 추가될 기능들:</h3>
        <ul className="space-y-1 text-gray-700">
          <li>• 2D/3D 뷰 모드 선택</li>
          <li>• 서울시 구 선택 기능</li>
          <li>• 마커 표시 설정</li>
          <li>• 데이터 persist (설정 저장)</li>
        </ul>
      </div>
      
      <div className="mt-6 p-4 bg-purple-50 rounded-lg text-sm">
        <h3 className="font-semibold mb-2">📂 프로젝트 폴더 구조 현황:</h3>
        <div className="font-mono text-xs space-y-1 text-gray-700">
          <div>✅ store/ - 상태 관리 (mapStore 구현 완료)</div>
          <div>✅ components/ - UI 컴포넌트 (구조 준비 완료)</div>
          <div>✅ types/ - TypeScript 타입 (기본 타입 완료)</div>
          <div>✅ utils/ - 유틸리티 함수 (기본 함수 완료)</div>
        </div>
        <p className="mt-2 text-gray-600">각 폴더의 README.md에서 자세한 사용법 확인 가능</p>
      </div>
    </div>
  );
}