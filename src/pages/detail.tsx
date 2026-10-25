import { createRoute } from "@granite-js/react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { BottomBannerAd } from "../components/BottomBannerAd";
import { BusDetailView } from "../components/detail/BusDetailView";
import { SubwayDetailView } from "../components/detail/SubwayDetailView";

export type DetailParams = {
  type?: "bus" | "subway";
  arsId?: string;
  stNm?: string;
  subwayId?: string;
  subwayNm?: string;
  statnNm?: string;
};

export const Route = createRoute<DetailParams>("/detail", {
  component: Page,
});

function Page() {
  const params = Route.useParams();

  const isSubway =
    params?.type === "subway" ||
    Boolean(params?.subwayNm || params?.statnNm);

  return (
    <View style={styles.container}>
      {isSubway ? (
        <SubwayDetailView
          statnNm={params?.statnNm}
          subwayNm={params?.subwayNm}
          subwayId={params?.subwayId}
        />
      ) : (
        <BusDetailView arsId={params?.arsId} stNm={params?.stNm} />
      )}
      <BottomBannerAd />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Page;
