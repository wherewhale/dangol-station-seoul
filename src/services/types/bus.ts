/** ws.bus.go.kr 공통 응답 (resultType=json) */
export type WsBusResponse<T> = {
  msgHeader: {
    headerCd: string;
    headerMsg: string;
    itemCount: number;
  };
  msgBody: {
    itemList: T[] | null;
  };
};

/** getStationByName 응답 항목 */
export type BusStation = {
  /** 정류소 고유 ID */
  stId: string;
  /** 정류소명 */
  stNm: string;
  /** 경도 (WGS84) */
  tmX: string;
  /** 위도 (WGS84) */
  tmY: string;
  /** 정류소 고유번호. 미정차 정류소는 "0" */
  arsId: string;
  /** 좌표X (GRS80) */
  posX?: string;
  /** 좌표Y (GRS80) */
  posY?: string;
};

/** getStationByUid 응답 항목 (실시간 도착 정보) */
export type BusArrival = {
  /** 노선 번호 (예: "144", "서초13") */
  rtNm: string;
  busRouteAbrv?: string;
  busRouteId: string;
  /**
   * 노선 유형 코드
   * 1: 공항, 2: 마을, 3: 간선, 4: 지선, 5: 순환, 6: 광역
   */
  routeType: string;
  /** 해당 버스의 진행 방면/종점 방향 */
  adirection: string;
  /** 다음 정류소 명칭 */
  nxtStn: string;
  /** 이번 버스 도착 메시지 (예: "3분12초후[2번째 전]", "곧도착", "출발대기", "운행종료") */
  arrmsg1: string;
  /** 다음 버스 도착 메시지 */
  arrmsg2: string;
  /** 첫 번째 버스 남은 도착 예정 시간 (초 단위) */
  traTime1: string;
  /** 두 번째 버스 남은 도착 예정 시간 (초 단위) */
  traTime2: string;
  /** 정류소 고유 ID */
  stId?: string;
  /** 정류소명 */
  stNm?: string;
  /** 정류소 고유번호 5자리 */
  arsId?: string;
};

export const ROUTE_TYPE_NAMES: Record<string, string> = {
  "1": "공항버스",
  "2": "마을버스",
  "3": "간선버스",
  "4": "지선버스",
  "5": "순환버스",
  "6": "광역버스",
};
