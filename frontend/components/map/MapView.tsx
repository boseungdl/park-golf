/**
 * MapView.tsx - 서울 파크골프 입지 분석 지도 컴포넌트
 * 
 * 🚧 현재 구현 단계: 기본 지도 + 서울 구 폴리곤 표시
 * 📅 다음 확장 예정: 동 폴리곤, 공원 마커, 클릭 상호작용
 * 📊 복잡도: ⭐⭐ (중급)
 * 
 * 🔗 연관 파일:
 * - 📥 Import: MapLibre GL, 서울 구 GeoJSON 데이터
 * - 📤 Export: MapView 컴포넌트
 * - 🔄 사용처: pages/index.tsx 메인 페이지
 * 
 * 📋 현재 포함 기능:
 * - ✅ MapLibre GL 기본 지도 렌더링
 * - ✅ 서울 구 경계 폴리곤 표시
 * - ✅ 서울시 중심 좌표 설정
 * - 🚧 구 클릭 이벤트 처리
 * - ⏳ 동 폴리곤 레이어 추가
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

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // 서울시 중심 좌표 (위도: 37.5665, 경도: 126.9780)
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [],
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf"
      },
      center: [126.9780, 37.5665], // 서울시 중심
      zoom: 10.5, // 서울시 전체가 보이는 줌 레벨
      attributionControl: false
    });

    // 지도 로드 완료 후 서울 구 폴리곤 추가
    map.current.on('load', async () => {
      try {
        console.log('🗺️ 지도 로드 완료, 데이터 로딩 중...');
        
        // 서울 구 GeoJSON 데이터와 불균형 지수 데이터 병렬 로드
        const [districtResponse, imbalanceResponse] = await Promise.all([
          fetch('/data/seoul-districts-real.geojson'),
          fetch('/data/seoul-districts-imbalance.json')
        ]);

        if (!districtResponse.ok || !imbalanceResponse.ok) {
          throw new Error('Failed to load data');
        }
        
        const seoulDistricts = await districtResponse.json();
        const imbalanceData = await imbalanceResponse.json();
        
        console.log('📍 서울 구 데이터 로드 완료:', seoulDistricts.features.length, '개 구');
        console.log('📊 불균형 지수 데이터 로드 완료:', Object.keys(imbalanceData).length, '개 구');

        // GeoJSON에 불균형 지수 데이터 추가
        seoulDistricts.features.forEach((feature: any) => {
          const districtName = feature.properties.name; // 'SGG_NM' 대신 'name' 사용
          const imbalanceIndex = imbalanceData[districtName] || 0;
          feature.properties.imbalanceIndex = imbalanceIndex;
        });

        // 서울 구 폴리곤 소스 추가
        map.current!.addSource('seoul-districts', {
          type: 'geojson',
          data: seoulDistricts
        });

        // 0 이상 0.5 단위, 0 미만 -0.2 단위로 색상 구분
        const colorExpression = [
          'case',
          // 0.5 이상 (높은 수요 초과) - 진한 빨강
          ['>=', ['get', 'imbalanceIndex'], 0.5], '#B71C1C',
          // 0.0 이상 (수요 초과) - 주황
          ['>=', ['get', 'imbalanceIndex'], 0.0], '#F57C00',
          // -0.2 이상 (약간 공급 초과) - 연한 초록
          ['>=', ['get', 'imbalanceIndex'], -0.2], '#66BB6A',
          // -0.2 미만 (공급 초과) - 진한 초록
          '#43A047'
        ];

        // 서울 구 폴리곤 레이어 추가 (불균형 지수에 따른 색상)
        map.current!.addLayer({
          id: 'seoul-districts-fill',
          type: 'fill',
          source: 'seoul-districts',
          paint: {
            'fill-color': colorExpression,
            'fill-opacity': 0.8
          }
        });

        // 서울 구 경계선 레이어 추가
        map.current!.addLayer({
          id: 'seoul-districts-line',
          type: 'line',
          source: 'seoul-districts',
          paint: {
            'line-color': '#1B5E20', // 진한 초록색 경계선
            'line-width': 2
          }
        });

        // 서울 구 라벨 레이어 추가
        map.current!.addLayer({
          id: 'seoul-districts-label',
          type: 'symbol',
          source: 'seoul-districts',
          layout: {
            'text-field': ['get', 'name'], // 구 이름 필드 ('SGG_NM' 대신 'name' 사용)
            'text-font': ['Noto Sans Regular'],
            'text-size': 14,
            'text-anchor': 'center'
          },
          paint: {
            'text-color': '#1B5E20', // 진한 초록색 텍스트
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 2
          }
        });

        console.log('✅ 서울 구 폴리곤 레이어 추가 완료');

        // 구 클릭 이벤트 추가
        map.current!.on('click', 'seoul-districts-fill', (e) => {
          if (e.features && e.features.length > 0) {
            const district = e.features[0];
            const districtName = district.properties?.name; // 'SGG_NM' 대신 'name' 사용
            const imbalanceIndex = district.properties?.imbalanceIndex || 0;
            console.log('🖱️ 클릭된 구:', districtName, '불균형 지수:', imbalanceIndex);
            
            // 불균형 지수에 따른 상태 설명
            let statusText = '';
            if (imbalanceIndex >= 0.5) statusText = '높은 수요';
            else if (imbalanceIndex >= 0.0) statusText = '수요 초과';
            else if (imbalanceIndex >= -0.2) statusText = '약간 공급';
            else statusText = '공급 초과';
            
            // TODO: 클릭된 구의 동 폴리곤 표시 로직 추가
            alert(`${districtName}\n불균형 지수: ${imbalanceIndex.toFixed(3)}\n상태: ${statusText}\n\n(동 폴리곤 표시 기능 준비 중)`);
          }
        });

        // 마우스 커서 변경
        map.current!.on('mouseenter', 'seoul-districts-fill', () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });

        map.current!.on('mouseleave', 'seoul-districts-fill', () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = '';
          }
        });

      } catch (error) {
        console.error('❌ 서울 구 데이터 로드 실패:', error);
      }
    });

    // 컴포넌트 언마운트 시 지도 정리
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* 지도 컨테이너 */}
      <div
        ref={mapContainer}
        className="w-full h-full bg-white"
        style={{ minHeight: '400px' }}
      />
      
      {/* 범례 패널 */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 text-sm">
        <div className="font-semibold text-gray-800 mb-3">파크골프 수요-공급 불균형 지수</div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: '#B71C1C' }}></div>
            <span className="text-xs"> 0.5 이상 - 높은 수요</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: '#F57C00' }}></div>
            <span className="text-xs"> 0.0 이상 - 수요 초과</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: '#66BB6A' }}></div>
            <span className="text-xs">-0.2 이상 - 약간 공급</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-3 rounded" style={{ backgroundColor: '#43A047' }}></div>
            <span className="text-xs">-0.2 미만 - 공급 초과</span>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-3 pt-2 border-t">
          구를 클릭하면 상세 정보를 확인할 수 있습니다
        </div>
      </div>
    </div>
  );
}