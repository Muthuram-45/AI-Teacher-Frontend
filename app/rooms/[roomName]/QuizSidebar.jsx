'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx-js-style';

export default function QuizSidebar({ quizId, topic, onClose, right = 0 }) {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!quizId) return;

        const fetchResults = async () => {
            try {
                const res = await fetch(`http://localhost:3001/quiz-results/${quizId}`);
                const data = await res.json();
                setResults(data);
            } catch (err) {
                console.error('Failed to fetch quiz results:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
        // Poll for updates every 3 seconds
        const interval = setInterval(fetchResults, 3000);
        return () => clearInterval(interval);
    }, [quizId]);

    const downloadExcel = () => {
        if (!results) return;

        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

        // styles
        const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "E9ECEF" } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
        const titleStyle = { font: { bold: true, size: 14 }, alignment: { horizontal: "center" } };
        const sectionStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4CAF50" } }, alignment: { horizontal: "center" } };
        const statsHeaderStyle = { font: { bold: true }, fill: { fgColor: { rgb: "D1E7DD" } } };

        const rows = [
            [{ v: `QUIZ REPORT: ${topic || 'General'}`, s: titleStyle }, '', '', ''],
            [{ v: `Date: ${dateStr}`, s: { font: { italic: true } } }],
            [],
            // Statistics Section
            [{ v: 'QUIZ STATISTICS', s: sectionStyle }, '', '', ''],
            [
                { v: 'Total Submissions', s: headerStyle },
                { v: 'Average Score', s: headerStyle },
                { v: 'Highest Score', s: headerStyle },
                { v: 'Lowest Score', s: headerStyle }
            ],
            [
                results.stats.totalSubmissions,
                `${results.stats.averageScore}%`,
                `${results.stats.highestScore}%`,
                `${results.stats.lowestScore}%`
            ],
            [],
            // Student Results Section
            [{ v: 'STUDENT RESULTS', s: sectionStyle }, '', '', ''],
            [
                { v: 'Student Name', s: headerStyle },
                { v: 'Score (%)', s: headerStyle },
                { v: 'Correct Answers', s: headerStyle },
                { v: 'Submission Time', s: headerStyle }
            ]
        ];

        // Add students
        results.submissions.forEach(s => {
            rows.push([
                s.studentName,
                `${s.score}%`,
                `${s.correctCount}/${s.totalQuestions}`,
                new Date(s.submittedAt).toLocaleTimeString()
            ]);
        });

        rows.push([]);
        // Questions Section
        rows.push([{ v: 'QUIZ QUESTIONS & CORRECT ANSWERS', s: sectionStyle }, '', '', '']);
        rows.push([
            { v: '#', s: headerStyle },
            { v: 'Question', s: headerStyle },
            { v: 'Correct Option', s: headerStyle },
            ''
        ]);

        results.questions.forEach((q, idx) => {
            rows.push([
                idx + 1,
                q.question,
                `${String.fromCharCode(65 + q.correctAnswer)}. ${q.options[q.correctAnswer]}`,
                ''
            ]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows, { cellStyles: true });

        // Merges
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Title
            { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // Stats Header
            { s: { r: 7, c: 0 }, e: { r: 7, c: 3 } }, // Results Header
            { s: { r: rows.length - results.questions.length - 2, c: 0 }, e: { r: rows.length - results.questions.length - 2, c: 3 } } // Questions Header
        ];

        // Column Widths
        ws['!cols'] = [
            { wch: 25 }, // A
            { wch: 50 }, // B
            { wch: 30 }, // C
            { wch: 20 }  // D
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Quiz Report');
        XLSX.writeFile(wb, `Quiz_Report_${topic.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: right,
            bottom: 0,
            width: 380,
            background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'linear-gradient(90deg, #4CAF50 0%, #2196F3 100%)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                            📊 Quiz Results
                        </h3>
                        <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px' }}>
                            {topic}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {results && (
                            <button
                                onClick={downloadExcel}
                                title="Download Excel"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    color: '#fff',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                📊 Download
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: '#fff',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                {loading && (
                    <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', padding: '40px 0' }}>
                        <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                        <p>Loading results...</p>
                    </div>
                )}

                {!loading && results && (
                    <>
                        {/* Statistics */}
                        <div style={{
                            background: 'rgba(76, 175, 80, 0.1)',
                            border: '1px solid rgba(76, 175, 80, 0.3)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '20px'
                        }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '14px' }}>
                                📈 Statistics
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                                        {results.stats.totalSubmissions}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Submissions
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                                        {results.stats.averageScore}%
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Average
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                                        {results.stats.highestScore}%
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Highest
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                                        {results.stats.lowestScore}%
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Lowest
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Student Submissions */}
                        <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '14px' }}>
                            👥 Student Submissions ({results.submissions.length})
                        </h4>

                        {results.submissions.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                color: 'rgba(255, 255, 255, 0.5)',
                                padding: '40px 20px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '8px'
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                                <p style={{ margin: 0, fontSize: '13px' }}>No submissions yet</p>
                            </div>
                        )}

                        {results.submissions.map((submission, idx) => (
                            <div key={idx} style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                padding: '14px',
                                marginBottom: '10px',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
                                        {submission.studentName}
                                    </div>
                                    <div style={{
                                        background: submission.score >= 70 ? '#4CAF50' : '#FF9800',
                                        color: '#fff',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        fontWeight: 'bold'
                                    }}>
                                        {submission.score}%
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                                    {submission.correctCount}/{submission.totalQuestions} correct
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                                    {new Date(submission.submittedAt).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}

                        {/* Quiz Questions */}
                        <div style={{ marginTop: '24px' }}>
                            <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '14px' }}>
                                📝 Quiz Questions ({results.questions.length})
                            </h4>
                            {results.questions.map((q, idx) => (
                                <div key={idx} style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    marginBottom: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    <div style={{ color: '#fff', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold' }}>
                                        {idx + 1}. {q.question}
                                    </div>
                                    <div style={{ fontSize: '12px' }}>
                                        {q.options.map((opt, optIdx) => (
                                            <div
                                                key={optIdx}
                                                style={{
                                                    padding: '6px 8px',
                                                    marginBottom: '4px',
                                                    borderRadius: '4px',
                                                    background: optIdx === q.correctAnswer
                                                        ? 'rgba(76, 175, 80, 0.2)'
                                                        : 'rgba(255, 255, 255, 0.03)',
                                                    color: optIdx === q.correctAnswer ? '#4CAF50' : 'rgba(255, 255, 255, 0.7)',
                                                    border: optIdx === q.correctAnswer ? '1px solid #4CAF50' : '1px solid transparent'
                                                }}
                                            >
                                                {String.fromCharCode(65 + optIdx)}. {opt}
                                                {optIdx === q.correctAnswer && ' ✓'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
