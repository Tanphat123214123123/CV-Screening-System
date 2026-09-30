# API Specification — CV Screening System

Base URL: `http://localhost:8080/api` · Swagger UI: `http://localhost:8080/swagger-ui.html` (tắt ở profile `prod`) · Health: `http://localhost:8080/actuator/health`

Xác thực: gửi header `Authorization: Bearer <JWT>` (lấy token từ `/auth/login`).

## Định dạng lỗi

Mọi lỗi đều trả cùng một body:

```json
{ "timestamp": "2026-09-30T08:00:00Z", "status": 400, "message": "Tiêu đề tối đa 200 ký tự.",
  "fieldErrors": { "title": "Tiêu đề tối đa 200 ký tự." } }
```

`fieldErrors` chỉ có khi lỗi validate, và chứa **tất cả** trường sai.

| Mã | Khi nào |
|---|---|
| 400 | Dữ liệu không hợp lệ, JSON hỏng, thiếu tham số / thiếu phần `file`, file sai định dạng hoặc nội dung |
| 401 | Chưa đăng nhập, token sai hoặc **hết hạn** → frontend đưa về trang đăng nhập |
| 403 | Đã đăng nhập nhưng không đủ quyền (sai vai trò, không phải chủ tin, sai mã mời HR) |
| 404 | Không tìm thấy tài nguyên hoặc đường dẫn API |
| 405 / 415 | Sai HTTP method / sai `Content-Type` |
| 409 | Trùng dữ liệu (email đã dùng, đã nộp CV cho tin này), shortlist hồ sơ chưa chấm xong |
| 413 | File > 5MB |
| 429 | Đăng nhập sai quá nhiều lần; header `Retry-After` (giây) cho biết thời gian chờ |

## Auth

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | Public | Body: `{fullName ≤100, email ≤254, password 8–72, role: "HR"\|"CANDIDATE", hrInviteCode?}`. `hrInviteCode` bắt buộc khi `role = HR`. Email được chuẩn hoá (trim + chữ thường) |
| POST | `/auth/login` | Public | Body: `{email, password}` → `{token, userId, fullName, email, role}`. Sai 5 lần / 15 phút → khoá 15 phút (429) |

## Jobs

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/jobs` | Đã đăng nhập | Danh sách tin đang mở |
| GET | `/jobs/mine` | HR | Tin do mình tạo (cả tin đã đóng) + số liệu: `applicantCount, pendingCount, strongCount (≥70 điểm), shortlistedCount, averageScore` |
| GET | `/jobs/{id}` | Đã đăng nhập | Chi tiết tin. Tin đã đóng: chỉ HR tạo tin xem được, người khác nhận 404 |
| POST | `/jobs` | HR | Body: `{title ≤200, description ≤10000, requiredSkills ≤1000, location? ≤200}`. `requiredSkills` phân cách dấu phẩy, AI dùng để chấm điểm |
| PUT | `/jobs/{id}` | HR (chủ tin) | Cập nhật tin. Đổi tiêu đề / mô tả / kỹ năng → **chấm lại toàn bộ CV** của tin (xoá điểm cũ, CV về PENDING) |
| DELETE | `/jobs/{id}` | HR (chủ tin) | Đóng tin (soft delete) |
| POST | `/jobs/{id}/reopen` | HR (chủ tin) | Mở lại tin đã đóng |

## CV

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/cv/upload` | CANDIDATE | multipart/form-data: `file` (PDF/DOCX ≤5MB, kiểm tra cả nội dung), `jobId`. Trả 202, CV vào trạng thái PENDING |
| GET | `/cv/mine` | CANDIDATE | Đơn ứng tuyển của tôi kèm điểm AI và `reviewStatus` |
| PATCH | `/cv/{id}/review-status` | HR (chủ tin) | Body: `{status: "NEW"\|"SHORTLISTED"\|"REJECTED"}`. SHORTLISTED chỉ khi CV đã PROCESSED. Lưu người duyệt + thời điểm |
| GET | `/cv/{id}/download` | HR chủ tin hoặc chủ CV | Presigned URL S3 (hạn 15 phút) |

## Matching

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/matching/job/{jobId}` | HR (chủ tin) | Ứng viên xếp hạng theo điểm giảm dần (CV chưa có điểm xếp cuối). Mỗi phần tử: `{cvId, candidateName, candidateEmail, fileName, status, reviewStatus, score, matchedSkills, missingSkills, summary, yearsExperience, uploadedAt, reviewedAt}` |

## Message SQS (backend → worker)

```json
{ "cvId": 12, "jobId": 3, "s3Key": "cvs/uuid-cv.pdf", "fileName": "cv.pdf" }
```

Backend không gửi SQS trực tiếp. Message được ghi vào bảng `outbox_messages` **cùng transaction** với CV, sau đó `OutboxRelay` đẩy sang SQS khi transaction đã commit. Cơ chế giao là at-least-once: worker ghi kết quả bằng upsert nên nhận trùng message không sai dữ liệu.

## Bảng dữ liệu chính

- `users(id, full_name, email UNIQUE, password, role, created_at)`
- `jobs(id, title, description, required_skills, location, created_by → users, active, created_at)`
- `cvs(id, file_name, s3key, status, review_status, reviewed_at, reviewed_by → users, candidate_id → users, job_id → jobs, uploaded_at)`, UNIQUE `(candidate_id, job_id)`
- `match_results(id, cv_id UNIQUE, job_id, score 0–100, matched_skills, missing_skills, summary, years_experience, created_at)`, FK `(cv_id, job_id) → cvs(id, job_id)` ON DELETE CASCADE
- `outbox_messages(id, aggregate_id, payload, created_at, sent_at, attempts, last_error)`

Schema do **Flyway** quản lý (`backend/src/main/resources/db/migration`), Hibernate chỉ `validate`. Worker Python ghi trực tiếp vào `match_results` và cập nhật `cvs.status`.
