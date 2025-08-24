/**
 * DashboardPanel.tsx - 3단계 레이어 대시보드 메인 패널
 * 
 * 🚧 현재 구현 단계: 기본 구조
 * 📅 다음 확장 예정: 차트 및 시각화 추가
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: dashboardStore, 하위 뷰 컴포넌트들
 * - 📤 Export: DashboardPanel 컴포넌트
 * - 🔄 사용처: page.tsx
 * 
 * 📋 현재 포함 기능:
 * - ✅ 3단계 레이어 네비게이션 (서울시/구/동)
 * - ✅ 레이어별 데이터 표시
 * - ✅ 인터랙티브 드릴다운
 * - ✅ 통계 요약 카드
 * - ✅ 순위 및 비교 기능
 * 
 * 💡 사용 예시:
 * ```jsx
 * <DashboardPanel />
 * ```
 */

'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';

const DashboardPanel = () => {
  const {
    currentLayer,
    selectedDistrict,
    selectedDong,
    seoulStats,
    districtStats,
    isLoading,
    loadedDatasets,
    
    setCurrentLayer,
    setSelectedDistrict,
    setSelectedDong,
    loadAllData,
    getTopDistricts
  } = useDashboardStore();

  // 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    if (loadedDatasets.length === 0) {
      loadAllData();
    }
  }, [loadAllData, loadedDatasets]);

  // 로딩 화면
  if (isLoading || loadedDatasets.length < 3) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center p-6 pb-4 border-b border-gray-200">
          <div className="text-4xl mr-3">📊</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
            <p className="text-sm text-gray-500">데이터 시각화 및 분석</p>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
            <p className="text-sm text-gray-400 mt-2">
              로딩 완료: {loadedDatasets.length}/3
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 서울시 레벨 뷰
  const SeoulView = () => (
    <div className="space-y-4">
      {/* 서울시 전체 통계 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
        <h3 className="font-bold text-lg text-gray-800 mb-3">📍 서울시 전체 현황</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-sm text-gray-600">전체 인구</div>
            <div className="text-xl font-bold text-blue-600">
              {seoulStats?.totalPopulation.toLocaleString()}명
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-sm text-gray-600">고령자 인구</div>
            <div className="text-xl font-bold text-orange-600">
              {seoulStats?.elderlyPopulation.toLocaleString()}명
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-sm text-gray-600">고령화율</div>
            <div className="text-xl font-bold text-red-600">
              {seoulStats?.elderlyRate.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-sm text-gray-600">관련 시설</div>
            <div className="text-xl font-bold text-green-600">
              {seoulStats?.totalFacilities.toLocaleString()}개
            </div>
          </div>
        </div>
      </div>

      {/* 상위 구 순위 */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="font-bold text-lg text-gray-800 mb-3">🏆 고령화율 상위 구</h3>
        <div className="space-y-2">
          {getTopDistricts('elderly').map((district, index) => (
            <div 
              key={district.district}
              onClick={() => setSelectedDistrict(district.district)}
              className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <span className="font-medium">{district.district}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-red-600">{district.elderlyRate.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">
                  {district.elderlyPopulation.toLocaleString()}명
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 시설 현황 상위 구 */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="font-bold text-lg text-gray-800 mb-3">🏢 시설 현황 상위 구</h3>
        <div className="space-y-2">
          {getTopDistricts('facility').map((district, index) => (
            <div 
              key={district.district}
              onClick={() => setSelectedDistrict(district.district)}
              className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                  index === 0 ? 'bg-green-500' : 
                  index === 1 ? 'bg-green-400' :
                  index === 2 ? 'bg-green-300' : 'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <span className="font-medium">{district.district}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">{district.facilityScore}점</div>
                <div className="text-xs text-gray-500">시설 점수</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 구 레벨 뷰
  const DistrictView = () => {
    const selectedDistrictData = districtStats.find(d => d.district === selectedDistrict);
    
    if (!selectedDistrictData) {
      return <div className="text-center p-6 text-gray-500">구 데이터를 찾을 수 없습니다.</div>;
    }

    const districtRank = districtStats.findIndex(d => d.district === selectedDistrict) + 1;
    
    return (
      <div className="space-y-4">
        {/* 브레드크럼 네비게이션 */}
        <div className="flex items-center text-sm text-gray-600 border-b border-gray-200 pb-2">
          <button 
            onClick={() => setSelectedDistrict(null)}
            className="hover:text-blue-600 transition-colors"
          >
            서울시
          </button>
          <span className="mx-2">›</span>
          <span className="font-medium text-gray-800">{selectedDistrict}</span>
        </div>

        {/* 선택된 구 상세 정보 */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg text-gray-800">📍 {selectedDistrict} 상세 현황</h3>
            <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              전체 {districtRank}위
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-sm text-gray-600">총 인구</div>
              <div className="text-lg font-bold text-blue-600">
                {selectedDistrictData.totalPopulation.toLocaleString()}명
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-sm text-gray-600">고령자 인구</div>
              <div className="text-lg font-bold text-orange-600">
                {selectedDistrictData.elderlyPopulation.toLocaleString()}명
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-sm text-gray-600">고령화율</div>
              <div className="text-lg font-bold text-red-600">
                {selectedDistrictData.elderlyRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-sm text-gray-600">시설 점수</div>
              <div className="text-lg font-bold text-green-600">
                {selectedDistrictData.facilityScore}점
              </div>
            </div>
          </div>
        </div>

        {/* 비교 차트 (간단한 바 차트) */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-bold text-lg text-gray-800 mb-3">📊 서울시 평균과 비교</h3>
          
          <div className="space-y-3">
            {/* 고령화율 비교 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>고령화율</span>
                <span className="font-medium">{selectedDistrictData.elderlyRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(selectedDistrictData.elderlyRate * 4, 100)}%` 
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                서울시 평균: {seoulStats?.elderlyRate.toFixed(1)}%
              </div>
            </div>

            {/* 시설 점수 비교 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>시설 점수</span>
                <span className="font-medium">{selectedDistrictData.facilityScore}점</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(selectedDistrictData.facilityScore / 3, 100)}%` 
                  }}
                />
              </div>
            </div>

            {/* 교통 점수 비교 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>교통 접근성</span>
                <span className="font-medium">{selectedDistrictData.transportScore}점</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${selectedDistrictData.transportScore}%` 
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                서울시 평균: {seoulStats?.averageAccessibility.toFixed(0)}점
              </div>
            </div>
          </div>
        </div>

        {/* 주변 구와 비교 */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-bold text-lg text-gray-800 mb-3">🔄 주변 순위 비교</h3>
          
          <div className="space-y-2">
            {districtStats.slice(
              Math.max(0, districtRank - 3), 
              Math.min(districtStats.length, districtRank + 2)
            ).map((district, index) => {
              const actualRank = districtStats.findIndex(d => d.district === district.district) + 1;
              const isSelected = district.district === selectedDistrict;
              
              return (
                <div 
                  key={district.district}
                  className={`flex items-center justify-between p-2 rounded transition-colors ${
                    isSelected ? 'bg-purple-100 border border-purple-300' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                      isSelected ? 'bg-purple-500' : 'bg-gray-400'
                    }`}>
                      {actualRank}
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-purple-800' : ''}`}>
                      {district.district}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-700">
                      {district.overallScore.toFixed(1)}점
                    </div>
                    <div className="text-xs text-gray-500">종합점수</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 동 레벨로 드릴다운 버튼 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-2">🔍 상세 분석</h3>
          <p className="text-sm text-gray-600 mb-3">
            {selectedDistrict}의 동별 상세 데이터를 확인해보세요
          </p>
          <button 
            onClick={() => setCurrentLayer('dong')}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors font-medium"
          >
            동별 상세보기 →
          </button>
        </div>
      </div>
    );
  };

  // 동 레벨 뷰 (간단한 구현)
  const DongView = () => (
    <div className="space-y-4">
      <div className="flex items-center text-sm text-gray-600 border-b border-gray-200 pb-2">
        <button 
          onClick={() => setSelectedDistrict(null)}
          className="hover:text-blue-600 transition-colors"
        >
          서울시
        </button>
        <span className="mx-2">›</span>
        <button 
          onClick={() => setCurrentLayer('district')}
          className="hover:text-blue-600 transition-colors"
        >
          {selectedDistrict}
        </button>
        <span className="mx-2">›</span>
        <span className="font-medium text-gray-800">동별 상세</span>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-bold text-lg text-yellow-800 mb-2">🚧 개발 중</h3>
        <p className="text-yellow-700 text-sm">
          {selectedDistrict}의 동별 상세 데이터는 곧 추가될 예정입니다.
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center p-6 pb-4 border-b border-gray-200">
        <div className="text-4xl mr-3">📊</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
          <p className="text-sm text-gray-500">
            {currentLayer === 'seoul' ? '서울시 전체 현황' :
             currentLayer === 'district' ? `${selectedDistrict} 상세 현황` :
             `${selectedDistrict} 동별 현황`}
          </p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {currentLayer === 'seoul' && <SeoulView />}
        {currentLayer === 'district' && <DistrictView />}
        {currentLayer === 'dong' && <DongView />}
      </div>
    </div>
  );
};

export default DashboardPanel;