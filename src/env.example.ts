/**
 * env.ts 템플릿. 이 파일을 복사해서 src/env.ts로 만들고 값을 채운다.
 *   cp src/env.example.ts src/env.ts
 */
export const ENV = {
  /** 프록시(Cloudflare Worker) 주소. 로컬은 http://localhost:8787 */
  PROXY_BASE_URL: "",
  /** Toss 광고 콘솔에서 발급받은 하단 배너 광고 그룹 ID */
  BANNER_AD_GROUP_ID: "your-banner-ad-group-id",
} as const;
