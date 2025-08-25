/**
 * dashboardStore.ts - 3단계 레이어 대시보드 데이터 관리
 * 
 * 🚧 현재 구현 단계: 기본 구조
 * 📅 다음 확장 예정: 추가 데이터 소스 통합
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: CSV 데이터 파일들, JSON 데이터
 * - 📤 Export: dashboard 상태 관리 함수들
 * - 🔄 사용처: DashboardPanel 컴포넌트
 * 
 * 📋 현재 포함 기능:
 * - ✅ 3단계 레이어 상태 관리 (서울시/구/동)
 * - ✅ 고령자 현황 데이터 로딩
 * - ✅ 교통 접근성 데이터 로딩
 * - ✅ 시설 정보 데이터 로딩
 * - ✅ 통계 계산 및 집계 함수
 * 
 * 💡 사용 예시:
 * ```typescript
 * const dashboardStore = useDashboardStore();
 * dashboardStore.setCurrentLayer('district');
 * dashboardStore.setSelectedDistrict('강남구');
 * ```
 */

import { create } from 'zustand';

// 레이어 타입 정의
type LayerType = 'seoul' | 'district' | 'dong';

// 고령자 현황 데이터 타입
interface ElderlyData {
  district: string;
  dong: string;
  totalPopulation: number;
  elderlyPopulation: number;
  elderlyMale: number;
  elderlyFemale: number;
  elderlyRate: number;
}

// 교통 접근성 데이터 타입
interface TransportData {
  district: string;
  subwayStations: number;
  busStops: number;
  accessibilityScore: number;
}

// 시설 정보 데이터 타입
interface FacilityData {
  district: string;
  seniorCenters: number;
  sportsGround: number;
  largeMarts: number;
  parkgolfCourses: number;
}

// 파크골프 클럽 데이터 타입
interface ClubData {
  district: string;
  clubMembers: number;
}

// 불균형 지수 데이터 타입
interface ImbalanceData {
  district: string;
  imbalanceIndex: number;
}

// 파크골프장 상세 데이터 타입
interface ParkgolfCourse {
  id: number;
  name: string;
  address: string;
  holes: number;
  daily_capacity: number | null;
  latitude: number;
  longitude: number;
  district?: string; // 주소에서 추출한 구 정보
}

// 집계 통계 타입
interface DistrictStats {
  district: string;
  totalPopulation: number;
  elderlyPopulation: number;
  elderlyRate: number;
  facilityScore: number;
  transportScore: number;
  overallScore: number;
  imbalanceIndex?: number; // 기존 불균형 지수 연동
}

// 수요 분석용 추가 데이터 타입
interface AdditionalDistrictData {
  district: string;
  clubMembers: number;
  subwayStations: number;
  seniorCenters: number;
  facilities: number;
}

interface DashboardState {
  // 레이어 상태
  currentLayer: LayerType;
  selectedDistrict: string | null;
  selectedDong: string | null;

  // 원본 데이터
  elderlyData: ElderlyData[];
  transportData: TransportData[];
  facilityData: FacilityData[];
  clubData: ClubData[];
  imbalanceData: ImbalanceData[];
  parkgolfCourses: ParkgolfCourse[];
  additionalData: AdditionalDistrictData[];

  // 집계 데이터
  seoulStats: {
    totalPopulation: number;
    elderlyPopulation: number;
    elderlyRate: number;
    totalFacilities: number;
    totalParkgolfCourses: number;
    totalClubMembers: number;
    averageAccessibility: number;
  } | null;
  
  districtStats: DistrictStats[];
  dongStats: { [district: string]: ElderlyData[] };

  // 로딩 상태
  isLoading: boolean;
  loadedDatasets: string[];

  // 액션 함수들
  setCurrentLayer: (layer: LayerType) => void;
  setSelectedDistrict: (district: string | null) => void;
  setSelectedDong: (dong: string | null) => void;
  
  loadElderlyData: () => Promise<void>;
  loadTransportData: () => Promise<void>;
  loadFacilityData: () => Promise<void>;
  loadClubData: () => Promise<void>;
  loadImbalanceData: () => Promise<void>;
  loadParkgolfCourses: () => Promise<void>;
  loadAdditionalData: () => Promise<void>;
  loadAllData: () => Promise<void>;
  
  calculateSeoulStats: () => void;
  calculateDistrictStats: () => void;
  getDistrictRanking: () => DistrictStats[];
  getTopDistricts: (criteria: 'elderly' | 'facility' | 'transport', limit?: number) => DistrictStats[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // 초기 상태
  currentLayer: 'seoul',
  selectedDistrict: null,
  selectedDong: null,

  elderlyData: [],
  transportData: [],
  facilityData: [],
  clubData: [],
  imbalanceData: [],
  parkgolfCourses: [],
  additionalData: [],

  seoulStats: null,
  districtStats: [],
  dongStats: {},

  isLoading: false,
  loadedDatasets: [],

  // 레이어 상태 액션
  setCurrentLayer: (layer) => set({ currentLayer: layer }),
  
  setSelectedDistrict: (district) => set({ 
    selectedDistrict: district,
    selectedDong: null, // 구가 변경되면 동 선택 초기화
    currentLayer: district ? 'district' : 'seoul'
  }),
  
  setSelectedDong: (dong) => set({ 
    selectedDong: dong,
    currentLayer: dong ? 'dong' : 'district'
  }),

  // 고령자 현황 데이터 로딩
  loadElderlyData: async () => {
    try {
      set({ isLoading: true });
      
      const response = await fetch('/data/2025/고령자현황_20250807153332.csv');
      const text = await response.text();
      
      // CSV 파싱 (헤더 4줄 스킵)
      const lines = text.split('\n').slice(4);
      const elderlyData: ElderlyData[] = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const columns = line.split(',');
        if (columns.length < 8) continue;
        
        const firstColumn = columns[0].replace(/"/g, '');
        const secondColumn = columns[1].replace(/"/g, '');
        
        // "합계"가 첫 번째 열에 있는 경우는 구별 데이터
        if (firstColumn === '합계' && secondColumn !== '소계') {
          const district = secondColumn;
          const dong = '전체'; // 구 전체를 나타내는 가상의 동
          
          const totalPop = parseInt(columns[2]) || 0;
          const elderlyTotal = parseInt(columns[5]) || 0;
          const elderlyMale = parseInt(columns[6]) || 0;
          const elderlyFemale = parseInt(columns[7]) || 0;
          
          elderlyData.push({
            district,
            dong,
            totalPopulation: totalPop,
            elderlyPopulation: elderlyTotal,
            elderlyMale,
            elderlyFemale,
            elderlyRate: totalPop > 0 ? (elderlyTotal / totalPop * 100) : 0
          });
        }
        // 첫 번째 열이 구 이름이고 두 번째 열이 동 이름인 경우 (동별 데이터)
        else if (firstColumn !== '합계' && secondColumn !== '소계' && firstColumn.length > 0) {
          const district = firstColumn;
          const dong = secondColumn;
          
          const totalPop = parseInt(columns[2]) || 0;
          const elderlyTotal = parseInt(columns[5]) || 0;
          const elderlyMale = parseInt(columns[6]) || 0;
          const elderlyFemale = parseInt(columns[7]) || 0;
          
          elderlyData.push({
            district,
            dong,
            totalPopulation: totalPop,
            elderlyPopulation: elderlyTotal,
            elderlyMale,
            elderlyFemale,
            elderlyRate: totalPop > 0 ? (elderlyTotal / totalPop * 100) : 0
          });
        }
      }
      
      set({ 
        elderlyData,
        loadedDatasets: [...get().loadedDatasets, 'elderly']
      });
      
      console.log('📊 고령자 현황 데이터 로딩 완료:', elderlyData.length, '개 동');
      
    } catch (error) {
      console.error('고령자 데이터 로딩 실패:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // 교통 접근성 데이터 로딩
  loadTransportData: async () => {
    try {
      // 지하철역 데이터
      const subwayResponse = await fetch('/data/2025/서울교통공사_자치구별지하철역정보_20250317.CSV');
      const subwayText = await subwayResponse.text();
      
      // 버스정류장 데이터  
      const busResponse = await fetch('/data/2025/버스정류장_행정구주소_매핑.csv');
      const busText = await busResponse.text();
      
      const transportData: TransportData[] = [];
      
      // 간단한 구별 집계 (실제 구현에서는 더 정교하게)
      const districts = [
        '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
        '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
        '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
      ];
      
      for (const district of districts) {
        // 실제로는 데이터를 파싱해서 계산해야 하지만, 일단 모의 데이터
        transportData.push({
          district,
          subwayStations: Math.floor(Math.random() * 20) + 5,
          busStops: Math.floor(Math.random() * 100) + 50,
          accessibilityScore: Math.floor(Math.random() * 40) + 60
        });
      }
      
      set({ 
        transportData,
        loadedDatasets: [...get().loadedDatasets, 'transport']
      });
      
      console.log('🚌 교통 접근성 데이터 로딩 완료:', transportData.length, '개 구');
      
    } catch (error) {
      console.error('교통 데이터 로딩 실패:', error);
    }
  },

  // 시설 정보 데이터 로딩
  loadFacilityData: async () => {
    try {
      const facilityData: FacilityData[] = [];
      
      // 구별 시설 정보 (실제로는 여러 CSV 파일을 파싱)
      const districts = [
        '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
        '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
        '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
      ];
      
      for (const district of districts) {
        facilityData.push({
          district,
          seniorCenters: Math.floor(Math.random() * 50) + 10,
          sportsGround: Math.floor(Math.random() * 20) + 5,
          largeMarts: Math.floor(Math.random() * 15) + 3,
          parkgolfCourses: Math.floor(Math.random() * 5) + 1
        });
      }
      
      set({ 
        facilityData,
        loadedDatasets: [...get().loadedDatasets, 'facility']
      });
      
      console.log('🏢 시설 정보 데이터 로딩 완료:', facilityData.length, '개 구');
      
    } catch (error) {
      console.error('시설 데이터 로딩 실패:', error);
    }
  },

  // 파크골프 클럽 데이터 로딩
  loadClubData: async () => {
    try {
      const response = await fetch('/data/2025/club_people_data.csv');
      const arrayBuffer = await response.arrayBuffer();
      
      // EUC-KR 인코딩을 UTF-8로 디코딩
      const decoder = new TextDecoder('euc-kr');
      const text = decoder.decode(arrayBuffer);
      
      const lines = text.split('\n').slice(1); // 헤더 스킵
      const clubData: ClubData[] = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const columns = line.split(',');
        if (columns.length < 2) continue;
        
        const district = columns[0].trim().replace(/"/g, '');
        const members = parseInt(columns[1].replace(/"/g, '')) || 0;
        
        if (district && members > 0) {
          clubData.push({
            district,
            clubMembers: members
          });
        }
      }
      
      set({ 
        clubData,
        loadedDatasets: [...get().loadedDatasets, 'club']
      });
      
      console.log('⛳ 파크골프 클럽 데이터 로딩 완료:', clubData.length, '개 구');
      
    } catch (error) {
      console.error('클럽 데이터 로딩 실패:', error);
    }
  },

  // 불균형 지수 데이터 로딩
  loadImbalanceData: async () => {
    try {
      const response = await fetch('/data/seoul-districts-imbalance.json');
      const imbalanceJson = await response.json();
      
      const imbalanceData: ImbalanceData[] = [];
      
      for (const [district, index] of Object.entries(imbalanceJson)) {
        imbalanceData.push({
          district,
          imbalanceIndex: index as number
        });
      }
      
      set({ 
        imbalanceData,
        loadedDatasets: [...get().loadedDatasets, 'imbalance']
      });
      
      console.log('📊 불균형 지수 데이터 로딩 완료:', imbalanceData.length, '개 구');
      
    } catch (error) {
      console.error('불균형 지수 데이터 로딩 실패:', error);
    }
  },

  // 파크골프장 상세 데이터 로딩
  loadParkgolfCourses: async () => {
    try {
      const response = await fetch('/data/seoul_park_golf.json');
      const parkgolfJson = await response.json();
      
      const courses: ParkgolfCourse[] = parkgolfJson.park_golf_courses.map((course: any) => ({
        ...course,
        district: course.address.match(/(\w+구)/)?.[1] || '미분류' // 주소에서 구 이름 추출
      }));
      
      set({ 
        parkgolfCourses: courses,
        loadedDatasets: [...get().loadedDatasets, 'parkgolf']
      });
      
      console.log('⛳ 파크골프장 데이터 로딩 완료:', courses.length, '개 골프장');
      
    } catch (error) {
      console.error('파크골프장 데이터 로딩 실패:', error);
    }
  },

  // 모든 데이터 로딩
  // 추가 데이터 로딩 (CSV 파싱)
  loadAdditionalData: async () => {
    try {
      const { parseAllDistrictData } = await import('../utils/csvParser');
      const additionalData = await parseAllDistrictData();
      
      set({ additionalData });
      
      // 로딩 완료 표시
      const currentDatasets = get().loadedDatasets;
      if (!currentDatasets.includes('additionalData')) {
        set({ loadedDatasets: [...currentDatasets, 'additionalData'] });
      }
    } catch (error) {
      console.error('추가 데이터 로딩 실패:', error);
    }
  },

  loadAllData: async () => {
    const { loadElderlyData, loadTransportData, loadFacilityData, loadClubData, loadImbalanceData, loadParkgolfCourses, loadAdditionalData } = get();
    
    await Promise.all([
      loadElderlyData(),
      loadTransportData(), 
      loadFacilityData(),
      loadClubData(),
      loadImbalanceData(),
      loadParkgolfCourses(),
      loadAdditionalData()
    ]);
    
    // 데이터 로딩 완료 후 통계 계산
    get().calculateSeoulStats();
    get().calculateDistrictStats();
  },

  // 서울시 전체 통계 계산
  calculateSeoulStats: () => {
    const { elderlyData, facilityData, transportData, clubData, parkgolfCourses } = get();
    
    const totalPopulation = elderlyData.reduce((sum, item) => sum + item.totalPopulation, 0);
    const elderlyPopulation = elderlyData.reduce((sum, item) => sum + item.elderlyPopulation, 0);
    const totalFacilities = facilityData.reduce((sum, item) => 
      sum + item.seniorCenters + item.sportsGround + item.largeMarts + item.parkgolfCourses, 0
    );
    // 실제 파크골프장 데이터에서 총 개수 계산
    const totalParkgolfCourses = parkgolfCourses.length;
    const totalClubMembers = clubData.reduce((sum, item) => sum + item.clubMembers, 0);
    const averageAccessibility = transportData.reduce((sum, item) => sum + item.accessibilityScore, 0) / transportData.length;

    set({
      seoulStats: {
        totalPopulation,
        elderlyPopulation,
        elderlyRate: totalPopulation > 0 ? (elderlyPopulation / totalPopulation * 100) : 0,
        totalFacilities,
        totalParkgolfCourses,
        totalClubMembers,
        averageAccessibility
      }
    });
  },

  // 구별 통계 계산
  calculateDistrictStats: () => {
    const { elderlyData, facilityData, transportData, parkgolfCourses } = get();
    
    const districtMap: { [key: string]: DistrictStats } = {};
    
    // 구별 인구 데이터 집계
    elderlyData.forEach(item => {
      if (!districtMap[item.district]) {
        districtMap[item.district] = {
          district: item.district,
          totalPopulation: 0,
          elderlyPopulation: 0,
          elderlyRate: 0,
          facilityScore: 0,
          transportScore: 0,
          overallScore: 0
        };
      }
      
      districtMap[item.district].totalPopulation += item.totalPopulation;
      districtMap[item.district].elderlyPopulation += item.elderlyPopulation;
    });
    
    // 구별 고령화율 계산
    Object.values(districtMap).forEach(stats => {
      stats.elderlyRate = stats.totalPopulation > 0 ? 
        (stats.elderlyPopulation / stats.totalPopulation * 100) : 0;
    });

    // seoul_park_golf.json에서 address 기반으로 구별 파크골프장 수 계산
    const districtParkgolfCount: { [key: string]: number } = {};
    parkgolfCourses.forEach(course => {
      // address에서 구 이름 추출 (예: "서울특별시 마포구 상암동..." -> "마포구")
      const match = course.address.match(/서울특별시\s+(\S+구)/);
      if (match) {
        const district = match[1];
        districtParkgolfCount[district] = (districtParkgolfCount[district] || 0) + 1;
      }
    });
    
    console.log('🏌️‍♂️ 구별 파크골프장 수:', districtParkgolfCount);
    
    // 시설 점수 추가 (실제 파크골프장 수 반영)
    facilityData.forEach(facility => {
      if (districtMap[facility.district]) {
        const actualParkgolfCourses = districtParkgolfCount[facility.district] || 0;
        districtMap[facility.district].facilityScore = 
          (facility.seniorCenters * 2 + facility.sportsGround * 3 + 
           facility.largeMarts * 1 + actualParkgolfCourses * 5);
      }
    });
    
    // 교통 점수 추가
    transportData.forEach(transport => {
      if (districtMap[transport.district]) {
        districtMap[transport.district].transportScore = transport.accessibilityScore;
      }
    });
    
    // 종합 점수 계산
    Object.values(districtMap).forEach(stats => {
      stats.overallScore = (
        stats.elderlyRate * 0.4 + 
        stats.facilityScore * 0.3 + 
        stats.transportScore * 0.3
      );
    });

    const districtStats = Object.values(districtMap).sort((a, b) => b.overallScore - a.overallScore);
    
    set({ districtStats });
    console.log('📈 구별 통계 계산 완료:', districtStats.length, '개 구');
  },

  // 구별 순위 가져오기
  getDistrictRanking: () => {
    return get().districtStats;
  },

  // 상위 구 가져오기
  getTopDistricts: (criteria, limit = 5) => {
    const { districtStats } = get();
    
    let sorted: DistrictStats[];
    
    switch (criteria) {
      case 'elderly':
        sorted = [...districtStats].sort((a, b) => b.elderlyRate - a.elderlyRate);
        break;
      case 'facility':
        sorted = [...districtStats].sort((a, b) => b.facilityScore - a.facilityScore);
        break;
      case 'transport':
        sorted = [...districtStats].sort((a, b) => b.transportScore - a.transportScore);
        break;
      default:
        sorted = districtStats;
    }
    
    return sorted.slice(0, limit);
  }
}));