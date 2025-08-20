/**
 * convert-excel.js - Excel 파일을 JSON으로 변환하는 스크립트
 * 
 * 🚧 현재 구현 단계: Excel → JSON 변환 도구
 * 📅 다음 확장 예정: 자동화된 데이터 처리 파이프라인
 * 📊 복잡도: ⭐ (입문)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: xlsx 패키지, path 모듈
 * - 📤 Export: JSON 파일들
 * - 🔄 사용처: 개발 환경에서 데이터 전처리
 * 
 * 📋 현재 포함 기능:
 * - ✅ Excel 파일 읽기
 * - ✅ 워크시트를 JSON으로 변환
 * - ✅ 한글 필드명 처리
 * - 🚧 데이터 정제 및 검증
 * 
 * 💡 사용 예시:
 * ```bash
 * node scripts/convert-excel.js
 * ```
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 파일 경로 설정
const excelFilePath = path.join(__dirname, '../frontend/data/서울공원_좌표_vworld2.xlsx');
const outputDir = path.join(__dirname, '../frontend/data');

function convertExcelToJson() {
    try {
        console.log('📊 Excel 파일 변환 시작...');
        console.log(`📁 입력 파일: ${excelFilePath}`);
        
        // Excel 파일 읽기
        const workbook = XLSX.readFile(excelFilePath);
        console.log(`📋 워크시트 목록: ${workbook.SheetNames.join(', ')}`);
        
        // 각 워크시트 처리
        workbook.SheetNames.forEach((sheetName, index) => {
            console.log(`\n🔄 처리 중: ${sheetName}`);
            
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            console.log(`📏 데이터 행 수: ${jsonData.length}`);
            
            // 데이터 샘플 출력 (처음 2개 행)
            if (jsonData.length > 0) {
                console.log('📝 데이터 구조 샘플:');
                console.log('필드명:', Object.keys(jsonData[0]).slice(0, 5).join(', '));
                console.log('첫 번째 행:', JSON.stringify(jsonData[0], null, 2).substring(0, 200) + '...');
            }
            
            // JSON 파일로 저장
            const outputFileName = `seoul-parks-${sheetName.replace(/[^a-zA-Z0-9가-힣]/g, '')}.json`;
            const outputPath = path.join(outputDir, outputFileName);
            
            fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf8');
            console.log(`✅ 저장 완료: ${outputFileName}`);
        });
        
        console.log('\n🎉 Excel → JSON 변환 완료!');
        
    } catch (error) {
        console.error('❌ 변환 중 오류 발생:', error.message);
        console.error('상세 오류:', error);
    }
}

// 스크립트 실행
if (require.main === module) {
    convertExcelToJson();
}

module.exports = { convertExcelToJson };