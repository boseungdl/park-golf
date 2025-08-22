/**
 * integrate-park-data.js - MCLP 결과와 공원 데이터 통합 스크립트
 * 
 * 🚧 현재 구현 단계: mclp-results.json 기반 정확한 데이터 생성
 * 📅 다음 확장 예정: 추가 공원 정보, 시각화 개선
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: mclp-results.json, seoul-parks-Sheet1.json
 * - 📤 Export: park-mclp-integrated.json
 * - 🔄 사용처: MapView 컴포넌트
 * 
 * 📋 현재 포함 기능:
 * - ✅ mclp-results.json을 기준으로 공원 데이터 생성
 * - ✅ seoul-parks.json과 매칭하여 좌표 정보 추가
 * - ✅ 올바른 총 수요지수와 포함 행정동 수 표시
 * - ✅ 매칭 성공률 리포팅
 * 
 * 💡 사용 예시:
 * ```bash
 * cd frontend && node scripts/integrate-park-data.js
 * ```
 */

const fs = require('fs');
const path = require('path');

class MclpParkIntegrator {
  constructor() {
    this.mclpResults = null;
    this.parkData = null;
    this.matchingStats = {
      total: 0,
      matched: 0,
      unmatched: []
    };
  }

  // 공원명 정규화 함수 (매칭용)
  normalizeParkName(name) {
    if (!name) return '';
    
    return name
      .replace(/시공원$/, '') // 시공원 접미사 제거
      .replace(/<시공원>$/, '') // <시공원> 형태도 제거
      .replace(/_/g, '') // 언더스코어 제거
      .replace(/\s+/g, '') // 모든 공백 제거
      .replace(/[<>()]/g, '') // 특수문자 제거
      .trim()
      .toLowerCase();
  }

  // MCLP 결과 데이터 로딩
  async loadMclpResults() {
    try {
      console.log('📊 MCLP 결과 데이터 로딩...');
      const mclpDataRaw = fs.readFileSync('public/data/mclp-results.json', 'utf8');
      this.mclpResults = JSON.parse(mclpDataRaw);
      
      // allParksData에서 모든 공원 추출
      this.allParks = Object.keys(this.mclpResults.allParksData).map(parkName => ({
        name: parkName,
        ...this.mclpResults.allParksData[parkName]
      }));
      
      console.log(`✅ MCLP 결과 로드 완료: ${this.allParks.length}개 공원`);
      return true;
    } catch (error) {
      console.error('❌ MCLP 결과 읽기 실패:', error.message);
      return false;
    }
  }

  // 공원 JSON 파일 읽기
  async loadParkData() {
    try {
      console.log('🏞️ 공원 데이터 로딩...');
      const parkDataRaw = fs.readFileSync('public/data/seoul-parks-Sheet1.json', 'utf8');
      this.parkData = JSON.parse(parkDataRaw);
      
      console.log(`✅ 공원 데이터 로드 완료: ${this.parkData.length}개 공원`);
      return true;
    } catch (error) {
      console.error('❌ 공원 데이터 읽기 실패:', error.message);
      return false;
    }
  }

  // 문자열 유사도 계산 (Levenshtein Distance)
  calculateSimilarity(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    const distance = matrix[str2.length][str1.length];
    const longer = str1.length > str2.length ? str1 : str2;
    
    if (longer.length === 0) return 1.0;
    return (longer.length - distance) / longer.length;
  }

  // MCLP 공원과 서울 공원 데이터 매칭
  matchParkData() {
    console.log('🔗 MCLP 공원과 서울 공원 데이터 매칭 중...');
    
    const integratedData = [];
    this.matchingStats.total = this.allParks.length;
    
    this.allParks.forEach(mclpPark => {
      const mclpParkNormalized = this.normalizeParkName(mclpPark.name);
      
      // 서울 공원 데이터에서 매칭 시도
      let matchedPark = null;
      let bestSimilarity = 0;
      
      this.parkData.forEach(park => {
        const parkNormalized = this.normalizeParkName(park['공 원 명']);
        const similarity = this.calculateSimilarity(mclpParkNormalized, parkNormalized);
        
        if (similarity > bestSimilarity && similarity > 0.5) {
          bestSimilarity = similarity;
          matchedPark = park;
        }
      });
      
      if (matchedPark) {
        this.matchingStats.matched++;
        integratedData.push({
          // 기본 공원 정보 (서울 공원 데이터 기준)
          ...matchedPark,
          
          // MCLP 분석 정보 (올바른 필드명 사용)
          mclpData: {
            총수요지수: mclpPark.score,           // score = 총 수요지수
            포함행정동수: mclpPark.coveredDongs,   // coveredDongs = 포함 행정동 수
            originalName: mclpPark.originalName || mclpPark.name,  // 원본 공원명
            매칭유사도: bestSimilarity           // 디버깅용
          }
        });
        
        if (this.matchingStats.matched <= 5) {  // 처음 5개만 로그 출력
          console.log(`✅ 매칭 성공: "${mclpPark.name}" ↔ "${matchedPark['공 원 명']}" (유사도: ${bestSimilarity.toFixed(3)})`);
        }
      } else {
        this.matchingStats.unmatched.push(mclpPark.name);
        
        // 매칭 실패한 경우에도 MCLP 데이터만으로 기본 정보 생성
        integratedData.push({
          '공 원 명': mclpPark.name,
          '소재지(시군구)': '서울특별시',
          '운영시간': '연중무휴',
          '입장료': '무료',
          위도: null,
          경도: null,
          
          // MCLP 분석 정보
          mclpData: {
            총수요지수: mclpPark.score,
            포함행정동수: mclpPark.coveredDongs,
            originalName: mclpPark.originalName || mclpPark.name,
            매칭유사도: 0  // 매칭 실패
          }
        });
        
        if (this.matchingStats.unmatched.length <= 5) {  // 처음 5개만 로그 출력
          console.log(`⚠️ 매칭 실패: "${mclpPark.name}" (좌표 정보 없음)`);
        }
      }
    });
    
    return integratedData;
  }

  // 매칭 결과 리포트 생성
  generateMatchingReport() {
    const successRate = (this.matchingStats.matched / this.matchingStats.total * 100).toFixed(1);
    
    console.log('\n📊 매칭 결과 리포트');
    console.log('==================');
    console.log(`✅ 총 MCLP 공원 수: ${this.matchingStats.total}`);
    console.log(`🎯 매칭 성공: ${this.matchingStats.matched}개`);
    console.log(`❌ 매칭 실패: ${this.matchingStats.unmatched.length}개`);
    console.log(`📈 성공률: ${successRate}%`);
    
    if (this.matchingStats.unmatched.length > 0) {
      console.log('\n❌ 매칭 실패한 공원들:');
      this.matchingStats.unmatched.forEach(name => {
        console.log(`   - ${name}`);
      });
    }
  }

  // 메인 실행 함수
  async execute() {
    console.log('🚀 MCLP-공원 데이터 통합 프로세스 시작\n');
    
    // 1. 데이터 로딩
    const mclpLoaded = await this.loadMclpResults();
    const parkLoaded = await this.loadParkData();
    
    if (!mclpLoaded || !parkLoaded) {
      console.error('❌ 데이터 로딩 실패로 프로세스 중단');
      return false;
    }
    
    // 2. 데이터 매칭 및 통합
    const integratedData = this.matchParkData();
    
    // 3. 결과 파일 저장
    const outputPath = 'public/data/park-mclp-integrated.json';
    fs.writeFileSync(outputPath, JSON.stringify(integratedData, null, 2), 'utf8');
    console.log(`💾 통합 데이터 저장 완료: ${outputPath}`);
    
    // 4. 매칭 리포트 생성
    this.generateMatchingReport();
    
    // 5. 샘플 데이터 출력 (상위 5개 공원)
    console.log('\n📄 통합 데이터 샘플 (상위 5개 공원):');
    integratedData.slice(0, 5).forEach((park, idx) => {
      console.log(`\n${idx + 1}. ${park['공 원 명']}`);
      if (park.mclpData) {
        console.log(`   🏆 순위: ${park.mclpData.순위}`);
        console.log(`   📊 총 수요지수: ${park.mclpData.총수요지수.toFixed(3)}`);
        console.log(`   📍 포함 행정동: ${park.mclpData.포함행정동수}개`);
        console.log(`   📍 좌표: ${park.위도 ? `${park.위도}, ${park.경도}` : '정보 없음'}`);
      }
    });
    
    return true;
  }
}

// 스크립트 실행
if (require.main === module) {
  const integrator = new MclpParkIntegrator();
  integrator.execute().then(success => {
    if (success) {
      console.log('\n🎉 MCLP-공원 데이터 통합 완료!');
      console.log('💡 다음 단계: MapView 컴포넌트에서 올바른 데이터 표시');
    } else {
      console.log('\n❌ 데이터 통합 프로세스 실패');
      process.exit(1);
    }
  });
}

module.exports = MclpParkIntegrator;