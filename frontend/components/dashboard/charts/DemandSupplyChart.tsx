/**
 * DemandSupplyChart.tsx - 수요 공급 균형 분석 차트
 * 
 * 🚧 현재 구현 단계: 완성
 * 📊 복잡도: ⭐⭐⭐ (고급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: recharts, dashboardStore
 * - 📤 Export: DemandSupplyChart 컴포넌트
 * - 🔄 사용처: DashboardPanel
 * 
 * 📋 현재 포함 기능:
 * - ✅ 수요(고령인구) vs 공급(파크골프장) 분석
 * - ✅ 4사분면 분석 영역 표시
 * - ✅ 수요공급 비율 계산
 * - ✅ 우선순위 구역 시각화
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
  ReferenceArea,
  Cell
} from 'recharts';
import { useDashboardStore } from '../../../store/dashboardStore';

interface DemandSupplyChartProps {
  showQuadrants?: boolean;
}

const DemandSupplyChart: React.FC<DemandSupplyChartProps> = ({ 
  showQuadrants = true 
}) => {
  const { districtStats, facilityData, clubData, setSelectedDistrict } = useDashboardStore();

  // 데이터 준비
  const prepareChartData = () => {
    const data = districtStats.map(district => {
      const facility = facilityData.find(f => f.district === district.district);
      const club = clubData.find(c => c.district === district.district);
      
      const demand = district.elderlyPopulation / 1000; // 수요: 고령인구(천명)
      const supply = (facility?.parkgolfCourses || 0) * 100; // 공급: 파크골프장 수 * 가중치
      const ratio = supply > 0 ? demand / (supply / 100) : demand; // 수요공급비율
      
      return {
        name: district.district.replace('구', ''),
        fullName: district.district,
        x: supply, // 공급 (파크골프장 수 * 100)
        y: demand, // 수요 (고령인구 천명)
        z: club?.clubMembers || 10, // 버블 크기 (클럽 가입자)
        ratio: ratio,
        parkgolfCourses: facility?.parkgolfCourses || 0,
        elderlyPopulation: district.elderlyPopulation,
        clubMembers: club?.clubMembers || 0
      };
    });

    return data;
  };

  const data = prepareChartData();
  
  // 평균값 계산 (4사분면 기준선)
  const avgSupply = data.reduce((sum, d) => sum + d.x, 0) / data.length;
  const avgDemand = data.reduce((sum, d) => sum + d.y, 0) / data.length;

  // 사분면별 색상 결정
  const getQuadrantColor = (supply: number, demand: number) => {
    if (supply >= avgSupply && demand >= avgDemand) {
      return '#22c55e'; // 1사분면: 높은 공급, 높은 수요 - 녹색 (균형)
    } else if (supply < avgSupply && demand >= avgDemand) {
      return '#ef4444'; // 2사분면: 낮은 공급, 높은 수요 - 빨간색 (우선 개발 필요)
    } else if (supply < avgSupply && demand < avgDemand) {
      return '#94a3b8'; // 3사분면: 낮은 공급, 낮은 수요 - 회색 (현상 유지)
    } else {
      return '#3b82f6'; // 4사분면: 높은 공급, 낮은 수요 - 파란색 (공급 과다)
    }
  };

  // 커스텀 도트 렌더링
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const size = Math.max(6, Math.min(20, Math.sqrt(payload.z) / 3)); // 버블 크기 조정
    const color = getQuadrantColor(payload.x, payload.y);
    
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
      const quadrant = 
        data.x >= avgSupply && data.y >= avgDemand ? '1사분면 (균형)' :
        data.x < avgSupply && data.y >= avgDemand ? '2사분면 (공급부족)' :
        data.x < avgSupply && data.y < avgDemand ? '3사분면 (저수요)' :
        '4사분면 (공급과다)';
      
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800 mb-2">{data.fullName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              수요: {data.elderlyPopulation.toLocaleString()}명
            </p>
            <p className="text-green-600">
              공급: {data.parkgolfCourses}개 파크골프장
            </p>
            <p className="text-purple-600">
              클럽가입자: {data.clubMembers.toLocaleString()}명
            </p>
            <p className="text-gray-600 font-medium">
              {quadrant}
            </p>
            <p className="text-orange-600">
              수요공급비: {data.ratio.toFixed(1)}
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
          
          {/* 사분면 배경 영역 */}
          {showQuadrants && (
            <>
              {/* 2사분면: 우선 개발 필요 (높은 수요, 낮은 공급) */}
              <ReferenceArea
                x1={0}
                x2={avgSupply}
                y1={avgDemand}
                y2={Math.max(...data.map(d => d.y)) + 10}
                fill="#fef2f2"
                fillOpacity={0.3}
              />
              {/* 1사분면: 균형 (높은 수요, 높은 공급) */}
              <ReferenceArea
                x1={avgSupply}
                x2={Math.max(...data.map(d => d.x)) + 50}
                y1={avgDemand}
                y2={Math.max(...data.map(d => d.y)) + 10}
                fill="#f0fdf4"
                fillOpacity={0.3}
              />
            </>
          )}
          
          <XAxis 
            dataKey="x" 
            type="number"
            domain={[0, 'dataMax + 50']}
            tick={{ fontSize: 12 }}
            label={{ 
              value: '공급 (파크골프장 점수)', 
              position: 'insideBottom', 
              offset: -20,
              style: { fontSize: 12 }
            }}
          />
          <YAxis 
            dataKey="y"
            type="number"
            domain={[0, 'dataMax + 10']}
            tick={{ fontSize: 12 }}
            label={{ 
              value: '수요 (고령인구 천명)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12 }
            }}
          />
          
          {/* 기준선 */}
          <ReferenceLine 
            x={avgSupply} 
            stroke="#6b7280" 
            strokeDasharray="2 2"
            label={{ 
              value: `평균 공급`, 
              position: "topRight",
              fill: "#6b7280",
              fontSize: 10
            }}
          />
          <ReferenceLine 
            y={avgDemand} 
            stroke="#6b7280" 
            strokeDasharray="2 2"
            label={{ 
              value: `평균 수요`, 
              position: "topLeft",
              fill: "#6b7280",
              fontSize: 10
            }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Scatter 
            data={data} 
            shape={renderCustomDot}
          />
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* 범례 */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>공급부족 (우선개발)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>균형</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
          <span>저수요</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span>공급과다</span>
        </div>
      </div>
    </div>
  );
};

export default DemandSupplyChart;