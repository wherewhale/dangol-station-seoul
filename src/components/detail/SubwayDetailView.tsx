import { useQuery } from "@tanstack/react-query";
import { ListHeader, ListRow, Loader, Top, Txt } from "@toss/tds-react-native";
import { useAdaptive } from "@toss/tds-react-native/private";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { FavoriteButton } from "../FavoriteButton";
import { TransitIcon } from "../TransitIcon";
import { getFavoriteId, useFavorites } from "../../hooks/useFavorites";
import {
  filterAndGroupSubwayArrivals,
  getSubwayArrivals,
} from "../../services/subway";
import type { SubwayArrival } from "../../services/types/subway";
import {
  formatSubwayArrival,
  getSubwayBadgeAndLocation,
} from "../../utils/subwayFormat";

type Props = {
  statnNm?: string;
  subwayNm?: string;
  subwayId?: string;
};

export const SubwayDetailView = ({
  statnNm = "강남",
  subwayNm = "2호선",
  subwayId,
}: Props) => {
  const adaptive = useAdaptive();
  const { isFavorite, toggleFavorite } = useFavorites();

  const cleanStatnNm = statnNm.replace(/역$/, "");

  const favId = getFavoriteId({
    type: "subway",
    subwayId: subwayId ? String(subwayId) : undefined,
    statnNm: cleanStatnNm,
  });
  const isFav = isFavorite(favId);

  const {
    data: rawSubwayData,
    isFetching,
    isError,
    refetch,
    dataUpdatedAt,
  } = useQuery<SubwayArrival[]>({
    queryKey: ["subwayArrivals", cleanStatnNm],
    queryFn: () => getSubwayArrivals(cleanStatnNm),
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

  const groupedSubway = filterAndGroupSubwayArrivals(
    rawSubwayData ?? [],
    subwayId,
    subwayNm,
  );

  const renderTrainRow = (train: SubwayArrival, keySuffix: string) => {
    const destination = train.trainLineNm || `${train.bstatnNm || ""}행`;
    const bottomContent = getSubwayBadgeAndLocation(train);
    const { timeText, positionText } = formatSubwayArrival(
      train,
      elapsedSec,
      subwayNm,
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

  const hasAnyTrain =
    groupedSubway.upGroup.current ||
    groupedSubway.upGroup.next ||
    groupedSubway.downGroup.current ||
    groupedSubway.downGroup.next;

  return (
    <ScrollView style={styles.scroll}>
      <Top
        title={
          <Top.TitleParagraph color={adaptive.grey900}>
            {cleanStatnNm}역
          </Top.TitleParagraph>
        }
        subtitle1={<Top.SubtitleParagraph>{subwayNm}</Top.SubtitleParagraph>}
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
                  type: "subway",
                  subwayId: subwayId ? String(subwayId) : "",
                  subwayNm,
                  statnNm: cleanStatnNm,
                })
              }
              size={34}
            />
          </View>
        }
      />

      {isFetching && !rawSubwayData ? (
        <View style={styles.center}>
          <Loader size="medium" />
        </View>
      ) : isError ? (
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
  itemPadding: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
});
