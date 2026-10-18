import os
from dotenv import load_dotenv

load_dotenv()

class ResumeService:
    async def parse_bytes(self, contents: bytes, filename: str) -> dict:
        """Extract text directly from in-memory file bytes without disk I/O."""
        import io
        ext = os.path.splitext(filename)[1].lower()
        text = ""
        try:
            if ext == ".pdf":
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(contents))
                extracted = []
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        extracted.append(page_text)
                text = "\n".join(extracted)
            elif ext in [".doc", ".docx"]:
                from docx import Document
                doc = Document(io.BytesIO(contents))
                text = "\n".join(para.text for para in doc.paragraphs if para.text.strip())
            else:
                text = contents.decode("utf-8", errors="ignore")
        except Exception as e:
            return {"error": str(e), "raw_text": "", "extracted_skills": [], "extracted_projects": []}

        clean_text = text.strip()
        skills = self._extract_skills(clean_text)
        projects = self._extract_projects(clean_text)

        return {
            "raw_text": clean_text[:6000],
            "extracted_skills": skills,
            "extracted_projects": projects,
            "word_count": len(clean_text.split())
        }

    async def parse(self, file_path: str) -> dict:
        """Extract text and key info from a resume PDF or DOCX."""
        ext = os.path.splitext(file_path)[1].lower()
        text = ""
        try:
            if ext == ".pdf":
                text = self._parse_pdf(file_path)
            elif ext in [".doc", ".docx"]:
                text = self._parse_docx(file_path)
            else:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
        except Exception as e:
            return {"error": str(e), "raw_text": "", "extracted_skills": [], "extracted_projects": []}

        clean_text = text.strip()
        skills = self._extract_skills(clean_text)
        projects = self._extract_projects(clean_text)

        return {
            "raw_text": clean_text[:6000],
            "extracted_skills": skills,
            "extracted_projects": projects,
            "word_count": len(clean_text.split())
        }


    def _parse_pdf(self, path: str) -> str:
        try:
            import pypdf
            reader = pypdf.PdfReader(path)
            extracted = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted.append(page_text)
            return "\n".join(extracted)
        except Exception as e:
            try:
                import pdfplumber
                with pdfplumber.open(path) as pdf:
                    return "\n".join(page.extract_text() or "" for page in pdf.pages)
            except Exception:
                return f"Error reading PDF: {e}"

    def _parse_docx(self, path: str) -> str:
        try:
            from docx import Document
            doc = Document(path)
            return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
        except Exception as e:
            return f"Error reading DOCX: {e}"

    def _extract_skills(self, text: str) -> list:
        KNOWN_SKILLS = [
            "core java", "java", "oops", "object oriented programming", "collections framework",
            "spring boot", "spring mvc", "spring", "hibernate", "jpa", "jdbc",
            "mysql", "sql", "postgresql", "mongodb", "redis", "oracle",
            "python", "javascript", "typescript", "c++", "c#", "c", "golang",
            "react", "angular", "vue", "next.js", "html", "css", "bootstrap", "tailwind",
            "node.js", "express", "fastapi", "django", "flask",
            "rest api", "microservices", "json", "postman", "maven", "gradle",
            "git", "github", "docker", "kubernetes", "aws", "azure", "gcp",
            "data structures", "algorithms", "dsa", "operating systems", "dbms", "computer networks",
            "junit", "mockito", "ci/cd", "agile"
        ]
        text_lower = text.lower()
        found = []
        for skill in KNOWN_SKILLS:
            # Match whole words or boundary
            if skill in text_lower:
                found.append(skill)
        return found

    def _extract_projects(self, text: str) -> list:
        """Find lines or section titles that indicate candidate projects."""
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        projects = []
        in_project_section = False

        for line in lines:
            lower = line.lower()
            if any(h in lower for h in ["projects", "academic projects", "key projects", "personal projects"]):
                in_project_section = True
                continue
            if in_project_section:
                # Stop if hitting another major header
                if any(h in lower for h in ["experience", "work history", "education", "certifications", "skills", "hobbies"]):
                    break
                if len(line) > 5 and len(line) < 80 and not line.startswith("•"):
                    projects.append(line)
                if len(projects) >= 4:
                    break

        return projects[:4]

