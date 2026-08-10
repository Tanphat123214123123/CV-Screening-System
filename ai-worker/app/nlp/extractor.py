"""Trich xuat thong tin tu text CV: ky nang, so nam kinh nghiem, email, SDT.

Phuong phap: keyword matching + regex (rule-based NLP).
Uu diem: nhanh, khong can GPU, de giai thich trong bao cao do an.
Co the nang cap sang spaCy NER hoac LLM neu muon do chinh xac cao hon.
"""
import re

# Tu dien ky nang pho bien (co the mo rong hoac tach ra file JSON rieng)
SKILL_KEYWORDS = [
    # Ngon ngu lap trinh
    "java", "python", "javascript", "typescript", "c#", "c++", "go", "kotlin",
    "swift", "php", "ruby", "rust", "scala", "dart", "sql",
    # Backend framework
    "spring boot", "spring", "django", "flask", "fastapi", "express", "nestjs",
    "laravel", ".net", "asp.net", "node.js", "nodejs",
    # Frontend
    "react", "vue", "angular", "next.js", "nuxt", "svelte", "html", "css",
    "tailwind", "bootstrap", "redux", "jquery",
    # Mobile
    "flutter", "react native", "android", "ios",
    # Database
    "postgresql", "mysql", "mongodb", "redis", "oracle", "sql server",
    "elasticsearch", "dynamodb", "cassandra", "sqlite",
    # Cloud & DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "terraform",
    "jenkins", "github actions", "gitlab ci", "ci/cd", "linux", "nginx",
    "lambda", "s3", "ec2", "sqs",
    # AI/Data
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
    "pandas", "numpy", "nlp", "computer vision", "opencv", "spark", "hadoop",
    # Khac
    "git", "rest api", "restful", "graphql", "grpc", "microservices", "kafka",
    "rabbitmq", "agile", "scrum", "oop", "design patterns", "unit test",
    "junit", "selenium", "jira", "figma",
]

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_RE = re.compile(r"(?:\+?84|0)(?:\d[ .-]?){8,9}\d")
# "3 nam kinh nghiem", "3+ years of experience", "5 yrs"...
YEARS_RE = re.compile(
    r"(\d{1,2})\s*\+?\s*(?:nam|năm|years?|yrs?)\b", re.IGNORECASE
)


def extract_profile(cv_text: str) -> dict:
    """Tra ve dict: skills, years_experience, email, phone."""
    normalized = " " + re.sub(r"\s+", " ", cv_text.lower()) + " "

    skills = []
    for skill in SKILL_KEYWORDS:
        # Bao quanh boi ky tu khong phai chu/so de tranh match nham
        # (vd: "java" khong duoc match trong "javascript")
        pattern = r"(?<![\w+#.])" + re.escape(skill) + r"(?![\w+#])"
        if re.search(pattern, normalized):
            skills.append(skill)
    # "javascript" match thi loai "java" neu java khong xuat hien doc lap - da xu ly bang regex boundary

    years_matches = [int(m) for m in YEARS_RE.findall(cv_text)]
    years_experience = max(years_matches) if years_matches else 0
    years_experience = min(years_experience, 40)  # chan gia tri vo ly

    email_match = EMAIL_RE.search(cv_text)
    phone_match = PHONE_RE.search(cv_text)

    return {
        "skills": sorted(set(skills)),
        "years_experience": years_experience,
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0).strip() if phone_match else None,
    }
