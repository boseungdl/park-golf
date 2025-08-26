'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { useMapStore } from '../store/mapStore';

// MapView를 동적으로 로드 (SSR 비활성화)
const MapView = dynamic(() => import('../components/map/MapView'), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-gray-100 flex items-center justify-center">지도 로딩중...</div>
});

export default function Home() {
  const [sidePanel, setSidePanel] = useState<'mclp' | 'dashboard' | null>(null);
  
  // mapStore에서 MCLP 분석 상태 가져오기
  const { 
    mclpAnalysis, 
    loadMclpResults, 
    startMclpAnalysis, 
    stopMclpAnalysis 
  } = useMapStore();

  // 컴포넌트 마운트 시 MCLP 데이터 로딩
  useEffect(() => {
    loadMclpResults();
  }, [loadMclpResults]);

  // MCLP 버튼 클릭 핸들러
  const handleMclpClick = () => {
    if (sidePanel === 'mclp') {
      // 이미 MCLP 패널이 열려있으면 분석 중단하고 패널 닫기
      if (mclpAnalysis.isRunning) {
        stopMclpAnalysis();
      }
      setSidePanel(null);
    } else {
      // MCLP 패널 열고 분석 시작
      setSidePanel('mclp');
      startMclpAnalysis();
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* 모드 전환 버튼 - 우상단 고정 */}
      <div className={`absolute top-4 right-6 z-50 transform transition-transform duration-300 ease-in-out ${
        sidePanel ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}>
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex">
          <button
            onClick={handleMclpClick}
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
        <div className="h-full bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden">
          {sidePanel === 'mclp' && (
            <div className="h-full flex flex-col">
              {/* 헤더 - 고정 */}
              <div className="flex items-center p-6 pb-4 border-b border-gray-200">
                <div className="text-4xl mr-3"></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">MCLP 분석</h2>
                  <p className="text-sm text-gray-500">최적 파크골프장 입지 분석</p>
                </div>
              </div>

              {/* 분석 진행 상황 - 스크롤 가능 */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {mclpAnalysis.isRunning ? (
                  // 분석 진행 중
                  <div className="space-y-4">
                    {/* 진행률 표시 */}
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>진행률</span>
                        <span>{mclpAnalysis.currentStep}/{mclpAnalysis.totalSteps}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(mclpAnalysis.currentStep / mclpAnalysis.totalSteps) * 100}%` 
                          }}
                        />
                      </div>
                    </div>

                    {/* 현재 메시지 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
                        <span className="text-blue-800 font-medium">{mclpAnalysis.currentMessage}</span>
                      </div>
                    </div>

                    {/* 선정된 후보들 목록 */}
                    {mclpAnalysis.selectedParks.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-700 mb-2">선정된 후보지</h3>
                        {mclpAnalysis.selectedParks.map((park, index) => (
                          <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center">
                              <div className="bg-green-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-green-800">
                                  {park.mclpData?.originalName || park["공 원 명"]}
                                </div>
                                <div className="text-xs text-green-600">
                                  {park["위    치"]} • {park.구}구
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : mclpAnalysis.currentStep > 0 ? (
                  // 분석 완료
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-4xl mb-2">✅</div>
                      <h3 className="font-bold text-green-800 mb-1">분석 완료!</h3>
                      <p className="text-green-600 text-sm">최적 입지 3곳이 선정되었습니다.</p>
                    </div>

                    {/* 최종 결과 목록 */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-700">최종 선정 결과</h3>
                      {mclpAnalysis.selectedParks.map((park, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center">
                            <div className="bg-blue-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-blue-800">
                                {park.mclpData?.originalName || park["공 원 명"]}
                              </div>
                              <div className="text-xs text-blue-600">
                                {park["위    치"]} • {park.구}구
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              5km 반경
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* MCLP 분석 통계 정보 */}
                    {mclpAnalysis.statistics && (
                      <div className="space-y-4 mt-6">
                        <h3 className="font-semibold text-gray-700 pb-2 border-b">분석 결과 통계</h3>
                        
                        {/* 기본 통계 카드들 */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-500 mb-1">총 후보 공원</div>
                            <div className="text-lg font-bold text-gray-800">
                              {mclpAnalysis.statistics.totalCandidateParks}개
                            </div>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-500 mb-1">선정 공원</div>
                            <div className="text-lg font-bold text-blue-600">
                              {mclpAnalysis.statistics.selectedParksCount}개
                            </div>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-500 mb-1">수요 커버리지</div>
                            <div className="text-lg font-bold text-green-600">
                              {mclpAnalysis.statistics.totalDemandCoverage.toFixed(1)}%
                            </div>
                          </div>
                          <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                            <div className="text-xs text-gray-500 mb-1">총 점수</div>
                            <div className="text-lg font-bold text-purple-600">
                              {mclpAnalysis.statistics.totalParkScore.toFixed(1)}점
                            </div>
                          </div>
                        </div>

                        {/* 상세 점수 정보 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-700 mb-3">공원별 상세 정보</h4>
                          <div className="space-y-2">
                            {mclpAnalysis.statistics.parkDetails.map((park, index) => (
                              <div key={index} className="flex justify-between items-center py-2">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-800">
                                    {park.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {park.district}구 • 전체 {park.rank}위
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-sm text-blue-600">
                                    {park.score.toFixed(1)}점
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 추가 분석 정보 */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <div className="text-lg mr-2">📈</div>
                            <h4 className="font-medium text-blue-800">분석 요약</h4>
                          </div>
                          <div className="text-sm text-blue-700 space-y-1">
                            <div>• 불균형 지수 상위 3개 구에서 선정</div>
                            <div>• 5km 서비스 반경 기준 최적화</div>
                            <div>• 최고점수: {mclpAnalysis.statistics.maxParkScore.toFixed(1)}점</div>
                            <div>• 최저점수: {mclpAnalysis.statistics.minParkScore.toFixed(1)}점</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // 분석 대기 상태
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      MCLP 분석 대기중
                    </h3>
                    <p className="text-gray-500 text-sm">
                      서울시 파크골프장 최적 입지 3곳을 분석합니다
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {sidePanel === 'dashboard' && (
            <DashboardPanel />
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
