/**
 * ParkgolfFacilityChart.tsx - 파크골프장 관련 시설 비교 차트
 * 
 * 🚧 현재 구현 단계: 완성
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: recharts, dashboardStore
 * - 📤 Export: ParkgolfFacilityChart 컴포넌트
 * - 🔄 사용처: DashboardPanel
 * 
 * 📋 현재 포함 기능:
 * - ✅ 파크골프장 수 vs 관련 시설 비교
 * - ✅ 이중축 막대 차트
 * - ✅ 클럽 가입자 수 포함
 * - ✅ 상대적 비교 가능
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
  ResponsiveContainer
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
  const { districtStats, facilityData, clubData, setSelectedDistrict } = useDashboardStore();

  // 데이터 준비
  const prepareChartData = () => {
    let data = districtStats.map(districtStat => {
      const facility = facilityData.find(f => f.district === districtStat.district);
      const club = clubData.find(c => c.district === districtStat.district);
      
      return {
        name: districtStat.district.replace('구', ''),
        fullName: districtStat.district,
        파크골프장: facility?.parkgolfCourses || 0,
        클럽가입자: club?.clubMembers || 0,
        경로당: facility?.seniorCenters || 0,
        체육시설: facility?.sportsGround || 0,
        // 상대적 비교를 위한 지수 계산
        시설_지수: facility ? (facility.seniorCenters + facility.sportsGround * 2) / 10 : 0,
        고령인구_천명: Math.round(districtStat.elderlyPopulation / 1000)
      };
    });

    if (district) {
      data = data.filter(d => d.fullName === district);
    } else {
      // 파크골프장 수 기준으로 정렬 후 제한
      data = data.sort((a, b) => b.파크골프장 - a.파크골프장).slice(0, limit);
    }

    return data;
  };

  const data = prepareChartData();

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800 mb-2">{label}구</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600">
              파크골프장: {data.파크골프장}개
            </p>
            <p className="text-blue-600">
              클럽가입자: {data.클럽가입자.toLocaleString()}명
            </p>
            <p className="text-purple-600">
              경로당: {data.경로당}개
            </p>
            <p className="text-orange-600">
              체육시설: {data.체육시설}개
            </p>
            <p className="text-gray-600">
              고령인구: {data.고령인구_천명}천명
            </p>
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
            yAxisId="left"
            tick={{ fontSize: 12 }}
            label={{ 
              value: '시설 수 (개)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12 }
            }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            label={{ 
              value: '가입자 수 (명)', 
              angle: 90, 
              position: 'insideRight',
              style: { fontSize: 12 }
            }}
          />
          
          {/* 파크골프장 수 */}
          <Bar 
            yAxisId="left"
            dataKey="파크골프장" 
            fill="#22c55e"
            name="파크골프장"
            onClick={handleBarClick}
            style={{ cursor: district ? 'default' : 'pointer' }}
            radius={[4, 4, 0, 0]}
          />
          
          {/* 경로당 수 */}
          <Bar 
            yAxisId="left"
            dataKey="경로당" 
            fill="#a855f7"
            name="경로당"
            onClick={handleBarClick}
            style={{ cursor: district ? 'default' : 'pointer' }}
            radius={[4, 4, 0, 0]}
            fillOpacity={0.7}
          />
          
          {/* 체육시설 수 */}
          <Bar 
            yAxisId="left"
            dataKey="체육시설" 
            fill="#f97316"
            name="체육시설"
            onClick={handleBarClick}
            style={{ cursor: district ? 'default' : 'pointer' }}
            radius={[4, 4, 0, 0]}
            fillOpacity={0.7}
          />
          
          {/* 클럽 가입자 수 (선 그래프) */}
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="클럽가입자" 
            stroke="#3b82f6"
            strokeWidth={3}
            name="클럽가입자"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            connectNulls={false}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="rect"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ParkgolfFacilityChart;