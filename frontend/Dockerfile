# ===== 1단계: 빌드 단계 =====
# Node.js 20버전의 경량 Alpine Linux 이미지 사용
FROM node:20-alpine AS builder

# 작업 디렉토리 설정 (컨테이너 내부 경로)
WORKDIR /app

# package.json과 package-lock.json만 먼저 복사
# (의존성이 변경되지 않으면 캐시 활용 가능)
COPY package*.json ./

# 의존성 설치 (npm ci는 package-lock.json 기반으로 정확한 버전 설치)
RUN npm ci

# 소스 코드 전체 복사
COPY . .

# Next.js 프로덕션 빌드 실행
# 이 명령어는 out/ 폴더에 정적 파일들을 생성합니다
RUN npm run build

# ===== 2단계: 실행 단계 =====
# Nginx 경량 이미지 사용 (웹서버)
FROM nginx:alpine

# 빌드 단계에서 생성된 정적 파일들을 Nginx 웹 루트로 복사
# /usr/share/nginx/html이 Nginx의 기본 정적 파일 서빙 경로입니다
COPY --from=builder /app/out /usr/share/nginx/html

# 컨테이너가 리스닝할 포트 선언 (문서화 목적)
# 실제 포트 바인딩은 docker-compose.yml의 ports에서 설정
EXPOSE 80

# Nginx를 포그라운드에서 실행 (컨테이너가 종료되지 않도록)
CMD ["nginx", "-g", "daemon off;"]