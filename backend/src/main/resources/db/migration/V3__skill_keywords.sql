-- V3: tu dien ky nang ma AI worker nhan dien duoc.
-- Nguon su that duy nhat la SKILL_KEYWORDS trong ai-worker/app/nlp/extractor.py: worker ghi de bang nay
-- moi lan khoi dong. Backend chi doc de form dang tin canh bao HR khi nhap ky nang AI khong nhan ra
-- (ky nang do se bi tinh la "thieu" voi moi CV).
CREATE TABLE IF NOT EXISTS skill_keywords (
    skill     VARCHAR(100)                NOT NULL,
    synced_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT pk_skill_keywords PRIMARY KEY (skill),
    CONSTRAINT ck_skill_keywords_normalized CHECK (skill = lower(trim(skill)) AND skill <> '')
);
