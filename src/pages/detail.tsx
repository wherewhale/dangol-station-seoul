import { createRoute } from "@granite-js/react-native";
import { useQuery } from "@tanstack/react-query";
import { ListRow, Loader, Top, Txt } from "@toss/tds-react-native";
import { useAdaptive } from "@toss/tds-react-native/private";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { TransitIcon } from "../components/TransitIcon";
import { getStationArrivalsByArsId } from "../services/bus";
import { ROUTE_TYPE_NAMES, type BusArrival } from "../services/types/bus";

export const Route = createRoute("/detail", {
  component: Page,
});

/**
 * 남은 초(traTime)를 실시간 반영하여 표시 문구를 생성한다.
 * 1분(60초) 미만이면 "곧 도착"으로 유지
 */
const formatArrivalTime = (
  initialSecondsStr: string,
  fallbackMsg: string,
  elapsedSec: number,
): { text: string; isSoon: boolean } => {
  const initialSec = parseInt(initialSecondsStr, 10);

  // traTime이 유효한 숫자가 아닐 경우 원본 메시지 사용
  if (isNaN(initialSec) || initialSec <= 0) {
    const isSoonMsg =
      fallbackMsg.includes("곧") || fallbackMsg.includes("도착");
    return { text: fallbackMsg || "도착 정보 없음", isSoon: isSoonMsg };
  }

  const remaining = Math.max(0, initialSec - elapsedSec);

  // 1분 미만 (60초 이하)이면 "곧 도착" 유지
  if (remaining <= 60) {
    return { text: "곧 도착", isSoon: true };
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const text = seconds > 0 ? `${minutes}분 ${seconds}초 뒤` : `${minutes}분 뒤`;

  return { text, isSoon: false };
};

function Page() {
  const adaptive = useAdaptive();

  // 기본 테스트용 정류소 (서래마을.서래글로벌빌리지센터 22518)
  const arsId = "22990";
  const stNm = "래미안퍼스티지정문";

  const { data, isFetching, isError, refetch, dataUpdatedAt } = useQuery<
    BusArrival[]
  >({
    queryKey: ["busArrivals", arsId],
    queryFn: () => getStationArrivalsByArsId(arsId),
    refetchInterval: 15 * 1000, // 15초마다 갱신
  });

  // 데이터 수신 시점 이후 경과 시간(초)을 매초 카운트다운
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
  }, [dataUpdatedAt]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const arrivals = data ?? [];

  return (
    <ScrollView style={styles.container}>
      <Top
        title={
          <Top.TitleParagraph color={adaptive.grey900}>
            {stNm}
          </Top.TitleParagraph>
        }
        subtitle1={<Top.SubtitleParagraph>{arsId}</Top.SubtitleParagraph>}
        right={
          <Top.RightButton
            style="weak"
            type="primary"
            size="medium"
            onPress={() => refetch()}
          >
            {isFetching ? "갱신 중" : "새로고침"}
          </Top.RightButton>
        }
      />

      {isFetching && arrivals.length === 0 ? (
        <View style={styles.center}>
          <Loader size="medium" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Txt typography="t6" color={adaptive.grey600}>
            도착 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </Txt>
        </View>
      ) : arrivals.length === 0 ? (
        <View style={styles.center}>
          <Txt typography="t6" color={adaptive.grey600}>
            현재 도착 예정인 버스가 없어요.
          </Txt>
        </View>
      ) : (
        arrivals.map((item) => {
          const directionText = item.adirection
            ? `${item.adirection} 방면`
            : item.nxtStn
              ? `${item.nxtStn} 방면`
              : "";

          const arrival1 = formatArrivalTime(
            item.traTime1,
            item.arrmsg1,
            elapsed,
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
});

export default Page;
