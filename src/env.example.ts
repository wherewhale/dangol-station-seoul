/**
 * env.ts 템플릿. 이 파일을 복사해서 src/env.ts로 만들고 값을 채운다.
 *   cp src/env.example.ts src/env.ts
 */
export const ENV = {
  /** 프록시(Cloudflare Worker) 주소. 로컬은 http://localhost:8787 */
  PROXY_BASE_URL: "",
} as const;
