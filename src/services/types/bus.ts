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
