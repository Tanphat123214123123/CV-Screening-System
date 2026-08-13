"""Trich xuat text tu file PDF bang pdfplumber."""
import pdfplumber


def extract_text(path: str) -> str:
    parts: list[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                parts.append(text)
    return "\n".join(parts)
