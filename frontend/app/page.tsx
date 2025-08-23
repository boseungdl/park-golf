'use client';

import { useState } from 'react';
import MapView from '../components/map/MapView';

export default function Home() {
  const [viewMode, setViewMode] = useState<'map' | 'dashboard'>('map');
  const [sidePanel, setSidePanel] = useState<'mclp' | 'dashboard' | null>(null);

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* 모드 전환 버튼 - 우상단 고정 */}
      <div className={`absolute top-4 right-6 z-50 transform transition-transform duration-300 ease-in-out ${
        sidePanel ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex">
          <button
            onClick={() => setSidePanel(sidePanel === 'mclp' ? null : 'mclp')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              sidePanel === 'mclp' 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            MCLP
          </button>
          <button
            onClick={() => setSidePanel(sidePanel === 'dashboard' ? null : 'dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              sidePanel === 'dashboard' 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            대시보드
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 - 지도를 기본으로 표시 */}
      <MapView />

      {/* 사이드 패널 */}
      <div className={`absolute top-4 bottom-4 w-1/3 transform transition-transform duration-300 ease-in-out z-40 ${
        sidePanel ? 'translate-x-0 right-4' : 'translate-x-full right-[-100%]'
      }`}>
        <div className="h-full bg-white bg-opacity-95 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-2xl overflow-hidden">
          {sidePanel === 'mclp' && (
            <div className="text-center p-6">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">MCLP 분석</h2>
              <p className="text-gray-600">MCLP 분석 컴포넌트가 들어갈 자리</p>
            </div>
          )}
          {sidePanel === 'dashboard' && (
            <div className="text-center p-6">
              <div className="text-6xl mb-4">📈</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">대시보드</h2>
              <p className="text-gray-600">대시보드 컴포넌트가 들어갈 자리</p>
            </div>
          )}
        </div>
      </div>

      {/* 사이드 패널이 열렸을 때 배경 오버레이 (선택적) */}
      {sidePanel && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-20 z-30"
          onClick={() => setSidePanel(null)}
        />
      )}
    </div>
  );
}
