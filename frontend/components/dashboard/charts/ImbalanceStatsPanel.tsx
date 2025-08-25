/**
 * ImbalanceStatsPanel.tsx - 불균형 지수 통계 패널
 * 
 * 🚧 현재 구현 단계: 신규 구현
 * 📊 복잡도: ⭐ (입문)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: dashboardStore
 * - 📤 Export: ImbalanceStatsPanel 컴포넌트
 * - 🔄 사용처: DashboardPanel
 * 
 * 📋 현재 포함 기능:
 * - ✅ 5단계 카테고리별 구 개수 통계
 * - ✅ 정책 제안 자동 생성
 * - ✅ 시각적 색상 구분
 * 
 * 💡 사용 예시:
 * ```typescript
 * <ImbalanceStatsPanel />
 * ```
 */

'use client';

import { useDashboardStore } from '../../../store/dashboardStore';
import { useMemo } from 'react';

const ImbalanceStatsPanel = () => {
  const { districtStats, imbalanceData, facilityData, parkgolfCourses } = useDashboardStore();

  // 색상 매핑 함수 (동일한 기준)
  const getImbalanceColor = (value: number): string => {
    if (value < -0.1) return '#2E7D32';      // 🟢 진한 초록 (과잉)
    if (value < 0.2) return '#66BB6A';       // 🟢 연한 초록 (적정)
    if (value < 0.4) return '#FFA726';       // 🟠 주황색 (주의)
    if (value < 0.6) return '#FF7043';       // 🟠 진한 주황 (부족)
    return '#E53935';                        // 🔴 빨간색 (심각)
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

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="font-bold text-lg text-gray-800 mb-4">📊 구별 현황 분석</h3>
      
      {/* 통계 그리드 */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { key: 'critical', label: '심각', color: '#E53935', count: categoryStats.critical },
          { key: 'shortage', label: '부족', color: '#FF7043', count: categoryStats.shortage },
          { key: 'attention', label: '주의', color: '#FFA726', count: categoryStats.attention },
          { key: 'adequate', label: '적정', color: '#66BB6A', count: categoryStats.adequate },
          { key: 'oversupply', label: '과잉', color: '#2E7D32', count: categoryStats.oversupply }
        ].map(({ key, label, color, count }) => (
          <div key={key} className="text-center p-4 rounded-lg bg-gray-50">
            <div 
              className="w-8 h-8 rounded-full mx-auto mb-2" 
              style={{ backgroundColor: color }}
            ></div>
            <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>
              {count}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
};

export default ImbalanceStatsPanel;