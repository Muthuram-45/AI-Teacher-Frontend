'use client';

import { useState, useEffect, useRef } from 'react';

export default function StudentQuizView({ quiz, onSubmit, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [results, setResults] = useState(null);
    const timerRef = useRef(null);

    const questions = quiz.questions || [];
    const isLastQuestion = currentIndex === questions.length - 1;

    // Timer logic
    useEffect(() => {
        if (submitted) return;

        setTimeLeft(30); // Reset timer for new question

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleNext();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [currentIndex, submitted]);

    const handleOptionSelect = (optionIndex) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
    };

    const handleNext = () => {
        if (isLastQuestion) {
            handleSubmit();
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handleSubmit = async () => {
        if (submitted) return;

        // Clear timer
        if (timerRef.current) clearInterval(timerRef.current);

        // Convert answers object to array, use null for unanswered
        const answersArray = questions.map((_, idx) =>
            answers[idx] !== undefined ? answers[idx] : null
        );

        const result = await onSubmit(answersArray);
        setResults(result);
        setSubmitted(true);
    };

    const currentQuestion = questions[currentIndex];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflow: 'auto'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1e1e2e 0%, #2a2a3e 100%)',
                borderRadius: '16px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'linear-gradient(90deg, #4CAF50 0%, #2196F3 100%)',
                    borderRadius: '16px 16px 0 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
                            📝 Quiz: {quiz.topic || 'General'}
                        </h2>
                        {!submitted && (
                            <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px' }}>
                                Question {currentIndex + 1} of {questions.length}
                            </p>
                        )}
                    </div>
                    {(!submitted || !results) && (
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: '#fff',
                                width: '30px',
                                height: '30px',
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
                    )}
                </div>

                {/* Progress Bar & Timer */}
                {!submitted && (
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '6px', position: 'relative' }}>
                        <div style={{
                            width: `${(timeLeft / 30) * 100}%`,
                            height: '100%',
                            background: timeLeft < 10 ? '#f44336' : '#FFC107',
                            transition: 'width 1s linear'
                        }} />
                        <div style={{
                            position: 'absolute',
                            right: '12px',
                            top: '12px',
                            background: timeLeft < 10 ? 'rgba(244, 67, 54, 0.2)' : 'rgba(255, 193, 7, 0.2)',
                            color: timeLeft < 10 ? '#f44336' : '#FFC107',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            border: `1px solid ${timeLeft < 10 ? '#f44336' : '#FFC107'}`
                        }}>
                            ⏱️ {timeLeft}s
                        </div>
                    </div>
                )}

                <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                    {/* Results View */}
                    {submitted && results ? (
                        <div>
                            <div style={{
                                background: results.score >= 70 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                                border: `2px solid ${results.score >= 70 ? '#4CAF50' : '#FF9800'}`,
                                borderRadius: '12px',
                                padding: '24px',
                                marginBottom: '24px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                                    {results.score >= 90 ? '🎉' : results.score >= 70 ? '👍' : '📚'}
                                </div>
                                <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '32px' }}>
                                    {results.score}%
                                </h3>
                                <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
                                    {results.correctCount} out of {results.totalQuestions} correct
                                </p>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ color: '#fff', marginBottom: '16px' }}>Review:</h4>
                                {results.results.map((result, idx) => (
                                    <div key={idx} style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        padding: '12px',
                                        marginBottom: '10px',
                                        border: `1px solid ${result.isCorrect ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`
                                    }}>
                                        <p style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                                            {idx + 1}. {result.question}
                                        </p>
                                        <div style={{ fontSize: '13px' }}>
                                            <p style={{ margin: '2px 0', color: result.isCorrect ? '#4CAF50' : '#f44336' }}>
                                                Your answer: {result.studentAnswer !== null ? quiz.questions[idx].options[result.studentAnswer] : 'No answer'}
                                            </p>
                                            {!result.isCorrect && (
                                                <p style={{ margin: '2px 0', color: '#4CAF50' }}>
                                                    Correct: {quiz.questions[idx].options[result.correctAnswer]}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={onClose}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'linear-gradient(90deg, #4CAF50 0%, #2196F3 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Close Result
                            </button>
                        </div>
                    ) : (
                        /* Question View */
                        <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                            {currentQuestion && (
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ color: '#fff', marginBottom: '24px', fontSize: '18px', lineHeight: '1.5' }}>
                                        {currentQuestion.question}
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {currentQuestion.options.map((option, optIdx) => {
                                            const isSelected = answers[currentIndex] === optIdx;
                                            return (
                                                <button
                                                    key={optIdx}
                                                    onClick={() => handleOptionSelect(optIdx)}
                                                    style={{
                                                        padding: '16px',
                                                        background: isSelected
                                                            ? 'rgba(33, 150, 243, 0.15)'
                                                            : 'rgba(255, 255, 255, 0.05)',
                                                        border: isSelected
                                                            ? '2px solid #2196F3'
                                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '10px',
                                                        color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.8)',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontSize: '15px',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <span style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        background: isSelected ? '#2196F3' : 'rgba(255,255,255,0.1)',
                                                        color: '#fff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        marginRight: '12px',
                                                        fontSize: '12px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {String.fromCharCode(65 + optIdx)}
                                                    </span>
                                                    {option}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Footer Navigation */}
                            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleNext}
                                    style={{
                                        padding: '12px 32px',
                                        background: 'linear-gradient(90deg, #4CAF50 0%, #2196F3 100%)',
                                        border: 'none',
                                        borderRadius: '30px',
                                        color: '#fff',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
                                        transition: 'transform 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {isLastQuestion ? 'Complete Quiz' : 'Next Question'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
