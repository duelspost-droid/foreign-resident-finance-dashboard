export function getRegionId(sido: string, sigungu: string): string {
  return `${sido}-${sigungu}`.replace(/\s+/g, "-");
}

export const majorSido = [
  "서울특별시",
  "경기도",
  "인천광역시",
  "충청남도",
  "부산광역시",
  "대구광역시"
];
