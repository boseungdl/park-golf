/**
 * ImbalanceScatterChart.tsx - 불균형 지수 버블 차트
 * 
 * 🚧 현재 구현 단계: 완성
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: recharts, dashboardStore
 * - 📤 Export: ImbalanceScatterChart 컴포넌트
 * - 🔄 사용처: DashboardPanel
 * 
 * 📋 현재 포함 기능:
 * - ✅ 불균형 지수와 고령인구의 산점도
 * - ✅ 버블 크기로 파크골프장 수 표현
 * - ✅ 사분면 기준선 표시
 * - ✅ 인터랙티브 툴팁
 */

'use client';

import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  ZAxis
} from 'recharts';
import { useDashboardStore } from '../../../store/dashboardStore';

interface ImbalanceScatterChartProps {
  showReferenceLine?: boolean;
}

const ImbalanceScatterChart: React.FC<ImbalanceScatterChartProps> = ({ 
  showReferenceLine = true 
}) => {
  const { districtStats, imbalanceData, facilityData, setSelectedDistrict } = useDashboardStore();

  // 데이터 준비
  const prepareChartData = () => {
    return districtStats.map(district => {
      const imbalance = imbalanceData.find(i => i.district === district.district);
      const facility = facilityData.find(f => f.district === district.district);
      
      return {
        name: district.district.replace('구', ''),
        fullName: district.district,
        x: imbalance?.imbalanceIndex || 0,
        y: district.elderlyPopulation / 1000, // 천명 단위로 변환
        z: facility?.parkgolfCourses || 1, // 버블 크기
        elderlyRate: district.elderlyRate,
        imbalanceIndex: imbalance?.imbalanceIndex || 0,
        parkgolfCourses: facility?.parkgolfCourses || 0
      };
    });
  };

  const data = prepareChartData();

  // 버블 색상 결정 (불균형 지수 기준)
  const getBubbleColor = (imbalanceIndex: number) => {
    if (imbalanceIndex > 0.5) return '#ef4444'; // 높은 불균형 - 빨강
    if (imbalanceIndex > 0.2) return '#f97316'; // 중간 불균형 - 주황
    if (imbalanceIndex > 0) return '#eab308'; // 낮은 불균형 - 노랑
    return '#22c55e'; // 균형 - 초록
  };

  // 커스텀 도트 렌더링
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const size = Math.max(6, Math.min(20, payload.z * 4)); // 버블 크기 조정
    const color = getBubbleColor(payload.imbalanceIndex);
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={size} 
        fill={color} 
        fillOpacity={0.7}
        stroke={color}
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
        onClick={() => setSelectedDistrict(payload.fullName)}
      />
    );
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800 mb-2">{data.fullName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              불균형 지수: {data.imbalanceIndex.toFixed(3)}
            </p>
            <p className="text-orange-600">
              고령인구: {(data.y * 1000).toLocaleString()}명
            </p>
            <p className="text-green-600">
              파크골프장: {data.parkgolfCourses}개
            </p>
            <p className="text-gray-600">
              고령화율: {data.elderlyRate.toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          data={data}
          margin={{ top: 20, right: 30, bottom: 40, left: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="x" 
            type="number"
            domain={['dataMin - 0.1', 'dataMax + 0.1']}
            tick={{ fontSize: 12 }}
            label={{ 
              value: '불균형 지수', 
              position: 'insideBottom', 
              offset: -20,
              style: { fontSize: 12 }
            }}
          />
          <YAxis 
            dataKey="y"
            type="number"
            tick={{ fontSize: 12 }}
            label={{ 
              value: '고령인구 (천명)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12 }
            }}
          />
          <ZAxis dataKey="z" range={[20, 200]} />
          
          {showReferenceLine && (
            <>
              {/* 불균형 지수 0선 */}
              <ReferenceLine 
                x={0} 
                stroke="#94a3b8" 
                strokeDasharray="2 2"
                label={{ 
                  value: "균형점", 
                  position: "topLeft",
                  fill: "#64748b",
                  fontSize: 10
                }}
              />
              {/* 고령인구 평균선 */}
              <ReferenceLine 
                y={data.reduce((sum, d) => sum + d.y, 0) / data.length} 
                stroke="#94a3b8" 
                strokeDasharray="2 2"
                label={{ 
                  value: "평균", 
                  position: "topRight",
                  fill: "#64748b",
                  fontSize: 10
                }}
              />
            </>
          )}
          
          <Tooltip content={<CustomTooltip />} />
          <Scatter 
            data={data} 
            shape={renderCustomDot}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ImbalanceScatterChart;