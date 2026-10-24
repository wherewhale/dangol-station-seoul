import {
  ApiError,
  buildUrl,
  getJson,
  type QueryParams,
  type RequestOptions,
} from "./apiClient";
import { API_CONFIG } from "./config";
import type { BusArrival, BusStation, WsBusResponse } from "./types/bus";

const HEADER_OK = "0";
const HEADER_NO_RESULT = "4";

/**
 * 버스 API 공통 요청.
 * 프록시가 인증키/resultType을 붙여 ws.bus.go.kr 응답을 그대로 넘겨주므로 headerCd만 검사한다.
 */
const busGet = async <T>(
  path: string,
  params: QueryParams,
  options?: RequestOptions,
): Promise<T[]> => {
  const url = buildUrl(API_CONFIG.proxy.baseURL, path, params);

  const res = await getJson<WsBusResponse<T>>(url, options);
  const { headerCd, headerMsg } = res.msgHeader;

  if (headerCd === HEADER_NO_RESULT) return [];
  if (headerCd !== HEADER_OK) throw new ApiError(headerMsg, undefined, headerCd);

  return res.msgBody.itemList ?? [];
};

/** 정류소명으로 정류소 목록 검색 */
export const getStationsByName = (stSrch: string, options?: RequestOptions) =>
  busGet<BusStation>("/bus/stations", { stSrch }, options);

/** 정류소 고유번호(arsId 5자리)로 도착 예정 버스 목록 조회 */
export const getStationArrivalsByArsId = (
  arsId: string,
  options?: RequestOptions,
) => busGet<BusArrival>("/bus/arrivals", { arsId }, options);
