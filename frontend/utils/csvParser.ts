/**
 * csvParser.ts - CSV 데이터 파싱 유틸리티
 * 
 * 🚧 현재 구현 단계: 기본 파싱 로직 구현
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 📋 현재 포함 기능:
 * - ✅ 협회가입자 데이터 파싱
 * - ✅ 고령자현황 데이터 파싱  
 * - ✅ 지하철역 정보 파싱
 * - ✅ 경로당 정보 파싱
 * - ✅ 구별 통계 통합
 */

// 협회가입자 데이터 타입
export interface ClubMemberData {
  district: string;
  members: number;
}

// 지하철역 정보 타입
export interface SubwayStationData {
  district: string;
  stations: string[];
  count: number;
}

// 경로당 정보 타입
export interface SeniorCenterData {
  district: string;
  centers: number;
}

// 대형마트 정보 타입
export interface LargeMartData {
  district: string;
  marts: number;
}

// 체육시설 정보 타입
export interface SportsData {
  district: string;
  sportsFacilities: number;
}

// 통합 구별 추가 데이터 타입
export interface DistrictAdditionalData {
  district: string;
  clubMembers: number;
  subwayStations: number;
  seniorCenters: number;
  facilities: number;
  largeMarts: number;
  sportsFacilities: number;
}

/**
 * 협회가입자 CSV 데이터 파싱
 */
export const parseClubMemberData = async (): Promise<ClubMemberData[]> => {
  try {
    const response = await fetch('/data/2025/club_people_data.csv');
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    const data: ClubMemberData[] = [];
    
    for (let i = 1; i < lines.length; i++) { // 헤더 제외
      const [district, membersStr] = lines[i].split(',');
      if (district && membersStr) {
        // 한글 인코딩 문제 해결
        const cleanDistrict = district.replace(/[^\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g, '').trim();
        const members = parseInt(membersStr.trim()) || 0;
        
        if (cleanDistrict && members > 0) {
          data.push({
            district: cleanDistrict.endsWith('구') ? cleanDistrict : cleanDistrict + '구',
            members
          });
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('협회가입자 데이터 파싱 실패:', error);
    return [];
  }
};

/**
 * 지하철역 정보 CSV 데이터 파싱
 */
export const parseSubwayStationData = async (): Promise<SubwayStationData[]> => {
  try {
    const response = await fetch('/data/2025/서울교통공사_자치구별지하철역정보_20250317.CSV');
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    const data: SubwayStationData[] = [];
    
    for (let i = 1; i < lines.length; i++) { // 헤더 제외
      const [district, stationsStr, countStr] = lines[i].split(',');
      
      if (district && stationsStr && countStr) {
        const cleanDistrict = district.trim();
        const stations = stationsStr.split('), ').map(s => s.trim());
        const count = parseInt(countStr.trim()) || 0;
        
        data.push({
          district: cleanDistrict.endsWith('구') ? cleanDistrict : cleanDistrict + '구',
          stations,
          count
        });
      }
    }
    
    return data;
  } catch (error) {
    console.error('지하철역 데이터 파싱 실패:', error);
    return [];
  }
};

/**
 * 경로당 정보 CSV 데이터 파싱 (구별 집계)
 */
export const parseSeniorCenterData = async (): Promise<SeniorCenterData[]> => {
  try {
    const response = await fetch('/data/2025/서울시 경로당 정보.csv');
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    const districtCount: { [key: string]: number } = {};
    
    for (let i = 1; i < lines.length; i++) { // 헤더 제외
      const line = lines[i];
      // CSV 파싱 (큰따옴표 처리)
      const matches = line.match(/,"([^"]+)"/g);
      if (matches && matches.length > 0) {
        const address = matches[0].replace(/,"|"/g, '');
        
        // 구 이름 추출
        const districtMatch = address.match(/서울특별시\s+(\S+구)/);
        if (districtMatch) {
          const district = districtMatch[1];
          districtCount[district] = (districtCount[district] || 0) + 1;
        }
      }
    }
    
    return Object.entries(districtCount).map(([district, count]) => ({
      district,
      centers: count
    }));
  } catch (error) {
    console.error('경로당 데이터 파싱 실패:', error);
    return [];
  }
};

/**
 * 대형마트 CSV 데이터 파싱 (구별 집계)
 */
export const parseLargeMartData = async (): Promise<LargeMartData[]> => {
  try {
    const response = await fetch('/data/2025/서울시 대규모점포 인허가 정보.csv');
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    const districtCount: { [key: string]: number } = {};
    
    for (let i = 1; i < lines.length; i++) { // 헤더 제외
      const line = lines[i];
      // CSV 파싱 - 주소 정보에서 구 이름 추출
      const matches = line.match(/,"[^"]*서울특별시\s+(\S+구)[^"]*"/);
      if (matches && matches[1]) {
        const district = matches[1];
        districtCount[district] = (districtCount[district] || 0) + 1;
      }
    }
    
    return Object.entries(districtCount).map(([district, count]) => ({
      district,
      marts: count
    }));
  } catch (error) {
    console.error('대형마트 데이터 파싱 실패:', error);
    return [];
  }
};

/**
 * 체육시설 CSV 데이터 파싱 (구별 집계)
 */
export const parseSportsData = async (): Promise<SportsData[]> => {
  try {
    const response = await fetch('/data/2025/서울시 종합체육시설업 인허가 정보.csv');
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    const districtCount: { [key: string]: number } = {};
    
    for (let i = 1; i < lines.length; i++) { // 헤더 제외
      const line = lines[i];
      // CSV 파싱 - 주소 정보에서 구 이름 추출
      const matches = line.match(/,"[^"]*서울특별시\s+(\S+구)[^"]*"/);
      if (matches && matches[1]) {
        const district = matches[1];
        districtCount[district] = (districtCount[district] || 0) + 1;
      }
    }
    
    return Object.entries(districtCount).map(([district, count]) => ({
      district,
      sportsFacilities: count
    }));
  } catch (error) {
    console.error('체육시설 데이터 파싱 실패:', error);
    return [];
  }
};

/**
 * 모든 추가 데이터를 통합하여 구별 데이터 생성
 */
export const parseAllDistrictData = async (): Promise<DistrictAdditionalData[]> => {
  try {
    const [clubData, subwayData, seniorCenterData, largeMartData, sportsData] = await Promise.all([
      parseClubMemberData(),
      parseSubwayStationData(),
      parseSeniorCenterData(),
      parseLargeMartData(),
      parseSportsData()
    ]);
    
    // 서울시 25개 구 목록
    const districts = [
      '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
      '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구',
      '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구',
      '종로구', '중구', '중랑구'
    ];
    
    return districts.map(district => {
      const club = clubData.find(c => c.district === district);
      const subway = subwayData.find(s => s.district === district);
      const seniorCenter = seniorCenterData.find(sc => sc.district === district);
      const largeMart = largeMartData.find(lm => lm.district === district);
      const sports = sportsData.find(sp => sp.district === district);
      
      return {
        district,
        clubMembers: club?.members || 0,
        subwayStations: subway?.count || 0,
        seniorCenters: seniorCenter?.centers || 0,
        facilities: sports?.sportsFacilities || 0, // 실제 체육시설 데이터로 교체
        largeMarts: largeMart?.marts || 0,
        sportsFacilities: sports?.sportsFacilities || 0
      };
    });
  } catch (error) {
    console.error('통합 데이터 파싱 실패:', error);
    return [];
  }
};