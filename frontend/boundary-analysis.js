// 구 경계와 행정동 경계 일치성 분석 스크립트
const fs = require('fs');
const path = require('path');

function extractDistrictFromDongName(dongName) {
  const match = dongName.match(/서울특별시\s+([가-힣]+구)\s+/);
  return match ? match[1] : null;
}

async function analyzeBoundaryAlignment() {
  try {
    console.log('🔍 구-행정동 경계 일치성 분석 시작...\n');

    // 1. 데이터 로딩
    console.log('1️⃣ 데이터 로딩');
    const districtsData = JSON.parse(fs.readFileSync(
      path.join(__dirname, 'public/data/seoul-districts-2017.geojson'),
      'utf-8'
    ));
    
    const dongsData = JSON.parse(fs.readFileSync(
      path.join(__dirname, 'public/data/seoul-dongs-2017.geojson'),
      'utf-8'
    ));
    
    console.log(`   - 구 데이터: ${districtsData.features.length}개`);
    console.log(`   - 행정동 데이터: ${dongsData.features.length}개`);

    // 2. 구별 행정동 매핑
    console.log('\n2️⃣ 구별 행정동 매핑 분석');
    const districtMapping = {};
    
    dongsData.features.forEach(feature => {
      const { adm_cd, adm_nm } = feature.properties;
      const districtName = extractDistrictFromDongName(adm_nm);
      
      if (districtName) {
        if (!districtMapping[districtName]) {
          districtMapping[districtName] = {
            dongList: [],
            dongCount: 0
          };
        }
        districtMapping[districtName].dongList.push({
          adm_cd,
          adm_nm,
          geometry: feature.geometry
        });
        districtMapping[districtName].dongCount++;
      }
    });

    // 3. 구 데이터와 비교
    console.log('\n3️⃣ 구 데이터와 행정동 매핑 비교');
    const districtNames = districtsData.features.map(f => f.properties.SIG_KOR_NM).sort();
    const mappedDistricts = Object.keys(districtMapping).sort();
    
    console.log(`   - 구 데이터에서: ${districtNames.length}개 구`);
    console.log(`   - 행정동에서 추출: ${mappedDistricts.length}개 구`);
    
    const missing = districtNames.filter(d => !mappedDistricts.includes(d));
    const extra = mappedDistricts.filter(d => !districtNames.includes(d));
    
    if (missing.length > 0) {
      console.log(`   ❌ 행정동에서 누락된 구: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
      console.log(`   ❌ 행정동에만 있는 구: ${extra.join(', ')}`);
    }
    if (missing.length === 0 && extra.length === 0) {
      console.log('   ✅ 구 명칭 완벽 일치');
    }

    // 4. 각 구별 상세 분석
    console.log('\n4️⃣ 구별 행정동 개수 분석');
    const analysis = [];
    
    districtNames.forEach(districtName => {
      const dongInfo = districtMapping[districtName];
      if (dongInfo) {
        analysis.push({
          district: districtName,
          dongCount: dongInfo.dongCount,
          dongList: dongInfo.dongList.map(d => d.adm_nm.split(' ').pop())
        });
        console.log(`   ${districtName}: ${dongInfo.dongCount}개 행정동`);
      } else {
        console.log(`   ❌ ${districtName}: 매핑되지 않음`);
      }
    });

    // 5. 경계 불일치 가능성 분석
    console.log('\n5️⃣ 경계 불일치 원인 분석');
    
    // 구 데이터의 좌표계 확인
    const sampleDistrictFeature = districtsData.features[0];
    const sampleDongFeature = dongsData.features[0];
    
    console.log('   📍 좌표계 정보:');
    console.log(`   - 구 데이터 CRS: ${districtsData.crs ? JSON.stringify(districtsData.crs) : 'undefined'}`);
    console.log(`   - 행정동 데이터 CRS: ${dongsData.crs ? JSON.stringify(dongsData.crs) : 'undefined'}`);
    
    // 좌표 범위 비교
    console.log('\n   📐 좌표 범위 비교:');
    
    // 구 데이터 좌표 범위
    let districtBounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    districtsData.features.forEach(feature => {
      const coords = feature.geometry.coordinates[0];
      coords.forEach(([x, y]) => {
        districtBounds.minX = Math.min(districtBounds.minX, x);
        districtBounds.minY = Math.min(districtBounds.minY, y);
        districtBounds.maxX = Math.max(districtBounds.maxX, x);
        districtBounds.maxY = Math.max(districtBounds.maxY, y);
      });
    });
    
    // 행정동 데이터 좌표 범위
    let dongBounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    dongsData.features.forEach(feature => {
      if (feature.geometry.type === 'Polygon') {
        const coords = feature.geometry.coordinates[0]; // Polygon의 첫 번째 ring
        coords.forEach(([x, y]) => {
          dongBounds.minX = Math.min(dongBounds.minX, x);
          dongBounds.minY = Math.min(dongBounds.minY, y);
          dongBounds.maxX = Math.max(dongBounds.maxX, x);
          dongBounds.maxY = Math.max(dongBounds.maxY, y);
        });
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => {
          const coords = polygon[0]; // 각 Polygon의 첫 번째 ring
          coords.forEach(([x, y]) => {
            dongBounds.minX = Math.min(dongBounds.minX, x);
            dongBounds.minY = Math.min(dongBounds.minY, y);
            dongBounds.maxX = Math.max(dongBounds.maxX, x);
            dongBounds.maxY = Math.max(dongBounds.maxY, y);
          });
        });
      }
    });
    
    console.log(`   - 구 데이터: X(${districtBounds.minX.toFixed(4)} ~ ${districtBounds.maxX.toFixed(4)}), Y(${districtBounds.minY.toFixed(4)} ~ ${districtBounds.maxY.toFixed(4)})`);
    console.log(`   - 행정동 데이터: X(${dongBounds.minX.toFixed(4)} ~ ${dongBounds.maxX.toFixed(4)}), Y(${dongBounds.minY.toFixed(4)} ~ ${dongBounds.maxY.toFixed(4)})`);
    
    const xDiff = Math.abs(districtBounds.minX - dongBounds.minX) + Math.abs(districtBounds.maxX - dongBounds.maxX);
    const yDiff = Math.abs(districtBounds.minY - dongBounds.minY) + Math.abs(districtBounds.maxY - dongBounds.maxY);
    
    console.log(`   - 좌표 차이: X축 ${xDiff.toFixed(6)}, Y축 ${yDiff.toFixed(6)}`);
    
    if (xDiff > 0.001 || yDiff > 0.001) {
      console.log('   ⚠️ 좌표 범위에 차이가 있음 - 경계 불일치 가능성 높음');
    } else {
      console.log('   ✅ 좌표 범위 거의 일치');
    }

    // 6. 최종 결론
    console.log('\n6️⃣ 최종 분석 결과');
    
    const totalDongCount = Object.values(districtMapping).reduce((sum, d) => sum + d.dongCount, 0);
    console.log(`   - 전체 ${mappedDistricts.length}개 구, ${totalDongCount}개 행정동`);
    
    if (xDiff > 0.001 || yDiff > 0.001) {
      console.log('   🚨 **경계 불일치 문제 확인됨**');
      console.log('   💡 해결 방안:');
      console.log('      1. 동일한 시점의 통합 데이터 소스 찾기');
      console.log('      2. 구 데이터 대신 행정동 데이터로 구 경계 생성');
      console.log('      3. 좌표계 변환 및 보정');
    } else {
      console.log('   ✅ 경계 일치성 양호');
    }
    
    // 결과 저장
    const result = {
      districtCount: mappedDistricts.length,
      dongCount: totalDongCount,
      boundaryMismatch: xDiff > 0.001 || yDiff > 0.001,
      coordinateDifference: { x: xDiff, y: yDiff },
      analysis
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'boundary-analysis-result.json'),
      JSON.stringify(result, null, 2),
      'utf-8'
    );
    
    console.log('\n📄 분석 결과가 boundary-analysis-result.json에 저장되었습니다.');

  } catch (error) {
    console.error('❌ 분석 오류:', error.message);
  }
}

analyzeBoundaryAlignment();