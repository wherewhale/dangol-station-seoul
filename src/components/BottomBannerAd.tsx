import {
  InlineAd,
  type BannerSlotErrorPayload,
  type BannerSlotEventPayload,
} from "@apps-in-toss/framework";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ENV } from "../env";

type Props = {
  adGroupId?: string;
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * 광고 로드 또는 렌더링 중 오류 발생 시 전체 화면이 터지지 않도록 보호하는 Error Boundary
 */
class AdErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[BottomBannerAd] 에러 캐치:", error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

/**
 * Apps in Toss 하단 배너 광고 컴포넌트
 * - impressFallbackOnMount: true 필수! (IOScrollView 외부/하단 고정 뷰에서 ImpressionArea의 IOProviderMissingError 크래시 방지)
 */
export const BottomBannerAd = ({
  adGroupId = ENV.BANNER_AD_GROUP_ID,
}: Props) => {
  const handleRendered = (_payload: BannerSlotEventPayload) => {
    console.log("[BottomBannerAd] 렌더링 완료:", _payload);
  };

  const handleFailedToRender = (err: BannerSlotErrorPayload) => {
    console.warn("[BottomBannerAd] 렌더링 실패:", err);
  };

  const handleNoFill = () => {
    console.log("[BottomBannerAd] NoFill (채울 광고 없음)");
  };

  if (!adGroupId || adGroupId === "your-banner-ad-group-id") {
    return null;
  }

  return (
    <AdErrorBoundary>
      <View style={styles.container}>
        <InlineAd
          adGroupId={adGroupId}
          theme="auto"
          tone="blackAndWhite"
          variant="expanded"
          impressFallbackOnMount={true}
          onAdRendered={handleRendered}
          onAdFailedToRender={handleFailedToRender}
          onNoFill={handleNoFill}
        />
      </View>
    </AdErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
});
