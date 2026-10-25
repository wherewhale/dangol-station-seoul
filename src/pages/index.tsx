import {
  Top,
  SegmentedControl,
  SearchField,
  Border,
  ListHeader,
  ListRow,
  Txt,
} from "@toss/tds-react-native";

import { useAdaptive } from "@toss/tds-react-native/private";
import { createRoute } from "@granite-js/react-native";
import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { BottomBannerAd } from "../components/BottomBannerAd";
import { FavoriteButton } from "../components/FavoriteButton";
import { StationSearchResults } from "../components/StationSearchResults";
import { TransitIcon } from "../components/TransitIcon";
import { useFavorites, stationItemToFavorite } from "../hooks/useFavorites";
import {
  useStationSearch,
  type SearchType,
  type StationItem,
} from "../hooks/useStationSearch";

export const Route = createRoute("/", {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  const adaptive = useAdaptive();

  const [searchType, setSearchType] = useState<SearchType>("bus");
  const [query, setQuery] = useState("");
  const { favorites, isFavorite, toggleFavorite, removeFavorite } =
    useFavorites();

  const search = useStationSearch(query, searchType);

  const handleStationPress = (item: StationItem) => {
    if (item.type === "bus") {
      navigation.navigate("/detail", {
        type: "bus",
        arsId: item.data.arsId,
        stNm: item.data.stNm,
      });
    } else {
      navigation.navigate("/detail", {
        type: "subway",
        subwayId: item.data.subwayId,
        subwayNm: item.data.subwayNm,
        statnNm: item.data.statnNm,
      });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll}>
        <Top
          title={
            <Top.TitleParagraph color={adaptive.grey900}>
              서울 정류장을 검색하고, 도착 정보를 바로 확인해요
            </Top.TitleParagraph>
          }
          lowerGap={16}
        />
        <SegmentedControl.Root
          value={searchType}
          name="SegmentedControl"
          onChange={(value) => {
            setSearchType(value as SearchType);
          }}
        >
          <SegmentedControl.Item value="bus">버스</SegmentedControl.Item>
          <SegmentedControl.Item value="subway">지하철</SegmentedControl.Item>
        </SegmentedControl.Root>

        <SearchField
          placeholder={`${searchType === "bus" ? "정류장" : "역"} 이름을 입력해주세요`}
          hasClearButton={true}
          value={query}
          onChange={(e) => setQuery(e.nativeEvent.text)}
          style={{
            padding: 24,
          }}
        />
        <Border type="height16" />
        {search.isActive ? (
          <StationSearchResults
            keyword={search.keyword}
            stations={search.stations}
            isSupported={search.isSupported}
            isTooShort={search.isTooShort}
            isSearching={search.isSearching}
            isError={search.isError}
            isFavorite={isFavorite}
            onToggleFavorite={(item) =>
              toggleFavorite(stationItemToFavorite(item))
            }
            onPressStation={handleStationPress}
          />
        ) : (
          <>
            <ListHeader
              title={
                <ListHeader.TitleParagraph color={adaptive.grey800}>
                  즐겨찾기
                </ListHeader.TitleParagraph>
              }
            />
            {favorites.length === 0 ? (
              <View style={{ paddingVertical: 48, alignItems: "center" }}>
                <Txt typography="t6" color={adaptive.grey600}>
                  자주 찾는 정류소나 지하철역을 즐겨찾기 해보세요
                </Txt>
              </View>
            ) : (
              favorites.map((fav) => {
                if (fav.type === "bus") {
                  return (
                    <ListRow
                      key={fav.id}
                      onPress={() =>
                        navigation.navigate("/detail", {
                          type: "bus",
                          arsId: fav.arsId,
                          stNm: fav.stNm,
                        })
                      }
                      left={<TransitIcon type="bus" />}
                      contents={
                        <ListRow.Texts
                          type="2RowTypeE"
                          top={fav.arsId}
                          topProps={{ color: adaptive.grey700 }}
                          bottom={fav.stNm}
                          bottomProps={{
                            color: adaptive.grey800,
                            fontWeight: "bold",
                          }}
                        />
                      }
                      right={
                        <FavoriteButton
                          active={true}
                          onToggle={() => removeFavorite(fav.id)}
                        />
                      }
                    />
                  );
                }

                return (
                  <ListRow
                    key={fav.id}
                    onPress={() =>
                      navigation.navigate("/detail", {
                        type: "subway",
                        subwayId: fav.subwayId,
                        subwayNm: fav.subwayNm,
                        statnNm: fav.statnNm,
                      })
                    }
                    left={<TransitIcon type="subway" subwayNm={fav.subwayNm} />}
                    contents={
                      <ListRow.Texts
                        type="2RowTypeE"
                        top={fav.subwayNm}
                        topProps={{ color: adaptive.grey700 }}
                        bottom={`${fav.statnNm}역`}
                        bottomProps={{
                          color: adaptive.grey800,
                          fontWeight: "bold",
                        }}
                      />
                    }
                    right={
                      <FavoriteButton
                        active={true}
                        onToggle={() => removeFavorite(fav.id)}
                      />
                    }
                  />
                );
              })
            )}
          </>
        )}
      </ScrollView>
      <BottomBannerAd />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
});
