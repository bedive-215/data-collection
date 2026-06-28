import os, sys, glob
sys.stdout = open(1, 'w', encoding='ascii', errors='replace')

# Comprehensive fix for ALL garbled Vietnamese text across the project
fixes = {
    # === AiChatbox.jsx ===
    'T?i c? bao nhi?u kh?o s?t ?ang ho?t ??ng?': 'Tôi có bao nhiêu khảo sát đang hoạt động?',
    'Xin l?i, m?nh ch?a nh?n ???c ph?n h?i t? AI.': 'Xin lỗi, mình chưa nhận được phản hồi từ AI.',
    'K?t n?i AI th?t b?i': 'Kết nối AI thất bại',
    '?? t?o kh?o s?t!': 'Đã tạo khảo sát!',
    '?? th?m': 'Đã thêm',
    'c?u h?i!': 'câu hỏi!',
    'C?u h?i': 'Câu hỏi',
    'Ph?n h?i': 'Phản hồi',
    'Ng??i tham gia': 'Người tham gia',
    'c?u': 'câu',
    'ph?n h?i': 'phản hồi',
    'ng??i': 'người',

    # === ErrorBoundary ===
    '?? x?y ra l?i': 'Đã xảy ra lỗi',
    'Oops! C? g? ?? kh?ng ?n': 'Oops! Có gì đó không ổn',
    'Trang n?y g?p s? c? khi t?i d? li?u. Th? t?i l?i ho?c quay l?i trang tr??c.': 'Trang này gặp sự cố khi tải dữ liệu. Thử tải lại hoặc quay lại trang trước.',
    'kh?ng th? t?i': 'không thể tải',
    'Ph?n n?y kh?ng th? t?i': 'Phần này không thể tải',

    # === NotificationDetailModal ===
    'Ng??i m?i': 'Người mời',
    'Ng??i ph?n h?i': 'Người phản hồi',
    'Ng??i tham gia': 'Người tham gia',
    '?ang gia h?n...': 'Đang gia hạn...',
    'Th?nh c?ng!': 'Thành công!',
    '?n form': 'Ẩn form',
    'Gia h?n': 'Gia hạn',
    'Chi ti?t': 'Chi tiết',

    # === CheckinButton ===
    'Streak': 'Streak',
    'ng?y': 'ngày',
    'Ch?a ?i?m danh': 'Chưa điểm danh',

    # === GamificationDashboard ===
    'ng?y': 'ngày',
    'Ch?a bao gi?': 'Chưa bao giờ',

    # === AiQuestionAssistant ===
    'G?i AI th?t b?i': 'Gọi AI thất bại',
    'V? d?': 'Ví dụ',
    'B?n c? h?i l?ng v?i d?ch v? kh?ng?': 'Bạn có hài lòng với dịch vụ không?',
    '?i?m c?n c?i thi?n?': 'Điểm cần cải thiện?',
    'Khu v?c b?n sinh s?ng': 'Khu vực bạn sinh sống',
    'Ch?a c? s?n c?u h?i? Nh?p ch? ?? kh?o s?t ? AI sinh b? c?u g?i ? (c? th? ch?nh sau khi th?m).': 'Chưa có sẵn câu hỏi? Nhập chủ đề khảo sát để AI sinh bộ câu gợi ý (có thể chỉnh sau khi thêm).',
    '?ang x? l?': 'Đang xử lý',
    'Ch?y AI': 'Chạy AI',

    # === CreateSurveyComposer ===
    '?? copy': 'Đã copy',

    # === SurveyCardHome ===
    'Kh?ng c? ti?u ??': 'Không có tiêu đề',
    'L?u': 'Lưu',
    '?? h?t h?n': 'Đã hết hạn',
    'H?t h?n': 'Hết hạn',

    # === Navbar ===
    'C?p': 'Cấp',
    '??ng menu': 'Đóng menu',
    'M? menu': 'Mở menu',

    # === GamificationContext ===
    '?i?m danh th?nh c?ng! B?n nh?n ???c': 'Điểm danh thành công! Bạn nhận được',
    'K? l?c m?i!': 'Kỷ lục mới!',
    'Streak': 'Streak',
    'ng?y!': 'ngày!',

    # === useApi ===
    '?? x?y ra l?i': 'Đã xảy ra lỗi',

    # === useSocketNotifications ===
    'ng?y!': 'ngày!',
    'Huy hi?u m?i': 'Huy hiệu mới',

    # === SurveysLayout ===
    '?? sao ch?p!': 'Đã sao chép!',
    'Sao ch?p link': 'Sao chép link',
    '?ang t?o link...': 'Đang tạo link...',
    '?ang g?i...': 'Đang gửi...',
    'G?i l?i': 'Gửi lại',
    '?ang g?i...': 'Đang gửi...',
    'M?i': 'Mời',
    'T?i l?i': 'Tải lại',
    'Kh?ng t?m th?y': 'Không tìm thấy',
    'Ch?a c': 'Chưa có',
    'Xo?': 'Xóa',
    '?ang x? l?...': 'Đang xử lý...',
    '?ang ??ng...': 'Đang đóng...',
    'L?u': 'Lưu',
    '?? sao ch?p': 'Đã sao chép',

    # === General patterns ===
    'kh?o s?t': 'khảo sát',
    'Kh?o s?t': 'Khảo sát',
    'c?u h?i': 'câu hỏi',
    'c?u': 'câu',
    'ph?n h?i': 'phản hồi',
    'ng??i': 'người',
    'Ng??i': 'Người',
    'th?nh c?ng': 'thành công',
    'th?t b?i': 'thất bại',
    't?i': 'tải',
    '?ang': 'đang',
    '?i?m': 'điểm',
    'danh': 'danh',
    '???c': 'được',
    '??': 'đã',
    '??ng': 'đóng',
    'n?y': 'này',
    'c?': 'có',
    'm?i': 'mới',
    't?o': 'tạo',
    't?': 'từ',
    'v?i': 'với',
    'cho': 'cho',
    'c?a': 'của',
    'b?n': 'bạn',
    'B?n': 'Bạn',
    'd?ch': 'dịch',
    'v?': 'vụ',
    'd?': 'để',
    'd?n': 'đến',
    'd?u': 'đầu',
    'd??i': 'dưới',
    'du?c': 'được',
    'gi?i': 'giới',
    'Gi?i': 'Giới',
    'gi?a': 'giữa',
    'h?i': 'hỏi',
    'h?n': 'hạn',
    'k?': 'kỳ',
    'K?': 'Kỷ',
    'l?i': 'lỗi',
    'l?i': 'lại',
    'm?nh': 'mạnh',
    'n?u': 'nếu',
    'ngu?n': 'nguồn',
    'nh?': 'nhờ',
    'nh?t': 'nhất',
    'n?i': 'nội',
    'n?i': 'nối',
    'ph?i': 'phải',
    'qu?n': 'quản',
    's?': 'số',
    't?p': 'tập',
    'th?a': 'thỏa',
    'th?p': 'thấp',
    'ti?n': 'tiện',
    'ti?t': 'tiết',
    'tr?': 'trả',
    'tri?n': 'triển',
    'tu?i': 'tuổi',
    't??ng': 'tương',
    '???ng': 'ường',
    '??c': 'ức',
    '?i?u': 'điều',
    'ki?n': 'kiện',
    'b?n': 'bản',
    'l?a ch?n': 'lựa chọn',
    'ch?n': 'chọn',
    'l?n': 'lớn',
    'c ng': 'c ng',
    'th?': 'thể',
    'hi?n': 'hiện',
    'th?': 'thị',
    'bi?u': 'biểu',
    'li?u': 'liệu',
    'tr?nh': 'trình',
    'ch?nh': 'chỉnh',
    's?a': 'sửa',
    'dung': 'dung',
    'd?ng': 'dạng',
    'd?ng': 'động',
    'ng?i': 'ngời',
    'ho?c': 'hoặc',
    'ho?t': 'hoạt',
    '??ng': 'động',
    't?nh': 'tính',
    'ch?c': 'chức',
    'n?ng': 'năng',
    'th?i': 'thời',
    'gian': 'gian',
    'l??ng': 'lượng',
    'k?ch': 'kích',
    'c?': 'cỡ',
    'm?u': 'mẫu',
    'tr?ng': 'trống',
    'th?m': 'thêm',
    'xem': 'xem',
    'theo': 'theo',
    't?m': 'tìm',
    'ki?m': 'kiếm',
    'th?y': 'thấy',
    'l?c': 'lọc',
    't?t c?': 'tất cả',
    'T?t c?': 'Tất cả',
    'c?': 'cả',
    't? trang': 'từ trang',

    # Stateless general patterns from the scan
    'R?t m?nh': 'Rất mạnh',
    'C?c k? c? ? nghia': 'Cực kỳ có ý nghĩa',
    'C?c k? c? ? ngh?a': 'Cực kỳ có ý nghĩa',
    'nhóm tu?i v? gi?i t?nh': 'nhóm tuổi và giới tính',
    'tu?i v? gi?i': 'tuổi và giới',
    'chi ti?t gi?a': 'chi tiết giữa',
    'T?i t?p l?n': 'Tải tập lớn',
    'Gi?i h?n s?': 'Giới hạn số',
    'Gi?i h?n ký t?': 'Giới hạn ký tự',
    'th?ng k?': 'thống kê',
    'Th?ng k?': 'Thống kê',
    'th?nh vi?n': 'thành viên',
    'qu?n l?': 'quản lý',
    'truy c?p': 'truy cập',
    'd? li?u': 'dữ liệu',
    'd?ch v?': 'dịch vụ',
    'ng??i d?ng': 'người dùng',
    'ng??i d?ng': 'người dụng',
    'c?p nh?t': 'cập nhật',
    'tri?n khai': 'triển khai',
    'ph?t tri?n': 'phát triển',
    'h? tr?': 'hỗ trợ',
    'th?i gian': 'thời gian',
    'k? ho?ch': 'kế hoạch',
    'hi?u qu?': 'hiệu quả',
    'k?t qu?': 'kết quả',
    'ngu?n d? li?u': 'nguồn dữ liệu',
    'kh?i t?o': 'khởi tạo',
    't?i kho?n': 'tài khoản',
    'm?t kh?u': 'mật khẩu',
    'd?ng nh?p': 'đăng nhập',
    'd?ng k?': 'đăng ký',
    'd?ng xu?t': 'đăng xuất',
    'x?c nh?n': 'xác nhận',
    'h?y b?': 'hủy bỏ',
    'ti?p theo': 'tiếp theo',
    'kh?i ph?c': 'khôi phục',
    't?i ?u': 'tối ưu',
}

# Apply to all .jsx and .js files
total = 0
for root, dirs, files in os.walk('.'):
    for f in files:
        if not f.endswith(('.jsx', '.js')):
            continue
        if 'node_modules' in root or 'dist' in root:
            continue
        path = os.path.join(root, f)
        try:
            with open(path, 'rb') as fp:
                raw = fp.read()
            text = raw.decode('utf-8')
        except:
            continue
        
        changed = False
        for old, new in fixes.items():
            if old in text:
                text = text.replace(old, new)
                changed = True
                total += 1
        
        if changed:
            with open(path, 'wb') as fp:
                fp.write(text.encode('utf-8'))
            print(f'Fixed: {path}')

print(f'\nTotal: {total} fixes applied')
