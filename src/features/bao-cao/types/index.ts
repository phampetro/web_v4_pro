import { z } from 'zod';

export const productSchema = z.object({
  MA_SPQD: z.string(),
  TEN_SPQD: z.string(),
  Username: z.string().optional(),
  Thu_tu_sap_xep: z.number().optional(),
});

export type Product = z.infer<typeof productSchema>;

export interface ProductConfigResponse {
  allProducts: Product[];
  userConfig: Product[];
}
