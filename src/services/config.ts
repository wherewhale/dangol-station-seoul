import { ENV } from "../env";

/**
 * 외부 API 설정.
 * 원본 API 주소와 인증키는 proxy/src/index.ts 의 ROUTES에서 관리한다.
 * 앱은 프록시 주소만 알면 된다.
 */
export const API_CONFIG = {
  proxy: {
    baseURL: ENV.PROXY_BASE_URL,
  },
} as const;
