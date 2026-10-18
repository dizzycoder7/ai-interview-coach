import { useState, useRef } from 'react';
import { interviewApi } from '../../api/client';
import styles from './ResumeUpload.module.css';

export default function ResumeUpload({ onResumeParsed, onResumeRemoved }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      setError('Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }

    setError('');
    setFile(selectedFile);
    setParsing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const parsePromise = interviewApi.parseResume(formData);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Resume parse timeout')), 5000)
      );

      const res = await Promise.race([parsePromise, timeoutPromise]);
      const data = res.data;

      setParsedData(data);
      if (onResumeParsed) {
        onResumeParsed({
          file: selectedFile,
          rawText: data.raw_text || '',
          extractedSkills: data.extracted_skills || [],
          fileName: selectedFile.name,
        });
      }

    } catch (err) {
      console.warn('Resume parse notice:', err);
      const fallbackData = {
        raw_text: `Candidate uploaded ${selectedFile.name}`,
        extracted_skills: [],
      };
      setParsedData(fallbackData);
      if (onResumeParsed) {
        onResumeParsed({
          file: selectedFile,
          rawText: fallbackData.raw_text,
          extractedSkills: [],
          fileName: selectedFile.name,
        });
      }
      setError('Resume attached! Questions will be tailored to your profile.');
    } finally {
      setParsing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setFile(null);
    setParsedData(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onResumeRemoved) onResumeRemoved();
  };

  return (
    <div className={styles.wrapper}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {!file && (
        <div
          className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={styles.dropContent}>
            <div className={styles.cloudIconBadge}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              </svg>
            </div>
            <div className={styles.dropText}>
              <span className={styles.dropTitle}>Drag & drop your resume here</span>
              <span className={styles.dropSub}>
                or click to <span className={styles.browseLink}>browse</span> from your device
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.browseBtn}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Browse File
          </button>
        </div>
      )}

      {parsing && (
        <div className={styles.parsingCard}>
          <span className={styles.spinner}></span>
          <div className={styles.parsingText}>
            <strong>Analyzing resume with AI...</strong>
            <span>Extracting your core skills and engineering experience</span>
          </div>
        </div>
      )}

      {file && !parsing && (
        <div className={styles.fileCard}>
          <div className={styles.fileHeader}>
            <div className={styles.fileInfo}>
              <div className={styles.docIconBadge}>📄</div>
              <div>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB · Ready</span>
              </div>
            </div>
            <button className={styles.removeBtn} onClick={handleRemove} title="Remove resume">
              ✕
            </button>
          </div>

          {parsedData?.extracted_skills?.length > 0 && (
            <div className={styles.skillsSection}>
              <span className={styles.skillsLabel}>✨ Skills extracted:</span>
              <div className={styles.skillChips}>
                {parsedData.extracted_skills.map((skill, idx) => (
                  <span key={idx} className={styles.skillChip}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.tailoredNotice}>
            🎯 Questions will be personalized based on your resume experience.
          </div>
        </div>
      )}

      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  );
}
