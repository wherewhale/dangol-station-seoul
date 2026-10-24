export interface SubwayStation {
  statnId: string;
  statnNm: string;
  subwayId: string;
  subwayNm: string;
}

/** 서울 열린데이터광장 지하철 실시간 도착정보 항목 */
export interface SubwayArrival {
  /** 호선 ID (예: "1002", "1077") */
  subwayId: string;
  /** 상하행선 구분 ("상행" | "하행" | "내선" | "외선") */
  updnLine: "상행" | "하행" | "내선" | "외선" | string;
  /** 도착지 방면 헤더 텍스트 (예: "성수행 - 역삼방면") */
  trainLineNm: string;
  /** 지하철역 이름 (예: "강남") */
  statnNm: string;
  /** 화면에 가장 크게 보여줄 도착 메시지 (예: "2분 20초 후", "강남 진입", "전역 도착", "[3]번째 전역 (청계산입구)") */
  arvlMsg2: string;
  /** 현재 열차가 위치한 역 이름 (예: "서초", "청계산입구") */
  arvlMsg3: string;
  /**
   * 도착 상태 코드
   * 0: 진입, 1: 도착, 2: 출발, 3: 전역출발, 4: 전역진입, 5: 전역도착, 99: 운행중
   */
  arvlCd: string;
  /** 열차 종류 ("일반", "급행", "ITX") */
  btrainSttus: string;
  /** 막차 여부 ("1": 막차, "0": 아님) */
  lstcarAt: string;
  /** 도착 순서 정렬 키 (예: "01002성수0") */
  ordkey: string;
  /** 종착역 이름 */
  bstatnNm?: string;
  /** 열차 도착예정시간 (초 단위) */
  barvlDt?: string;
}

export interface SubwayArrivalResponse {
  errorMessage?: {
    status: number;
    code: string;
    message: string;
    link: string;
    developerMessage: string;
    total: number;
  };
  realtimeArrivalList?: SubwayArrival[];
}

export interface GroupedSubwayArrivals {
  upGroup: {
    lineLabel: string;
    current?: SubwayArrival;
    next?: SubwayArrival;
  };
  downGroup: {
    lineLabel: string;
    current?: SubwayArrival;
    next?: SubwayArrival;
  };
}
