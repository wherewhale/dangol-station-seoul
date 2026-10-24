import { ListHeader, ListRow, Loader, Txt } from "@toss/tds-react-native";
import { useAdaptive } from "@toss/tds-react-native/private";
import React from "react";
import { StyleSheet, View } from "react-native";
import type { StationItem } from "../hooks/useStationSearch";
import { FavoriteButton } from "./FavoriteButton";
import { TransitIcon } from "./TransitIcon";

type Props = {
  keyword: string;
  stations: StationItem[];
  isSupported: boolean;
  isTooShort: boolean;
  isSearching: boolean;
  isError: boolean;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  onPressStation: (item: StationItem) => void;
};

export const getFavoriteId = (item: StationItem) =>
  item.type === "bus" ? `bus-${item.data.stId}` : `subway-${item.data.statnId}`;

export const StationSearchResults = ({
  keyword,
  stations,
  isSupported,
  isTooShort,
  isSearching,
  isError,
  isFavorite,
  onToggleFavorite,
  onPressStation,
}: Props) => {
  const adaptive = useAdaptive();

  const message = (text: string) => (
    <View style={styles.message}>
      <Txt typography="t6" color={adaptive.grey600}>
        {text}
      </Txt>
    </View>
  );

  const renderBody = () => {
    if (!isSupported) return message("검색이 지원되지 않는 항목이에요");
    if (isTooShort) return message("두 글자 이상 입력해주세요");
    if (isError) return message("검색에 실패했어요. 잠시 후 다시 시도해주세요");
    // 이전 결과가 있으면 로딩 중에도 리스트 유지 (깜빡임 방지)
    if (isSearching && stations.length === 0) {
      return (
        <View style={styles.message}>
          <Loader size="medium" />
        </View>
      );
    }
    if (stations.length === 0)
      return message(`'${keyword}' 검색 결과가 없어요`);

    return stations.map((item) => {
      const id = getFavoriteId(item);

      if (item.type === "bus") {
        const station = item.data;
        return (
          <ListRow
            key={`bus-${station.stId}`}
            onPress={() => onPressStation(item)}
            left={<TransitIcon type="bus" />}
            contents={
              <ListRow.Texts
                type="2RowTypeE"
                top={station.arsId}
                topProps={{ color: adaptive.grey700 }}
                bottom={station.stNm}
                bottomProps={{ color: adaptive.grey800, fontWeight: "bold" }}
              />
            }
            right={
              <FavoriteButton
                active={isFavorite(id)}
                onToggle={() => onToggleFavorite(id)}
              />
            }
          />
        );
      }

      // 지하철 결과
      const subway = item.data;
      return (
        <ListRow
          key={`subway-${subway.statnId}`}
          onPress={() => onPressStation(item)}
          left={<TransitIcon type="subway" subwayNm={subway.subwayNm} />}
          contents={
            <ListRow.Texts
              type="2RowTypeE"
              top={subway.subwayNm}
              topProps={{ color: adaptive.grey700 }}
              bottom={`${subway.statnNm}역`}
              bottomProps={{ color: adaptive.grey800, fontWeight: "bold" }}
            />
          }
          right={
            <FavoriteButton
              active={isFavorite(id)}
              onToggle={() => onToggleFavorite(id)}
            />
          }
        />
      );
    });
  };

  return (
    <>
      <ListHeader
        title={
          <ListHeader.TitleParagraph color={adaptive.grey800}>
            검색 결과
          </ListHeader.TitleParagraph>
        }
      />
      {renderBody()}
    </>
  );
};

const styles = StyleSheet.create({
  message: {
    paddingVertical: 40,
    alignItems: "center",
  },
});
