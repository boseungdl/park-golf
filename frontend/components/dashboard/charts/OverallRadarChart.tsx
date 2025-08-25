/**
 * OverallRadarChart.tsx - 종합 지표 레이더 차트
 * 
 * 🚧 현재 구현 단계: 완성
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: recharts, dashboardStore
 * - 📤 Export: OverallRadarChart 컴포넌트
 * - 🔄 사용처: DashboardPanel
 * 
 * 📋 현재 포함 기능:
 * - ✅ 다중 지표 레이더 차트
 * - ✅ 구별 비교 기능
 * - ✅ 서울시 평균 오버레이
 * - ✅ 애니메이션 효과
 */

'use client';

import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { useDashboardStore } from '../../../store/dashboardStore';

interface OverallRadarChartProps {
  districts?: string[];
  showAverage?: boolean;
}

const OverallRadarChart: React.FC<OverallRadarChartProps> = ({ 
  districts = [], 
  showAverage = true 
}) => {
  const { districtStats, seoulStats } = useDashboardStore();

  // 지표 정규화 (0-100 스케일)
  const normalizeValue = (value: number, min: number, max: number): number => {
    if (max === min) return 50;
    return ((value - min) / (max - min)) * 100;
  };

  // 데이터 준비
  const prepareChartData = () => {
    // 최대/최소값 계산
    const maxElderly = Math.max(...districtStats.map(d => d.elderlyRate));
    const minElderly = Math.min(...districtStats.map(d => d.elderlyRate));
    const maxFacility = Math.max(...districtStats.map(d => d.facilityScore));
    const minFacility = Math.min(...districtStats.map(d => d.facilityScore));
    const maxTransport = Math.max(...districtStats.map(d => d.transportScore));
    const minTransport = Math.min(...districtStats.map(d => d.transportScore));
    const maxOverall = Math.max(...districtStats.map(d => d.overallScore));
    const minOverall = Math.min(...districtStats.map(d => d.overallScore));
    const maxPopulation = Math.max(...districtStats.map(d => d.totalPopulation));
    const minPopulation = Math.min(...districtStats.map(d => d.totalPopulation));

    // 지표별 데이터 구성
    const indicators = [
      { subject: '고령화율', fullMark: 100 },
      { subject: '시설점수', fullMark: 100 },
      { subject: '교통접근성', fullMark: 100 },
      { subject: '종합점수', fullMark: 100 },
      { subject: '인구규모', fullMark: 100 }
    ];

    // 서울시 평균 데이터
    if (showAverage && seoulStats) {
      const avgElderly = seoulStats.elderlyRate;
      const avgFacility = districtStats.reduce((sum, d) => sum + d.facilityScore, 0) / districtStats.length;
      const avgTransport = seoulStats.averageAccessibility;
      const avgOverall = districtStats.reduce((sum, d) => sum + d.overallScore, 0) / districtStats.length;
      const avgPopulation = seoulStats.totalPopulation / districtStats.length;

      indicators.forEach((indicator, index) => {
        switch (index) {
          case 0:
            (indicator as any)['서울시평균'] = normalizeValue(avgElderly, minElderly, maxElderly);
            break;
          case 1:
            (indicator as any)['서울시평균'] = normalizeValue(avgFacility, minFacility, maxFacility);
            break;
          case 2:
            (indicator as any)['서울시평균'] = normalizeValue(avgTransport, minTransport, maxTransport);
            break;
          case 3:
            (indicator as any)['서울시평균'] = normalizeValue(avgOverall, minOverall, maxOverall);
            break;
          case 4:
            (indicator as any)['서울시평균'] = normalizeValue(avgPopulation, minPopulation, maxPopulation);
            break;
        }
      });
    }

    // 선택된 구별 데이터 추가
    districts.forEach(districtName => {
      const district = districtStats.find(d => d.district === districtName);
      if (district) {
        indicators.forEach((indicator, index) => {
          switch (index) {
            case 0:
              (indicator as any)[districtName] = normalizeValue(district.elderlyRate, minElderly, maxElderly);
              break;
            case 1:
              (indicator as any)[districtName] = normalizeValue(district.facilityScore, minFacility, maxFacility);
              break;
            case 2:
              (indicator as any)[districtName] = normalizeValue(district.transportScore, minTransport, maxTransport);
              break;
            case 3:
              (indicator as any)[districtName] = normalizeValue(district.overallScore, minOverall, maxOverall);
              break;
            case 4:
              (indicator as any)[districtName] = normalizeValue(district.totalPopulation, minPopulation, maxPopulation);
              break;
          }
        });
      }
    });

    return indicators;
  };

  const data = prepareChartData();

  // 색상 팔레트
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800 mb-2">{payload[0].payload.subject}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value.toFixed(1)}점
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid 
            gridType="polygon"
            stroke="#e5e7eb"
            radialLines={true}
          />
          <PolarAngleAxis 
            dataKey="subject"
            tick={{ fontSize: 12 }}
            className="text-gray-700"
          />
          <PolarRadiusAxis 
            angle={90}
            domain={[0, 100]}
            tickCount={5}
            tick={{ fontSize: 10 }}
          />
          
          {showAverage && (
            <Radar
              name="서울시평균"
              dataKey="서울시평균"
              stroke="#9ca3af"
              fill="#9ca3af"
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
          
          {districts.map((district, index) => (
            <Radar
              key={district}
              name={district}
              dataKey={district}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.3}
              strokeWidth={2}
              animationBegin={0}
              animationDuration={1000}
            />
          ))}
          
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OverallRadarChart;