import { Asset } from "@toss/tds-react-native";
import React from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { getSubwayIconUrl } from "../services/subway";

export const BUS_ICON =
  "https://static.toss.im/2d-icons/emoji/png/4x/u1F68F.png";

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
