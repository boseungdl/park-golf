'use client';

import { useState } from 'react';
import MapView from '../components/map/MapView';

export default function Home() {
  const [viewMode, setViewMode] = useState<'map' | 'dashboard'>('map');

  return (
    <div className="h-screen w-full relative">
      {/* 모드 전환 버튼 - 우상단 고정 */}
      <div className="absolute top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex">
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              viewMode === 'map' 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            지도
          </button>
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              viewMode === 'dashboard' 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            대시보드
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      {viewMode === 'map' ? (
        <MapView />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">대시보드</h2>
            <p className="text-gray-600">차트 컴포넌트가 들어갈 자리</p>
          </div>
        </div>
      )}
    </div>
  );
}
