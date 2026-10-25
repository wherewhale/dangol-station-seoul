import { useQuery } from "@tanstack/react-query";
import { ListRow, Loader, Top, Txt } from "@toss/tds-react-native";
import { useAdaptive } from "@toss/tds-react-native/private";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { FavoriteButton } from "../FavoriteButton";
import { TransitIcon } from "../TransitIcon";
import { getFavoriteId, useFavorites } from "../../hooks/useFavorites";
import { getStationArrivalsByArsId } from "../../services/bus";
import type { BusArrival } from "../../services/types/bus";
import {
  formatBusArrivalTime,
  getBusDirectionText,
} from "../../utils/busFormat";

type Props = {
  arsId?: string;
  stNm?: string;
};

export const BusDetailView = ({
  arsId = "22990",
  stNm = "래미안퍼스티지정문",
}: Props) => {
  const adaptive = useAdaptive();
  const { isFavorite, toggleFavorite } = useFavorites();

  const favId = getFavoriteId({
    type: "bus",
    arsId,
  });
  const isFav = isFavorite(favId);

  const {
    data: busData,
    isFetching,
    isError,
    refetch,
    dataUpdatedAt,
  } = useQuery<BusArrival[]>({
    queryKey: ["busArrivals", arsId],
    queryFn: () => getStationArrivalsByArsId(arsId),
    refetchInterval: 30 * 1000,
  });

  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    setElapsedSec(0);
  }, [dataUpdatedAt]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const busArrivals = busData ?? [];

  return (
    <ScrollView style={styles.scroll}>
      <Top
        title={
          <Top.TitleParagraph color={adaptive.grey900}>
            {stNm}
          </Top.TitleParagraph>
        }
        subtitle1={<Top.SubtitleParagraph>{arsId}</Top.SubtitleParagraph>}
        right={
          <View style={styles.topRightArea}>
            <Top.RightButton
              style="weak"
              type="primary"
              size="medium"
              onPress={() => refetch()}
            >
              {isFetching ? "갱신 중" : "새로고침"}
            </Top.RightButton>
            <FavoriteButton
              active={isFav}
              onToggle={() =>
                toggleFavorite({
                  id: favId,
                  type: "bus",
                  arsId,
                  stNm,
                })
              }
              size={34}
            />
          </View>
        }
      />

      {isFetching && busArrivals.length === 0 ? (
        <View style={styles.center}>
          <Loader size="medium" />
        </View>
      ) : isError ? (
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
          const directionText = getBusDirectionText(
            item.adirection,
            item.nxtStn,
          );

          const arrival1 = formatBusArrivalTime(
            item.traTime1,
            item.arrmsg1,
            elapsedSec,
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
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  topRightArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  center: {
    paddingVertical: 48,
    alignItems: "center",
  },
});
