export interface Env {
  /** 서울시 버스정보 (ws.bus.go.kr) 인증키 */
  BUS_API_KEY: string;
}

type RouteDef = {
  /** 원본 API 주소 (http 허용: Worker -> 원본 구간) */
  upstream: string;
  /**
   * 인증 파라미터 주입. API마다 키 이름이 다르다.
   * data.go.kr 계열은 "Decoding" 키를 넣어야 이중 인코딩이 안 된다.
   */
  auth: (env: Env) => Record<string, string>;
  /** 항상 붙는 고정 파라미터 */
  fixed?: Record<string, string>;
  /** 클라이언트가 보낼 수 있는 파라미터 화이트리스트 */
  params: { name: string; required?: boolean }[];
  /** 엣지 캐시 TTL(초). 실시간 도착정보는 짧게, 정류소 검색은 길게 */
  cacheTtl: number;
};

/**
 * 앱에서 호출하는 경로 -> 원본 API 매핑.
 * API를 추가할 때는 여기에 항목 하나만 추가한다.
 */
const ROUTES: Record<string, RouteDef> = {
  "/bus/stations": {
    upstream: "http://ws.bus.go.kr/api/rest/stationinfo/getStationByName",
    auth: (env) => ({ serviceKey: env.BUS_API_KEY }),
    fixed: { resultType: "json" },
    params: [{ name: "stSrch", required: true }],
    cacheTtl: 60 * 60, // 정류소명은 거의 안 바뀜
  },
};

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, OPTIONS",
  "access-control-allow-headers": "*",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...CORS_HEADERS, ...extra },
  });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
    if (req.method !== "GET") return json({ error: "Method Not Allowed" }, 405);

    const url = new URL(req.url);
    const route = ROUTES[url.pathname];
    if (!route) return json({ error: "Not Found" }, 404);

    const upstream = new URL(route.upstream);

    // 화이트리스트에 있는 파라미터만 전달 (임의 파라미터로 원본 API를 두드리는 것 방지)
    for (const { name, required } of route.params) {
      const value = url.searchParams.get(name)?.trim();
      if (!value) {
        if (required) return json({ error: `Missing parameter: ${name}` }, 400);
        continue;
      }
      upstream.searchParams.set(name, value);
    }
    for (const [k, v] of Object.entries({ ...route.fixed, ...route.auth(env) })) {
      upstream.searchParams.set(k, v);
    }

    try {
      const res = await fetch(upstream.toString(), {
        cf: { cacheTtl: route.cacheTtl, cacheEverything: true },
      });
      const body = await res.text();

      if (!res.ok) return json({ error: `Upstream HTTP ${res.status}` }, 502);

      return new Response(body, {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": `public, max-age=${route.cacheTtl}`,
          ...CORS_HEADERS,
        },
      });
    } catch (e) {
      return json({ error: "Upstream fetch failed", detail: String(e) }, 502);
    }
  },
} satisfies ExportedHandler<Env>;
