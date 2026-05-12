import { z } from 'zod';

export const chinhtuyenRecordSchema = z.object({
  ID: z.number(),
  Khu_vuc: z.string(),
  Ma_KH: z.string(),
  Ten_KH: z.string(),
  DC: z.string(),
  Ma_ten_nvbh_CU: z.string(),
  Thu_CU: z.string(),
  Tan_suat_CU: z.string(),
  Ma_ten_nvbh_MOI: z.string(),
  Thu_MOI: z.string(),
  Tan_suat_MOI: z.string(),
  Trang_thai_duyet: z.string(),
  Ngay_dang_ky: z.string(),
  Nguoi_dang_ky: z.string().nullable(),
  Ngay_duyet: z.string().nullable(),
  Nguoi_duyet: z.string().nullable(),
});

export type ChinhtuyenRecord = z.infer<typeof chinhtuyenRecordSchema>;

export interface ChinhtuyenResponse {
  data: ChinhtuyenRecord[];
}
