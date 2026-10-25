import type { SubwayArrival } from "../services/types/subway";

/**
 * 지하철 도착 예정 시간(초)을 추출/추정한다.
 * 1순위: barvlDt (초)
 * 2순위: arvlMsg2 시간 텍스트 ("2분 30초 후" 등)
 * 3순위: arvlCd 진입/도착 -> 0초 ("곧 도착")
 * 4순위: [N]번째 전역 -> N * 120초 (역당 약 2분)
 * 5순위: 전역 도착/진입/출발 -> 90초
 */
export const extractSubwayInitialSeconds = (train: SubwayArrival): number | null => {
  const barvl = parseInt(train.barvlDt || "0", 10);
  if (!isNaN(barvl) && barvl > 0) {
    return barvl;
  }

  const msg = train.arvlMsg2 || "";

  const timeMatch = msg.match(/(\d+)분(?:\s*(\d+)초)?/);
  if (timeMatch && timeMatch[1]) {
    const min = parseInt(timeMatch[1], 10);
    const sec = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    return min * 60 + sec;
  }

  if (
    ["0", "1"].includes(train.arvlCd) ||
    (msg.endsWith("진입") && !msg.includes("전역")) ||
    (msg.endsWith("도착") && !msg.includes("전역"))
  ) {
    return 0;
  }

  const nthMatch = msg.match(/\[(\d+)\]번째\s*전역/);
  if (nthMatch && nthMatch[1]) {
    const n = parseInt(nthMatch[1], 10);
    return Math.max(60, n * 120);
  }

  if (["3", "4", "5"].includes(train.arvlCd) || msg.includes("전역")) {
    return 90;
  }

  return null;
};

/**
 * 우측 하단에 표시할 "N전 역" 텍스트를 산출한다.
 * - [N]번째 전역 패턴 -> "N전 역"
 * - 전역 도착/진입/출발 -> "1전 역"
 * - 시간/운행중 데이터 -> 역간 평균 시간(120초) 기준으로 환산하여 "N전 역"
 * - 당역 진입/도착 -> "진입 중" / "도착"
 */
export const extractSubwayStationCountText = (
  train: SubwayArrival,
  remainingSec: number | null,
): string => {
  const msg = (train.arvlMsg2 || "").trim();

  // 1. [N]번째 전역 패턴 우선 적용
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

  // 4. 남은 시간(초)이 있는 경우: 역간 평균 약 2분(120초) 기준으로 N전 역 계산
  if (remainingSec !== null) {
    if (remainingSec <= 60) {
      return "1전 역";
    }
    const count = Math.max(1, Math.round(remainingSec / 120));
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
): { timeText: string; positionText: string } => {
  const initialSec = extractSubwayInitialSeconds(train);
  const remaining =
    initialSec !== null ? Math.max(0, initialSec - elapsedSec) : null;
  const positionText = extractSubwayStationCountText(train, remaining);

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
