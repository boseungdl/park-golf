/**
 * MapView.tsx - 서울 파크골프 입지 분석 지도 컴포넌트 (2017년 데이터)
 * 
 * 🚧 현재 구현 단계: 2017년 데이터 + 구 클릭 → 행정동 표시
 * 📅 다음 확장 예정: 공원 마커, 분석 기능
 * 📊 복잡도: ⭐⭐⭐ (고급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: MapLibre GL, mapStore, 2017년 GeoJSON 데이터
 * - 📤 Export: MapView 컴포넌트
 * - 🔄 사용처: pages/index.tsx 메인 페이지
 * 
 * 📋 현재 포함 기능:
 * - ✅ MapLibre GL 기본 지도 렌더링
 * - ✅ 2017년 서울 구 경계 폴리곤 표시
 * - ✅ 2017년 행정동 경계 폴리곤 표시
 * - ✅ 구 클릭 → 해당 행정동 하이라이트
 * - ✅ mapStore 연동
 * - ⏳ 공원 마커 표시
 * 
 * 💡 사용 예시:
 * ```tsx
 * <MapView />
 * ```
 */

'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../../store/mapStore';

// 불균형 지수에 따른 색상 반환 함수
const getImbalanceColor = (value: number): string => {
  if (value < -0.1) return '#2E7D32';      // 진한 초록 (과소 공급)
  if (value < 0.2) return '#66BB6A';       // 연한 초록 (적정)
  if (value < 0.4) return '#FFA726';       // 주황색 (다소 부족)
  if (value < 0.6) return '#FF7043';       // 진한 주황 (부족)
  return '#E53935';                        // 빨간색 (매우 부족)
};

// 불균형 지수 상태 텍스트 반환 함수
const getImbalanceStatus = (value: number): string => {
  if (value < -0.1) return '과잉';
  if (value < 0.2) return '적정';
  if (value < 0.4) return '주의';
  if (value < 0.6) return '부족';
  return '심각';
};

// 색상을 더 진하게 만드는 함수
const getDarkerColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    '#2E7D32': '#1B5E20', // 진한 초록 → 더 진한 초록
    '#66BB6A': '#388E3C', // 연한 초록 → 진한 초록
    '#FFA726': '#F57C00', // 주황 → 진한 주황
    '#FF7043': '#D84315', // 진한 주황 → 더 진한 주황
    '#E53935': '#B71C1C', // 빨강 → 진한 빨강
  };
  return colorMap[color] || color;
};

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const layersAdded = useRef<boolean>(false);
  
  // mapStore 연동
  const { 
    center, 
    zoom, 
    loadData,
    loadImbalanceData, 
    loadingState,
    districtsData,
    dongsData,
    imbalanceData,
    showImbalance,
    toggleImbalanceView,
    setImbalanceView,
    selectedDistrict,
    selectedDongs,
    selectDistrict,
    clearSelection
  } = useMapStore();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // 지도 초기화
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [],
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf"
      },
      center: [center.lng, center.lat], // mapStore 중심 좌표 사용
      zoom: zoom, // mapStore 줌 레벨 사용
      attributionControl: false
    });

    // 데이터 로딩 시작
    loadData();
    loadImbalanceData();

    // 컴포넌트 언마운트 시 지도 정리
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      layersAdded.current = false; // 플래그 리셋
    };
  }, []);

  // 데이터가 로드되면 지도에 레이어 추가
  useEffect(() => {
    if (!map.current || loadingState !== 'success' || !districtsData || !dongsData || layersAdded.current) return;

    console.log('🗺️ 2017년 데이터 로드 완료, 레이어 추가 중...');
    
    // 구 데이터 소스 추가 (이미 존재하는지 확인)
    if (!map.current.getSource('districts-2017')) {
      map.current.addSource('districts-2017', {
        type: 'geojson',
        data: districtsData
      });
    }

    // 행정동 데이터 소스 추가 (이미 존재하는지 확인)
    if (!map.current.getSource('dongs-2017')) {
      map.current.addSource('dongs-2017', {
        type: 'geojson',
        data: dongsData
      });
    }

    // 구 폴리곤 레이어 (불균형 지수 색상 적용) - 이미 존재하는지 확인
    if (!map.current.getLayer('districts-fill')) {
      map.current.addLayer({
        id: 'districts-fill',
        type: 'fill',
        source: 'districts-2017',
        paint: {
          'fill-color': '#E3F2FD', // 기본 색상 (불균형 데이터 로드 전)
          'fill-opacity': 0.7
        }
      });
    }

    // 구 경계선 레이어 - 얇은 선으로 수정
    if (!map.current.getLayer('districts-line')) {
      map.current.addLayer({
        id: 'districts-line',
        type: 'line',
        source: 'districts-2017',
        paint: {
          'line-color': '#1976D2', // 조금 더 진한 파란색
          'line-width': 0.8,       // 매우 얇게
          'line-opacity': 0.7      // 투명도 추가
        }
      });
    }

    // 구 라벨 레이어
    if (!map.current.getLayer('districts-label')) {
      map.current.addLayer({
        id: 'districts-label',
        type: 'symbol',
        source: 'districts-2017',
        layout: {
          'text-field': ['get', 'SIG_KOR_NM'], // 2017년 데이터 필드
          'text-font': ['Noto Sans Regular'],
          'text-size': 14,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#1565C0',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2
        }
      });
    }

    // 행정동 폴리곤 레이어 (초기에는 숨김) - 색상 개선
    if (!map.current.getLayer('dongs-fill')) {
      map.current.addLayer({
        id: 'dongs-fill',
        type: 'fill',
        source: 'dongs-2017',
        paint: {
          'fill-color': '#FFC107',   // 좀 더 진한 앰버 색상
          'fill-opacity': 0.6        // 투명도 약간 낮춤
        },
        filter: ['in', 'adm_cd', ''] // 초기에는 아무것도 표시하지 않음
      });
    }

    // 행정동 경계선 레이어 - 연한 스타일로 수정
    if (!map.current.getLayer('dongs-line')) {
      map.current.addLayer({
        id: 'dongs-line',
        type: 'line',
        source: 'dongs-2017',
        paint: {
          'line-color': '#FFB74D',   // 연한 오렌지색으로 변경
          'line-width': 0.8,         // 더 얇게
          'line-opacity': 0.5        // 더 투명하게
        },
        filter: ['in', 'adm_cd', ''] // 초기에는 아무것도 표시하지 않음
      });
    }

    // 행정동 라벨 레이어 - 이름 표시
    if (!map.current.getLayer('dongs-label')) {
      map.current.addLayer({
        id: 'dongs-label',
        type: 'symbol',
        source: 'dongs-2017',
        layout: {
          'text-field': [
            'case',
            ['has', 'adm_nm'],
            [
              // "서울특별시 XX구 YY동" 형식에서 마지막 부분(동 이름)만 추출
              // 두 번째 공백 이후의 텍스트를 추출
              'let',
              'fullName', ['get', 'adm_nm'],
              [
                'let',
                'firstSpace', ['index-of', ' ', ['var', 'fullName']],
                [
                  'let',
                  'secondSpace', ['index-of', ' ', ['var', 'fullName'], ['+', ['var', 'firstSpace'], 1]],
                  [
                    'slice',
                    ['var', 'fullName'],
                    ['+', ['var', 'secondSpace'], 1]
                  ]
                ]
              ]
            ],
            ''
          ],
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'symbol-placement': 'point'
        },
        paint: {
          'text-color': '#f53d05ff',      // 진한 갈색
          'text-halo-color': '#FFFFFF', // 흰색 테두리
          'text-halo-width': 2,
          'text-opacity': 0.9
        },
        filter: ['in', 'adm_cd', ''] // 초기에는 아무것도 표시하지 않음
      });
    }

    // 구 클릭 이벤트
    map.current.on('click', 'districts-fill', (e) => {
      if (e.features && e.features.length > 0) {
        const district = e.features[0];
        const districtName = district.properties?.SIG_KOR_NM;
        
        if (districtName) {
          console.log('🖱️ 클릭된 구:', districtName);
          
          // 1. 먼저 구 경계선을 즉시 숨김
          if (map.current?.getLayer('districts-line')) {
            map.current.setPaintProperty('districts-line', 'line-opacity', 0);
          }
          
          // 2. 불균형 표시를 OFF로 변경 (구 선택 모드로 전환)
          if (showImbalance) {
            setImbalanceView(false);
          }
          
          // 3. 구 선택 및 행정동 표시
          selectDistrict(districtName);
          
          // 4. 선택된 구로 줌인
          const bounds = new maplibregl.LngLatBounds();
          const geometry = district.geometry;
          
          if (geometry.type === 'Polygon') {
            geometry.coordinates[0].forEach(coord => {
              bounds.extend(coord);
            });
          } else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach(polygon => {
              polygon[0].forEach(coord => {
                bounds.extend(coord);
              });
            });
          }
          
          // 부드러운 줌인 애니메이션
          map.current.fitBounds(bounds, {
            padding: 50,
            duration: 1000 // 1초 애니메이션
          });
        }
      }
    });

    // 마우스 커서 변경
    map.current.on('mouseenter', 'districts-fill', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'pointer';
      }
    });

    map.current.on('mouseleave', 'districts-fill', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = '';
      }
    });

    // 레이어 추가 완료 플래그 설정
    layersAdded.current = true;
    console.log('✅ 2017년 데이터 레이어 추가 완료');

  }, [loadingState, districtsData, dongsData]);

  // 선택된 구가 변경되면 행정동 필터 업데이트
  useEffect(() => {
    if (!map.current || !selectedDongs.length) {
      // 선택 해제 시 행정동 숨김 및 구 경계선 원래대로 + 줌 리셋
      if (map.current?.getLayer('dongs-fill')) {
        map.current.setFilter('dongs-fill', ['in', 'adm_cd', '']);
        map.current.setFilter('dongs-line', ['in', 'adm_cd', '']);
        map.current.setFilter('dongs-label', ['in', 'adm_cd', '']);
      }
      if (map.current?.getLayer('districts-line')) {
        map.current.setPaintProperty('districts-line', 'line-opacity', 0.7);
        map.current.setPaintProperty('districts-line', 'line-width', 0.8);
      }
      
      // 원래 줌 레벨로 부드럽게 복귀
      if (map.current) {
        map.current.flyTo({
          center: [center.lng, center.lat],
          zoom: zoom,
          duration: 800
        });
      }
      return;
    }

    console.log('🎯 선택된 구의 행정동 표시:', selectedDistrict, selectedDongs.length + '개');

    // 선택된 행정동들만 표시
    const filter = ['in', 'adm_cd', ...selectedDongs];
    
    if (map.current?.getLayer('dongs-fill')) {
      map.current.setFilter('dongs-fill', filter);
      map.current.setFilter('dongs-line', filter);
      map.current.setFilter('dongs-label', filter); // 라벨도 필터 적용
      
      // 선택된 구의 불균형 지수에 따른 색상으로 동 폴리곤 업데이트
      if (selectedDistrict && imbalanceData && imbalanceData[selectedDistrict] !== undefined) {
        const districtImbalance = imbalanceData[selectedDistrict];
        const districtColor = getImbalanceColor(districtImbalance);
        
        // 동 폴리곤을 구와 같은 색상으로 설정
        map.current.setPaintProperty('dongs-fill', 'fill-color', districtColor);
        map.current.setPaintProperty('dongs-fill', 'fill-opacity', 0.7);
        
        // 동 경계선을 더 진한 색상으로 설정
        const darkerColor = getDarkerColor(districtColor);
        map.current.setPaintProperty('dongs-line', 'line-color', darkerColor);
        map.current.setPaintProperty('dongs-line', 'line-width', 1.2);
        map.current.setPaintProperty('dongs-line', 'line-opacity', 0.8);
      }
    }

  }, [selectedDistrict, selectedDongs, center.lng, center.lat, zoom, imbalanceData]);

  // 불균형 데이터가 로드되면 구 색상 업데이트
  useEffect(() => {
    if (!map.current || !imbalanceData || !showImbalance || !layersAdded.current) return;
    
    // 불균형 지수에 따른 색상 표현식 생성
    const colorExpression: any = ['case'];
    
    Object.entries(imbalanceData).forEach(([district, value]) => {
      colorExpression.push(['==', ['get', 'SIG_KOR_NM'], district]);
      colorExpression.push(getImbalanceColor(value));
    });
    
    // 기본 색상 (매칭되지 않는 경우)
    colorExpression.push('#E3F2FD');
    
    // 구 폴리곤 색상 업데이트
    if (map.current.getLayer('districts-fill')) {
      map.current.setPaintProperty('districts-fill', 'fill-color', colorExpression);
    }
    
    console.log('🎨 불균형 지수 색상 적용 완료');
  }, [imbalanceData, showImbalance, layersAdded.current]);

  // 불균형 시각화 모드가 꺼지면 기본 색상으로 복원
  useEffect(() => {
    if (!map.current) return;
    
    if (!showImbalance && map.current.getLayer('districts-fill')) {
      // 불균형 표시가 OFF일 때 기본 색상으로 변경
      map.current.setPaintProperty('districts-fill', 'fill-color', '#E3F2FD');
      console.log('🎨 불균형 색상 제거 완료 - 기본 색상으로 복원');
    }
  }, [showImbalance]);

  return (
    <div className="relative w-full h-full">
      {/* 지도 컨테이너 */}
      <div
        ref={mapContainer}
        className="w-full h-full bg-white"
        style={{ minHeight: '400px' }}
      />
      
      {/* 로딩 상태 표시 */}
      {loadingState === 'loading' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div className="mt-2 text-sm text-gray-600">지도 데이터 로딩 중...</div>
          </div>
        </div>
      )}

      {/* 에러 상태 표시 */}
      {loadingState === 'error' && (
        <div className="absolute top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          <div className="text-red-800 font-medium">데이터 로딩 실패</div>
          <div className="text-red-600 mt-1">지도 데이터를 불러올 수 없습니다.</div>
        </div>
      )}
      
      {/* 선택 해제 버튼 (중앙 상단) */}
      {selectedDistrict && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <button
            onClick={() => clearSelection()}
            className="bg-white shadow-lg rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200"
          >
            선택 해제
          </button>
        </div>
      )}
      
      {/* 범례 및 상태 패널 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 text-sm max-w-sm">
        <div className="font-semibold text-gray-800 mb-3">
          파크골프장 불균형 지수 지도
        </div>
        
        {/* 불균형 지수 색상 범례 */}
        {showImbalance && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-700 mb-2">불균형 지수</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: '#2E7D32' }}></div>
                <span className="text-xs">과잉</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: '#66BB6A' }}></div>
                <span className="text-xs">적정</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: '#FFA726' }}></div>
                <span className="text-xs">주의</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: '#FF7043' }}></div>
                <span className="text-xs">부족</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-3 rounded" style={{ backgroundColor: '#E53935' }}></div>
                <span className="text-xs">심각</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 선택된 구 정보 */}
        {selectedDistrict && (
          <div className="bg-blue-50 rounded p-2 mb-3">
            <div className="font-medium text-blue-800">{selectedDistrict}</div>
            {imbalanceData && imbalanceData[selectedDistrict] !== undefined && (
              <>
                <div className="text-xs text-gray-700 mt-1">
                  불균형 지수: <span className="font-semibold">{imbalanceData[selectedDistrict].toFixed(3)}</span>
                </div>
                <div className="text-xs text-gray-700">
                  상태: <span className="font-semibold">{getImbalanceStatus(imbalanceData[selectedDistrict])}</span>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* 불균형 시각화 토글 */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-gray-600">불균형 지수 표시</span>
          <button
            onClick={() => toggleImbalanceView()}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              showImbalance ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                showImbalance ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="text-xs text-gray-500 pt-2 border-t mt-2">
          구를 클릭하면 상세 정보를 확인할 수 있습니다
        </div>
      </div>
    </div>
  );
}