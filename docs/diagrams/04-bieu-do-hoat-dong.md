' ============================================================
' CHƯƠNG 3. PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG
' 3.4. BIỂU ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM)
' ============================================================

' ============================================================
' 3.4.1. Chức năng Đăng ký tài khoản
' ============================================================
@startuml 3-4-1-dang-ky
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #E3F2FD
  BorderColor #1565C0
  ArrowColor #1565C0
  DiamondBackgroundColor #FFF9C4
  DiamondBorderColor #F57F17
  StartColor #4CAF50
  StopColor #F44336
}

|#FEFEFE **Người dùng**|
start
:Nhấn **"Đăng ký"**;
:Hiển thị form đăng ký;
:Enter thông tin (email, mật khẩu, họ tên);
:**Hệ thống** kiểm tra dữ liệu;
|#FFF9C4 **Hệ thống**|
if (Email đã tồn tại?) then (Đúng)
  :Thông báo lỗi "Email đã được sử dụng";
  stop
else (Không)
  :Lưu thông tin tài khoản mới vào CSDL;
  :Gửi email xác thực (OTP);
  |**Người dùng**|
  :Nhập mã OTP;
  |#FFF9C4 **Hệ thống**|
  if (Mã OTP đúng?) then (Sai)
    :Thông báo lỗi "Mã OTP không chính xác";
    stop
  else (Đúng)
    :Xác thực tài khoản trong CSDL;
    :Đăng ký thành công;
    |**Người dùng**|
    :Chuyển hướng đến Dashboard;
    stop
  endif
endif

@enduml

' ============================================================
' 3.4.2. Chức năng Đăng nhập
' ============================================================
@startuml 3-4-2-dang-nhap
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #E8F5E9
  BorderColor #2E7D32
  ArrowColor #2E7D32
  DiamondBackgroundColor #FFF9C4
  DiamondBorderColor #F57F17
  StartColor #4CAF50
  StopColor #F44336
}

|#FEFEFE **Người dùng**|
start
:Nhấn **"Đăng nhập"**;
:Hiển thị form đăng nhập;
|#FFF9C4 **Hệ thống**|
if (Đăng nhập bằng Google?) then (Có)
  |**Người dùng**|
  :Chọn **"Đăng nhập bằng Google"**;
  |#FFF9C4 **Hệ thống**|
  :Xác thực Google OAuth token;
  :Tìm hoặc tạo tài khoản trong CSDL;
else (Không - đăng nhập thường)
  |**Người dùng**|
  :Nhập **email** và **mật khẩu**;
  |#FFF9C4 **Hệ thống**|
  :Kiểm tra thông tin đăng nhập trong CSDL;
  if (Tài khoản không tồn tại?) then (Đúng)
    :Thông báo lỗi "Email không tồn tại";
    stop
  else (Tồn tại)
    :So sánh mật khẩu (bcrypt);
    if (Mật khẩu sai?) then (Đúng)
      :Thông báo lỗi "Sai mật khẩu";
      stop
    else (Đúng)
      :Tạo JWT access token và refresh token;
    endif
  endif
endif
|Hệ thống|
:Lưu token, cập nhật trạng thái đăng nhập;
| **Người dùng**|
:Đăng nhập thành công - chuyển đến Dashboard;
stop

@enduml

' ============================================================
' 3.4.3. Chức năng Tạo Khảo sát
' ============================================================
@startuml 3-4-3-tao-khao-sat
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #F3E5F5
  BorderColor #7B1FA2
  ArrowColor #7B1FA2
  DiamondBackgroundColor #FFF9C4
  DiamondBorderColor #F57F17
  StartColor #4CAF50
  StopColor #F44336
}

|#FEFEFE **Người tạo**|
start
:Chọn **"Tạo Khảo sát mới"**;
|#FFF9C4 **Hệ thống**|
:Hiển thị form tạo khảo sát;
| **Người tạo**|
:Nhập tiêu đề, mô tả, cấu hình;
|#FFF9C4 **Hệ thống**|
:Lưu khảo sát vào CSDL (trạng thái DRAFT);
|#FFF9C4 **Hệ thống**|
if (Người dùng chọn Lưu nháp?) then (Có)
  | **Người tạo**|
  :Quay về Dashboard;
  stop
else (Không - tiếp tục thêm câu hỏi)
  | **Người tạo**|
  :Thêm câu hỏi (loại, nội dung, tùy chọn);
  |#FFF9C4 **Hệ thống**|
  :Lưu câu hỏi vào CSDL;
  if (Người dùng chọn gợi ý AI?) then (Có)
    | **Người tạo**|
    :Nhấn **"Gợi ý bằng AI"**;
    |#FFF9C4 **Hệ thống**|
    :Gọi **Gemini AI** sinh câu hỏi;
    | **Người tạo**|
    :Duyệt và chọn câu hỏi phù hợp;
    |#FFF9C4 **Hệ thống**|
    :Lưu câu hỏi đã chọn vào CSDL;
  else (Không - nhập thủ công)
    | **Người tạo**|
    :Nhập nội dung câu hỏi;
  endif
  :Nhấn **"Hoàn tất"**;
  |#FFF9C4 **Hệ thống**|
  :Kiểm tra khảo sát hợp lệ;
  if (Khảo sát hợp lệ?) then (Không)
    :Thông báo lỗi validation;
    :Quay lại chỉnh sửa;
  else (Có)
    :Lưu tất cả thay đổi vào CSDL;
    | **Người tạo**|
    :Thông báo **tạo thành công**;
    stop
  endif
endif

@enduml

' ============================================================
' 3.4.4. Chức năng Quản lý Khảo sát
' ============================================================
@startuml 3-4-4-quan-ly-khao-sat
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #FFF3E0
  BorderColor #E65100
  ArrowColor #E65100
  DiamondBackgroundColor #FFF9C4
  DiamondBorderColor #F57F17
  StartColor #4CAF50
  StopColor #F44336
}

|#FEFEFE **Người tạo**|
start
:Truy cập **"Khảo sát của tôi"**;
|#FFF9C4 **Hệ thống**|
:Lấy danh sách khảo sát từ CSDL;
:Hiển thị danh sách khảo sát;
| **Người tạo**|
:Chọn một khảo sát;
|#FFF9C4 **Hệ thống**|
if (Hành động nào?) then (Chỉnh sửa)
  | **Người tạo**|
  :Nhấn **"Chỉnh sửa"**;
  |#FFF9C4 **Hệ thống**|
  :Mở trang thiết kế khảo sát;
  | **Người tạo**|
  :Cập nhật thông tin / câu hỏi;
  |#FFF9C4 **Hệ thống**|
  :Lưu thay đổi vào CSDL;
  :Thông báo cập nhật thành công;
else (Xuất bản)
  | **Người tạo**|
  :Nhấn **"Xuất bản"**;
  |#FFF9C4 **Hệ thống**|
  :Cập nhật trạng thái = **PUBLISHED**;
  :Gửi thông báo cho người được mời;
  :Thông báo xuất bản thành công;
else (Đóng khảo sát)
  | **Người tạo**|
  :Nhấn **"Đóng"**;
  |#FFF9C4 **Hệ thống**|
  :Cập nhật trạng thái = **CLOSED**;
  :Thông báo đã đóng khảo sát;
else (Xóa)
  | **Người tạo**|
  :Nhấn **"Xóa"**;
  |#FFF9C4 **Hệ thống**|
  :Hiển thị hộp xác nhận;
  | **Người tạo**|
  :Xác nhận xóa;
  |#FFF9C4 **Hệ thống**|
  :Xóa khảo sát và dữ liệu liên quan trong CSDL;
  :Thông báo xóa thành công;
else (Gia hạn)
  | **Người tạo**|
  :Nhấn **"Gia hạn"**;
  |#FFF9C4 **Hệ thống**|
  :Cập nhật ngày kết thúc trong CSDL;
  :Thông báo gia hạn thành công;
endif
stop

@enduml

' ============================================================
' 3.4.5. Chức năng Làm Khảo sát
' ============================================================
@startuml 3-4-5-lam-khao-sat
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #E0F2F1
  BorderColor #00695C
  ArrowColor #00695C
  DiamondBackgroundColor #FFF9C4
  DiamondBorderColor #F57F17
  StartColor #4CAF50
  StopColor #F44336
}

|#FEFEFE **Người trả lời**|
start
:Truy cập **link khảo sát**;
|#FFF9C4 **Hệ thống**|
:Kiểm tra khảo sát trong CSDL;
if (Khảo sát hết hạn?) then (Có)
  | **Người trả lời**|
  :Thông báo "Khảo sát đã kết thúc";
  stop
else (Không)
  if (Đạt số lượng phản hồi tối đa?) then (Có)
    | **Người trả lời**|
    :Thông báo "Khảo sát đã đạt giới hạn";
    stop
  else (Không)
    :Hiển thị trang giới thiệu khảo sát;
    | **Người trả lời**|
    :Nhấn **"Bắt đầu"**;
    |#FFF9C4 **Hệ thống**|
    :Tạo lượt trả lời mới (status = IN_PROGRESS);
    | **Người trả lời**|
    :Trả lời các câu hỏi;
    |#FFF9C4 **Hệ thống**|
    :Lưu tạm câu trả lời (auto-save);
    | **Người trả lời**|
    :Nhấn **"Tiếp theo"**;
    |#FFF9C4 **Hệ thống**|
    :Kiểm tra có câu hỏi tiếp theo không;
    while (Còn câu hỏi?) is (Có)
      | **Người trả lời**|
      :Trả lời câu hỏi;
      |#FFF9C4 **Hệ thống**|
      :Lưu tạm (auto-save);
      | **Người trả lời**|
      :Nhấn **"Tiếp theo"**;
    endwhile (Không - kết thúc)
    | **Người trả lời**|
    :Nhấn **"Nộp bài"**;
    |#FFF9C4 **Hệ thống**|
    :Cập nhật trạng thái = **COMPLETED**;
    :Gửi thông báo cho chủ khảo sát;
    | **Người trả lời**|
    :Hiển thị trang **cảm ơn**;
    stop
  endif
endif

@enduml

' ============================================================
' 3.4.6. Chức năng Xem Báo cáo Phân tích
' ============================================================
@startuml 3-4-6-xem-phan-tich
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #FFF8E1
  BorderColor #F57F17
  ArrowColor #F57F17
  DiamondBackgroundColor #FFF9C4
  DiamondBorderColor #F57F17
  StartColor #4CAF50
  StopColor #F44336
}

|#FEFEFE **Người tạo**|
start
:Chọn **"Xem Phân tích"**;
|#FFF9C4 **Hệ thống**|
:Lấy dữ liệu phản hồi từ CSDL;
:Tính toán các chỉ số thống kê;
:Hiển thị **Dashboard** phân tích;
| **Người tạo**|
:Chọn loại phân tích;
|#FFF9C4 **Hệ thống**|
if (Loại phân tích?) then (Tổng quan)
  :Tổng hợp dữ liệu từ CSDL;
  :Hiển thị biểu đồ tổng quan;
else (Theo câu hỏi)
  :Lấy câu trả lời theo từng câu hỏi;
  :Tính phân bố câu trả lời;
  :Hiển thị biểu đồ phân bố;
else (Xu hướng)
  :Lấy dữ liệu theo thời gian;
  :Tổng hợp theo ngày / tuần / tháng;
  :Hiển thị biểu đồ đường;
else (Cross-tabulation)
  :Chọn 2 câu hỏi để so sánh;
  :Tính bảng chéo trong CSDL;
  :Hiển thị bảng cross-tab;
else (Xuất CSV)
  :Tạo file CSV từ dữ liệu;
  :Tải file về máy người dùng;
endif
stop

@enduml

' ============================================================
' 3.4.7. Chức năng Quản lý Thông báo
' ============================================================
@startuml 3-4-7-quan-ly-thong-bao
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #FCE4EC
  BorderColor #AD1457
  ArrowColor #AD1457
  DiamondBackgroundColor #FFF9C4
  DiamondBorderColor #F57F17
  StartColor #4CAF50
  StopColor #F44336
}

|#FEFEFE **Người dùng**|
start

|#FEFEFE **Hệ thống** (nền)|
:Farp tạo thông báo mới;
:Thông báo cho người dùng;

|#FEFEFE **Người dùng**|
:Truy cập trang **Thông báo**;
|#FFF9C4 **Hệ thống**|
:Lấy danh sách thông báo từ CSDL;
:Hiển thị danh sách thông báo;
| **Người dùng**|
:Chọn thao tác trên thông báo;
|#FFF9C4 **Hệ thống**|
if (Thao tác?) then (Đánh dấu đã đọc)
  :Cập nhật is_read = true trong CSDL;
  :Cập nhật badge số thông báo chưa đọc;
else (Đánh dấu tất cả)
  :Cập nhật tất cả is_read = true;
  :Đặt badge về 0;
else (Xóa)
  :Xóa bản ghi thông báo trong CSDL;
  :Ẩn thông báo khỏi danh sách;
endif
stop

@enduml

' ============================================================
' 3.4.8. Chức năng Cập nhật Hồ sơ Người dùng
' ============================================================
@startuml 3-4-8-cap-nhat-ho-so
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #E8EAF6
  BorderColor #283593
  ArrowColor #283593
  DiamondBackgroundColor #FFF9C4
  DiamondBorderColor #F57F17
  StartColor #4CAF50
  StopColor #F44336
}

|#FEFEFE **Người dùng**|
start
:Truy cập trang **Hồ sơ**;
|#FFF9C4 **Hệ thống**|
:Lấy thông tin người dùng từ CSDL;
:Hiển thị thông tin hồ sơ;
| **Người dùng**|
:Chọn thao tác cập nhật;
|#FFF9C4 **Hệ thống**|
if (Thao tác?) then (Cập nhật thông tin)
  | **Người dùng**|
  :Nhấn **"Chỉnh sửa"**;
  :Nhập thông tin mới;
  |#FFF9C4 **Hệ thống**|
  :Validate dữ liệu;
  if (Dữ liệu hợp lệ?) then (Không)
    :Thông báo lỗi validation;
  else (Có)
    :Lưu thông tin mới vào CSDL;
    :Thông báo **cập nhật thành công**;
  endif
else (Đổi mật khẩu)
  | **Người dùng**|
  :Nhấn **"Đổi mật khẩu"**;
  :Nhập mật khẩu cũ và mới;
  |#FFF9C4 **Hệ thống**|
  :Xác minh mật khẩu cũ trong CSDL;
  if (Mật khẩu cũ đúng?) then (Không)
    :Thông báo lỗi "Mật khẩu cũ không đúng";
  else (Đúng)
    :Hash mật khẩu mới (bcrypt);
    :Cập nhật password_hash trong CSDL;
    :Thông báo **đổi thành công**;
  endif
else (Cập nhật avatar)
  | **Người dùng**|
  :Nhấn **"Thay đổi ảnh đại diện"**;
  :Upload hình ảnh mới;
  |#FFF9C4 **Hệ thống**|
  :Validate định dạng và kích thước file;
  :Upload lên **Cloudinary**;
  :Cập nhật avatar URL trong CSDL;
  :Hiển thị avatar mới;
endif
stop

@enduml

' ============================================================
' 3.4.9. Chức năng Quản lý Người dùng (Admin)
' ============================================================
@startuml 3-4-9-quan-ly-nguoi-dung-admin
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #FBE9E7
  BorderColor #BF360C
  ArrowColor #BF360C
  DiamondBackgroundColor #FFF9C4
  DiamondBorderColor #F57F17
  StartColor #4CAF50
  StopColor #F44336
}

|#FEFEFE **Quản trị viên**|
start
:Truy cập trang **Quản trị**;
|#FFF9C4 **Hệ thống**|
:Lấy dữ liệu thống kê từ CSDL;
:Hiển thị **Dashboard quản trị**;
| **Quản trị viên**|
:Chọn mục **"Quản lý Người dùng"**;
|#FFF9C4 **Hệ thống**|
:Lấy danh sách người dùng (phân trang);
:Hiển thị bảng danh sách người dùng;
| **Quản trị viên**|
:Chọn một người dùng;
|#FFF9C4 **Hệ thống**|
if (Hành động?) then (Khóa tài khoản)
  :Cập nhật is_active = false trong CSDL;
  :Thông báo tài khoản đã bị khóa;
else (Xóa tài khoản)
  :Hiển thị hộp xác nhận;
  | **Quản trị viên**|
  :Xác nhận xóa;
  |#FFF9C4 **Hệ thống**|
  :Xóa tài khoản (cascade: surveys, responses);
  :Thông báo đã xóa tài khoản;
endif
| **Quản trị viên**|
:Chọn mục **"Thống kê"**;
|#FFF9C4 **Hệ thống**|
:Lấy dữ liệu thống kê từ CSDL;
:Hiển thị biểu đồ thống kê;
stop

@enduml

' ============================================================
' 3.4.10. Chức năng Quản lý Câu hỏi
' ============================================================
@startuml 3-4-10-quan-ly-cau-hoi
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #E1F5FE
  BorderColor #0277BD
  ArrowColor #0277BD
  DiamondBackgroundColor #FFF9C4
  DiamondBorderColor #F57F17
  StartColor #4CAF50
  StopColor #F44336
}

|#FEFEFE **Người tạo**|
start
:Truy cập trang **thiết kế khảo sát**;
|#FFF9C4 **Hệ thống**|
:Lấy danh sách câu hỏi từ CSDL;
:Hiển thị danh sách câu hỏi;
| **Người tạo**|
:Chọn thao tác;
|#FFF9C4 **Hệ thống**|
if (Thao tác?) then (Thêm câu hỏi)
  | **Người tạo**|
  :Nhấn **"Thêm Câu hỏi"**;
  :Chọn loại câu hỏi, nhập nội dung;
  |#FFF9C4 **Hệ thống**|
  :Lưu câu hỏi vào CSDL;
  :Hiển thị câu hỏi trong danh sách;
else (Gợi ý AI)
  | **Người tạo**|
  :Nhấn **"Gợi ý bằng AI"**;
  |#FFF9C4 **Hệ thống**|
  :Gọi **Gemini AI** sinh câu hỏi;
  :Trả về danh sách câu hỏi gợi ý;
  | **Người tạo**|
  :Duyệt và chọn câu hỏi;
  |#FFF9C4 **Hệ thống**|
  :Lưu câu hỏi đã chọn vào CSDL;
else (Sửa câu hỏi)
  | **Người tạo**|
  :Nhấn **"Sửa"**;
  :Cập nhật nội dung / tùy chọn;
  |#FFF9C4 **Hệ thống**|
  :Lưu thay đổi vào CSDL;
  :Cập nhật hiển thị;
else (Xóa câu hỏi)
  | **Người tạo**|
  :Nhấn **"Xóa"**;
  |#FFF9C4 **Hệ thống**|
  :Hiển thị hộp xác nhận;
  | **Người tạo**|
  :Xác nhận;
  |#FFF9C4 **Hệ thống**|
  :Xóa câu hỏi và tùy chọn trong CSDL;
  :Xóa khỏi danh sách hiển thị;
else (Sắp xếp)
  | **Người tạo**|
  :Kéo thả để sắp xếp thứ tự;
  |#FFF9C4 **Hệ thống**|
  :Cập nhật order_index trong CSDL;
  :Cập nhật thứ tự hiển thị;
endif
stop

@enduml

' ============================================================
' 3.4.11. Chức năng Chia sẻ và Mời Khảo sát
' ============================================================
@startuml 3-4-11-chia-se-khao-sat
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #F1F8E9
  BorderColor #33691E
  ArrowColor #33691E
  DiamondBackgroundColor #FFF9C4
  DiamondBorderColor #F57F17
  StartColor #4CAF50
  StopColor #F44336
}

|#FEFEFE **Người tạo**|
start
:Chọn khảo sát → Nhấn **"Chia sẻ"**;
|#FFF9C4 **Hệ thống**|
:Hiển thị tùy chọn chia sẻ;
| **Người tạo**|
:Chọn phương thức chia sẻ;
|#FFF9C4 **Hệ thống**|
if (Phương thức?) then (Link chia sẻ)
  :Tạo access token trong CSDL;
  :Sinh URL chia sẻ;
  | **Người tạo**|
  :Sao chép link;
  |#FFF9C4 **Hệ thống**|
  :Thông báo đã sao chép;
else (Mời qua Email)
  | **Người tạo**|
  :Nhập danh sách email;
  :Nhấn **"Gửi lời mời"**;
  |#FFF9C4 **Hệ thống**|
  :Validate định dạng email;
  :Tạo bản ghi participant cho mỗi email;
  :Gửi email lời mời;
  :Thông báo đã gửi lời mời;
else (Mời hàng loạt)
  | **Người tạo**|
  :Upload file **CSV / Excel**;
  |#FFF9C4 **Hệ thống**|
  :Parse danh sách email từ file;
  | **Người tạo**|
  :Xác nhận danh sách;
  |#FFF9C4 **Hệ thống**|
  :Tạo participants hàng loạt trong CSDL;
  :Gửi email hàng loạt;
  :Thông báo đã gửi N lời mời;
endif
| **Người tạo**|
:Chọn tab **"Người được mời"**;
|#FFF9C4 **Hệ thống**|
:Lấy danh sách người được mời từ CSDL;
:Hiển thị danh sách và trạng thái;
| **Người tạo**|
:Xóa một người được mời;
|#FFF9C4 **Hệ thống**|
:Xóa bản ghi participant trong CSDL;
: Cập nhật danh sách;
stop

@enduml

' ============================================================
' 3.4.12. Chức năng AI Chat hỗ trợ tạo Khảo sát
' ============================================================
@startuml 3-4-12-ai-chat-ho-tro
skinparam backgroundColor #FEFEFE
skinparam activity {
  BackgroundColor #EDE7F6
  BorderColor #4527A0
  ArrowColor #4527A0
  DiamondBackgroundColor #FFF9C4
  DiamondBorderColor #F57F17
  StartColor #4CAF50
  StopColor #F44336
}

|#FEFEFE **Người tạo**|
start
:Mở **AI Chat Assistant**;
|#FFF9C4 **Hệ thống**|
:Hiển thị giao diện chat;
| **Người tạo**|
:Nhập tin nhắn / yêu cầu;
|#FFF9C4 **Hệ thống**|
:Gửi request đến **Gemini AI**;
if (Loại yêu cầu?) then (Hỏi đáp thông thường)
  :Gemini AI trả lời câu hỏi;
  :Trả về phản hồi text;
  | **Người tạo**|
  :Xem phản hồi;
else (Tạo câu hỏi)
  :Gemini AI sinh câu hỏi theo chủ đề;
  :Trả về danh sách câu hỏi;
  | **Người tạo**|
  :Duyệt và chọn câu hỏi;
  |#FFF9C4 **Hệ thống**|
  :Lưu câu hỏi đã chọn vào CSDL;
  :Thông báo đã thêm N câu hỏi;
else (Thiết kế khảo sát)
  :Gemini AI sinh cấu trúc khảo sát hoàn chỉnh;
  :Trả về sections, questions, options;
  | **Người tạo**|
  :Xem preview cấu trúc;
  :Xác nhận tạo;
  |#FFF9C4 **Hệ thống**|
  :Lưu khảo sát vào CSDL;
  :Thông báo khảo sát đã tạo thành công;
endif
| **Người tạo**|
:Tiếp tục trò chuyện hoặc đóng chat;
|#FFF9C4 **Hệ thống**|
:Lưu lịch sử trò chuyện;
stop

@enduml
