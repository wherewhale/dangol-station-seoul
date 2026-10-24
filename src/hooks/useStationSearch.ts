import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getStationsByName } from "../services/bus";
import { searchSubwayStations } from "../services/subway";
import type { BusStation } from "../services/types/bus";
import type { SubwayStation } from "../services/types/subway";
import { useDebouncedValue } from "./useDebouncedValue";

export type SearchType = "bus" | "subway";

export type StationItem =
  | { type: "bus"; data: BusStation }
  | { type: "subway"; data: SubwayStation };

type Options = {
  /** 디바운스 지연(ms) */
  delay?: number;
  /** 이 글자 수 이상일 때만 요청 */
  minLength?: number;
};

/** 미정차 정류소(arsId "0")는 탑승할 수 없으므로 제외 */
const selectStoppableBus = (list: BusStation[]): StationItem[] =>
  list
    .filter((s) => s.arsId !== "0")
    .map((s) => ({ type: "bus" as const, data: s }));

/**
 * 검색어를 디바운스해서 버스 정류소(API) 또는 지하철역(로컬 JSON)을 검색한다.
 * - 버스: 서울시 버스 API 호출
 * - 지하철: subwayStations.json 파일 기반 로컬 검색
 */
export const useStationSearch = (
  query: string,
  type: SearchType,
  { delay = 300, minLength = 2 }: Options = {},
) => {
  const trimmed = query.trim();
  const keyword = useDebouncedValue(trimmed, delay);

  // 버스와 지하철 모두 검색 지원
  const isSupported = true;
  const enabled = keyword.length >= minLength;

  const { data, isFetching, isError, refetch } = useQuery<StationItem[]>({
    queryKey: ["stations", type, keyword],
    queryFn: async ({ signal }) => {
      if (type === "bus") {
        const busList = await getStationsByName(keyword, { signal });
        return selectStoppableBus(busList);
      } else {
        const subwayList = searchSubwayStations(keyword);
        return subwayList.map((s) => ({ type: "subway" as const, data: s }));
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  return {
    /** 검색 모드 여부 (입력값이 있으면 true) */
    isActive: trimmed.length > 0,
    isSupported,
    searchType: type,
    /** 실제 요청에 쓰인(디바운스된) 검색어 */
    keyword,
    /** minLength 미만이라 아직 요청하지 않은 상태 */
    isTooShort: trimmed.length > 0 && trimmed.length < minLength,
    stations: enabled ? (data ?? []) : [],
    /** 디바운스 대기 중이거나 요청 중 */
    isSearching: enabled && (trimmed !== keyword || isFetching),
    isError: enabled && isError,
    refetch,
  };
};
