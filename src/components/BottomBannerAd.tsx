import {
  InlineAd,
  type BannerSlotErrorPayload,
  type BannerSlotEventPayload,
} from "@apps-in-toss/framework";
import { Txt } from "@toss/tds-react-native";
import { useAdaptive } from "@toss/tds-react-native/private";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ENV } from "../env";

type Props = {
  adGroupId?: string;
};

/**
 * Apps in Toss 하단 배너 광고 컴포넌트
 * - 위치: 화면 하단 (Bottom)
 * - 설정: Theme=Auto, Tone=BlackAndWhite, Variant=Expanded
 * - 실제 Toss 앱 내에서만 네이티브 광고가 렌더링되며,
 *   개발/웹 환경에서는 위치 및 동작 확인을 위한 테스트 배너가 표시됩니다.
 */
export const BottomBannerAd = ({
  adGroupId = ENV.BANNER_AD_GROUP_ID,
}: Props) => {
  const adaptive = useAdaptive();
  const [isRendered, setIsRendered] = useState(false);
  const [isLoadFailed, setIsLoadFailed] = useState(false);

  const handleRendered = (_payload: BannerSlotEventPayload) => {
    setIsRendered(true);
    setIsLoadFailed(false);
    console.log("[BottomBannerAd] 렌더링 완료:", _payload);
  };

  const handleFailedToRender = (err: BannerSlotErrorPayload) => {
    setIsLoadFailed(true);
    console.warn("[BottomBannerAd] 렌더링 실패:", err);
  };

  const handleNoFill = () => {
    setIsLoadFailed(true);
    console.log("[BottomBannerAd] NoFill (채울 광고 없음)");
  };

  return (
    <View style={[styles.container, { backgroundColor: adaptive.background }]}>
      <InlineAd
        adGroupId={adGroupId}
        theme="auto"
        tone="blackAndWhite"
        variant="expanded"
        onAdRendered={handleRendered}
        onAdFailedToRender={handleFailedToRender}
        onNoFill={handleNoFill}
      />

      {/* 개발 모드 또는 광고 렌더 미지원(웹/시뮬레이터) 환경 테스트 안내 UI */}
      {!isRendered && (
        <View
          style={[
            styles.testBanner,
            {
              backgroundColor: adaptive.grey100,
              borderColor: adaptive.grey200,
            },
          ]}
        >
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.adBadge,
                { backgroundColor: adaptive.grey300 },
              ]}
            >
              <Txt typography="t7" color={adaptive.grey700} style={styles.badgeText}>
                AD
              </Txt>
            </View>
            <Txt typography="t6" color={adaptive.grey800} style={styles.testTitle}>
              [테스트] Toss 하단 배너 광고 영역
            </Txt>
          </View>
          <Txt typography="t7" color={adaptive.grey500}>
            {isLoadFailed
              ? `Toss 앱 실기기 배포 시 실제 광고가 렌더링돼요 (ID: ${adGroupId})`
              : `광고를 불러오는 중이에요 (ID: ${adGroupId})`}
          </Txt>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
  },
  testBanner: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  adBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  testTitle: {
    fontWeight: "600",
  },
});
