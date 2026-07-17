'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const QUESTIONS = [
  {
    q: 'What is a Credit/CIBIL Score?',
    options: [
      'A score tracking how much money you have in bank accounts.',
      'A 3-digit summary of your credit history and loan repayment behavior.',
      'The amount of tax you owe to the government.',
      'A ranking of your employment seniority.'
    ],
    ans: 1,
    explanation: 'A Credit/CIBIL score is a 3-digit number (ranging from 300 to 900) that reflects your borrowing history and creditworthiness. Higher scores lead to lower interest rates.'
  },
  {
    q: 'If you pay only the "Minimum Amount Due" on a credit card statement:',
    options: [
      'No interest is charged on the outstanding balance.',
      'Your credit score automatically rises to 900.',
      'You avoid late fees, but high interest continues to accumulate on the unpaid balance.',
      'The bank cancels your card immediately.'
    ],
    ans: 2,
    explanation: 'Paying the Minimum Amount Due only saves you from late payment penalties. The remaining outstanding balance continues to accrue high interest rates daily.'
  },
  {
    q: 'What does EMI stand for in the context of loans?',
    options: [
      'Earned Monthly Income',
      'Equated Monthly Installment',
      'Electronic Money Transfer',
      'Emergency Medical Insurance'
    ],
    ans: 1,
    explanation: 'EMI stands for Equated Monthly Installment. It is a fixed payment amount made by a borrower to a lender at a specified date each calendar month.'
  },
  {
    q: 'A Home or Education Loan "Moratorium Period" refers to:',
    options: [
      'A period during which interest rates are permanently doubled.',
      'The deadline by which the entire loan must be paid back in one payment.',
      'A temporary holiday period during which the borrower is not required to pay EMIs.',
      'The legal process of seizing default collateral.'
    ],
    ans: 2,
    explanation: 'A moratorium (or EMI holiday) is a period during which repayments are temporarily paused, usually while studying or during economic emergencies. Interest may still accrue.'
  },
  {
    q: 'Which of the following is a key advantage of taking a Gold Loan?',
    options: [
      'It requires a high credit score above 850.',
      'It offers very quick disbursals because it is backed by physical gold collateral.',
      'You never have to pay back the borrowed principal.',
      'The bank owns the gold permanently from day one.'
    ],
    ans: 1,
    explanation: 'Because gold loans are secured by gold jewelry, banks face lower risk and can approve/disburse funds in as little as 30 minutes, even with low credit scores.'
  }
];

export default function GamesPage() {
  const [gameState, setGameState] = useState('intro'); // intro, playing, results
  const [currQ, setCurrQ] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const startQuiz = () => {
    setGameState('playing');
    setCurrQ(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setScore(0);
  };

  const handleOptionSelect = (idx) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
  };

  const submitAnswer = () => {
    if (selectedOpt === null || isAnswered) return;
    setIsAnswered(true);
    if (selectedOpt === QUESTIONS[currQ].ans) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currQ < QUESTIONS.length - 1) {
      setCurrQ(q => q + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      setGameState('results');
    }
  };

  const getRank = () => {
    const pct = (score / QUESTIONS.length) * 100;
    if (pct === 100) return { title: '👑 Financial Guru', desc: 'Flawless performance! You have masterful command of personal finance and borrowing principles.' };
    if (pct >= 80) return { title: '🧠 Smart Investor', desc: 'Impressive! You understand credit scores, interest rates, and loan features very well.' };
    if (pct >= 60) return { title: '📈 Budgeting Enthusiast', desc: 'Good job! You have basic financial literacy but can brush up on advanced loan details.' };
    return { title: '🌱 Finance Learner', desc: 'Keep learning! Financial concepts can be tricky, but mastering them saves you money.' };
  };

  const rank = getRank();

  return (
    <>
      <Header />
      <main className="main-content flex-center" style={{ minHeight: '85vh', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: '650px', width: '100%', margin: '0 auto' }}>
          
          {gameState === 'intro' && (
            <div style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '12px' }}>
                H2H Finance Challenge
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, marginBottom: '32px' }}>
                Test your knowledge of loans, credit scores, interest rates, and financial smarts! Complete the 5-question trivia to earn your smartness badge.
              </p>
              <button onClick={startQuiz} className="btn btn-primary" style={{ padding: '14px 40px', borderRadius: '10px', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                Start Challenge
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(20px)'
            }}>
              {/* Progress Tracker */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                  QUESTION {currQ + 1} OF {QUESTIONS.length}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 700 }}>
                  Score: {score}/{QUESTIONS.length}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', width: '100%', marginBottom: '32px', overflow: 'hidden' }}>
                <div style={{ background: 'var(--color-primary)', height: '100%', width: `${((currQ + 1) / QUESTIONS.length) * 100}%`, transition: 'width 0.3s ease' }} />
              </div>

              {/* Question */}
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '24px', lineHeight: 1.4 }}>
                {QUESTIONS[currQ].q}
              </h2>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {QUESTIONS[currQ].options.map((opt, i) => {
                  let optStyle = {
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '10px',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  };

                  if (!isAnswered) {
                    if (selectedOpt === i) {
                      optStyle.background = 'rgba(99, 102, 241, 0.08)';
                      optStyle.borderColor = 'var(--color-accent)';
                      optStyle.color = 'var(--color-text-primary)';
                    }
                  } else {
                    if (i === QUESTIONS[currQ].ans) {
                      optStyle.background = 'rgba(0, 215, 86, 0.08)';
                      optStyle.borderColor = '#00d756';
                      optStyle.color = '#ffffff';
                      optStyle.fontWeight = 700;
                    } else if (selectedOpt === i) {
                      optStyle.background = 'rgba(239, 68, 68, 0.08)';
                      optStyle.borderColor = '#ef4444';
                      optStyle.color = '#ffffff';
                    } else {
                      optStyle.opacity = 0.5;
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(i)}
                      disabled={isAnswered}
                      style={optStyle}
                      onMouseOver={(e) => {
                        if (!isAnswered && selectedOpt !== i) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isAnswered && selectedOpt !== i) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        }
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons & Explanation */}
              {isAnswered && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderLeft: '4px solid var(--color-primary)',
                  padding: '16px 20px',
                  borderRadius: '0 8px 8px 0',
                  marginBottom: '24px',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5
                }}>
                  💡 <strong>Explanation:</strong> {QUESTIONS[currQ].explanation}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {!isAnswered ? (
                  <button
                    onClick={submitAnswer}
                    disabled={selectedOpt === null}
                    className="btn btn-primary"
                    style={{ padding: '12px 32px', borderRadius: '8px', cursor: selectedOpt === null ? 'not-allowed' : 'pointer' }}
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="btn btn-primary"
                    style={{ padding: '12px 32px', borderRadius: '8px' }}
                  >
                    {currQ === QUESTIONS.length - 1 ? 'See Results' : 'Next Question'}
                  </button>
                )}
              </div>
            </div>
          )}

          {gameState === 'results' && (
            <div style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(20px)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏆</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Challenge Completed!
              </h2>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '24px' }}>
                Score: {score} / {QUESTIONS.length}
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: 'var(--border-light)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '32px'
              }}>
                <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
                  {rank.title}
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {rank.desc}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={startQuiz} className="btn btn-secondary" style={{ padding: '12px 24px', borderRadius: '8px' }}>
                  Play Again
                </button>
                <Link href="/check" className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
                  Check Loan Eligibility
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
