import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // 파크골프 불균형 지수 색상 체계
        imbalance: {
          1: "#10b981", // 매우 낮음 (충족) - emerald-500
          2: "#eab308", // 낮음 (주의) - yellow-500  
          3: "#f97316", // 보통 (우선검토) - orange-500
          4: "#ef4444", // 높음 (즉시투자) - red-500
          5: "#dc2626", // 매우 높음 (긴급) - red-600
        },
        // 파크골프 시설 관련 색상
        facility: {
          park: "#059669", // 공원 - emerald-600
          golf: "#dc2626", // 파크골프장 - red-600
          candidate: "#3b82f6", // 후보지 - blue-500
        },
        // 서울시 브랜드 색상
        seoul: {
          primary: "#004098", // 서울시 파랑
          secondary: "#00a0e9", // 서울시 하늘색
          accent: "#f15a24", // 포인트 색상
        },
      },
      // 파크골프 전용 그라디언트
      backgroundImage: {
        'imbalance-gradient': 'linear-gradient(to right, #10b981, #eab308, #f97316, #ef4444, #dc2626)',
        'seoul-gradient': 'linear-gradient(135deg, #004098, #00a0e9)',
      },
      // 반응형 브레이크포인트 (시청 회의실 대형 모니터 고려)
      screens: {
        'xs': '475px',
        'meeting': '1600px', // 회의실 대형 모니터
        '4k': '2560px', // 4K 디스플레이
      },
      // 맵 및 차트 전용 애니메이션
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
