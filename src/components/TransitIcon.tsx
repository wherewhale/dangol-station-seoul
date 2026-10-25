import { Asset } from "@toss/tds-react-native";
import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { BUS_ICON, getSubwayIconUrl } from "../const/icons";

export { BUS_ICON };

export type TransitIconProps = (
  | {
      type: "bus";
      size?: number;
    }
  | {
      type: "subway";
      subwayNm?: string;
      iconUrl?: string;
      size?: number;
    }
) & {
  style?: StyleProp<ViewStyle>;
};

export const TransitIcon = (props: TransitIconProps) => {
  const size = props.size ?? 48;
  const uri =
    props.type === "bus"
      ? BUS_ICON
      : (props.iconUrl ?? getSubwayIconUrl(props.subwayNm ?? ""));

  return (
    <Asset.Image
      style={[{ marginRight: 16 }, props.style]}
      frameShape={{ width: size, height: size }}
      source={{ uri }}
    />
  );
};
