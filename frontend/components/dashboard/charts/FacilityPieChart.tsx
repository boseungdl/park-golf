/**
 * FacilityPieChart.tsx - 시설 분포 파이 차트
 * 
 * 🚧 현재 구현 단계: 완성
 * 📊 복잡도: ⭐ (입문)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: recharts, dashboardStore
 * - 📤 Export: FacilityPieChart 컴포넌트
 * - 🔄 사용처: DashboardPanel
 * 
 * 📋 현재 포함 기능:
 * - ✅ 시설별 분포 파이 차트
 * - ✅ 애니메이션 효과
 * - ✅ 커스텀 라벨
 * - ✅ 인터랙티브 툴팁
 */

'use client';

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  Sector
} from 'recharts';
import { useState } from 'react';
import { useDashboardStore } from '../../../store/dashboardStore';

interface FacilityPieChartProps {
  district?: string;
}

const FacilityPieChart: React.FC<FacilityPieChartProps> = ({ district }) => {
  const { facilityData, districtStats } = useDashboardStore();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 구별 또는 전체 시설 데이터 집계
  const getFacilityData = () => {
    if (district) {
      const districtFacility = facilityData.find(f => f.district === district);
      if (!districtFacility) return [];
      
      return [
        { name: '경로당', value: districtFacility.seniorCenters, color: '#3b82f6' },
        { name: '체육시설', value: districtFacility.sportsGround, color: '#10b981' },
        { name: '대형마트', value: districtFacility.largeMarts, color: '#f59e0b' },
        { name: '파크골프장', value: districtFacility.parkgolfCourses, color: '#ef4444' }
      ];
    } else {
      // 서울시 전체 집계
      const totalFacilities = facilityData.reduce((acc, f) => ({
        seniorCenters: acc.seniorCenters + f.seniorCenters,
        sportsGround: acc.sportsGround + f.sportsGround,
        largeMarts: acc.largeMarts + f.largeMarts,
        parkgolfCourses: acc.parkgolfCourses + f.parkgolfCourses
      }), {
        seniorCenters: 0,
        sportsGround: 0,
        largeMarts: 0,
        parkgolfCourses: 0
      });
      
      return [
        { name: '경로당', value: totalFacilities.seniorCenters, color: '#3b82f6' },
        { name: '체육시설', value: totalFacilities.sportsGround, color: '#10b981' },
        { name: '대형마트', value: totalFacilities.largeMarts, color: '#f59e0b' },
        { name: '파크골프장', value: totalFacilities.parkgolfCourses, color: '#ef4444' }
      ];
    }
  };

  const data = getFacilityData();
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  // 액티브 섹터 렌더링
  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-bold">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">
          {value}개
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
          {`(${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  // 커스텀 라벨
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // 5% 미만은 라벨 숨김
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800">{data.name}</p>
          <p className="text-sm" style={{ color: data.payload.color }}>
            {data.value}개
          </p>
          <p className="text-xs text-gray-600">
            전체의 {((data.value / total) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>
                {value}: {entry.payload.value}개
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FacilityPieChart;