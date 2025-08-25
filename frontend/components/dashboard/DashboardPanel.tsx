/**
 * DashboardPanel.tsx - 3단계 레이어 대시보드 메인 패널
 * 
 * 🚧 현재 구현 단계: 시각화 차트 통합 완료
 * 📅 다음 확장 예정: 실시간 데이터 연동
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: dashboardStore, 차트 컴포넌트들
 * - 📤 Export: DashboardPanel 컴포넌트
 * - 🔄 사용처: page.tsx
 * 
 * 📋 현재 포함 기능:
 * - ✅ 3단계 레이어 네비게이션 (서울시/구/동)
 * - ✅ 레이어별 데이터 표시
 * - ✅ 인터랙티브 드릴다운
 * - ✅ 통계 요약 카드
 * - ✅ 순위 및 비교 기능
 * - ✅ 차트 시각화 (막대, 파이, 레이더)
 * 
 * 💡 사용 예시:
 * ```jsx
 * <DashboardPanel />
 * ```
 */

'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import ElderlyRateBarChart from './charts/ElderlyRateBarChart';
import FacilityPieChart from './charts/FacilityPieChart';
import OverallRadarChart from './charts/OverallRadarChart';
import ImbalanceRankingChart from './charts/ImbalanceRankingChart';
import ParkgolfFacilityChart from './charts/ParkgolfFacilityChart';
import DemandSupplyChart from './charts/DemandSupplyChart';
import ImbalanceStatsPanel from './charts/ImbalanceStatsPanel';

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
  if (isLoading || loadedDatasets.length < 6) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center p-6 pb-4 border-b border-gray-200">
          <div className="text-4xl mr-3">📊</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">대시보드</h2>
            <p className="text-sm text-gray-500">파크골프장 데이터 분석</p>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
            <p className="text-sm text-gray-400 mt-2">
              로딩 완료: {loadedDatasets.length}/6
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
            <div className="text-sm text-gray-600">파크골프장</div>
            <div className="text-xl font-bold text-green-600">
              {seoulStats?.totalParkgolfCourses || 0}개
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-sm text-gray-600">클럽 가입자</div>
            <div className="text-xl font-bold text-blue-600">
              {seoulStats?.totalClubMembers.toLocaleString() || '0'}명
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-sm text-gray-600">서울시 인구</div>
            <div className="text-xl font-bold text-orange-600">
              {seoulStats?.totalPopulation.toLocaleString()}명
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-sm text-gray-600">고령화율</div>
            <div className="text-xl font-bold text-purple-600">
              {seoulStats?.elderlyRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* 불균형 지수 우선순위 차트 */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="font-bold text-lg text-gray-800 mb-3">📊 불균형 지수 우선순위</h3>
        <div className="h-96">
          <ImbalanceRankingChart />
        </div>
      </div>

      {/* 구별 현황 분석 */}
      <ImbalanceStatsPanel />

      {/* 파크골프 관련 시설 비교 */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="font-bold text-lg text-gray-800 mb-3">⛳ 파크골프 시설 현황</h3>
        <div className="h-64">
          <ParkgolfFacilityChart limit={8} />
        </div>
      </div>

      {/* 수요공급 균형 분석 */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <h3 className="font-bold text-lg text-gray-800 mb-3">⚖️ 수요공급 균형</h3>
        <div className="h-64">
          <DemandSupplyChart showQuadrants={true} />
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

        {/* 파크골프 시설 상세 분석 */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-bold text-lg text-gray-800 mb-3">⛳ {selectedDistrict} 파크골프 시설</h3>
          <div className="h-64">
            <ParkgolfFacilityChart district={selectedDistrict} />
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
            {currentLayer === 'seoul' ? '파크골프장 현황 및 분석' :
             currentLayer === 'district' ? `${selectedDistrict} 파크골프 분석` :
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