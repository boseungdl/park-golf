/**
 * DemandFactorsChart.tsx - 파크골프 수요 요인 상관관계 분석 차트
 * 
 * 🚧 현재 구현 단계: 다차원 수요 분석 구현
 * 📊 복잡도: ⭐⭐⭐ (고급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: recharts, dashboardStore, CSV 데이터
 * - 📤 Export: DemandFactorsChart 컴포넌트
 * - 🔄 사용처: DashboardPanel
 * 
 * 📋 현재 포함 기능:
 * - ✅ 협회가입자수(실제 수요) vs 고령인구 상관관계
 * - ✅ 교통접근성(지하철역 수) 버블 크기 표현
 * - ✅ 경로당 밀도 색상 구분
 * - ✅ 구별 수요 효율성 분석
 * - ✅ 인터랙티브 툴팁 with 상세 요인 분석
 * 
 * 💡 핵심 메시지: "어떤 요인이 파크골프 수요에 실제로 영향을 미치는가?"
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
import { useMemo, useEffect, useState } from 'react';

interface DemandFactorsChartProps {
  showTrendLine?: boolean;
}


// JSON 데이터 타입 정의
interface DistrictFacilityData {
  district: string;
  largeMarts: number;
  sportsFacilities: number;
  seniorCenters: number;
  subwayStations: number;
  clubMembers: number;
}

const DemandFactorsChart: React.FC<DemandFactorsChartProps> = ({ 
  showTrendLine = true 
}) => {
  const { districtStats, setSelectedDistrict } = useDashboardStore();
  const [facilityData, setFacilityData] = useState<DistrictFacilityData[]>([]);

  // JSON 파일에서 시설 데이터 로드
  useEffect(() => {
    const loadFacilityData = async () => {
      try {
        const response = await fetch('/data/seoul_districts_facilities.json');
        const data: DistrictFacilityData[] = await response.json();
        setFacilityData(data);
      } catch (error) {
        console.error('시설 데이터 로드 실패:', error);
      }
    };
    
    loadFacilityData();
  }, []);

  // 주변 인프라 종합 점수 계산 및 색상 결정 (Min-Max 정규화)
  const calculateInfraScore = (largeMarts: number, seniorCenters: number, sportsFacilities: number): number => {
    // Min-Max 정규화 (0-1 범위)
    // 대형마트: 최소 18개(도봉구) ~ 최대 75개(중구)
    const martScore = (largeMarts - 18) / (75 - 18);
    
    // 경로당: 최소 51개(중구) ~ 최대 239개(노원구) 
    const seniorScore = (seniorCenters - 51) / (239 - 51);
    
    // 체육시설: 최소 1개(금천구, 도봉구, 성동구) ~ 최대 55개(강남구)
    const sportsScore = (sportsFacilities - 1) / (55 - 1);
    
    // 가중 평균 계산 (경로당 40%, 대형마트 35%, 체육시설 25%)
    return Math.max(0, Math.min(1, seniorScore * 0.4 + martScore * 0.35 + sportsScore * 0.25));
  };

  const getInfraScoreColor = (score: number): string => {
    if (score >= 0.8) return '#ef4444';   // 🔴 매우 높음 (0.8+)
    if (score >= 0.6) return '#f97316';   // 🟠 높음 (0.6-0.8)
    if (score >= 0.4) return '#eab308';   // 🟡 중간 (0.4-0.6)
    if (score >= 0.2) return '#22c55e';   // 🟢 낮음 (0.2-0.4)
    return '#3b82f6';                     // 🔵 매우 낮음 (0.2↓)
  };

  // 수요 효율성 계산 (고령인구 대비 협회가입자 비율)
  const getDemandEfficiency = (clubMembers: number, elderlyPop: number): number => {
    return elderlyPop > 0 ? (clubMembers / elderlyPop) * 1000 : 0; // 고령인구 1000명당 가입자 수
  };


  // 데이터 준비
  const chartData = useMemo(() => {
    if (facilityData.length === 0) return [];
    
    return districtStats.map(district => {
      const facility = facilityData.find(f => f.district === district.district);
      
      if (!facility) return null;
      
      const elderlyPop = district.elderlyPopulation;
      const demandEfficiency = getDemandEfficiency(facility.clubMembers, elderlyPop);
      
      // 주변 인프라 종합 점수 계산
      const infraScore = calculateInfraScore(facility.largeMarts, facility.seniorCenters, facility.sportsFacilities);
      
      return {
        name: district.district.replace('구', ''),
        fullName: district.district,
        x: elderlyPop / 1000, // 고령인구 (천명 단위)
        y: facility.clubMembers, // 협회가입자수 (실제 수요)
        z: facility.subwayStations, // 버블 크기: 지하철역 수 (접근성)
        seniorCenters: facility.seniorCenters, // 경로당 수
        largeMarts: facility.largeMarts, // 대형마트 수
        sportsFacilities: facility.sportsFacilities, // 체육시설 수
        elderlyRate: district.elderlyRate,
        demandEfficiency: demandEfficiency,
        infraScore: infraScore, // 인프라 종합 점수
        color: getInfraScoreColor(infraScore) // 인프라 점수에 따른 색상
      };
    }).filter(d => d !== null && d.y > 0); // null이 아니고 협회가입자가 있는 구만 표시
  }, [districtStats, facilityData]);

  // 커스텀 도트 렌더링 (버블 차트) - 겹침 방지 개선
  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    
    // 버블 크기 더 세밀하게 조정 (더 작게, 더 넓은 범위)
    const minSize = 4;
    const maxSize = 18;
    const size = Math.max(minSize, Math.min(maxSize, payload.z * 1.2 + 3));
    
    const color = payload.color;
    
    return (
      <g style={{ cursor: 'pointer' }} onClick={() => setSelectedDistrict(payload.fullName)}>
        {/* 외곽선으로 가독성 향상 */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={size + 1} 
          fill="white" 
          fillOpacity={0.8}
        />
        <circle 
          cx={cx} 
          cy={cy} 
          r={size} 
          fill={color} 
          fillOpacity={0.75}
          stroke={color}
          strokeWidth={1.5}
        />
        {/* 구 이름 라벨 제거 - 툴팁으로 대체 */}
      </g>
    );
  };

  // 심플한 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-lg shadow-md border border-gray-200 min-w-48" style={{ backgroundColor: '#ffffff', opacity: '1 !important', zIndex: 9999 }}>
          {/* 헤더 */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold text-gray-800">{data.fullName}</span>
          </div>
          
          {/* 핵심 지표 */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">협회가입자</span>
              <span className="font-medium text-blue-600">{data.y.toLocaleString()}명</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">고령인구</span>
              <span className="font-medium text-orange-600">{(data.x * 1000).toLocaleString()}명</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">지하철역</span>
              <span className="font-medium text-purple-600">{data.z}개</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">인프라점수</span>
              <span className="font-medium text-gray-700">{(data.infraScore * 100).toFixed(0)}점</span>
            </div>
            
            {/* 인프라 상세 */}
            <div className="pt-1 border-t border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">경로당</span>
                <span className="text-gray-600 text-xs">{data.seniorCenters}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">대형마트</span>
                <span className="text-gray-600 text-xs">{data.largeMarts}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">체육시설</span>
                <span className="text-gray-600 text-xs">{data.sportsFacilities}개</span>
              </div>
            </div>
          </div>
          
          {/* 간단한 인사이트 */}
          <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
            {data.demandEfficiency > 15 ? '높은 수요효율' : 
             data.demandEfficiency > 10 ? '적정 수요효율' : '낮은 수요효율'}
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
          data={chartData}
          margin={{ top: 30, right: 10, bottom: 60, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="x" 
            type="number"
            domain={['dataMin - 8', 'dataMax + 8']}
            tick={{ fontSize: 11 }}
            label={{ 
              value: '고령인구 (천명)', 
              position: 'insideBottom', 
              offset: -25,
              style: { fontSize: 12, textAnchor: 'middle' }
            }}
          />
          <YAxis 
            dataKey="y"
            type="number"
            domain={['dataMin - 50', 'dataMax + 100']}
            tick={{ fontSize: 11 }}
            label={{ 
              value: '협회 가입자수 (실제 수요)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12, textAnchor: 'middle' }
            }}
          />
          <ZAxis dataKey="z" range={[30, 300]} />
          
          {showTrendLine && (
            <ReferenceLine 
              segment={[
                {x: Math.min(...chartData.map(d => d.x)), y: 200},
                {x: Math.max(...chartData.map(d => d.x)), y: 800}
              ]}
              stroke="#94a3b8" 
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}
          
          <Tooltip 
            content={<CustomTooltip />} 
            wrapperStyle={{ backgroundColor: 'transparent', border: 'none' }}
            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Scatter 
            data={chartData} 
            shape={renderCustomDot}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DemandFactorsChart;