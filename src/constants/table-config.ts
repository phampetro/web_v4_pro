/**
 * Cấu hình kích thước cột chuẩn cho toàn hệ thống
 * Giúp đồng bộ giao diện và dễ dàng điều chỉnh tập trung
 */

export const TABLE_CONFIG = {
  // Cột đặc biệt
  COL_SELECT: 40,
  COL_STT: 50,

  // Thông tin định danh
  COL_MA_KH: 110,
  COL_TEN_KH: 150,
  COL_NVBH: 150,
  COL_NGUOI_DK: 100,

  // Thông tin địa lý & hành chính
  COL_KHU_VUC: 120,
  COL_DIA_CHI: 200,

  // Thông tin nghiệp vụ
  COL_THU: 60,
  COL_TAN_SUAT: 80,
  COL_LOAI_CP: 160, // Cột chọn Chợ/Phố

  // Trạng thái & Thời gian
  COL_TRANG_THAI: 120,
  COL_NGAY: 120,
  COL_NGAY_GIO: 160,

  // Khác
  COL_TRUNG_BAY: 100,
  COL_CHANGE_VALUE: 180, // Cột hiển thị thay đổi Cũ -> Mới
  COL_ARROW: 40,        // Cột mũi tên chuyển hướng
  COL_KHU_VUC_PIVOT: 80, // Cột Khu vực riêng cho bảng Xem nhanh
  COL_NVBH_PIVOT: 120,   // Cột NVBH riêng cho bảng Xem nhanh
  COL_THU_PIVOT: 50,    // Cột Thứ trong bảng xem nhanh (T2-T7)
  COL_CN_PIVOT: 50,     // Cột Chủ nhật trong bảng xem nhanh
  COL_TONG_KH: 50,      // Cột Tổng KH trong bảng xem nhanh

  // Chiều cao cuộn (Bắt buộc là số khi dùng Virtual Scrolling)
  SCROLL_Y_STANDARD: 550,
  SCROLL_Y_COMPACT: 550,
  SCROLL_Y_PIVOT: 550,
};

export const TABLE_SCROLL_X = {
  STANDARD: 1300,
  LARGE: 1500,
  X_LARGE: 1800,
  PIVOT: 800,
};
