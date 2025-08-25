/**
 * ParkgolfFacilityChart.tsx - 파크골프 수요압박지수 분석 차트
 * 
 * 🚧 현재 구현 단계: 실제 수용능력 기반 분석 완성
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: recharts, dashboardStore, seoul_park_golf.json
 * - 📤 Export: ParkgolfFacilityChart 컴포넌트
 * - 🔄 사용처: DashboardPanel
 * 
 * 📋 현재 포함 기능:
 * - ✅ 실제 일일수용능력 기반 공급 분석 (seoul_park_golf.json 활용)
 * - ✅ 협회가입자 + 잠재수요(고령인구 5%) 통합 수요 분석
 * - ✅ 수요압박지수 = 추정수요 / 일일수용능력
 * - ✅ 4단계 색상 코딩 (여유-적정-부족-심각)
 * - ✅ 구별 수요압박 우선순위 정렬
 * 
 * 💡 핵심 메시지: "실제 시설 수용능력 대비 수요압박이 가장 심한 구는?"
 */

'use client';

import { 
  ComposedChart, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { useDashboardStore } from '../../../store/dashboardStore';

interface ParkgolfFacilityChartProps {
  limit?: number;
  district?: string;
}

const ParkgolfFacilityChart: React.FC<ParkgolfFacilityChartProps> = ({ 
  limit = 10,
  district
}) => {
  const { districtStats, facilityData, clubData, parkgolfCourses, setSelectedDistrict } = useDashboardStore();

  // 수요압박지수에 따른 색상 결정 (실제 수용능력 기준)
  const getSupplyDemandColor = (pressureIndex: number): string => {
    if (pressureIndex > 2.0) return '#ef4444';    // 🔴 심각한 압박 (수요가 공급의 2배 이상)
    if (pressureIndex > 1.0) return '#eab308';    // 🟡 압박 상황 (수요가 공급 초과)
    if (pressureIndex > 0.5) return '#22c55e';    // 🟢 적정 수준 
    return '#06b6d4';                             // 🔵 여유 있음
  };

  // 수요압박 상태 텍스트
  const getSupplyDemandStatus = (pressureIndex: number): string => {
    if (pressureIndex > 2.0) return '심각';
    if (pressureIndex > 1.0) return '부족';
    if (pressureIndex > 0.5) return '적정';
    return '여유';
  };

  // 구별 실제 시설 수용능력 계산
  const getDistrictCapacity = (districtName: string) => {
    const districtFacilities = parkgolfCourses.filter(course => {
      const match = course.address?.match(/서울특별시\s+(\S+구)/);
      return match && match[1] === districtName;
    });
    
    return {
      count: districtFacilities.length,
      totalCapacity: districtFacilities.reduce((sum, course) => sum + (course.daily_capacity || 0), 0),
      totalHoles: districtFacilities.reduce((sum, course) => sum + (course.holes || 0), 0)
    };
  };

  // 데이터 준비 - 실제 수용능력 기반 분석
  const prepareChartData = () => {
    let data = districtStats.map(districtStat => {
      const club = clubData.find(c => c.district === districtStat.district);
      const capacityInfo = getDistrictCapacity(districtStat.district);
      
      const clubMembers = club?.clubMembers || 0;
      const dailyCapacity = capacityInfo.totalCapacity;
      
      // 수요압박지수: 협회가입자수 / 일일수용능력 (높을수록 시설 부족)
      // 잠재수요도 고려: 고령인구의 5% 정도가 잠재 이용자라고 가정
      const estimatedDemand = clubMembers + (districtStat.elderlyPopulation * 0.05);
      const demandPressureIndex = dailyCapacity > 0 ? estimatedDemand / dailyCapacity : estimatedDemand;
      
      return {
        name: districtStat.district.replace('구', ''),
        fullName: districtStat.district,
        파크골프장: capacityInfo.count,
        일일수용능력: dailyCapacity,
        협회가입자: clubMembers,
        추정수요: Math.round(estimatedDemand),
        수요압박지수: demandPressureIndex,
        고령인구: districtStat.elderlyPopulation,
        색상: getSupplyDemandColor(demandPressureIndex),
        상태: getSupplyDemandStatus(demandPressureIndex)
      };
    });

    if (district) {
      data = data.filter(d => d.fullName === district);
    } else {
      // 수요압박지수 기준으로 정렬 (압박이 심한 곳부터)
      data = data.sort((a, b) => b.수요압박지수 - a.수요압박지수).slice(0, limit);
    }

    return data;
  };

  const data = prepareChartData();

  // 커스텀 툴팁 (최소화된 정보만 표시)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.색상 }}
            />
            <p className="font-bold text-gray-800">{data.fullName}</p>
          </div>
          
          <div className="text-sm space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">수요압박지수:</span>
              <span className="font-bold" style={{ color: data.색상 }}>
                {data.수요압박지수.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">일일수용능력:</span>
              <span className="font-medium text-blue-600">
                {data.일일수용능력.toLocaleString()}명
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">추정수요:</span>
              <span className="font-medium text-orange-600">
                {data.추정수요.toLocaleString()}명
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">상태:</span>
              <span className="font-bold" style={{ color: data.색상 }}>
                {data.상태}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // 막대 클릭 핸들러
  const handleBarClick = (data: any) => {
    if (data?.fullName && !district) {
      setSelectedDistrict(data.fullName);
    }
  };


  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 40, right: 30, left: 60, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f8f9fa" opacity={0.5} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            label={{ 
              value: '수요압박지수', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12, textAnchor: 'middle' }
            }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            label={{ 
              value: '일일수용능력', 
              angle: 90, 
              position: 'insideRight',
              style: { fontSize: 12, textAnchor: 'middle' }
            }}
          />
          
          {/* 기준선 제거 - 색상만으로 구분 */}
          
          {/* 수요-공급 비율 (메인 지표) */}
          <Bar 
            yAxisId="left"
            dataKey="수요압박지수" 
            name="수요압박지수 (높을수록 시설 부족)"
            onClick={handleBarClick}
            style={{ cursor: district ? 'default' : 'pointer' }}
            radius={[6, 6, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.색상} />
            ))}
          </Bar>
          
          {/* 일일수용능력 (보조 지표) */}
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="일일수용능력" 
            stroke="#374151"
            strokeWidth={2}
            name="일일수용능력(명)"
            dot={{ fill: '#374151', strokeWidth: 2, r: 3 }}
            connectNulls={false}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '13px', marginTop: '10px' }}
            iconType="rect"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ParkgolfFacilityChart;