import type { SubwayArrival } from "../services/types/subway";

/**
 * 지하철 도착 예정 시간(초)을 추출/추정한다.
 * 1순위: barvlDt (초)
 * 2순위: arvlMsg2 시간 텍스트 ("2분 30초 후" 등)
 * 3순위: arvlCd 진입/도착 -> 0초 ("곧 도착")
 * 4순위: [N]번째 전역 -> N * 120초 (역당 약 2분)
 * 5순위: 전역 도착/진입/출발 -> 90초
 */
const isSuinBundangLine = (
  train: SubwayArrival,
  subwayNm?: string,
): boolean => {
  return (
    String(train.subwayId) === "1075" ||
    subwayNm === "수인분당선" ||
    (train.trainLineNm?.includes("수인") ?? false) ||
    (train.trainLineNm?.includes("분당") ?? false)
  );
};

/**
 * 지하철 도착 예정 시간(초)을 추출/추정한다.
 * 기본 역간 이동 시간: 90초 (1분 30초)
 * 수인분당선: 코레일 연계 지연 보정 (1단계 시간 앞당김)
 */
export const extractSubwayInitialSeconds = (
  train: SubwayArrival,
  subwayNm?: string,
): number | null => {
  const isSuin = isSuinBundangLine(train, subwayNm);
  const msg = train.arvlMsg2 || "";

  // 당역 진입/도착 상태
  if (
    ["0", "1"].includes(train.arvlCd) ||
    (msg.endsWith("진입") && !msg.includes("전역")) ||
    (msg.endsWith("도착") && !msg.includes("전역"))
  ) {
    return 0;
  }

  // 1순위: barvlDt (초)
  const barvl = parseInt(train.barvlDt || "0", 10);
  if (!isNaN(barvl) && barvl > 0) {
    return isSuin ? Math.max(0, barvl - 45) : barvl;
  }

  // 2순위: arvlMsg2 시간 텍스트 ("2분 30초 후" 등)
  const timeMatch = msg.match(/(\d+)분(?:\s*(\d+)초)?/);
  if (timeMatch && timeMatch[1]) {
    const min = parseInt(timeMatch[1], 10);
    const sec = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const total = min * 60 + sec;
    return isSuin ? Math.max(0, total - 45) : total;
  }

  // 3순위: [N]번째 전역
  const nthMatch = msg.match(/\[(\d+)\]번째\s*전역/);
  if (nthMatch && nthMatch[1]) {
    const n = parseInt(nthMatch[1], 10);
    if (isSuin) {
      // 수인분당선: N-1번째로 보정 (1전역이면 35초로 곧 도착/진입)
      return n <= 1 ? 35 : Math.max(45, (n - 1) * 90);
    }
    return Math.max(45, n * 90);
  }

  // 4순위: 1전역 (전역 도착/진입/출발)
  if (["3", "4", "5"].includes(train.arvlCd) || msg.includes("전역")) {
    // 수인분당선 1전역 -> 실제 진입 중 (35초)
    return isSuin ? 35 : 90;
  }

  return null;
};

/**
 * 우측 하단에 표시할 "N전 역" 텍스트를 산출한다.
 * 기본 역간 이동 시간: 90초 (1분 30초)
 * 수인분당선 지연 보정:
 *   - 1전역 -> "진입 중"
 *   - 진입 중 -> "도착"
 *   - [N]번째 전역 -> (N-1)전 역
 */
export const extractSubwayStationCountText = (
  train: SubwayArrival,
  remainingSec: number | null,
  subwayNm?: string,
): string => {
  const isSuin = isSuinBundangLine(train, subwayNm);
  const msg = (train.arvlMsg2 || "").trim();

  // 수인분당선 보정 모드
  if (isSuin) {
    // 진입 중이거나 도착 -> 바로 "도착"
    if (
      ["0", "1"].includes(train.arvlCd) ||
      (msg.endsWith("진입") && !msg.includes("전역")) ||
      (msg.endsWith("도착") && !msg.includes("전역"))
    ) {
      return "도착";
    }

    // 1전역 (전역 도착/진입/출발) -> "진입 중"
    if (["3", "4", "5"].includes(train.arvlCd)) {
      return "진입 중";
    }

    const nthMatch = msg.match(/\[(\d+)\]번째\s*전역/);
    if (nthMatch && nthMatch[1]) {
      const n = parseInt(nthMatch[1], 10);
      if (n <= 1) return "진입 중";
      return `${n - 1}전 역`;
    }

    if (msg.includes("전역")) {
      return "진입 중";
    }

    // 남은 시간 기준 보정
    if (remainingSec !== null) {
      if (remainingSec <= 20) return "도착";
      if (remainingSec <= 50) return "진입 중";
      const count = Math.max(1, Math.round(remainingSec / 90));
      return `${count}전 역`;
    }

    return "진입 중";
  }

  // 일반 호선 표준 처리
  // 1. [N]번째 전역 패턴
  const nthMatch = msg.match(/\[(\d+)\]번째\s*전역/);
  if (nthMatch && nthMatch[1]) {
    return `${nthMatch[1]}전 역`;
  }

  // 2. 당역 진입 / 도착 상태
  if (train.arvlCd === "0" || (msg.endsWith("진입") && !msg.includes("전역"))) {
    return "진입 중";
  }
  if (train.arvlCd === "1" || (msg.endsWith("도착") && !msg.includes("전역"))) {
    return "도착";
  }

  // 3. 전역 도착 / 전역 진입 / 전역 출발
  if (["3", "4", "5"].includes(train.arvlCd) || msg.includes("전역")) {
    return "1전 역";
  }

  // 4. 남은 시간(초) 기준: 역간 평균 90초 기준 계산
  if (remainingSec !== null) {
    if (remainingSec <= 45) {
      return "1전 역";
    }
    const count = Math.max(1, Math.round(remainingSec / 90));
    return `${count}전 역`;
  }

  return "1전 역";
};

/**
 * 지하철 도착 시간 및 상태 포맷팅
 */
export const formatSubwayArrival = (
  train: SubwayArrival,
  elapsedSec: number,
  subwayNm?: string,
): { timeText: string; positionText: string } => {
  const initialSec = extractSubwayInitialSeconds(train, subwayNm);
  const remaining =
    initialSec !== null ? Math.max(0, initialSec - elapsedSec) : null;
  const positionText = extractSubwayStationCountText(
    train,
    remaining,
    subwayNm,
  );

  if (remaining === null) {
    return {
      timeText: "운행 중",
      positionText,
    };
  }

  if (remaining <= 60) {
    return {
      timeText: "곧 도착",
      positionText,
    };
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeText =
    seconds > 0 ? `${minutes}분 ${seconds}초 뒤` : `${minutes}분 뒤`;

  return {
    timeText,
    positionText,
  };
};

/**
 * 열차 급행/막차 뱃지 및 현재 위치 텍스트 포맷팅
 */
export const getSubwayBadgeAndLocation = (train: SubwayArrival): string => {
  const location = train.arvlMsg3 ? `현재 위치: ${train.arvlMsg3}` : "";
  const badge =
    train.btrainSttus === "급행"
      ? "[급행] "
      : train.lstcarAt === "1"
        ? "[막차] "
        : "";

  return `${badge}${location}`.trim();
};
