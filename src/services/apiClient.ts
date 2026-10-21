export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type QueryParams = Record<string, string | number | undefined>;

/** RN 환경 호환을 위해 URLSearchParams 대신 직접 직렬화 */
export const buildUrl = (baseURL: string, path: string, params?: QueryParams) => {
  const query = Object.entries(params ?? {})
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

  return `${baseURL}${path}${query ? `?${query}` : ""}`;
};

export type RequestOptions = {
  timeoutMs?: number;
  signal?: AbortSignal;
};

export const getJson = async <T>(
  url: string,
  { timeoutMs = 10_000, signal }: RequestOptions = {},
): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  signal?.addEventListener("abort", () => controller.abort());

  try {
    // @types/node와 RN 전역 AbortSignal 타입이 충돌해서 캐스팅 (런타임 객체는 동일)
    const res = await fetch(url, {
      signal: controller.signal as unknown as RequestInit["signal"],
    });
    const text = await res.text();

    if (!res.ok) {
      throw new ApiError(`HTTP ${res.status}`, res.status);
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      // 인증 실패 등 일부 공공 API는 JSON 요청에도 XML/HTML을 돌려준다
      throw new ApiError(`JSON 파싱 실패: ${text.slice(0, 200)}`, res.status);
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (controller.signal.aborted) throw new ApiError("요청 시간 초과 또는 취소");
    throw new ApiError(e instanceof Error ? e.message : "네트워크 오류");
  } finally {
    clearTimeout(timer);
  }
};
