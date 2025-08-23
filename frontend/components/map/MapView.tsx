/**
 * MapView.tsx - 서울 파크골프 입지 분석 지도 컴포넌트 (2017년 데이터 + 공원 마커)
 * 
 * 🚧 현재 구현 단계: 3D 불균형 지수 표시 + 배경 실지도 완료
 * 📅 다음 확장 예정: 분석 기능, 마커 클러스터링, 필터링
 * 📊 복잡도: ⭐⭐⭐ (고급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: MapLibre GL, mapStore, 공원 데이터
 * - 📤 Export: MapView 컴포넌트
 * - 🔄 사용처: pages/index.tsx 메인 페이지
 * 
 * 📋 현재 포함 기능:
 * - ✅ MapLibre GL 기본 지도 렌더링
 * - ✅ 2017년 서울 구 경계 폴리곤 표시
 * - ✅ 2017년 행정동 경계 폴리곤 표시
 * - ✅ 구 클릭 → 해당 행정동 하이라이트
 * - ✅ 불균형 지수 색상 표시
 * - ✅ mapStore 연동
 * - ✅ 구 선택 시 공원 마커 표시
 * - ✅ 마커 클릭 시 공원 정보 팝업
 * - ✅ 마커 호버 효과 및 애니메이션
 * - ✅ 좌표 유효성 검증된 공원만 표시
 * - ✅ 불균형 지수 기반 3D 높이 표시
 * - ✅ 배경 실지도 흐릿하게 표시
 * - ✅ 공원 클릭 시 버퍼 크기 기반 자동 줌
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

// 불균형 지수에 따른 3D 높이 계산 함수
const getImbalanceHeight = (value: number): number => {
  // 불균형 지수를 3D 높이로 변환 (미터 단위)
  // 값이 클수록 (부족할수록) 더 높이 표시
  
  if (value < -0.1) return 50;   // 과잉 - 낮게
  if (value < 0.2) return 200;   // 적정 - 보통
  if (value < 0.4) return 500;   // 주의 - 중간 높이
  if (value < 0.6) return 800;   // 부족 - 높게  
  return 1200;                   // 심각 - 가장 높게
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

// 공원명을 안전하게 가져오는 헬퍼 함수
const getParkName = (park: ValidParkData): string => {
  // MCLP 데이터의 originalName이 있으면 사용, 없으면 원본 공원명 사용
  return park.mclpData?.originalName || park["공 원 명"];
};

// 버퍼 크기에 따른 최적 줌 레벨 계산 함수
const calculateOptimalZoomForBuffer = (radiusKm: number): number => {
  // 5km 버퍼를 화면에 적절히 표시하기 위한 줌 레벨 계산
  // 서울 지역 기준으로 경험적 공식 사용
  
  // 버퍼 지름을 고려한 줌 레벨 (padding 포함)
  const diameterKm = radiusKm * 2;
  const paddingFactor = 1.4; // 40% 여백 추가
  const effectiveDiameter = diameterKm * paddingFactor;
  
  // 경험적 공식: 지름이 클수록 줌 레벨은 낮아짐
  // 5km 버퍼 → 10km 지름 → 14km 효과 지름 → 줄 레벨 11-12 정도
  let zoom: number;
  
  if (effectiveDiameter >= 20) {
    zoom = 10; // 매우 큰 버퍼
  } else if (effectiveDiameter >= 15) {
    zoom = 11; // 큰 버퍼 (5km 기본값)
  } else if (effectiveDiameter >= 10) {
    zoom = 12; // 중간 버퍼
  } else if (effectiveDiameter >= 5) {
    zoom = 13; // 작은 버퍼
  } else {
    zoom = 14; // 매우 작은 버퍼
  }
  
  console.log(`📐 버퍼 계산: ${radiusKm}km 반지름 → ${effectiveDiameter.toFixed(1)}km 효과 지름 → 줌 레벨 ${zoom}`);
  return zoom;
};

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const layersAdded = useRef<boolean>(false);
  const parkMarkers = useRef<maplibregl.Marker[]>([]);  // 공원 마커들 관리
  
  // mapStore 연동
  const { 
    center, 
    zoom, 
    loadData,
    loadImbalanceData,
    loadParksData,
    loadingState,
    districtsData,
    dongsData,
    imbalanceData,
    showImbalance,
    toggleImbalanceView,
    setImbalanceView,
    selectedDistrict,
    selectedDongs,
    selectedPark,
    selectDistrict,
    clearSelection,
    selectPark,
    clearParkSelection,
    getSelectedDistrictParks,
    getParksWithinBuffer
  } = useMapStore();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // 지도 초기화 (3D 뷰 + 배경 실지도)
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          // 배경 실지도 타일 소스 (OpenStreetMap)
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          // 배경 실지도 레이어 (흐릿하게 표시)
          {
            id: 'background-map',
            type: 'raster',
            source: 'osm-tiles',
            paint: {
              'raster-opacity': 0.3, // 30% 투명도로 흐릿하게
              'raster-brightness-max': 0.8, // 밝기 조절
              'raster-contrast': -0.2 // 대비 낮춤
            }
          }
        ],
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf"
      },
      center: [center.lng, center.lat], // mapStore 중심 좌표 사용
      zoom: zoom, // mapStore 줌 레벨 사용
      pitch: 45, // 3D 뷰를 위한 카메라 각도 (0-60도)
      bearing: 0, // 북쪽 기준 회전 각도
      minZoom:10.8,  // 최소 줌 레벨 (너무 축소되지 않도록)
      maxZoom: 18, // 최대 줌 레벨 (너무 확대되지 않도록)
      attributionControl: false
    });

    // 데이터 로딩 시작
    loadData();
    loadImbalanceData();
    loadParksData();

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

    // 구 3D 폴리곤 레이어 (불균형 지수 높이 + 색상 적용) - 이미 존재하는지 확인
    if (!map.current.getLayer('districts-fill')) {
      map.current.addLayer({
        id: 'districts-fill',
        type: 'fill-extrusion', // 3D extrusion 타입으로 변경
        source: 'districts-2017',
        paint: {
          'fill-extrusion-color': '#E3F2FD', // 기본 색상 (불균형 데이터 로드 전)
          'fill-extrusion-height': 100, // 기본 높이
          'fill-extrusion-opacity': 0.8, // 약간 더 진하게 표시
          'fill-extrusion-vertical-gradient': true // 수직 그라데이션 효과
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
          'line-color': '#dbdbdbff', // 조금 더 진한 파란색
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
        filter: ['in', 'adm_cd', ''] as any // 초기에는 아무것도 표시하지 않음
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
        filter: ['in', 'adm_cd', ''] as any // 초기에는 아무것도 표시하지 않음
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
        filter: ['in', 'adm_cd', ''] as any // 초기에는 아무것도 표시하지 않음
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
          
          // 3. 기존 공원 선택 해제 (버퍼 제거) - 최신 상태를 직접 가져오기
          const currentSelectedPark = useMapStore.getState().selectedPark;
          console.log('🔍 최신 selectedPark 상태 확인:', currentSelectedPark ? getParkName(currentSelectedPark) : 'null');
          if (currentSelectedPark) {
            console.log('🏞️ 공원 선택 해제 호출 중...');
            clearParkSelection();
          } else {
            console.log('🏞️ selectedPark가 null이어서 clearParkSelection() 호출 안됨');
          }
          
          // 4. 구 선택 및 행정동 표시
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

  // 선택된 구가 변경되면 행정동 필터 업데이트 및 공원 마커 표시
  useEffect(() => {
    if (!map.current || !selectedDongs.length) {
      // 선택 해제 시 행정동 숨김 및 구 경계선 원래대로 + 줌 리셋
      if (map.current?.getLayer('dongs-fill')) {
        map.current.setFilter('dongs-fill', ['in', 'adm_cd', ''] as any);
        map.current.setFilter('dongs-line', ['in', 'adm_cd', ''] as any);
        map.current.setFilter('dongs-label', ['in', 'adm_cd', ''] as any);
      }
      if (map.current?.getLayer('districts-line')) {
        map.current.setPaintProperty('districts-line', 'line-opacity', 0.7);
        map.current.setPaintProperty('districts-line', 'line-width', 0.8);
      }
      
      // 기존 공원 마커들 제거
      parkMarkers.current.forEach(marker => marker.remove());
      parkMarkers.current = [];
      
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
    const filter: any = ['in', 'adm_cd', ...selectedDongs];
    
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

  // 선택된 구의 공원 마커 표시 관리
  useEffect(() => {
    if (!map.current || !selectedDistrict) {
      // 구 선택이 해제되면 모든 마커 제거
      parkMarkers.current.forEach(marker => marker.remove());
      parkMarkers.current = [];
      return;
    }

    // 기존 마커들 제거
    parkMarkers.current.forEach(marker => marker.remove());
    parkMarkers.current = [];

    // 선택된 구의 공원들 가져오기
    const districtParks = getSelectedDistrictParks();
    
    if (districtParks.length === 0) {
      console.log('🏞️ 해당 구에 공원 데이터가 없습니다:', selectedDistrict);
      return;
    }

    console.log(`🏞️ ${selectedDistrict} 공원 마커 생성: ${districtParks.length}개`);

    // 각 공원에 대해 기본 마커 생성 (줌 안정성 최고)
    districtParks.forEach((park) => {
      // 기본 MapLibre GL 마커 생성 (공원 녹색)
      const marker = new maplibregl.Marker({
        color: '#4CAF50', // 공원 녹색
        scale: 1.2
      }).setLngLat([park.경도, park.위도]);

      // 팝업 생성
      const popup = new maplibregl.Popup({ 
        offset: 15,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div class="text-sm max-w-xs">
          <div class="font-semibold text-gray-800 mb-2">${getParkName(park)}</div>
          <div class="space-y-1 text-xs text-gray-600">
            <div><span class="font-medium">위치:</span> ${park["위    치"]}</div>
            <div><span class="font-medium">구:</span> ${park.구}</div>
            <div><span class="font-medium">종류:</span> ${park.공원종류}</div>
            <div><span class="font-medium">면적:</span> ${park["면 적 합 계(㎡)"].toLocaleString()}㎡</div>
            ${park.질의주소 ? `<div><span class="font-medium">주소:</span> ${park.질의주소}</div>` : ''}
            ${park.mclpData && park.mclpData.총수요지수 !== null && !isNaN(park.mclpData.총수요지수) ? `
              <div class="mt-2 pt-2 border-t border-gray-200">
                <div class="font-medium text-blue-700 mb-1">📊 MCLP 분석 정보</div>
                <div><span class="font-medium">포함 행정동:</span> ${park.mclpData.포함행정동수}개</div>
                <div><span class="font-medium">총 수요지수:</span> ${park.mclpData.총수요지수.toFixed(3)}</div>
              </div>
            ` : `<div class="mt-2 pt-2 border-t border-gray-200 text-yellow-600">
              <div class="text-xs">⚠️ MCLP 분석 데이터 없음</div>
            </div>`}
          </div>
        </div>
      `);

      // 마커에 팝업 연결
      marker.setPopup(popup);

      // 마커 클릭 이벤트 (공원 선택 및 5km 버퍼 표시)
      marker.getElement().addEventListener('click', (e) => {
        console.log('🖱️ 마커 클릭됨:', getParkName(park));
        e.stopPropagation(); // 이벤트 버블링 방지
        e.preventDefault(); // 기본 동작 방지
        
        selectPark(park);
        
        // 팝업 닫기 (버퍼 표시를 위해)
        marker.getPopup()?.remove();
        
        // 5km 버퍼에 맞는 줌 레벨로 자동 조정
        const bufferRadiusKm = 5; // 5km 버퍼
        const optimalZoom = calculateOptimalZoomForBuffer(bufferRadiusKm);
        
        // 공원 위치로 부드럽게 이동하면서 줌 조정
        map.current?.flyTo({
          center: [park.경도, park.위도],
          zoom: optimalZoom,
          duration: 1200, // 1.2초 애니메이션
          essential: true // 애니메이션 중단 방지
        });
        
        console.log(`🎯 ${getParkName(park)} 위치로 이동 (줌 레벨: ${optimalZoom})`);
      });

      // 지도에 마커 추가
      marker.addTo(map.current!);
      
      // 마커 배열에 추가 (나중에 정리용)
      parkMarkers.current.push(marker);
    });

  }, [selectedDistrict, getSelectedDistrictParks]);

  // 선택된 공원의 5km 버퍼 원 표시
  useEffect(() => {
    if (!map.current) return;

    // 기존 버퍼 소스와 레이어 제거
    if (map.current.getLayer('park-buffer-fill')) {
      map.current.removeLayer('park-buffer-fill');
    }
    if (map.current.getLayer('park-buffer-line')) {
      map.current.removeLayer('park-buffer-line');
    }
    if (map.current.getSource('park-buffer')) {
      map.current.removeSource('park-buffer');
    }

    if (!selectedPark) return;

    // 5km 버퍼 원 생성 (GeoJSON)
    const bufferRadius = 5000; // 5km in meters
    const center = [selectedPark.경도, selectedPark.위도];
    const points = 64; // 원의 정밀도
    
    // 원을 이루는 좌표들 생성
    const coordinates = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      // 대략적인 lat/lng 변환 (서울 지역 기준)
      const latOffset = (bufferRadius / 111111) * Math.cos(angle); // 1도 ≈ 111.111km
      const lngOffset = (bufferRadius / (111111 * Math.cos(selectedPark.위도 * Math.PI / 180))) * Math.sin(angle);
      
      coordinates.push([
        center[0] + lngOffset,
        center[1] + latOffset
      ]);
    }
    coordinates.push(coordinates[0]); // 원을 닫기 위해 첫 점 추가

    const bufferGeoJSON = {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coordinates]
      },
      properties: {
        parkName: getParkName(selectedPark),
        radius: bufferRadius
      }
    };

    // 버퍼 원 소스 추가
    map.current.addSource('park-buffer', {
      type: 'geojson',
      data: bufferGeoJSON
    });

    // 버퍼 원 채우기 레이어
    map.current.addLayer({
      id: 'park-buffer-fill',
      type: 'fill',
      source: 'park-buffer',
      paint: {
        'fill-color': '#2196F3',
        'fill-opacity': 0.1
      }
    });

    // 버퍼 원 경계선 레이어
    map.current.addLayer({
      id: 'park-buffer-line',
      type: 'line',
      source: 'park-buffer',
      paint: {
        'line-color': '#2196F3',
        'line-width': 2,
        'line-opacity': 0.8,
        'line-dasharray': [2, 2] // 점선 효과
      }
    });

    console.log(`🎯 ${getParkName(selectedPark)} 5km 버퍼 표시 완료`);

  }, [selectedPark]);

  // 불균형 데이터가 로드되면 구 3D 높이 + 색상 업데이트
  useEffect(() => {
    if (!map.current || !imbalanceData || !layersAdded.current) return;
    
    // 불균형 지수에 따른 색상 표현식 생성
    const colorExpression: any = ['case'];
    // 불균형 지수에 따른 3D 높이 표현식 생성
    const heightExpression: any = ['case'];
    
    Object.entries(imbalanceData).forEach(([district, value]) => {
      // 색상 설정
      colorExpression.push(['==', ['get', 'SIG_KOR_NM'], district]);
      colorExpression.push(getImbalanceColor(value));
      
      // 3D 높이 설정
      heightExpression.push(['==', ['get', 'SIG_KOR_NM'], district]);
      heightExpression.push(getImbalanceHeight(value));
    });
    
    // 기본값 (매칭되지 않는 경우)
    colorExpression.push('#E3F2FD');
    heightExpression.push(100); // 기본 높이
    
    // 구 3D 폴리곤 색상 + 높이 업데이트
    if (map.current.getLayer('districts-fill')) {
      if (showImbalance) {
        // 불균형 모드: 색상 + 높이 모두 적용
        map.current.setPaintProperty('districts-fill', 'fill-extrusion-color', colorExpression);
        map.current.setPaintProperty('districts-fill', 'fill-extrusion-height', heightExpression);
      } else {
        // 일반 모드: 기본 색상 + 낮은 높이
        map.current.setPaintProperty('districts-fill', 'fill-extrusion-color', '#E3F2FD');
        map.current.setPaintProperty('districts-fill', 'fill-extrusion-height', 100);
      }
    }
    
    console.log('🎨 불균형 지수 3D 표시 적용 완료 (색상 + 높이)');
  }, [imbalanceData, showImbalance, layersAdded.current]);

  // 불균형 시각화 모드 토글 처리는 위의 useEffect에서 통합 처리됨
  // (showImbalance 값에 따라 자동으로 색상과 높이가 조정됨)

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
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          <button
            onClick={() => clearSelection()}
            className="bg-white shadow-lg rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200"
          >
            구 선택 해제
          </button>
          {selectedPark && (
            <button
              onClick={() => clearParkSelection()}
              className="bg-blue-500 shadow-lg rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              공원 선택 해제
            </button>
          )}
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
            <div className="text-xs text-gray-700 mt-1">
              공원 수: <span className="font-semibold text-green-600">{getSelectedDistrictParks().length}개</span>
            </div>
          </div>
        )}

        {/* 선택된 공원 정보 (5km 버퍼) */}
        {selectedPark && (
          <div className="bg-green-50 rounded p-2 mb-3 border border-green-200">
            <div className="font-medium text-green-800 mb-1">
              🎯 선택된 공원
            </div>
            <div className="text-sm font-semibold text-gray-800">{getParkName(selectedPark)}</div>
            <div className="space-y-1 text-xs text-gray-600 mt-1">
              <div><span className="font-medium">종류:</span> {selectedPark.공원종류}</div>
              <div><span className="font-medium">면적:</span> {selectedPark["면 적 합 계(㎡)"].toLocaleString()}㎡</div>
              <div><span className="font-medium">위치:</span> {selectedPark["위    치"]}</div>
            </div>
            
            {/* MCLP 분석 정보 */}
            {selectedPark.mclpData && selectedPark.mclpData.총수요지수 !== null && !isNaN(selectedPark.mclpData.총수요지수) ? (
              <div className="mt-2 pt-2 border-t border-green-200">
                <div className="text-xs font-medium text-blue-700 mb-1">
                  📊 MCLP 분석 정보
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div><span className="font-medium">포함 행정동:</span> {selectedPark.mclpData.포함행정동수}개</div>
                  <div><span className="font-medium">총 수요지수:</span> {selectedPark.mclpData.총수요지수.toFixed(3)}</div>
                </div>
              </div>
            ) : (
              <div className="mt-2 pt-2 border-t border-green-200">
                <div className="text-xs text-yellow-600">
                  ⚠️ MCLP 분석 데이터 없음
                </div>
              </div>
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