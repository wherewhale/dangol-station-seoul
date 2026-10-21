import { Asset, ListHeader, ListRow } from "@toss/tds-react-native";
import { useAdaptive } from "@toss/tds-react-native/private";

export const RecentSearchList = () => {
  const adaptive = useAdaptive();

  return (
    <>
      <ListHeader
        title={
          <ListHeader.TitleParagraph color={adaptive.grey800}>
            최근 검색어
          </ListHeader.TitleParagraph>
        }
      />
      <ListRow
        left={
          <>
            <Asset.Image
              frameShape={{ height: 54 }}
              backgroundColor={adaptive.greyOpacity100}
              source={{
                uri: "https://static.toss.im/2d-icons/emoji/png/4x/u1F7E2.png",
              }}
            />
          </>
        }
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
      />
      <ListRow
        left={
          <>
            <Asset.Image
              frameShape={{ height: 54 }}
              backgroundColor={adaptive.greyOpacity100}
              source={{
                uri: "https://static.toss.im/2d-icons/emoji/png/4x/u1F534.png",
              }}
            />
          </>
        }
        contents={
          <ListRow.Texts
            type="3RowTypeD"
            top="신분당선"
            topProps={{ color: adaptive.grey700 }}
            middle="강남역"
            middleProps={{ color: adaptive.grey800, fontWeight: "bold" }}
            bottom="어쩌구 방면"
            bottomProps={{ color: adaptive.grey600 }}
          />
        }
      />
    </>
  );
};
