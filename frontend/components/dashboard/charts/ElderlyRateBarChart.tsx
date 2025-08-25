/**
 * ElderlyRateBarChart.tsx - 고령화율 비교 막대 차트
 * 
 * 🚧 현재 구현 단계: 완성
 * 📊 복잡도: ⭐ (입문)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: recharts, dashboardStore
 * - 📤 Export: ElderlyRateBarChart 컴포넌트
 * - 🔄 사용처: DashboardPanel
 * 
 * 📋 현재 포함 기능:
 * - ✅ 구별 고령화율 막대 차트
 * - ✅ 서울시 평균선 표시
 * - ✅ 인터랙티브 툴팁
 * - ✅ 색상 그라디언트
 */

'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { useDashboardStore } from '../../../store/dashboardStore';

interface ElderlyRateBarChartProps {
  limit?: number;
  sortBy?: 'rate' | 'population';
}

const ElderlyRateBarChart: React.FC<ElderlyRateBarChartProps> = ({ 
  limit = 10, 
  sortBy = 'rate' 
}) => {
  const { districtStats, seoulStats } = useDashboardStore();

  // 데이터 정렬 및 제한
  const sortedData = [...districtStats]
    .sort((a, b) => {
      if (sortBy === 'rate') {
        return b.elderlyRate - a.elderlyRate;
      }
      return b.elderlyPopulation - a.elderlyPopulation;
    })
    .slice(0, limit)
    .map(district => ({
      name: district.district.replace('구', ''),
      고령화율: parseFloat(district.elderlyRate.toFixed(1)),
      고령인구: district.elderlyPopulation,
      총인구: district.totalPopulation
    }));

  // 색상 그라디언트 생성
  const getBarColor = (value: number) => {
    const max = Math.max(...sortedData.map(d => d.고령화율));
    const min = Math.min(...sortedData.map(d => d.고령화율));
    const ratio = (value - min) / (max - min);
    
    if (ratio > 0.7) return '#ef4444'; // red-500
    if (ratio > 0.4) return '#f97316'; // orange-500
    return '#3b82f6'; // blue-500
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800">{label}구</p>
          <p className="text-sm text-blue-600">
            고령화율: {data.고령화율}%
          </p>
          <p className="text-xs text-gray-600">
            고령인구: {data.고령인구.toLocaleString()}명
          </p>
          <p className="text-xs text-gray-600">
            총인구: {data.총인구.toLocaleString()}명
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ 
              value: '고령화율 (%)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12 }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          {seoulStats && (
            <ReferenceLine 
              y={seoulStats.elderlyRate} 
              stroke="#10b981" 
              strokeDasharray="5 5"
              label={{ 
                value: `서울시 평균: ${seoulStats.elderlyRate.toFixed(1)}%`, 
                position: 'right',
                fill: '#10b981',
                fontSize: 11
              }}
            />
          )}
          <Bar dataKey="고령화율" radius={[8, 8, 0, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.고령화율)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ElderlyRateBarChart;