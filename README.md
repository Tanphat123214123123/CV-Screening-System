# 🎯 TalentSift — Hệ thống quản lý & tuyển dụng nhân sự tích hợp AI sàng lọc CV

Đồ án chuyên ngành Công nghệ phần mềm. Hệ thống cho phép **HR đăng tin tuyển dụng**, **ứng viên nộp CV**, và **AI tự động phân tích – chấm điểm – xếp hạng ứng viên** theo mức độ phù hợp với Job Description, xử lý **bất đồng bộ** qua message queue trên hạ tầng cloud.

## Kiến trúc

```
[React + TypeScript] ──REST/JWT──► [Spring Boot Backend] ──file──► [S3 / MinIO]
                                          │
                                          └──message──► [SQS / ElasticMQ]
                                                              │
                                                              ▼
[PostgreSQL] ◄──ghi kết quả────────────── [AI Worker - Python]
     ▲                                     (parse PDF/DOCX → NLP → chấm điểm)
     └────đọc kết quả─── Backend ─── HR xem bảng xếp hạng
```

| Thành phần | Công nghệ |
|---|---|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS |
| Backend | Java 17, Spring Boot 3 (Web, Security JWT, Data JPA), Springdoc OpenAPI |
| AI Worker | Python 3.11 — pdfplumber, python-docx, rule-based NLP, tùy chọn LLM |
| Database | PostgreSQL 16 |
| Cloud | AWS S3 + SQS (dev local: MinIO + ElasticMQ, cùng API) |
| DevOps | Docker Compose, GitHub Actions |

## Chạy dự án (local)

Yêu cầu: **Docker**, **JDK 17+**, **Python 3.11+**, **Node 20+**. Không cần cài Maven: backend có sẵn Maven Wrapper (`mvnw` / `mvnw.cmd`), lần chạy đầu tự tải Maven về.

### 1. Hạ tầng (PostgreSQL + MinIO + ElasticMQ)

```bash
cd infra
docker compose up -d
```

- MinIO console: http://localhost:9001 (minioadmin / minioadmin)
- Bucket `cv-bucket` được tạo tự động.

### 2. Backend Spring Boot

```bash
cd backend
# Postgres trong docker-compose chay o cong 5433 (khong phai 5432 mac dinh) de
# tranh xung dot voi mot PostgreSQL cai san tren may (rat pho bien tren Windows).
# Spring Boot khong tu doc file .env nen phai export truc tiep:
export DB_PORT=5433
./mvnw spring-boot:run
```

Trên Windows:

```bat
:: cmd — de dau ngoac kep bao ca "TEN=GIATRI": neu khong, dau cach cuoi dong
:: (vd truoc "&&") bi tinh vao gia tri -> "5433 " -> loi "invalid port number"
set "DB_PORT=5433"
mvnw spring-boot:run
```

```powershell
# PowerShell
$env:DB_PORT="5433"
.\mvnw spring-boot:run
```

- API: http://localhost:8080 · Swagger: http://localhost:8080/swagger-ui.html · Health: http://localhost:8080/actuator/health
- Schema DB do **Flyway** tạo và nâng cấp tự động khi khởi động (`backend/src/main/resources/db/migration`). Hibernate chỉ kiểm tra entity khớp schema (`ddl-auto: validate`).
  - DB dev cũ (do phiên bản trước tự tạo bằng Hibernate) được nâng cấp **giữ nguyên dữ liệu**: V2 chuẩn hoá email về chữ thường, thêm khoá ngoại / index / constraint có tên, xoá kết quả chấm mồ côi.
- Dữ liệu demo (chỉ ở môi trường dev, **không** seed ở profile `prod`):
  - HR: `hr@demo.com` / `123456`
  - Ứng viên: `candidate@demo.com` / `123456`
- Đăng ký tài khoản **nhà tuyển dụng** cần mã mời `HR_INVITE_CODE` (dev mặc định: `HR-DEMO-2026`). Ứng viên đăng ký tự do.
- Đăng nhập sai 5 lần / 15 phút với cùng email (hoặc 20 lần từ cùng IP) sẽ bị khoá 15 phút (HTTP 429).
- Backend kiểm tra bucket S3 và queue SQS ngay khi khởi động: phải bật hạ tầng ở bước 1 trước, nếu không backend dừng và báo lỗi rõ ràng.

### 3. AI Worker

```bash
cd ai-worker
cp .env.example .env    # Windows: copy .env.example .env  — worker tu doc file nay (python-dotenv)
python -m venv venv && source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
```

Tùy chọn: đặt biến môi trường `ANTHROPIC_API_KEY` để worker dùng LLM sinh nhận xét chi tiết thay cho nhận xét rule-based (không có key vẫn chạy bình thường).

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Mở http://localhost:5173

Kiểm tra chất lượng code frontend:

```bash
npm run lint   # ESLint
npm test       # Vitest + Testing Library
```

### Kịch bản demo

1. Mở http://localhost:5173 → trang giới thiệu → **Đăng nhập**. Ở môi trường dev có nút **Dùng thử nhanh** điền sẵn tài khoản demo.
2. Đăng nhập `candidate@demo.com` → **Việc làm** → chọn một tin → kéo thả CV (PDF/DOCX, tối đa 5MB) → **Nộp CV**.
3. Vòng điểm chuyển từ "đang phân tích" sang điểm thật sau vài giây (tự cập nhật, không cần tải lại). **Đơn của tôi** hiện kỹ năng đã khớp và kỹ năng nên bổ sung.
4. Đăng nhập `hr@demo.com` → **Tổng quan**: số liệu hồ sơ, đăng / sửa / đóng / mở lại tin.
5. Bấm **Ứng viên** ở một tin → danh sách xếp hạng theo điểm, lọc theo ngưỡng điểm / trạng thái, tìm theo tên hoặc kỹ năng. Chọn một ứng viên để xem điểm, kỹ năng khớp / thiếu, nhận xét AI, **Xem CV** ngay trong trang (PDF) và đánh dấu **Shortlist** / **Loại**.
6. Nút mặt trăng / mặt trời trên thanh điều hướng chuyển giao diện sáng / tối.

## Kiểm thử & CI

| Tầng | Công cụ | Lệnh |
|---|---|---|
| Backend | JUnit 5 + Mockito, `@WebMvcTest` (security + mã lỗi HTTP), Testcontainers PostgreSQL (migration, constraint, truy vấn), JaCoCo | `cd backend && ./mvnw verify` → báo cáo ở `target/site/jacoco/` |
| AI worker | pytest + pytest-cov, ruff (lint) | `cd ai-worker && ruff check . && pytest --cov` |
| Frontend | Vitest + Testing Library, ESLint | `cd frontend && npm run lint && npm run test:coverage` |
| **Tích hợp (end-to-end)** | pytest gọi API thật trên toàn bộ hệ thống Docker | xem bên dưới |

Test tích hợp dựng **cả hệ thống** (backend + worker + Postgres + MinIO + ElasticMQ) bằng Docker rồi kiểm tra luồng thật: nộp CV → S3 → SQS → worker chấm điểm → HR xem / shortlist, phân quyền giữa các HR, đóng / mở lại tin, CORS:

```bash
cd infra
docker compose --profile app up -d --build   # profile "app" = thêm backend + ai-worker
cd ../integration-tests
pip install -r requirements.txt
pytest -v
cd ../infra && docker compose --profile app down   # thêm -v để xoá dữ liệu
```

> Test tự tạo user/tin với email ngẫu nhiên nên chạy lặp lại được; nếu chạy trên DB local có dữ liệu demo, các tin "Integration Java Backend" sẽ xuất hiện cùng.
>
> Test Testcontainers của backend cần Docker đang chạy; máy không có Docker thì các test này tự bỏ qua (CI luôn chạy đủ).

GitHub Actions ([`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml)) chạy 4 job song song trên mỗi PR và push vào `main`: `backend`, `ai-worker`, `frontend`, `integration` — kèm tóm tắt coverage và artifact báo cáo. Nhánh `main` được bảo vệ: phải qua PR và cả 4 job phải xanh mới merge được. Dependabot ([`.github/dependabot.yml`](.github/dependabot.yml)) mở PR cập nhật thư viện hằng tuần.

## Cách AI chấm điểm

1. **Parse**: trích text từ PDF (pdfplumber) hoặc DOCX (python-docx, gồm cả bảng).
2. **Extract** (rule-based NLP): so khớp ~100 từ khóa kỹ năng với word-boundary regex (tránh "java" match nhầm trong "javascript"); regex bắt số năm kinh nghiệm, email, SĐT.
3. **Match**: giao giữa kỹ năng CV và `requiredSkills` của JD → tỉ lệ phủ (coverage).
4. **Score** = `coverage × 80 + min(năm KN, 5) × 4` → thang 0–100, dễ giải thích trước hội đồng.
5. **(Tùy chọn) LLM**: nếu có API key, gọi Claude sinh nhận xét 2–3 câu tiếng Việt; lỗi thì fallback về nhận xét rule-based — pipeline không bao giờ gián đoạn.

## Triển khai AWS thật

Backend chạy với **`SPRING_PROFILES_ACTIVE=prod`** ([`application-prod.yml`](backend/src/main/resources/application-prod.yml)). Profile này bỏ mọi giá trị mặc định dành cho dev. Thiếu biến bắt buộc thì backend **từ chối khởi động**, thay vì chạy với secret công khai trong repo.

1. Tạo S3 bucket + SQS queue bằng IaC / console. Ở prod, backend **không tự tạo** (IAM không cần quyền `CreateBucket` / `CreateQueue`).
2. Quyền AWS: gán **IAM role** cho ECS task / EC2 (`s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `sqs:GetQueueUrl`, `sqs:SendMessage`). Để trống `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` → SDK tự dùng role (`DefaultCredentialsProvider`).
3. Biến bắt buộc: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (Amazon RDS PostgreSQL), `JWT_SECRET` (ngẫu nhiên ≥ 32 byte; dùng secret mặc định của dev → không khởi động), `CORS_ORIGINS`, `AWS_REGION`, `S3_BUCKET`, `SQS_QUEUE`.
4. Tuỳ chọn: `HR_INVITE_CODE` (để trống = tắt đăng ký HR công khai). Nếu chạy sau load balancer, bật `SERVER_FORWARD_HEADERS_STRATEGY=native` để giới hạn đăng nhập theo IP thật của client.
5. Để trống `S3_ENDPOINT`, `SQS_ENDPOINT` → SDK kết nối AWS thật. Swagger tự tắt ở prod.
6. Deploy: build image từ 2 Dockerfile có sẵn → ECS/Fargate hoặc Elastic Beanstalk, health check `/actuator/health`; frontend build tĩnh → S3 + CloudFront.

## Cấu trúc thư mục

```
backend/     Spring Boot — auth, jobs, cv upload (S3+SQS), matching API, unit test
ai-worker/   Python — consume SQS, parse CV, NLP, chấm điểm, ghi PostgreSQL
frontend/    React + TS — trang ứng viên & trang HR
infra/       docker-compose (postgres/minio/elasticmq; profile "app" thêm backend + worker)
integration-tests/  Test end-to-end qua API trên toàn bộ hệ thống Docker
.github/     CI GitHub Actions + Dependabot
docs/        api-spec.md
```

## Điểm nhấn khi viết báo cáo / thuyết trình

- **Kiến trúc hướng dịch vụ + xử lý bất đồng bộ**: upload trả về ngay (202 Accepted), AI xử lý nền qua queue — giải thích vì sao (parse + NLP chậm, không được block request).
- **Cloud-native**: S3/SQS với endpoint override → một codebase chạy cả local lẫn AWS (12-factor config).
- **Tin cậy của pipeline — Transactional Outbox**: message cho AI worker được ghi vào bảng `outbox_messages` **cùng transaction** với bản ghi CV, rồi `OutboxRelay` mới đẩy sang SQS sau khi commit (`FOR UPDATE SKIP LOCKED` để chạy nhiều instance). Tránh hai lỗi kinh điển của "ghi DB + gửi message": worker nhận message trước khi dữ liệu commit (CV kẹt PENDING), hoặc gửi xong mà commit thất bại.
- **Toàn vẹn dữ liệu**: schema quản lý bằng Flyway, khoá ngoại + constraint có tên + CHECK; khoá ngoại kép `match_results(cv_id, job_id) → cvs(id, job_id)` đảm bảo kết quả chấm luôn thuộc đúng tin. Sửa JD → tự chấm lại toàn bộ CV của tin.
- **Bảo mật**: JWT stateless (401 khi hết hạn / 403 khi sai quyền), phân quyền HR/CANDIDATE bằng `@PreAuthorize`, đăng ký HR cần mã mời, chống dò mật khẩu (khoá theo email + IP), email chuẩn hoá, presigned URL thay vì mở public bucket, kiểm tra **nội dung** file (magic bytes PDF / cấu trúc DOCX) chứ không chỉ đuôi, profile `prod` fail-fast khi thiếu secret.
- **AI giải thích được**: công thức điểm minh bạch, chỉ rõ ưu điểm (nhanh, rẻ, deterministic) và hạn chế (từ điển kỹ năng tĩnh) + hướng phát triển (spaCy NER, embedding similarity, LLM).
- Vẽ kèm: architecture diagram, sequence diagram luồng nộp CV, ERD 4 bảng.
