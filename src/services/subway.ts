import rawStations from "../const/subwayStations.json";
import { buildUrl, getJson, type RequestOptions } from "./apiClient";
import { API_CONFIG } from "./config";
import type {
  GroupedSubwayArrivals,
  SubwayArrival,
  SubwayArrivalResponse,
  SubwayStation,
} from "./types/subway";

const subwayStations: SubwayStation[] = rawStations as SubwayStation[];

import {
  DEFAULT_SUBWAY_ICON,
  getSubwayIconUrl,
  SUBWAY_LINE_ICON_MAP,
} from "../const/icons";

export { DEFAULT_SUBWAY_ICON, getSubwayIconUrl, SUBWAY_LINE_ICON_MAP };

/**
 * JSON 파일(subwayStations.json)에서 역 이름으로 지하철역을 검색한다.
 * - '강남역'처럼 '역'을 붙여 검색해도 '강남'으로 매칭되도록 보정
 * - 검색어와 정확히 일치하거나 접두어로 일치하는 역을 우선 정렬
 */
export const searchSubwayStations = (keyword: string): SubwayStation[] => {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  const lowerKeyword = trimmed.toLowerCase();
  const normalizedKeyword =
    lowerKeyword.endsWith("역") && lowerKeyword.length > 1
      ? lowerKeyword.slice(0, -1)
      : lowerKeyword;

  const matched = subwayStations.filter((station) => {
    const name = station.statnNm.toLowerCase();
    return (
      name.includes(lowerKeyword) ||
      name.includes(normalizedKeyword) ||
      station.subwayNm.toLowerCase().includes(lowerKeyword)
    );
  });

  return matched.sort((a, b) => {
    const aExact =
      a.statnNm === trimmed || a.statnNm === normalizedKeyword ? 1 : 0;
    const bExact =
      b.statnNm === trimmed || b.statnNm === normalizedKeyword ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;

    const aStarts =
      a.statnNm.startsWith(trimmed) || a.statnNm.startsWith(normalizedKeyword)
        ? 1
        : 0;
    const bStarts =
      b.statnNm.startsWith(trimmed) || b.statnNm.startsWith(normalizedKeyword)
        ? 1
        : 0;
    if (aStarts !== bStarts) return bStarts - aStarts;

    return a.statnNm.localeCompare(b.statnNm, "ko");
  });
};

/**
 * 역 이름으로 서울시 실시간 지하철 도착정보를 조회한다.
 * 심야 시간대 등 운행 열차가 없을 때는 빈 배열로 폴백한다.
 */
export const getSubwayArrivals = async (
  statnNm: string,
  options?: RequestOptions,
): Promise<SubwayArrival[]> => {
  const trimmed = statnNm.trim();
  const cleanStatnNm =
    trimmed.endsWith("역") && trimmed.length > 1
      ? trimmed.slice(0, -1)
      : trimmed;

  const url = buildUrl(API_CONFIG.proxy.baseURL, "/subway/arrivals", {
    statnNm: cleanStatnNm,
  });

  try {
    const res = await getJson<SubwayArrivalResponse>(url, options);
    return res.realtimeArrivalList ?? [];
  } catch {
    return [];
  }
};

export const SUBWAY_LINE_ID_MAP: Record<string, string> = {
  "1호선": "1001",
  "2호선": "1002",
  "3호선": "1003",
  "4호선": "1004",
  "5호선": "1005",
  "6호선": "1006",
  "7호선": "1007",
  "8호선": "1008",
  "9호선": "1009",
  "GTX-A": "1032",
  경의중앙선: "1063",
  공항철도: "1065",
  경춘선: "1067",
  수인분당선: "1075",
  신분당선: "1077",
  경강선: "1081",
  우이신설선: "1092",
  서해선: "1093",
  신림선: "1094",
};

/**
 * 선택 호선 필터링 및 상/하행(또는 내/외선) 그룹화하여 이번/다음 열차를 매핑한다.
 * 라우터 파서가 숫자(1002)로 변환하거나 호선명(2호선)으로 올 수 있으므로 문자열로 정규화하여 매칭.
 */
export const filterAndGroupSubwayArrivals = (
  arrivals: SubwayArrival[],
  subwayId?: string | number,
  subwayNm?: string,
): GroupedSubwayArrivals => {
  // 1. 대상 호선 ID 도출
  const targetId = subwayId
    ? String(subwayId).trim()
    : subwayNm
      ? SUBWAY_LINE_ID_MAP[subwayNm]
      : undefined;

  // 2. 선택 호선 필터링 (일치하는 항목이 없을 때는 전체 배열 폴백)
  const matched = targetId
    ? arrivals.filter((a) => String(a.subwayId).trim() === targetId)
    : arrivals;

  const filtered = matched.length > 0 ? matched : arrivals;

  // 3. 상행/내선 vs 하행/외선 분리
  const upList: SubwayArrival[] = [];
  const downList: SubwayArrival[] = [];

  for (const item of filtered) {
    if (item.updnLine === "상행" || item.updnLine === "내선") {
      upList.push(item);
    } else {
      downList.push(item);
    }
  }

  const isCircle = filtered.some(
    (a) => a.updnLine === "내선" || a.updnLine === "외선",
  );

  return {
    upGroup: {
      lineLabel: isCircle ? "내선순환" : "상행",
      current: upList[0],
      next: upList[1],
    },
    downGroup: {
      lineLabel: isCircle ? "외선순환" : "하행",
      current: downList[0],
      next: downList[1],
    },
  };
};
