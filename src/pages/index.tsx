import {
  Top,
  SegmentedControl,
  SearchField,
  Border,
  ListHeader,
  ListRow,
} from "@toss/tds-react-native";

import { useAdaptive } from "@toss/tds-react-native/private";
import { createRoute } from "@granite-js/react-native";
import React, { useState } from "react";
import { ScrollView } from "react-native";
import { FavoriteButton } from "../components/FavoriteButton";
import { StationSearchResults } from "../components/StationSearchResults";
import { TransitIcon } from "../components/TransitIcon";
import { useStationSearch, type SearchType } from "../hooks/useStationSearch";

export const Route = createRoute("/", {
  component: Page,
});

function Page() {
  const navigation = Route.useNavigation();
  const adaptive = useAdaptive();

  const [searchType, setSearchType] = useState<SearchType>("bus");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const search = useStationSearch(query, searchType);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRowPress = (_id: string) => {
    // TODO: 정류장/역 상세 화면으로 이동 (id 전달)
    navigation.navigate("/about");
  };

  return (
    <ScrollView>
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
          isFavorite={(id) => favorites.has(id)}
          onToggleFavorite={toggleFavorite}
          onPressStation={(item) =>
            handleRowPress(
              item.type === "bus"
                ? `bus-${item.data.stId}`
                : `subway-${item.data.statnId}`,
            )
          }
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
          <ListRow
            onPress={() => handleRowPress("subway-2-gangnam")}
            left={<TransitIcon type="subway" subwayNm="2호선" />}
            contents={
              <ListRow.Texts
                type="3RowTypeD"
                top="2호선"
                topProps={{ color: adaptive.grey700 }}
                middle="강남역"
                middleProps={{ color: adaptive.grey800, fontWeight: "bold" }}
                bottom="역삼역 방면"
                bottomProps={{ color: adaptive.grey600 }}
              />
            }
            right={
              <FavoriteButton
                active={favorites.has("subway-2-gangnam")}
                onToggle={() => toggleFavorite("subway-2-gangnam")}
              />
            }
          />
          <ListRow
            onPress={() => handleRowPress("bus-22518")}
            left={<TransitIcon type="bus" />}
            contents={
              <ListRow.Texts
                type="2RowTypeE"
                top="22518"
                topProps={{ color: adaptive.grey700 }}
                bottom="서래마을.서래글로벌빌리지센터"
                bottomProps={{ color: adaptive.grey800, fontWeight: "bold" }}
              />
            }
            right={
              <FavoriteButton
                active={favorites.has("bus-22518")}
                onToggle={() => toggleFavorite("bus-22518")}
              />
            }
          />
        </>
      )}
    </ScrollView>
  );
}
