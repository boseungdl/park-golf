/**
 * ImbalanceRankingChart.tsx - 불균형 지수 우선순위 막대 차트
 * 
 * 🚧 현재 구현 단계: 신규 구현
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: recharts, dashboardStore
 * - 📤 Export: ImbalanceRankingChart 컴포넌트
 * - 🔄 사용처: DashboardPanel
 * 
 * 📋 현재 포함 기능:
 * - ✅ 색상 + 높이 시스템으로 우선순위 표현
 * - ✅ 가로 막대 차트로 구별 순위 표시
 * - ✅ 5단계 카테고리 분류
 * - ✅ 인터랙티브 툴팁 및 클릭 이벤트
 * 
 * 💡 사용 예시:
 * ```typescript
 * <ImbalanceRankingChart showStatistics={true} />
 * ```
 */

'use client';

// Recharts는 더 이상 사용하지 않음 - 실무적인 커스텀 차트로 구현
import { useDashboardStore } from '../../../store/dashboardStore';
import { useMemo } from 'react';

interface ImbalanceRankingChartProps {
  showStatistics?: boolean;
}

const ImbalanceRankingChart: React.FC<ImbalanceRankingChartProps> = ({ 
  showStatistics = true 
}) => {
  const { districtStats, imbalanceData, facilityData, parkgolfCourses, setSelectedDistrict } = useDashboardStore();

  // 색상 매핑 함수 (제공된 기준)
  const getImbalanceColor = (value: number): string => {
    if (value < -0.1) return '#2E7D32';      // 🟢 진한 초록 (과잉)
    if (value < 0.2) return '#66BB6A';       // 🟢 연한 초록 (적정)
    if (value < 0.4) return '#FFA726';       // 🟠 주황색 (주의)
    if (value < 0.6) return '#FF7043';       // 🟠 진한 주황 (부족)
    return '#E53935';                        // 🔴 빨간색 (심각)
  };

  // 높이 매핑 함수 (제공된 기준)
  const getImbalanceHeight = (value: number): number => {
    if (value < -0.1) return 50;    // 과잉 - 낮게
    if (value < 0.2) return 200;    // 적정 - 보통
    if (value < 0.4) return 500;    // 주의 - 중간 높이
    if (value < 0.6) return 800;    // 부족 - 높게  
    return 1200;                    // 심각 - 가장 높게
  };

  // 카테고리 이름 반환
  const getCategoryName = (value: number): string => {
    if (value < -0.1) return '과잉';
    if (value < 0.2) return '적정';
    if (value < 0.4) return '주의';
    if (value < 0.6) return '부족';
    return '심각';
  };

  // 차트 데이터 준비
  const chartData = useMemo(() => {
    // 실제 파크골프장 데이터에서 구별 개수 계산
    const districtParkgolfCount: { [key: string]: number } = {};
    parkgolfCourses.forEach(course => {
      // address에서 구 이름 추출 (예: "서울특별시 마포구 상암동..." -> "마포구")
      const match = course.address?.match(/서울특별시\s+(\S+구)/);
      if (match) {
        const district = match[1];
        districtParkgolfCount[district] = (districtParkgolfCount[district] || 0) + 1;
      }
    });

    return districtStats.map(district => {
      const imbalance = imbalanceData.find(i => i.district === district.district);
      const imbalanceIndex = imbalance?.imbalanceIndex || 0;
      
      // 실제 파크골프장 수 계산 (seoul_park_golf.json에서 추출)
      const actualParkgolfCourses = districtParkgolfCount[district.district] || 0;
      
      return {
        name: district.district,
        fullName: district.district,
        imbalanceIndex,
        elderlyPopulation: district.elderlyPopulation,
        parkgolfCourses: actualParkgolfCourses,
        barHeight: getImbalanceHeight(imbalanceIndex),
        color: getImbalanceColor(imbalanceIndex),
        category: getCategoryName(imbalanceIndex)
      };
    }).sort((a, b) => b.imbalanceIndex - a.imbalanceIndex);
  }, [districtStats, imbalanceData, parkgolfCourses]);

  // 카테고리별 통계 계산
  const categoryStats = useMemo(() => {
    const stats = {
      critical: 0,      // 심각
      shortage: 0,      // 부족
      attention: 0,     // 주의
      adequate: 0,      // 적정
      oversupply: 0,    // 과잉
      totalShortage: 0  // 부족 지역 필요 파크골프장 수
    };
    
    chartData.forEach(d => {
      if (d.imbalanceIndex >= 0.6) {
        stats.critical++;
        stats.totalShortage += Math.max(0, 3 - d.parkgolfCourses);
      } else if (d.imbalanceIndex >= 0.4) {
        stats.shortage++;
        stats.totalShortage += Math.max(0, 2 - d.parkgolfCourses);
      } else if (d.imbalanceIndex >= 0.2) {
        stats.attention++;
        stats.totalShortage += Math.max(0, 1 - d.parkgolfCourses);
      } else if (d.imbalanceIndex >= -0.1) {
        stats.adequate++;
      } else {
        stats.oversupply++;
      }
    });
    
    return stats;
  }, [chartData]);

  // 더 이상 Recharts를 사용하지 않으므로 해당 함수들 제거됨

  return (
    <div className="w-full h-full">
      {/* 테이블 헤더 */}
      <div className="flex items-center gap-3 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg mb-2">
        <div className="w-8 text-center text-xs font-bold text-gray-700 flex-shrink-0">
          순위
        </div>
        <div className="w-20 text-sm font-bold text-gray-700 flex-shrink-0">
          구명
        </div>
        <div className="flex-1 text-sm font-bold text-gray-700 min-w-0 text-center">
          불균형 지수 (낮을수록 좋음)
        </div>
        <div className="w-16 text-center text-xs font-bold text-gray-700 flex-shrink-0">
          파크골프장
        </div>
        <div className="w-16 text-right text-xs font-bold text-gray-700 flex-shrink-0">
          고령인구
        </div>
      </div>

      {/* 실무적인 막대 차트 - 스크롤 처리 */}
      <div 
        className="w-full overflow-y-auto space-y-1 pr-2 scrollbar-hide"
        style={{
          height: 'calc(100% - 3rem)', // 헤더 높이 제외
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE and Edge
        }}
      >
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>
        
        {chartData.map((district, index) => (
          <div 
            key={district.name} 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => setSelectedDistrict(district.fullName)}
          >
            {/* 순위 */}
            <div className="w-8 text-center text-sm font-bold text-gray-600 flex-shrink-0">
              {index + 1}
            </div>
            
            {/* 구 이름 */}
            <div className="w-20 text-sm font-medium text-gray-800 flex-shrink-0">
              {district.name}
            </div>
            
            {/* 막대 그래프 */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              {/* 불균형 지수 숫자 표시 (막대 외부) */}
              <div className="w-14 text-sm font-bold text-center flex-shrink-0" style={{ color: district.color }}>
                {district.imbalanceIndex.toFixed(3)}
              </div>
              
              {/* 막대 그래프 */}
              <div className="flex-1 bg-gray-200 rounded h-4 relative overflow-hidden">
                <div 
                  className="h-full rounded transition-all duration-500"
                  style={{ 
                    width: `${Math.max(5, Math.min(95, (district.imbalanceIndex + 0.2) * 120))}%`,
                    backgroundColor: district.color 
                  }}
                />
              </div>
              
              {/* 카테고리 표시 */}
              <div className="w-12 text-xs font-medium text-center flex-shrink-0" style={{ color: district.color }}>
                {district.category}
              </div>
            </div>
            
            {/* 파크골프장 수 */}
            <div className="w-16 text-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-600">🏌️‍♂️ {district.parkgolfCourses}</span>
            </div>
            
            {/* 고령인구 */}
            <div className="w-16 text-right text-xs text-gray-600 flex-shrink-0">
              {(district.elderlyPopulation / 1000).toFixed(0)}K
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImbalanceRankingChart;