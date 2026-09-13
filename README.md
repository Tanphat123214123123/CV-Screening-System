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

Yêu cầu: **Docker**, **JDK 17 + Maven**, **Python 3.11+**, **Node 20+**.

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
export DB_PORT=5433              # Windows PowerShell: $env:DB_PORT="5433"
mvn spring-boot:run
```

- API: http://localhost:8080 · Swagger: http://localhost:8080/swagger-ui.html
- Schema DB tự tạo, kèm dữ liệu demo:
  - HR: `hr@demo.com` / `123456`
  - Ứng viên: `candidate@demo.com` / `123456`

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

### Kịch bản demo

1. Đăng nhập `candidate@demo.com` → tab **Việc làm** → bấm **Nộp CV**, chọn file PDF/DOCX.
2. Worker log hiện `Hoan tat CV #...: score=...` sau vài giây.
3. Đăng nhập `hr@demo.com` → tab **Ứng viên** → thấy ứng viên được xếp hạng theo điểm, kèm kỹ năng trùng khớp / còn thiếu và nhận xét; bấm **Tải CV** để tải file gốc qua presigned URL.

## Cách AI chấm điểm

1. **Parse**: trích text từ PDF (pdfplumber) hoặc DOCX (python-docx, gồm cả bảng).
2. **Extract** (rule-based NLP): so khớp ~100 từ khóa kỹ năng với word-boundary regex (tránh "java" match nhầm trong "javascript"); regex bắt số năm kinh nghiệm, email, SĐT.
3. **Match**: giao giữa kỹ năng CV và `requiredSkills` của JD → tỉ lệ phủ (coverage).
4. **Score** = `coverage × 80 + min(năm KN, 5) × 4` → thang 0–100, dễ giải thích trước hội đồng.
5. **(Tùy chọn) LLM**: nếu có API key, gọi Claude sinh nhận xét 2–3 câu tiếng Việt; lỗi thì fallback về nhận xét rule-based — pipeline không bao giờ gián đoạn.

## Triển khai AWS thật

1. Tạo S3 bucket + SQS queue thật, IAM user có quyền tương ứng.
2. Đặt biến môi trường cho backend & worker: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`, `SQS_QUEUE`, và **để trống `S3_ENDPOINT`, `SQS_ENDPOINT`** — SDK sẽ tự kết nối AWS thật (code không đổi một dòng).
3. Database: Amazon RDS PostgreSQL (`DB_HOST`, `DB_USER`, `DB_PASSWORD`).
4. Deploy: build image từ 2 Dockerfile có sẵn → ECS/Fargate hoặc Elastic Beanstalk; frontend build tĩnh → S3 + CloudFront.
5. Đổi `JWT_SECRET` và `CORS_ORIGINS` sang giá trị production.

## Cấu trúc thư mục

```
backend/     Spring Boot — auth, jobs, cv upload (S3+SQS), matching API, unit test
ai-worker/   Python — consume SQS, parse CV, NLP, chấm điểm, ghi PostgreSQL
frontend/    React + TS — trang ứng viên & trang HR
infra/       docker-compose (postgres/minio/elasticmq)
.github/     CI GitHub Actions (.github/workflows/ci-cd.yml)
docs/        api-spec.md
```

## Điểm nhấn khi viết báo cáo / thuyết trình

- **Kiến trúc hướng dịch vụ + xử lý bất đồng bộ**: upload trả về ngay (202 Accepted), AI xử lý nền qua queue — giải thích vì sao (parse + NLP chậm, không được block request).
- **Cloud-native**: S3/SQS với endpoint override → một codebase chạy cả local lẫn AWS (12-factor config).
- **Bảo mật**: JWT stateless, phân quyền HR/CANDIDATE bằng `@PreAuthorize`, presigned URL thay vì mở public bucket, validate loại/kích thước file.
- **AI giải thích được**: công thức điểm minh bạch, chỉ rõ ưu điểm (nhanh, rẻ, deterministic) và hạn chế (từ điển kỹ năng tĩnh) + hướng phát triển (spaCy NER, embedding similarity, LLM).
- Vẽ kèm: architecture diagram, sequence diagram luồng nộp CV, ERD 4 bảng.
