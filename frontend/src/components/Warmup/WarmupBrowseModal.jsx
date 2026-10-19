import { useState, useMemo } from 'react';
import {
  WARMUP_CATEGORIES,
  getAllWarmupQuestions,
} from '../../utils/warmupQuestionBank';
import styles from './WarmupBrowseModal.module.css';

export default function WarmupBrowseModal({
  isOpen,
  onClose,
  track,
  onSelectQuestion,
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const allQuestions = useMemo(() => {
    return getAllWarmupQuestions(track?.id || 'SOFTWARE_ENGINEERING');
  }, [track]);

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      const matchCat = selectedCategory === 'ALL' || q.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.jobRelatedTerms || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (q.tips || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allQuestions, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.headerTitle}>Browse All Questions</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              {track?.label || 'Software Engineering'} Question Bank
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Filter Controls */}
        <div className={styles.filterBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search questions by keyword, topic, or tech..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className={styles.categoryFilters}>
            <button
              className={`${styles.filterChip} ${selectedCategory === 'ALL' ? styles.filterChipActive : ''}`}
              onClick={() => setSelectedCategory('ALL')}
            >
              All ({allQuestions.length})
            </button>
            <button
              className={`${styles.filterChip} ${
                selectedCategory === 'BACKGROUND' ? styles.filterChipActive : ''
              }`}
              onClick={() => setSelectedCategory('BACKGROUND')}
            >
              Background
            </button>
            <button
              className={`${styles.filterChip} ${
                selectedCategory === 'SITUATIONAL' ? styles.filterChipActive : ''
              }`}
              onClick={() => setSelectedCategory('SITUATIONAL')}
            >
              Situational
            </button>
            <button
              className={`${styles.filterChip} ${
                selectedCategory === 'TECHNICAL' ? styles.filterChipActive : ''
              }`}
              onClick={() => setSelectedCategory('TECHNICAL')}
            >
              Technical
            </button>
          </div>
        </div>

        {/* Question List */}
        <div className={styles.questionList}>
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((q) => {
              const cat = WARMUP_CATEGORIES[q.category] || WARMUP_CATEGORIES.TECHNICAL;
              return (
                <div key={q.id} className={styles.questionItem}>
                  <div className={styles.itemTop}>
                    <span
                      className={styles.catBadge}
                      style={{
                        backgroundColor: cat.bgLight,
                        color: cat.color,
                        border: `1px solid ${cat.color}40`,
                      }}
                    >
                      {cat.label}
                    </span>

                    {(q.jobRelatedTerms || []).length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                        Key terms: {q.jobRelatedTerms.slice(0, 3).join(', ')}...
                      </span>
                    )}
                  </div>

                  <p className={styles.itemText}>{q.question}</p>

                  {q.tips && (
                    <p className={styles.itemTips}>
                      <strong>Tip:</strong> {q.tips}
                    </p>
                  )}

                  <button
                    className={styles.practiceBtn}
                    onClick={() => {
                      onSelectQuestion(q);
                      onClose();
                    }}
                  >
                    Practice This Question 🎙️
                  </button>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>
              No questions found matching your filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
