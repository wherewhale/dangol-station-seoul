/**
 * 버스 실시간 도착 및 노선 텍스트 포맷 유틸
 */

/**
 * 버스 남은 초(traTime)를 실시간 반영하여 표시 문구를 생성한다.
 * 1분(60초) 미만이면 "곧 도착"으로 유지
 */
export const formatBusArrivalTime = (
  initialSecondsStr: string,
  fallbackMsg: string,
  elapsedSec: number,
): { text: string; isSoon: boolean } => {
  const initialSec = parseInt(initialSecondsStr, 10);

  if (isNaN(initialSec) || initialSec <= 0) {
    const isSoonMsg =
      fallbackMsg.includes("곧") || fallbackMsg.includes("도착");
    return { text: fallbackMsg || "도착 정보 없음", isSoon: isSoonMsg };
  }

  const remaining = Math.max(0, initialSec - elapsedSec);

  if (remaining <= 60) {
    return { text: "곧 도착", isSoon: true };
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const text = seconds > 0 ? `${minutes}분 ${seconds}초 뒤` : `${minutes}분 뒤`;

  return { text, isSoon: false };
};

/**
 * 버스 방면 안내 문구 생성
 */
export const getBusDirectionText = (
  adirection?: string,
  nxtStn?: string,
): string => {
  if (adirection) return `${adirection} 방면`;
  if (nxtStn) return `${nxtStn} 방면`;
  return "";
};
