# API Specification — CV Screening System

Base URL: `http://localhost:8080/api` · Swagger UI: `http://localhost:8080/swagger-ui.html`

Xác thực: gửi header `Authorization: Bearer <JWT>` (lấy token từ `/auth/login`).

## Auth

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | Public | Đăng ký. Body: `{fullName, email, password, role: "HR"\|"CANDIDATE"}` |
| POST | `/auth/login` | Public | Đăng nhập. Body: `{email, password}` → `{token, userId, fullName, email, role}` |

## Jobs

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/jobs` | Đã đăng nhập | Danh sách tin đang mở |
| GET | `/jobs/{id}` | Đã đăng nhập | Chi tiết tin |
| POST | `/jobs` | HR | Tạo tin. Body: `{title, description, requiredSkills, location}`. `requiredSkills` phân cách dấu phẩy — AI dùng để chấm điểm |
| PUT | `/jobs/{id}` | HR (chủ tin) | Cập nhật tin |
| DELETE | `/jobs/{id}` | HR (chủ tin) | Đóng tin (soft delete) |

## CV

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/cv/upload` | CANDIDATE | multipart/form-data: `file` (pdf/docx ≤5MB), `jobId`. Trả 202, CV vào trạng thái PENDING |
| GET | `/cv/mine` | CANDIDATE | Đơn ứng tuyển của tôi kèm điểm AI |
| GET | `/cv/{id}/download` | HR hoặc chủ CV | Trả presigned URL S3 (hạn 15 phút) |

## Matching

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| GET | `/matching/job/{jobId}` | HR (chủ tin) | Danh sách ứng viên xếp hạng theo điểm AI giảm dần. Mỗi phần tử: `{cvId, candidateName, candidateEmail, fileName, status, score, matchedSkills, missingSkills, summary, yearsExperience, uploadedAt}` |

## Message SQS (backend → worker)

```json
{ "cvId": 12, "jobId": 3, "s3Key": "cvs/uuid-cv.pdf", "fileName": "cv.pdf" }
```

## Bảng dữ liệu chính

- `users(id, full_name, email, password, role, created_at)`
- `jobs(id, title, description, required_skills, location, created_by, active, created_at)`
- `cvs(id, file_name, s3_key, status, candidate_id, job_id, uploaded_at)`
- `match_results(id, cv_id UNIQUE, job_id, score, matched_skills, missing_skills, summary, years_experience, created_at)`

Schema do Hibernate tự tạo (`ddl-auto: update`); worker Python ghi trực tiếp vào `match_results` và cập nhật `cvs.status`.
