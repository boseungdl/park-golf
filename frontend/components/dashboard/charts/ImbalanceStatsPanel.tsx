/**
 * ImbalanceStatsPanel.tsx - 불균형 지수 통계 도넛 차트
 * 
 * 🚧 현재 구현 단계: 도넛 차트 구현
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: recharts, dashboardStore
 * - 📤 Export: ImbalanceStatsPanel 컴포넌트
 * - 🔄 사용처: DashboardPanel
 * 
 * 📋 현재 포함 기능:
 * - ✅ 5단계 카테고리별 구 개수 통계
 * - ✅ 도넛 차트 시각화
 * - ✅ 중앙 총계 표시
 * - ✅ 시각적 색상 구분
 * 
 * 💡 사용 예시:
 * ```typescript
 * <ImbalanceStatsPanel />
 * ```
 */

'use client';

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { useDashboardStore } from '../../../store/dashboardStore';
import { useMemo } from 'react';

const ImbalanceStatsPanel = () => {
  const { districtStats, imbalanceData, parkgolfCourses } = useDashboardStore();

  // 색상 매핑 함수
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

  // 도넛 차트용 데이터 준비
  const { pieData, totalCount } = useMemo(() => {
    const stats = {
      critical: 0,      // 심각
      shortage: 0,      // 부족
      attention: 0,     // 주의
      adequate: 0,      // 적정
      oversupply: 0,    // 과잉
    };
    
    chartData.forEach(d => {
      if (d.imbalanceIndex >= 0.6) {
        stats.critical++;
      } else if (d.imbalanceIndex >= 0.4) {
        stats.shortage++;
      } else if (d.imbalanceIndex >= 0.2) {
        stats.attention++;
      } else if (d.imbalanceIndex >= -0.1) {
        stats.adequate++;
      } else {
        stats.oversupply++;
      }
    });
    
    const pieData = [
      { name: '심각', value: stats.critical, color: '#E53935' },
      { name: '부족', value: stats.shortage, color: '#FF7043' },
      { name: '주의', value: stats.attention, color: '#FFA726' },
      { name: '적정', value: stats.adequate, color: '#66BB6A' },
      { name: '과잉', value: stats.oversupply, color: '#2E7D32' }
    ].filter(item => item.value > 0); // 0개인 카테고리는 제외
    
    const totalCount = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    return { pieData, totalCount };
  }, [chartData]);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0];
      const percentage = ((data.value / totalCount) * 100).toFixed(1);
      return (
        <div className="p-2 rounded-lg shadow-md border border-gray-200" style={{ backgroundColor: '#ffffff', opacity: '1 !important', zIndex: 9999 }}>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: data.payload.color }}
            />
            <span className="font-medium text-gray-800">{data.payload.name}</span>
            <span className="text-sm text-gray-600">{data.value}개구 ({percentage}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="font-bold text-lg text-gray-800 mb-4">📊 구별 현황 분석</h3>
      
      {/* 도넛 차트 */}
      <div className="flex items-center justify-center">
        <div className="relative w-64 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                content={<CustomTooltip />} 
                wrapperStyle={{ backgroundColor: 'transparent', border: 'none' }}
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* 중앙 텍스트 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{totalCount}</div>
              <div className="text-sm text-gray-600">개 구</div>
            </div>
          </div>
        </div>
        
        {/* 범례 */}
        <div className="ml-8 space-y-2">
          {pieData.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-sm font-medium text-gray-700">{entry.name}</span>
              <span className="text-sm text-gray-500">({entry.value})</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ImbalanceStatsPanel;