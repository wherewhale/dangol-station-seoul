import { createRoute } from "@granite-js/react-native";
import { useQuery } from "@tanstack/react-query";
import { ListHeader, ListRow, Loader, Top, Txt } from "@toss/tds-react-native";
import { useAdaptive } from "@toss/tds-react-native/private";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { TransitIcon } from "../components/TransitIcon";
import { getStationArrivalsByArsId } from "../services/bus";
import {
  filterAndGroupSubwayArrivals,
  getSubwayArrivals,
} from "../services/subway";
import type { BusArrival } from "../services/types/bus";
import type { SubwayArrival } from "../services/types/subway";

export type DetailParams = {
  type?: "bus" | "subway";
  arsId?: string;
  stNm?: string;
  subwayId?: string;
  subwayNm?: string;
  statnNm?: string;
};

export const Route = createRoute<DetailParams>("/detail", {
  component: Page,
});

/**
 * 버스 남은 초(traTime)를 실시간 반영하여 표시 문구를 생성한다.
 * 1분(60초) 미만이면 "곧 도착"으로 유지
 */
const formatBusArrivalTime = (
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
 * 지하철 도착 예정 시간(초)을 추출/추정한다.
 * 1순위: barvlDt (초)
 * 2순위: arvlMsg2 시간 텍스트 ("2분 30초 후" 등)
 * 3순위: arvlCd 진입/도착 -> 0초 ("곧 도착")
 * 4순위: [N]번째 전역 -> N * 120초 (역당 약 2분)
 * 5순위: 전역 도착/진입/출발 -> 90초
 */
const extractSubwayInitialSeconds = (train: SubwayArrival): number | null => {
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
const extractSubwayStationCountText = (
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
const formatSubwayArrival = (
  train: SubwayArrival,
  elapsedSec: number,
): { timeText: string; positionText: string } => {
  const initialSec = extractSubwayInitialSeconds(train);
  const remaining = initialSec !== null ? Math.max(0, initialSec - elapsedSec) : null;
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

function Page() {
  const adaptive = useAdaptive();
  const params = Route.useParams();

  const isSubway =
    params?.type === "subway" ||
    Boolean(params?.subwayNm || params?.statnNm);

  // -------------------------
  // 1. 버스 실시간 도착 로직
  // -------------------------
  const busArsId = params?.arsId ?? "22990";
  const busStNm = params?.stNm ?? "래미안퍼스티지정문";

  const {
    data: busData,
    isFetching: isBusFetching,
    isError: isBusError,
    refetch: refetchBus,
    dataUpdatedAt: busUpdatedAt,
  } = useQuery<BusArrival[]>({
    queryKey: ["busArrivals", busArsId],
    queryFn: () => getStationArrivalsByArsId(busArsId),
    enabled: !isSubway,
    refetchInterval: 30 * 1000,
  });

  const [busElapsed, setBusElapsed] = useState(0);

  useEffect(() => {
    setBusElapsed(0);
  }, [busUpdatedAt]);

  useEffect(() => {
    if (isSubway) return;
    const timer = setInterval(() => {
      setBusElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubway]);

  // -------------------------
  // 2. 지하철 실시간 도착 로직
  // -------------------------
  const subwayStatnNm = (params?.statnNm ?? "강남").replace(/역$/, "");
  const subwayNm = params?.subwayNm ?? "2호선";
  const subwayId = params?.subwayId;

  const {
    data: rawSubwayData,
    isFetching: isSubwayFetching,
    isError: isSubwayError,
    refetch: refetchSubway,
    dataUpdatedAt: subwayUpdatedAt,
  } = useQuery<SubwayArrival[]>({
    queryKey: ["subwayArrivals", subwayStatnNm],
    queryFn: () => getSubwayArrivals(subwayStatnNm),
    enabled: isSubway,
    refetchInterval: 30 * 1000,
  });

  const [subwayElapsed, setSubwayElapsed] = useState(0);

  useEffect(() => {
    setSubwayElapsed(0);
  }, [subwayUpdatedAt]);

  useEffect(() => {
    if (!isSubway) return;
    const timer = setInterval(() => {
      setSubwayElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubway]);

  const groupedSubway = filterAndGroupSubwayArrivals(
    rawSubwayData ?? [],
    subwayId,
    subwayNm,
  );

  // -------------------------
  // 3. 지하철 열차 행 렌더링 헬퍼
  // -------------------------
  const renderTrainRow = (train: SubwayArrival, keySuffix: string) => {
    const destination = train.trainLineNm || `${train.bstatnNm || ""}행`;
    const location = train.arvlMsg3 ? `현재 위치: ${train.arvlMsg3}` : "";
    const badge =
      train.btrainSttus === "급행"
        ? "[급행] "
        : train.lstcarAt === "1"
          ? "[막차] "
          : "";

    const bottomContent = `${badge}${location}`.trim();

    const { timeText, positionText } = formatSubwayArrival(
      train,
      subwayElapsed,
    );

    return (
      <ListRow
        key={`${train.ordkey}-${keySuffix}`}
        left={<TransitIcon type="subway" subwayNm={subwayNm} />}
        contents={
          <ListRow.Texts
            type="2RowTypeB"
            top={destination}
            topProps={{ color: adaptive.grey800, fontWeight: "bold" }}
            bottom={bottomContent || undefined}
            bottomProps={{ color: adaptive.grey600 }}
          />
        }
        right={
          <ListRow.RightTexts
            type="2RowTypeA"
            top={timeText}
            topProps={{
              typography: "t4",
              color: "#f04452",
              fontWeight: "bold",
            }}
            bottom={positionText}
            bottomProps={{ color: adaptive.grey500 }}
          />
        }
      />
    );
  };

  // -------------------------
  // 지하철 UI 렌더링
  // -------------------------
  if (isSubway) {
    const hasAnyTrain =
      groupedSubway.upGroup.current ||
      groupedSubway.upGroup.next ||
      groupedSubway.downGroup.current ||
      groupedSubway.downGroup.next;

    return (
      <ScrollView style={styles.container}>
        <Top
          title={
            <Top.TitleParagraph color={adaptive.grey900}>
              {subwayStatnNm}역
            </Top.TitleParagraph>
          }
          subtitle1={<Top.SubtitleParagraph>{subwayNm}</Top.SubtitleParagraph>}
          right={
            <Top.RightButton
              style="weak"
              type="primary"
              size="medium"
              onPress={() => refetchSubway()}
            >
              {isSubwayFetching ? "갱신 중" : "새로고침"}
            </Top.RightButton>
          }
        />

        {isSubwayFetching && !rawSubwayData ? (
          <View style={styles.center}>
            <Loader size="medium" />
          </View>
        ) : isSubwayError ? (
          <View style={styles.center}>
            <Txt typography="t6" color={adaptive.grey600}>
              도착 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </Txt>
          </View>
        ) : !hasAnyTrain ? (
          <View style={styles.center}>
            <Txt typography="t6" color={adaptive.grey600}>
              현재 운행 중인 열차가 없어요.
            </Txt>
          </View>
        ) : (
          <>
            {/* 상행 / 내선 그룹 */}
            <ListHeader
              title={
                <ListHeader.TitleParagraph color={adaptive.grey800}>
                  {groupedSubway.upGroup.lineLabel} 방면
                </ListHeader.TitleParagraph>
              }
            />
            {groupedSubway.upGroup.current ? (
              renderTrainRow(groupedSubway.upGroup.current, "up-0")
            ) : (
              <View style={styles.itemPadding}>
                <Txt typography="t6" color={adaptive.grey500}>
                  도착 예정 열차가 없습니다.
                </Txt>
              </View>
            )}
            {groupedSubway.upGroup.next &&
              renderTrainRow(groupedSubway.upGroup.next, "up-1")}

            {/* 하행 / 외선 그룹 */}
            <ListHeader
              title={
                <ListHeader.TitleParagraph color={adaptive.grey800}>
                  {groupedSubway.downGroup.lineLabel} 방면
                </ListHeader.TitleParagraph>
              }
            />
            {groupedSubway.downGroup.current ? (
              renderTrainRow(groupedSubway.downGroup.current, "down-0")
            ) : (
              <View style={styles.itemPadding}>
                <Txt typography="t6" color={adaptive.grey500}>
                  도착 예정 열차가 없습니다.
                </Txt>
              </View>
            )}
            {groupedSubway.downGroup.next &&
              renderTrainRow(groupedSubway.downGroup.next, "down-1")}
          </>
        )}
      </ScrollView>
    );
  }

  // -------------------------
  // 버스 UI 렌더링
  // -------------------------
  const busArrivals = busData ?? [];

  return (
    <ScrollView style={styles.container}>
      <Top
        title={
          <Top.TitleParagraph color={adaptive.grey900}>
            {busStNm}
          </Top.TitleParagraph>
        }
        subtitle1={<Top.SubtitleParagraph>{busArsId}</Top.SubtitleParagraph>}
        right={
          <Top.RightButton
            style="weak"
            type="primary"
            size="medium"
            onPress={() => refetchBus()}
          >
            {isBusFetching ? "갱신 중" : "새로고침"}
          </Top.RightButton>
        }
      />

      {isBusFetching && busArrivals.length === 0 ? (
        <View style={styles.center}>
          <Loader size="medium" />
        </View>
      ) : isBusError ? (
        <View style={styles.center}>
          <Txt typography="t6" color={adaptive.grey600}>
            도착 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </Txt>
        </View>
      ) : busArrivals.length === 0 ? (
        <View style={styles.center}>
          <Txt typography="t6" color={adaptive.grey600}>
            현재 도착 예정인 버스가 없어요.
          </Txt>
        </View>
      ) : (
        busArrivals.map((item) => {
          const directionText = item.adirection
            ? `${item.adirection} 방면`
            : item.nxtStn
              ? `${item.nxtStn} 방면`
              : "";

          const arrival1 = formatBusArrivalTime(
            item.traTime1,
            item.arrmsg1,
            busElapsed,
          );

          const arrival2Text =
            item.arrmsg2 && item.arrmsg2 !== "운행종료"
              ? `${item.arrmsg2}`
              : undefined;

          return (
            <ListRow
              key={`${item.busRouteId}-${item.adirection}`}
              left={<TransitIcon type="bus" />}
              contents={
                <ListRow.Texts
                  type="2RowTypeB"
                  top={item.rtNm}
                  topProps={{ color: adaptive.grey800, fontWeight: "bold" }}
                  bottom={directionText}
                  bottomProps={{ color: adaptive.grey600, typography: "t4" }}
                />
              }
              right={
                <ListRow.RightTexts
                  type="2RowTypeA"
                  top={arrival1.text}
                  topProps={{
                    typography: "t4",
                    color: "#f04452",
                    fontWeight: "bold",
                  }}
                  bottom={arrival2Text}
                  bottomProps={{ color: adaptive.grey500 }}
                />
              }
            />
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    paddingVertical: 48,
    alignItems: "center",
  },
  itemPadding: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});

export default Page;
