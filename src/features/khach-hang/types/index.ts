import { z } from 'zod';

export const khRecordSchema = z.object({
  Tên_Miền: z.string(),
  Tên_Vùng: z.string(),
  Khu_Vực: z.string(),
  Mã_NPP: z.string(),
  Tên_NPP: z.string(),
  Mã_Tên_NVBH: z.string(),
  Mã_KH: z.string(),
  Tên_KH: z.string(),
  Địa_Chỉ: z.string(),
  Tần_Suất: z.string(),
  Thứ: z.string(),
  Ngày_ĐH_Cuối: z.string().nullable(),
  Trưng_Bày: z.string().nullable(),
});

export type KHRecord = z.infer<typeof khRecordSchema>;

export interface KPSDSResponse {
  data: KHRecord[];
  ngayUpdate: string | null;
}

export const tamNgungRecordSchema = z.object({
  ID: z.number(),
  Khu_vuc: z.string(),
  Ma_ten_nvbh: z.string(),
  Ma_KH: z.string(),
  Ten_KH: z.string(),
  DC: z.string(),
  Thu: z.string(),
  Tan_suat: z.string(),
  Trang_thai_duyet: z.string(),
  Ngay_dang_ky: z.string(),
  Nguoi_dang_ky: z.string().nullable(),
  Ngay_duyet: z.string().nullable(),
  Nguoi_duyet: z.string().nullable(),
});

export type TamNgungRecord = z.infer<typeof tamNgungRecordSchema>;

export interface TamNgungResponse {
  data: TamNgungRecord[];
  ngayUpdate: string | null;
}
