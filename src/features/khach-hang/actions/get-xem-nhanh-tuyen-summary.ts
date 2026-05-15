'use server';

import { getKPSDS } from './get-kpsds';
import { getChoPho } from './get-cho-pho';

export interface SummaryCell {
  total: number;
  marketCount: number;
  details: Record<string, number>;
}

export interface SummaryRow {
  key: string;
  khuVuc: string;
  nvbh: string;
  tongKH: number;
  t2: SummaryCell;
  t3: SummaryCell;
  t4: SummaryCell;
  t5: SummaryCell;
  t6: SummaryCell;
  t7: SummaryCell;
  cn: SummaryCell;
}

export async function getXemNhanhTuyenSummary(): Promise<{ data: SummaryRow[], khuVucList: string[], error?: string }> {
  try {
    const [resKpsds, resChoPho] = await Promise.all([
      getKPSDS(),
      getChoPho()
    ]);

    if ('error' in resKpsds) throw new Error(resKpsds.error);
    if ('error' in resChoPho) throw new Error(resChoPho.error);

    const data = resKpsds.data;
    const cpMap: Record<string, string> = {};
    
    resChoPho.data.forEach(item => {
      cpMap[item.MA_KH] = item.TRENDUONG_TRONGCHO;
    });

    const groups: Record<string, any> = {};
    const days = ['t2', 't3', 't4', 't5', 't6', 't7', 'cn'];
    const dayMapping: Record<string, string> = { 'T2': 't2', 'T3': 't3', 'T4': 't4', 'T5': 't5', 'T6': 't6', 'T7': 't7', 'CN': 'cn' };

    data.forEach(r => {
      // Logic lọc F2 giống bản cũ (chỉ lấy v)
      const tanSuat = r.Tần_Suất || '';
      if (tanSuat.includes('F2') && !tanSuat.toLowerCase().includes('v')) return;

      const key = `${r.Khu_Vực}_${r.Mã_Tên_NVBH}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          khuVuc: r.Khu_Vực,
          nvbh: r.Mã_Tên_NVBH,
          khSet: new Set<string>(),
        };
        days.forEach(d => {
          groups[key][d] = { total: 0, marketCount: 0, details: {} as Record<string, number> };
        });
      }

      const g = groups[key];
      g.khSet.add(r.Mã_KH);

      const thuStr = r.Thứ || '';
      Object.entries(dayMapping).forEach(([label, dayKey]) => {
        if (thuStr.includes(label)) {
          g[dayKey].total++;
          g[dayKey].details[tanSuat] = (g[dayKey].details[tanSuat] || 0) + 1;
          
          const rawVal = cpMap[r.Mã_KH.trim()] || '';
          if (rawVal.toLowerCase().includes('trong chợ')) {
            g[dayKey].marketCount++;
          }
        }
      });
    });

    const summaryData = Object.values(groups).map(g => ({
      ...g,
      tongKH: g.khSet.size,
      khSet: undefined // Khong gui Set object xuong client
    })).sort((a, b) => (a.khuVuc || '').localeCompare(b.khuVuc || '') || (a.nvbh || '').localeCompare(b.nvbh || '')) as SummaryRow[];

    const khuVucList = Array.from(new Set(data.map(r => r.Khu_Vực))).filter(Boolean).sort();

    return { data: summaryData, khuVucList };

  } catch (err: any) {
    console.error('getXemNhanhTuyenSummary error:', err);
    return { data: [], khuVucList: [], error: err.message || 'Lỗi xử lý dữ liệu tổng hợp từ Server' };
  }
}
