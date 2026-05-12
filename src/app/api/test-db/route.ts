import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query('SELECT TOP 1 * FROM ReportVBA_BP_KHUVUC');
    return NextResponse.json(res.recordset[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
