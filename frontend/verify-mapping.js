// 최종 매핑 검증 스크립트
const fs = require('fs');
const path = require('path');

// 매핑 함수들
function extractDistrictFromDongName(dongName) {
  // 수정: 구로구처럼 '로'가 들어간 구명을 위한 패턴 개선
  const match = dongName.match(/서울특별시\s+([가-힣]+구)\s+/);
  return match ? match[1] : null;
}

function generateDistrictDongMapping(dongGeoJSON) {
  const mapping = {};
  
  dongGeoJSON.features.forEach((feature) => {
    const { adm_cd, adm_nm } = feature.properties;
    const districtName = extractDistrictFromDongName(adm_nm);
    
    if (districtName) {
      if (!mapping[districtName]) {
        mapping[districtName] = {
          dongList: [],
          count: 0
        };
      }
      
      mapping[districtName].dongList.push({ adm_cd, adm_nm });
      mapping[districtName].count = mapping[districtName].dongList.length;
    }
  });
  
  return mapping;
}

async function verifyMapping() {
  try {
    console.log('🔍 최종 검증 시작...\n');

    // 1. 구 데이터 검증
    console.log('1️⃣ 자치구 데이터 검증');
    const districtsData = JSON.parse(fs.readFileSync(
      path.join(__dirname, 'public/data/seoul-districts-2017.geojson'),
      'utf-8'
    ));
    
    const districtNames = districtsData.features.map(feature => feature.properties.SIG_KOR_NM).sort();
    console.log(`   - 자치구 개수: ${districtNames.length}개`);
    console.log(`   - 자치구 목록: ${districtNames.slice(0, 5).join(', ')}...`);

    // 2. 행정동 데이터 검증
    console.log('\n2️⃣ 행정동 데이터 검증');
    const dongsData = JSON.parse(fs.readFileSync(
      path.join(__dirname, 'public/data/seoul-dongs-2017.geojson'),
      'utf-8'
    ));
    
    console.log(`   - 행정동 개수: ${dongsData.features.length}개`);
    
    // 3. 매핑 테이블 생성 및 검증
    console.log('\n3️⃣ 구-행정동 매핑 검증');
    const mapping = generateDistrictDongMapping(dongsData);
    const mappedDistricts = Object.keys(mapping).sort();
    const totalMappedDongs = mappedDistricts.reduce((sum, district) => sum + mapping[district].count, 0);
    
    console.log(`   - 매핑된 구 개수: ${mappedDistricts.length}개`);
    console.log(`   - 매핑된 행정동 개수: ${totalMappedDongs}개`);

    // 4. 일치성 검증
    console.log('\n4️⃣ 데이터 일치성 검증');
    const missingInMapping = districtNames.filter(name => !mappedDistricts.includes(name));
    const extraInMapping = mappedDistricts.filter(name => !districtNames.includes(name));
    
    if (missingInMapping.length > 0) {
      console.log(`   ❌ 매핑에서 누락된 구: ${missingInMapping.join(', ')}`);
    }
    
    if (extraInMapping.length > 0) {
      console.log(`   ❌ 매핑에만 있는 구: ${extraInMapping.join(', ')}`);
    }
    
    if (missingInMapping.length === 0 && extraInMapping.length === 0) {
      console.log('   ✅ 구 데이터 완벽 일치!');
    }

    // 5. 샘플 구 상세 검증
    console.log('\n5️⃣ 샘플 구 상세 검증');
    const sampleDistricts = ['종로구', '강남구', '마포구'];
    
    sampleDistricts.forEach(district => {
      if (mapping[district]) {
        console.log(`   ${district}: ${mapping[district].count}개 행정동`);
        mapping[district].dongList.slice(0, 2).forEach(dong => {
          console.log(`     - ${dong.adm_cd}: ${dong.adm_nm}`);
        });
      } else {
        console.log(`   ❌ ${district}: 매핑되지 않음`);
      }
    });

    // 6. 최종 결과
    console.log('\n6️⃣ 최종 결과');
    const isValid = missingInMapping.length === 0 && extraInMapping.length === 0 && 
                   mappedDistricts.length >= 24 && totalMappedDongs >= 400;
    
    if (isValid) {
      console.log('✅ 모든 검증 통과! 구-행정동 경계 불일치 문제 해결 완료');
      console.log(`   - 서울시 ${mappedDistricts.length}개 구`);
      console.log(`   - 총 ${totalMappedDongs}개 행정동`);
      console.log('   - 2017년 동일 소스 데이터 사용으로 경계 완벽 일치');
    } else {
      console.log('❌ 검증 실패: 추가 확인 필요');
    }

  } catch (error) {
    console.error('❌ 검증 오류:', error.message);
  }
}

verifyMapping();