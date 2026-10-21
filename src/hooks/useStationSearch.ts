import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getStationsByName } from "../services/bus";
import type { BusStation } from "../services/types/bus";
import { useDebouncedValue } from "./useDebouncedValue";

export type SearchType = "bus" | "subway";

type Options = {
  /** 디바운스 지연(ms) */
  delay?: number;
  /** 이 글자 수 이상일 때만 요청 */
  minLength?: number;
};

/** 미정차 정류소(arsId "0")는 탑승할 수 없으므로 제외 */
const selectStoppable = (list: BusStation[]) => list.filter((s) => s.arsId !== "0");

/**
 * 검색어를 디바운스해서 정류소를 검색한다.
 * - 같은 검색어는 react-query 캐시로 재요청하지 않음
 * - 새 검색어 입력 시 이전 요청은 signal로 취소
 * - 로딩 중에는 이전 결과를 유지해서 리스트가 깜빡이지 않음
 */
export const useStationSearch = (
  query: string,
  type: SearchType,
  { delay = 300, minLength = 2 }: Options = {},
) => {
  const trimmed = query.trim();
  const keyword = useDebouncedValue(trimmed, delay);

  // TODO: 지하철 검색 API 연결 시 type별 queryFn 분기
  const isSupported = type === "bus";
  const enabled = isSupported && keyword.length >= minLength;

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["stations", type, keyword],
    queryFn: ({ signal }) => getStationsByName(keyword, { signal }),
    enabled,
    select: selectStoppable,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  return {
    /** 검색 모드 여부 (입력값이 있으면 true) */
    isActive: trimmed.length > 0,
    isSupported,
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
