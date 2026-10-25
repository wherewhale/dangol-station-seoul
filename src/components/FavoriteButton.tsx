import { Asset } from "@toss/tds-react-native";
import React from "react";
import { GestureResponderEvent, Pressable } from "react-native";
import { FAVORITE_ICON_OFF, FAVORITE_ICON_ON } from "../const/icons";

type Props = {
  active: boolean;
  onToggle: () => void;
  size?: number;
};

export const FavoriteButton = ({ active, onToggle, size = 24 }: Props) => {
  const handlePress = (e: GestureResponderEvent) => {
    // 부모 ListRow의 onPress로 이벤트가 전파되지 않도록 차단
    // (네이티브는 responder 시스템상 가장 안쪽 터처블이 이벤트를 가져가지만,
    //  react-native-web 등 버블링이 일어나는 환경까지 방어)
    e.stopPropagation();
    onToggle();
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={active ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <Asset.Image
        frameShape={{ width: size, height: size }}
        source={{ uri: active ? FAVORITE_ICON_ON : FAVORITE_ICON_OFF }}
      />
    </Pressable>
  );
};
