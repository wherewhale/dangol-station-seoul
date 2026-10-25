/**
 * 대중교통 및 앱 UI 공통 아이콘 상수 모음
 */

export const BUS_ICON =
  "https://static.toss.im/2d-icons/emoji/png/4x/u1F68F.png";

export const DEFAULT_SUBWAY_ICON =
  "https://static.toss.im/2d-icons/emoji/png/4x/u1F687.png";

/** 호선 번호별 직접 이미지(PNG) URL 매핑 */
export const SUBWAY_LINE_ICON_MAP: Record<string, string> = {
  "1호선":
    "https://i.ibb.co/jZ6ymj0K/sc-CU-nc-X1xn-Gy-VOBc-A0cmea-J13d-JT3z-Que-Sx7cwl-LSL07-F-Xs-PCsba-Kb-Qf-VMft3vf-M-CPhu-Cx-KCQZmf-TJa.png",
  "2호선":
    "https://i.ibb.co/pvwD4R5Z/HKT-xhx-SCZ-xma-MZLj-GUDssg-LEEGBvs4l-U7-CPLhs-T8f-Ga-ZGDUA4-UDo-UOhk-NFgv-m2g-XWk-F63m-FVHFddmj-Sl-DC.png",
  "3호선":
    "https://i.ibb.co/RGPfMdm3/N467-Hp-R-ROz-Ur-SQT65-Gr-Az-USZ-TRQq-K-QTt70w-EId-ORf-QLk-YFutt-Wry-RJrn6-M5-EUDPZgxk-L-J-MRVAqbn4-HDctw.png",
  "4호선":
    "https://i.ibb.co/wNPqMctz/Inz-UOAx-XTwtz-QSpwutnt-VCd-Yz-OTIHJz-KGU6-AQAu8-Cs6h-G1-Ug-IV-ic-XUx-VRSv-Retaec8f-PGMRFmq-VDdic-ZH69-B.png",
  "5호선":
    "https://i.ibb.co/PG7wYQG8/u6-UXhy-Owo-Koc-P7aw-Xd-QCr-M04x-PWBw-CB-3-W2-SZwl-Jr-Fsf-YGjdxb9l-Zqjp-Ih-Hla68-U1sn-Llu3-ZY0b-FKccw-X.png",
  "6호선":
    "https://i.ibb.co/YTkhqYz6/37as-R2f-CZu-Bp5g-C7i-2bb282-VXXGf-FQMQm-ND-5c-Q0w1-Se9-8-LCYym-TS2z-Bnkr-Bn-KLPGW8t-Iataqslg-R4-V7-Hu-E3.png",
  "7호선":
    "https://i.ibb.co/W4zFZjz4/5-To-KIvk-Il-Rw-G2-RUa-D2-Lwo-Wz15zqcp-JL2-Ce3-Ha-Ql-Pg-ZCow7hp-Ys-Qc-Gv-U-ko-Fy-HRt-K-4-XMv-VQdv-Ge-O-xbu.png",
  "8호선":
    "https://i.ibb.co/ns3J1WBq/WVj-YFZc-82up-Afw-Nkj-Cicka-2sd5bxs-Fd-Ubh-T0-NRn-Hzo-Nlz-XNMjy-Ua-Pthgg-Xpdsb-Ng-Fg-CD9-FPgd0-JCFZRod.png",
  "9호선":
    "https://i.ibb.co/Xx8NWJJZ/x-o-DBh-JQ4abwube-AGXq-RXfv-Dnce-N1i-C7w9wvisa-Ltwkc6g-M5dl-EZRFAGvz-Bl-CJuw23-YPYu-YTGvi-Je-Nj-U47c.png",
  우이신설선:
    "https://i.ibb.co/KczyxtY6/p5r-Scho8s-Sgvau-Xl-B4-Vae-Fhz-Oaz-ZVa-Uev-RXtrin-Gfo9-Hnzrlo16g-PNGD7-BQW0-Q3-Qy-Us-EBqj-W7-So-JMQCg-2-X23.png",
  신림선:
    "https://i.ibb.co/9HvGD8gp/Gplt38f-X4-Kl4zv7lln3-Li3jf-K7m7v-WB9zh-Z5-y-Ucy-TXz2jqc-Vkoe9v-Uu-As-VJwfhwh-RUGqfa-Ykpu-S86-UTDbww-ZV.png",
};

/** 호선명에 따른 아이콘 URL 반환 */
export const getSubwayIconUrl = (subwayNm: string): string => {
  return SUBWAY_LINE_ICON_MAP[subwayNm] ?? DEFAULT_SUBWAY_ICON;
};

/** 즐겨찾기 별 아이콘 */
export const FAVORITE_ICON_OFF =
  "https://static.toss.im/2d-icons/emoji/png/4x/uE0062.png";
export const FAVORITE_ICON_ON =
  "https://static.toss.im/2d-icons/emoji/png/4x/u2B50.png";
