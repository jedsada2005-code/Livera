export type NvlPeriod = '6m' | '1y' | 'all';
export type NvlSeries = { labels: string[]; values: number[] };

export const nvlCurrent = 3_200_000;
export const nvlTarget = 8_000_000;
export const nvlProgress = Math.round(nvlCurrent / nvlTarget * 100);
export const nvlSeries: Record<NvlPeriod, NvlSeries> = {
  '6m': { labels: ['มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.'], values: [2_450_000, 2_580_000, 2_720_000, 2_850_000, 3_020_000, 3_200_000] },
  '1y': { labels: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.'], values: [1_800_000, 1_980_000, 2_120_000, 2_290_000, 2_410_000, 2_520_000, 2_650_000, 2_760_000, 2_920_000, 3_040_000, 3_200_000] },
  all: { labels: ['2562', '2563', '2564', '2565', '2566', '2567', '2568', '2569'], values: [720_000, 930_000, 1_180_000, 1_520_000, 1_920_000, 2_360_000, 2_780_000, 3_200_000] },
};
