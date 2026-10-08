'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  IconShuttlecock,
  IconTrophy,
  IconClock,
  IconPlay,
  IconPause,
  IconRefreshCw,
  IconChevronRight,
  IconCheck,
} from '@/components/icons';

// Types for the simulation steps
interface DemoStep {
  title: string;
  shortDesc: string;
  duration: number; // base duration in milliseconds at 1x speed
}

const DEMO_STEPS: DemoStep[] = [
  { title: 'Create Tournament', shortDesc: 'Fill out location, details and dates', duration: 7000 },
  { title: 'Add Event', shortDesc: 'Select template standard categories', duration: 7000 },
  { title: 'Player Registration', shortDesc: 'Simulate player sign-up and approval', duration: 8000 },
  { title: 'Generate Fixtures', shortDesc: 'Generate seeded brackets automatically', duration: 6000 },
  { title: 'Appoint Umpire', shortDesc: 'Assign qualified match officials', duration: 6000 },
  { title: 'Start Match', shortDesc: 'Activate court and scoring systems', duration: 5000 },
  { title: 'Score Match Live', shortDesc: 'Simulate point-by-point live play', duration: 15000 },
  { title: 'View Champion', shortDesc: 'Review results and award podiums', duration: 8000 },
];

export default function LiveDemoPage() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [elapsed, setElapsed] = useState<number>(0);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; visible: boolean; clicking: boolean }>({ x: 100, y: 100, visible: false, clicking: false });
  const [toast, setToast] = useState<string | null>(null);

  // Theme configuration inside the simulated browser viewport
  const [demoTheme, setDemoTheme] = useState<'dark' | 'light'>('dark');

  // Simulated Input & Process States
  const [typedTitle, setTypedTitle] = useState('');
  const [typedLocation, setTypedLocation] = useState('');
  const [eventAdded, setEventAdded] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [registrationsApproved, setRegistrationsApproved] = useState(false);
  const [fixturesGenerated, setFixturesGenerated] = useState(false);
  const [assignedUmpire, setAssignedUmpire] = useState('');
  const [matchStarted, setMatchStarted] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [server, setServer] = useState<'p1' | 'p2'>('p1');
  const [scoreCompleted, setScoreCompleted] = useState(false);

  // References for coordinates calculation
  const mockContainerRef = useRef<HTMLDivElement>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const elapsedRef = useRef<number>(0);

  // Refs for tracking variables across setInterval closures
  const isPausedRef = useRef(isPaused);
  const currentStepRef = useRef(currentStep);
  const speedRef = useRef(speed);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Active step duration scaled by playback speed
  const stepDuration = DEMO_STEPS[currentStep].duration / speed;

  // Function to show toast
  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Helper to get element coordinates relative to mock viewport container
  const moveCursorToElement = (selector: string, clickDelay = 800) => {
    if (!mockContainerRef.current) return;
    const element = mockContainerRef.current.querySelector(selector);
    if (element) {
      const containerRect = mockContainerRef.current.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      const targetX = rect.left - containerRect.left + rect.width / 2;
      const targetY = rect.top - containerRect.top + rect.height / 2;

      setCursorPos(prev => ({ ...prev, visible: true, clicking: false }));

      // Animate cursor movement
      let startX = cursorPos.x;
      let startY = cursorPos.y;
      const duration = 600 / speedRef.current;
      const startTime = performance.now();

      const animate = (time: number) => {
        const elapsedVal = time - startTime;
        const progress = Math.min(elapsedVal / duration, 1);
        // Easing out cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        setCursorPos(prev => ({
          ...prev,
          x: startX + (targetX - startX) * ease,
          y: startY + (targetY - startY) * ease
        }));

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Trigger click animation
          setTimeout(() => {
            setCursorPos(prev => ({ ...prev, clicking: true }));
            setTimeout(() => {
              setCursorPos(prev => ({ ...prev, clicking: false }));
            }, 150);
          }, clickDelay / speedRef.current);
        }
      };

      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };

  // Handle resets when switching steps
  const resetDemoStateToStep = (stepIdx: number) => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setElapsed(0);
    elapsedRef.current = 0;
    setCursorPos({ x: 250, y: 150, visible: false, clicking: false });

    // Step-specific initialization
    if (stepIdx === 0) {
      setTypedTitle('');
      setTypedLocation('');
      setEventAdded(false);
      setShowEventModal(false);
      setRegistrationsApproved(false);
      setFixturesGenerated(false);
      setAssignedUmpire('');
      setMatchStarted(false);
      setP1Score(0);
      setP2Score(0);
      setScoreCompleted(false);
    } else if (stepIdx === 1) {
      setTypedTitle('Mumbai Super Cup 2026');
      setTypedLocation('CCI Club, Mumbai');
      setEventAdded(false);
      setShowEventModal(false);
      setEventDropdownOpen(false);
      setSelectedMasterId('');
      setRegistrationsApproved(false);
      setFixturesGenerated(false);
      setAssignedUmpire('');
      setMatchStarted(false);
      setP1Score(0);
      setP2Score(0);
      setScoreCompleted(false);
    } else if (stepIdx === 2) {
      setTypedTitle('Mumbai Super Cup 2026');
      setTypedLocation('CCI Club, Mumbai');
      setEventAdded(true);
      setSelectedMasterId('ms_open');
      setRegistrationsApproved(false);
      setFixturesGenerated(false);
      setAssignedUmpire('');
      setMatchStarted(false);
      setP1Score(0);
      setP2Score(0);
      setScoreCompleted(false);
    } else if (stepIdx === 3) {
      setTypedTitle('Mumbai Super Cup 2026');
      setTypedLocation('CCI Club, Mumbai');
      setEventAdded(true);
      setSelectedMasterId('ms_open');
      setRegistrationsApproved(true);
      setFixturesGenerated(false);
      setAssignedUmpire('');
      setMatchStarted(false);
      setP1Score(0);
      setP2Score(0);
      setScoreCompleted(false);
    } else if (stepIdx === 4) {
      setTypedTitle('Mumbai Super Cup 2026');
      setTypedLocation('CCI Club, Mumbai');
      setEventAdded(true);
      setSelectedMasterId('ms_open');
      setRegistrationsApproved(true);
      setFixturesGenerated(true);
      setAssignedUmpire('');
      setMatchStarted(false);
      setP1Score(0);
      setP2Score(0);
      setScoreCompleted(false);
    } else if (stepIdx === 5) {
      setTypedTitle('Mumbai Super Cup 2026');
      setTypedLocation('CCI Club, Mumbai');
      setEventAdded(true);
      setSelectedMasterId('ms_open');
      setRegistrationsApproved(true);
      setFixturesGenerated(true);
      setAssignedUmpire('Suresh Nair');
      setMatchStarted(false);
      setP1Score(0);
      setP2Score(0);
      setScoreCompleted(false);
    } else if (stepIdx === 6) {
      setTypedTitle('Mumbai Super Cup 2026');
      setTypedLocation('CCI Club, Mumbai');
      setEventAdded(true);
      setSelectedMasterId('ms_open');
      setRegistrationsApproved(true);
      setFixturesGenerated(true);
      setAssignedUmpire('Suresh Nair');
      setMatchStarted(true);
      setP1Score(0);
      setP2Score(0);
      setServer('p1');
      setScoreCompleted(false);
    } else if (stepIdx === 7) {
      setTypedTitle('Mumbai Super Cup 2026');
      setTypedLocation('CCI Club, Mumbai');
      setEventAdded(true);
      setSelectedMasterId('ms_open');
      setRegistrationsApproved(true);
      setFixturesGenerated(true);
      setAssignedUmpire('Suresh Nair');
      setMatchStarted(true);
      setP1Score(21);
      setP2Score(18);
      setScoreCompleted(true);
    }
  };

  // Step Simulation Actions Triggered on Step Entry
  useEffect(() => {
    resetDemoStateToStep(currentStep);
    const stepAtStart = currentStep;
    let activeInterval: NodeJS.Timeout | null = null;

    // Setup sequence actions for each step
    const runSimulationActions = async () => {
      // Step 1: Create Tournament Form Input Simulation
      if (currentStep === 0) {
        // Wait 500ms, hover name field
        await new Promise(r => setTimeout(r, 600 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        moveCursorToElement('.demo-input-name', 200);
        await new Promise(r => setTimeout(r, 800 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;

        // Type Name
        const titleStr = 'Mumbai Super Cup 2026';
        for (let i = 0; i <= titleStr.length; i++) {
          if (currentStepRef.current !== stepAtStart) return;
          setTypedTitle(titleStr.slice(0, i));
          await new Promise(r => setTimeout(r, 60 / speedRef.current));
        }

        // Hover location field
        if (currentStepRef.current !== stepAtStart) return;
        await new Promise(r => setTimeout(r, 400 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        moveCursorToElement('.demo-input-loc', 200);
        await new Promise(r => setTimeout(r, 800 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;

        // Type Location
        const locStr = 'CCI Club, Mumbai';
        for (let i = 0; i <= locStr.length; i++) {
          if (currentStepRef.current !== stepAtStart) return;
          setTypedLocation(locStr.slice(0, i));
          await new Promise(r => setTimeout(r, 60 / speedRef.current));
        }

        // Hover Submit Button
        if (currentStepRef.current !== stepAtStart) return;
        await new Promise(r => setTimeout(r, 500 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        moveCursorToElement('.demo-btn-submit', 600);
        await new Promise(r => setTimeout(r, 1200 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        triggerToast('🏆 Tournament "Mumbai Super Cup 2026" Created!');
      }

      // Step 2: Event Assignment
      if (currentStep === 1) {
        await new Promise(r => setTimeout(r, 800 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        moveCursorToElement('.demo-btn-add-event', 400);
        await new Promise(r => setTimeout(r, 1200 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        setShowEventModal(true);

        // Hover Template dropdown
        await new Promise(r => setTimeout(r, 600 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        moveCursorToElement('.demo-select-template', 400);
        await new Promise(r => setTimeout(r, 1000 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        setEventDropdownOpen(true);

        // Hover Option 1
        await new Promise(r => setTimeout(r, 600 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        moveCursorToElement('.demo-option-ms', 300);
        await new Promise(r => setTimeout(r, 900 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        setSelectedMasterId('ms_open');
        setEventDropdownOpen(false);

        // Hover Add Template Button
        await new Promise(r => setTimeout(r, 500 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        moveCursorToElement('.demo-btn-save-event', 400);
        await new Promise(r => setTimeout(r, 1000 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        setEventAdded(true);
        setShowEventModal(false);
        triggerToast('🏸 Added Event template "Men\'s Singles"!');
      }

      // Step 3: Player Registration Approval
      if (currentStep === 2) {
        await new Promise(r => setTimeout(r, 1200 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        moveCursorToElement('.demo-btn-approve-all', 600);
        await new Promise(r => setTimeout(r, 1600 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        setRegistrationsApproved(true);
        triggerToast('⚡ All 8 Player registrations approved successfully!');
      }

      // Step 4: Draw generation
      if (currentStep === 3) {
        await new Promise(r => setTimeout(r, 800 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        moveCursorToElement('.demo-btn-generate-fixtures', 600);
        await new Promise(r => setTimeout(r, 1400 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        setFixturesGenerated(true);
        triggerToast('⚡ Seeded Brackets generated automatically!');
      }

      // Step 5: Umpire Assignment
      if (currentStep === 4) {
        await new Promise(r => setTimeout(r, 800 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        moveCursorToElement('.demo-btn-assign-umpire', 600);
        await new Promise(r => setTimeout(r, 1400 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        setAssignedUmpire('Suresh Nair');
        triggerToast('📋 Umpire Suresh Nair assigned to Court 1!');
      }

      // Step 6: Start Match
      if (currentStep === 5) {
        await new Promise(r => setTimeout(r, 1000 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        moveCursorToElement('.demo-btn-start-match', 600);
        await new Promise(r => setTimeout(r, 1400 / speedRef.current));
        if (currentStepRef.current !== stepAtStart) return;
        setMatchStarted(true);
        triggerToast('🟢 Court 1 Live Scoring Activated!');
      }

      // Step 7: Point-by-Point Live Score Simulation
      if (currentStep === 6) {
        if (currentStepRef.current !== stepAtStart) return;
        setServer('p1');
        const pointsSeq = [
          { p1: 1, p2: 0, s: 'p1' },
          { p1: 1, p2: 1, s: 'p2' },
          { p1: 2, p2: 1, s: 'p1' },
          { p1: 3, p2: 1, s: 'p1' },
          { p1: 3, p2: 2, s: 'p2' },
          { p1: 3, p2: 3, s: 'p2' },
          { p1: 4, p2: 3, s: 'p1' },
          { p1: 4, p2: 4, s: 'p2' },
          { p1: 5, p2: 4, s: 'p1' },
          { p1: 5, p2: 5, s: 'p2' },
          { p1: 11, p2: 9, s: 'p1' }, // Fast forward
          { p1: 11, p2: 10, s: 'p2' },
          { p1: 12, p2: 10, s: 'p1' },
          { p1: 15, p2: 13, s: 'p1' },
          { p1: 18, p2: 17, s: 'p1' },
          { p1: 19, p2: 17, s: 'p1' },
          { p1: 20, p2: 17, s: 'p1' }, // Match Point
          { p1: 20, p2: 18, s: 'p2' },
          { p1: 21, p2: 18, s: 'p1' }, // Completed
        ];

        let index = 0;
        const intervalDuration = 12000 / pointsSeq.length;
        const scoreInterval = setInterval(() => {
          if (currentStepRef.current !== 6) {
            clearInterval(scoreInterval);
            return;
          }
          if (isPausedRef.current) return;
          if (index < pointsSeq.length) {
            const pt = pointsSeq[index];
            setP1Score(pt.p1);
            setP2Score(pt.p2);
            setServer(pt.s as 'p1' | 'p2');

            // Hover buttons simulating umpire tap
            if (pt.s === 'p1') {
              moveCursorToElement('.demo-scoring-p1-btn', 100);
            } else {
              moveCursorToElement('.demo-scoring-p2-btn', 100);
            }

            index++;
          } else {
            setScoreCompleted(true);
            triggerToast('🎉 Rajesh Kumar Wins 21-18! Match Completed.');
            clearInterval(scoreInterval);
          }
        }, intervalDuration / speedRef.current);

        activeInterval = scoreInterval;
      }
    };

    runSimulationActions();

    return () => {
      if (activeInterval) clearInterval(activeInterval);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [currentStep, speed]);

  // Master Timer loop to advance steps automatically
  useEffect(() => {
    if (isPaused) {
      if (stepTimerRef.current) {
        clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
      return;
    }

    const intervalTime = 50;
    const timerInterval = setInterval(() => {
      const activeStepDuration = DEMO_STEPS[currentStepRef.current].duration / speedRef.current;

      elapsedRef.current += intervalTime;
      if (elapsedRef.current >= activeStepDuration) {
        elapsedRef.current = 0;
        setElapsed(0);
        setCurrentStep(curr => {
          if (curr < DEMO_STEPS.length - 1) {
            return curr + 1;
          } else {
            return 0; // Loop back to start
          }
        });
      } else {
        setElapsed(elapsedRef.current);
      }
    }, intervalTime);

    stepTimerRef.current = timerInterval;

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isPaused]);

  // Manual Step Selection
  const selectStep = (idx: number) => {
    setCurrentStep(idx);
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    resetDemoStateToStep(0);
  };

  const handleNextStep = () => {
    if (currentStep < DEMO_STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      setCurrentStep(0);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  // Dynamic progress percentage for active step
  const progressPct = Math.min((elapsed / stepDuration) * 100, 100);

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <nav className="nav" style={{ borderBottom: '1px solid var(--border)', zIndex: 10 }}>
        <div className="container-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, var(--accent), #3b82f6)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconShuttlecock size={18} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>MatchPoint</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="badge badge-accent" style={{ fontSize: 11, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="live-dot" style={{ background: '#f59e0b', width: 6, height: 6 }} />
              Live Interactive Demo
            </span>
            <Link href="/" className="btn btn-ghost" style={{ fontSize: 13 }}>
              Exit Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="container-app" style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr', gap: 32, padding: '24px 0 40px' }}>

        {/* Left Sidebar Checklist */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>
              Interactive Tour
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              Watch how MatchPoint automates badminton events from creation to championship.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DEMO_STEPS.map((step, idx) => {
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;
                return (
                  <button
                    key={idx}
                    onClick={() => selectStep(idx)}
                    style={{
                      background: isActive ? 'var(--accent-subtle)' : 'transparent',
                      border: '1px solid ' + (isActive ? 'var(--accent)' : 'transparent'),
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      width: '100%',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                    className="demo-step-btn"
                  >
                    <div style={{
                      width: 22, height: 22,
                      borderRadius: '50%',
                      background: isCompleted ? '#22c55e' : isActive ? 'var(--accent)' : 'var(--bg-elevated)',
                      border: '1px solid ' + (isCompleted ? '#22c55e' : isActive ? 'var(--accent)' : 'var(--border)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isCompleted || isActive ? '#fff' : 'var(--text-muted)',
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {isCompleted ? <IconCheck size={12} /> : idx + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}>
                        {step.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {step.shortDesc}
                      </div>

                      {isActive && (
                        <div style={{ width: '100%', height: 3, background: 'var(--bg-elevated)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent)', transition: 'width 0.05s linear' }} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 16, fontSize: 11, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>💡</span>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Tip: Click manual steps</span>
            </div>
            You can pause the tour at any time, click any step in the checklist, or adjust speeds to inspect individual screens.
          </div>
        </aside>

        {/* Right Dashboard Mock Environment */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Controls Bar */}
          <div className="glass-card" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={handlePrevStep} className="btn btn-ghost" style={{ padding: 8, borderRadius: '50%' }} title="Previous Step">
                <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}><IconChevronRight size={18} /></span>
              </button>
              <button onClick={handlePauseToggle} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}>
                {isPaused ? <IconPlay size={14} /> : <IconPause size={14} />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button onClick={handleNextStep} className="btn btn-ghost" style={{ padding: 8, borderRadius: '50%' }} title="Next Step">
                <IconChevronRight size={18} />
              </button>
              <button onClick={handleRestart} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13 }}>
                <IconRefreshCw size={12} />
                Restart
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Theme Toggle option */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Theme:</span>
                <button
                  onClick={() => setDemoTheme(demoTheme === 'light' ? 'dark' : 'light')}
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  className="btn-theme-toggle"
                >
                  {demoTheme === 'light' ? '☀️ Light' : '🌙 Dark'}
                </button>
              </div>

              {/* Speed control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Speed:</span>
                {['1x', '2x'].map((spdVal) => {
                  const numSpd = parseInt(spdVal);
                  const isSel = numSpd === speed;
                  return (
                    <button
                      key={spdVal}
                      onClick={() => setSpeed(numSpd)}
                      style={{
                        background: isSel ? 'var(--accent)' : 'var(--bg-elevated)',
                        color: isSel ? '#fff' : 'var(--text-secondary)',
                        border: '1px solid ' + (isSel ? 'var(--accent)' : 'var(--border)'),
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {spdVal}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Frame Simulator Container */}
          <div
            ref={mockContainerRef}
            className={`glass-card ${demoTheme === 'dark' ? 'sim-dark' : 'sim-light'}`}
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              minHeight: 520,
              background: 'var(--sim-bg-primary)',
              border: '1px solid var(--sim-border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              transition: 'background 0.3s ease, border-color 0.3s ease',
            }}
          >
            {/* Device Bar / Browser Header Mock */}
            <div style={{
              height: 42,
              background: 'var(--sim-window-bg)',
              borderBottom: '1px solid var(--sim-window-border)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: 12,
              userSelect: 'none',
            }}>
              {/* Window Dots */}
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              </div>

              {/* URL Address Bar */}
              <div style={{
                flex: 1,
                maxWidth: 420,
                margin: '0 auto',
                background: 'var(--sim-address-bg)',
                border: '1px solid var(--sim-address-border)',
                borderRadius: 'var(--radius-sm)',
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: 'var(--sim-text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                🔒 https://matchpoint.io/dashboard/{currentStep <= 4 ? 'tournaments' : 'umpire/scoring'}
              </div>
            </div>

            {/* Dashboard Workspace Mock */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, position: 'relative' }}>

              {/* SCENE 1: Create Tournament Form */}
              {currentStep === 0 && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 480, margin: '0 auto', width: '100%' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--sim-text-primary)', marginBottom: 4 }}>
                      Create New Tournament
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--sim-text-muted)' }}>
                      Enter core parameters to publish your badminton tournament website instantly.
                    </p>
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ color: 'var(--sim-text-secondary)' }}>Tournament Name</label>
                    <input
                      readOnly
                      placeholder="e.g. Mumbai Open Championship"
                      className="input demo-input-name"
                      value={typedTitle}
                      style={{ background: 'var(--sim-input-bg)', borderColor: typedTitle ? 'var(--accent)' : 'var(--sim-border)', color: 'var(--sim-text-primary)' }}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ color: 'var(--sim-text-secondary)' }}>Location / Club</label>
                    <input
                      readOnly
                      placeholder="e.g. NSCI, Worli"
                      className="input demo-input-loc"
                      value={typedLocation}
                      style={{ background: 'var(--sim-input-bg)', borderColor: typedLocation ? 'var(--accent)' : 'var(--sim-border)', color: 'var(--sim-text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label" style={{ color: 'var(--sim-text-secondary)' }}>Format Type</label>
                      <select disabled className="input" style={{ background: 'var(--sim-input-bg)', borderColor: 'var(--sim-border)', color: 'var(--sim-text-primary)' }} defaultValue="individual">
                        <option value="individual">Individual Draws</option>
                        <option value="team">Franchise Tie Configs</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label" style={{ color: 'var(--sim-text-secondary)' }}>Initial Status</label>
                      <input readOnly className="input" style={{ background: 'var(--sim-input-bg)', borderColor: 'var(--sim-border)', color: 'var(--sim-text-primary)' }} value="Draft" />
                    </div>
                  </div>

                  <button className="btn btn-primary demo-btn-submit" style={{ marginTop: 10, width: '100%', boxShadow: '0 0 15px rgba(37, 99, 235, 0.3)' }}>
                    Publish Tournament
                  </button>
                </div>
              )}

              {/* SCENE 2: Add Event to Tournament */}
              {currentStep === 1 && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--sim-border)', paddingBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--sim-text-primary)' }}>
                        {typedTitle || 'Mumbai Super Cup 2026'}
                      </h3>
                      <p style={{ fontSize: 11, color: 'var(--sim-text-muted)' }}>📍 {typedLocation || 'CCI Club, Mumbai'} · Status: Draft</p>
                    </div>
                    <button className="btn btn-primary demo-btn-add-event" style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      ➕ Add Event Template
                    </button>
                  </div>

                  {/* Empty state/Events card grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                    {eventAdded ? (
                      <div className="glass-card animate-scale-up animate-fade-in" style={{ padding: 16, border: '1px solid var(--accent)', background: 'var(--sim-bg-card)', boxShadow: 'none' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>
                          Template Event
                        </div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--sim-text-primary)' }}>Men's Singles</h4>
                        <div style={{ fontSize: 11, color: 'var(--sim-text-secondary)', marginTop: 8 }}>
                          Format: Knockout · Limit: 16
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--sim-text-muted)', marginTop: 4 }}>
                          Age: No Limit · Gender: Male
                        </div>
                      </div>
                    ) : (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--sim-text-muted)', border: '1px dashed var(--sim-border)', borderRadius: 'var(--radius-md)' }}>
                        No events added to this tournament yet. Add event templates to enable registration.
                      </div>
                    )}
                  </div>

                  {/* Add Event Modal overlay simulation */}
                  {showEventModal && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(3px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 5,
                    }}>
                      <div className="glass-card animate-scale-up" style={{ width: 400, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--sim-modal-bg)', border: '1px solid var(--sim-border)', borderRadius: 'var(--radius-md)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--sim-text-primary)' }}>Add Event Template</h4>

                        <div className="input-group" style={{ position: 'relative' }}>
                          <label className="input-label" style={{ color: 'var(--sim-text-secondary)' }}>Select Master Event</label>
                          <div className="input demo-select-template" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'var(--sim-input-bg)', borderColor: 'var(--sim-border)', color: 'var(--sim-text-primary)' }}>
                            <span>{selectedMasterId ? "Men's Singles" : "Choose from Dictionary..."}</span>
                            <span>▼</span>
                          </div>

                          {eventDropdownOpen && (
                            <div style={{
                              position: 'absolute',
                              top: '100%', left: 0, right: 0,
                              background: 'var(--sim-modal-bg)',
                              border: '1px solid var(--sim-border)',
                              borderRadius: 'var(--radius-sm)',
                              zIndex: 6,
                              marginTop: 4,
                              boxShadow: '0 10px 20px rgba(0,0,0,0.25)',
                            }}>
                              <div className="demo-option-ms" style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', background: 'var(--accent)', color: '#fff' }}>
                                Men's Singles
                              </div>
                              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--sim-text-muted)', pointerEvents: 'none' }}>
                                Women's Singles
                              </div>
                              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--sim-text-muted)', pointerEvents: 'none' }}>
                                Men's Doubles
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="input-group">
                            <label className="input-label" style={{ color: 'var(--sim-text-secondary)' }}>Entry Limit</label>
                            <input readOnly className="input" defaultValue="16" style={{ background: 'var(--sim-input-bg)', borderColor: 'var(--sim-border)', color: 'var(--sim-text-primary)' }} />
                          </div>
                          <div className="input-group">
                            <label className="input-label" style={{ color: 'var(--sim-text-secondary)' }}>Tournament Format</label>
                            <input readOnly className="input" defaultValue="Knockout" style={{ background: 'var(--sim-input-bg)', borderColor: 'var(--sim-border)', color: 'var(--sim-text-primary)' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                          <button className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }}>Cancel</button>
                          <button className="btn btn-primary demo-btn-save-event" style={{ padding: '8px 14px', fontSize: 12 }}>Add Event</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SCENE 3: Player Registrations list (NEW STEP) */}
              {currentStep === 2 && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--sim-border)', paddingBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--sim-text-primary)' }}>
                        Mumbai Super Cup 2026 · Player Registrations
                      </h3>
                      <p style={{ fontSize: 11, color: 'var(--sim-text-muted)' }}>Manage self-service entries for Men's Singles Open</p>
                    </div>

                    <button
                      className="btn btn-primary demo-btn-approve-all"
                      style={{
                        padding: '8px 14px',
                        fontSize: 12,
                        background: registrationsApproved ? '#22c55e' : 'var(--accent)',
                        borderColor: registrationsApproved ? '#22c55e' : 'var(--accent)',
                        boxShadow: 'none',
                        pointerEvents: 'none'
                      }}
                    >
                      {registrationsApproved ? '✓ All Approved' : '⚡ Approve All (8)'}
                    </button>
                  </div>

                  {/* Player registrations table representation */}
                  <div style={{ border: '1px solid var(--sim-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--sim-bg-card)' }}>
                    <div style={{ display: 'flex', background: 'var(--sim-bg-secondary)', borderBottom: '1px solid var(--sim-border)', padding: '8px 16px', fontSize: 11, fontWeight: 600, color: 'var(--sim-text-muted)', textTransform: 'uppercase' }}>
                      <span style={{ width: '40%' }}>Player Name</span>
                      <span style={{ width: '40%' }}>Email Address</span>
                      <span style={{ width: '20%', textAlign: 'right' }}>Status</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 220, overflowY: 'auto' }}>
                      {[
                        { name: 'Rajesh Kumar', email: 'rajesh@matchpoint.io' },
                        { name: 'Vikas Patel', email: 'vikas@matchpoint.io' },
                        { name: 'Rahul Singh', email: 'rahul@matchpoint.io' },
                        { name: 'Suresh Nair', email: 'umpire@matchpoint.io' },
                        { name: 'Neha Gupta', email: 'neha@matchpoint.io' },
                      ].map((reg, rIdx) => (
                        <div key={rIdx} style={{ display: 'flex', padding: '10px 16px', fontSize: 12, borderBottom: rIdx === 4 ? 'none' : '1px solid var(--sim-divider)', color: 'var(--sim-text-primary)', alignItems: 'center' }}>
                          <span style={{ width: '40%', fontWeight: 500 }}>{reg.name}</span>
                          <span style={{ width: '40%', color: 'var(--sim-text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{reg.email}</span>
                          <span style={{ width: '20%', textAlign: 'right' }}>
                            <span
                              className={`badge badge-${registrationsApproved ? 'approved' : 'pending'}`}
                              style={{
                                fontSize: 9,
                                padding: '2px 8px',
                                background: registrationsApproved ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                                color: registrationsApproved ? '#22c55e' : '#f59e0b'
                              }}
                            >
                              {registrationsApproved ? 'Approved' : 'Pending'}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SCENE 4: Generate Fixtures / Brackets */}
              {currentStep === 3 && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--sim-border)', paddingBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--sim-text-primary)' }}>
                        Mumbai Super Cup 2026 · Men's Singles
                      </h3>
                      <p style={{ fontSize: 11, color: 'var(--sim-text-muted)' }}>Registered Players: 8 (Draw size: 8)</p>
                    </div>
                    {!fixturesGenerated && (
                      <button className="btn btn-primary demo-btn-generate-fixtures" style={{ padding: '8px 14px', fontSize: 12, boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)' }}>
                        ⚡ Generate Seeding & Bracket
                      </button>
                    )}
                  </div>

                  {fixturesGenerated ? (
                    /* Beautiful simulated SVG brackets */
                    <div className="animate-scale-up" style={{ display: 'flex', gap: 40, alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
                      {/* Quarterfinals */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                        {[
                          { p1: 'Rajesh Kumar', p2: 'Vikas Patel' },
                          { p1: 'Rahul Singh', p2: 'Suresh Nair' },
                        ].map((m, idx) => (
                          <div key={idx} style={{
                            width: 160,
                            background: 'var(--sim-bg-card)',
                            border: '1px solid var(--sim-border)',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            fontSize: 11,
                          }}>
                            <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--sim-divider)', display: 'flex', justifyContent: 'space-between', color: 'var(--sim-text-primary)' }}>
                              <span>{m.p1}</span>
                              <span style={{ color: 'var(--sim-text-muted)' }}>—</span>
                            </div>
                            <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between', color: 'var(--sim-text-primary)' }}>
                              <span>{m.p2}</span>
                              <span style={{ color: 'var(--sim-text-muted)' }}>—</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Line connector spacer */}
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: 160 }}>
                        <svg width="40" height="80" style={{ opacity: 0.8 }}>
                          <path d="M 0 10 L 20 10 L 20 50 L 40 50 M 20 50 L 20 50" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
                          <path d="M 0 70 L 20 70 L 20 50" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
                        </svg>
                      </div>

                      {/* Semifinals */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 70 }}>
                        <div style={{
                          width: 160,
                          background: 'var(--sim-bg-card)',
                          border: '1px solid var(--accent)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          fontSize: 11,
                        }}>
                          <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--sim-divider)', display: 'flex', justifyContent: 'space-between', background: 'var(--accent-subtle)' }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>TBD (Q1 Winner)</span>
                            <span>—</span>
                          </div>
                          <div style={{ padding: '6px 10px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--sim-text-muted)' }}>TBD (Q2 Winner)</span>
                            <span>—</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Setup registrations preview */
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {['Rajesh Kumar', 'Vikas Patel', 'Rahul Singh', 'Suresh Nair', 'Neha Gupta', 'Amit Shah', 'Priya Sharma', 'Anita Desai'].map((name, i) => (
                        <div key={i} style={{ padding: '10px 14px', background: 'var(--sim-bg-card)', border: '1px solid var(--sim-border)', borderRadius: 'var(--radius-sm)', fontSize: 12, display: 'flex', justifyContent: 'space-between', color: 'var(--sim-text-primary)' }}>
                          <span>{name}</span>
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Seed #{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SCENE 5: Assign Umpire */}
              {currentStep === 4 && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--sim-text-primary)', marginBottom: 4 }}>
                      Court Assignments & Schedule
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--sim-text-muted)' }}>Match official validation is required before starting the live broadcast.</p>
                  </div>

                  <div className="glass-card" style={{ padding: 18, border: '1px solid var(--sim-border)', background: 'var(--sim-bg-card)', boxShadow: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span className="badge badge-draft" style={{ fontSize: 10 }}>DRAFT STATE</span>
                      <span style={{ fontSize: 11, color: 'var(--sim-text-muted)' }}>Court 1 · Match #1</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px 0' }}>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sim-text-primary)' }}>Rajesh Kumar</div>
                        <div style={{ fontSize: 10, color: 'var(--sim-text-muted)', marginTop: 2 }}>Seed #1</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>VS</div>
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sim-text-primary)' }}>Vikas Patel</div>
                        <div style={{ fontSize: 10, color: 'var(--sim-text-muted)', marginTop: 2 }}>Seed #2</div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--sim-divider)', marginTop: 12, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: 'var(--sim-text-secondary)' }}>Umpire:</div>
                      {assignedUmpire ? (
                        <div className="animate-scale-up" style={{ fontSize: 12, color: 'var(--sim-text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>👤 {assignedUmpire}</span>
                          <span style={{ color: '#22c55e', fontSize: 10 }}>✓ Ready</span>
                        </div>
                      ) : (
                        <button className="btn btn-secondary demo-btn-assign-umpire" style={{ padding: '6px 12px', fontSize: 11, background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)' }}>
                          Assign Suresh Nair
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SCENE 6: Start Match */}
              {currentStep === 5 && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 360, margin: '0 auto', width: '100%' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>Umpire Scoring App</div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--sim-text-primary)' }}>Court 1 Controller</h3>
                  </div>

                  <div className="glass-card" style={{ padding: 20, border: '1px solid var(--sim-border)', background: 'var(--sim-bg-card)', display: 'flex', flexDirection: 'column', gap: 14, boxShadow: 'none' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--sim-text-muted)' }}>Event: Men's Singles Open</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sim-text-primary)', marginTop: 4 }}>Rajesh Kumar vs Vikas Patel</div>
                      <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 8 }}>Official Umpire: Suresh Nair</div>
                    </div>

                    {matchStarted ? (
                      <div className="animate-scale-up" style={{ textAlign: 'center', padding: '10px 0', borderTop: '1px solid var(--sim-divider)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', padding: '6px 14px' }}>
                          <span className="live-dot" style={{ background: '#ef4444', width: 8, height: 8 }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>LIVE MATCH STREAMING</span>
                        </div>
                      </div>
                    ) : (
                      <button className="btn btn-primary demo-btn-start-match" style={{ width: '100%', padding: '10px', fontSize: 13, boxShadow: '0 0 15px rgba(37, 99, 235, 0.3)' }}>
                        🟢 Start Match & Broadcast
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* SCENE 7: Live Points Scoring */}
              {currentStep === 6 && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 440, margin: '0 auto', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="live-dot" style={{ background: '#ef4444' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>Court 1 Live</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--sim-text-muted)' }}>Best of 3 Sets</span>
                  </div>

                  {/* Dual Scoring buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Player 1 Scoring panel */}
                    <div className="glass-card" style={{
                      padding: 16,
                      border: '1px solid ' + (server === 'p1' ? 'var(--accent)' : 'var(--sim-border)'),
                      background: server === 'p1' ? 'var(--accent-subtle)' : 'var(--sim-bg-card)',
                      textAlign: 'center',
                      position: 'relative',
                      boxShadow: 'none',
                    }}>
                      {server === 'p1' && (
                        <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12 }} title="Active Server">🏸</div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sim-text-primary)' }}>Rajesh Kumar</div>
                      <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--sim-text-primary)', margin: '12px 0', fontFamily: 'var(--font-mono)' }}>
                        {p1Score}
                      </div>
                      <button className="btn btn-secondary btn-sm demo-scoring-p1-btn" style={{ width: '100%', fontSize: 11, pointerEvents: 'none' }}>
                        + Point Rajesh
                      </button>
                    </div>

                    {/* Player 2 Scoring panel */}
                    <div className="glass-card" style={{
                      padding: 16,
                      border: '1px solid ' + (server === 'p2' ? 'var(--accent)' : 'var(--sim-border)'),
                      background: server === 'p2' ? 'var(--accent-subtle)' : 'var(--sim-bg-card)',
                      textAlign: 'center',
                      position: 'relative',
                      boxShadow: 'none',
                    }}>
                      {server === 'p2' && (
                        <div style={{ position: 'absolute', top: 10, left: 10, fontSize: 12 }} title="Active Server">🏸</div>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sim-text-primary)' }}>Vikas Patel</div>
                      <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--sim-text-primary)', margin: '12px 0', fontFamily: 'var(--font-mono)' }}>
                        {p2Score}
                      </div>
                      <button className="btn btn-secondary btn-sm demo-scoring-p2-btn" style={{ width: '100%', fontSize: 11, pointerEvents: 'none' }}>
                        + Point Vikas
                      </button>
                    </div>
                  </div>

                  {/* Public scoreboard sync preview */}
                  <div style={{ background: 'var(--sim-bg-secondary)', border: '1px solid var(--sim-border)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'var(--sim-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      Public Live Scoreboard Sync
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, fontSize: 13, fontWeight: 600 }}>
                      <span style={{ color: server === 'p1' ? 'var(--accent)' : 'var(--sim-text-primary)' }}>Rajesh (1)</span>
                      <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--sim-bg-elevated)', padding: '2px 8px', borderRadius: 4, fontSize: 14, color: 'var(--sim-text-primary)', border: '1px solid var(--sim-border)' }}>
                        {p1Score} - {p2Score}
                      </span>
                      <span style={{ color: server === 'p2' ? 'var(--accent)' : 'var(--sim-text-primary)' }}>Vikas (0)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SCENE 8: Tournament Results & Podium */}
              {currentStep === 7 && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center', maxWidth: 480, margin: '0 auto', width: '100%' }}>
                  <div>
                    <span style={{ fontSize: 32 }}>🏆</span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sim-text-primary)', marginTop: 8 }}>
                      Mumbai Super Cup Champion!
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--sim-text-muted)' }}>Men's Singles (Open Category) Championship Award</p>
                  </div>

                  {/* Podium display */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 16, height: 180 }}>
                    {/* 2nd Place */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 90 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sim-text-primary)', marginBottom: 6 }}>Vikas Patel</span>
                      <div style={{
                        width: '100%',
                        height: 70,
                        background: 'linear-gradient(180deg, var(--sim-bg-elevated) 0%, var(--sim-bg-secondary) 100%)',
                        border: '1px solid var(--sim-border)',
                        borderBottom: 'none',
                        borderRadius: '6px 6px 0 0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 18 }}>🥈</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sim-text-muted)', marginTop: 2 }}>2ND PLACE</span>
                      </div>
                    </div>

                    {/* 1st Place */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 110 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', marginBottom: 6 }}>Rajesh Kumar</span>
                      <div style={{
                        width: '100%',
                        height: 100,
                        background: 'linear-gradient(180deg, var(--accent-subtle) 0%, var(--sim-bg-secondary) 100%)',
                        border: '1px solid var(--accent)',
                        borderBottom: 'none',
                        borderRadius: '6px 6px 0 0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(245, 158, 11, 0.05)'
                      }}>
                        <span style={{ fontSize: 24 }}>🥇</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)', marginTop: 2 }}>CHAMPION</span>
                      </div>
                    </div>

                    {/* 3rd Place */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 90 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sim-text-primary)', marginBottom: 6 }}>Priyank Sharma</span>
                      <div style={{
                        width: '100%',
                        height: 50,
                        background: 'linear-gradient(180deg, var(--sim-bg-elevated) 0%, var(--sim-bg-secondary) 100%)',
                        border: '1px solid var(--sim-border)',
                        borderBottom: 'none',
                        borderRadius: '6px 6px 0 0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 18 }}>🥉</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--sim-text-muted)', marginTop: 2 }}>3RD PLACE</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <Link href="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
                      Create Your Own Tournament
                    </Link>
                  </div>
                </div>
              )}

              {/* Toast Alerts Notification mock */}
              {toast && (
                <div style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  background: 'var(--sim-bg-card)',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 16px',
                  color: 'var(--sim-text-primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                  zIndex: 20,
                  animation: 'slide-in 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span>⚡</span> {toast}
                </div>
              )}

              {/* Automated mouse pointer indicator representation */}
              {cursorPos.visible && (
                <div
                  style={{
                    position: 'absolute',
                    top: cursorPos.y - 12,
                    left: cursorPos.x - 12,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '2px solid #ef4444',
                    background: cursorPos.clicking ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.15)',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                    pointerEvents: 'none',
                    transition: `transform 0.1s ease, background 0.1s ease`,
                    transform: cursorPos.clicking ? 'scale(0.8)' : 'scale(1)',
                    zIndex: 100,
                  }}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Scoped and Variables CSS definition injected locally */}
      <style jsx global>{`
        .sim-dark {
          --sim-bg-primary: #0b0f19;
          --sim-bg-secondary: #111827;
          --sim-bg-card: #1a1f2e;
          --sim-bg-card-hover: #1f2537;
          --sim-bg-elevated: #252b3b;
          --sim-border: rgba(255, 255, 255, 0.08);
          --sim-border-hover: rgba(255, 255, 255, 0.15);
          --sim-text-primary: #ffffff;
          --sim-text-secondary: #94a3b8;
          --sim-text-muted: #64748b;
          --sim-input-bg: rgba(255, 255, 255, 0.02);
          --sim-modal-bg: #111827;
          --sim-window-bg: rgba(255, 255, 255, 0.03);
          --sim-window-border: rgba(255, 255, 255, 0.06);
          --sim-address-bg: rgba(0, 0, 0, 0.25);
          --sim-address-border: rgba(255, 255, 255, 0.08);
          --sim-divider: rgba(255, 255, 255, 0.06);
          color: var(--sim-text-primary) !important;
        }
        .sim-light {
          --sim-bg-primary: #ffffff;
          --sim-bg-secondary: #f3f4f6;
          --sim-bg-card: #f9fafb;
          --sim-bg-card-hover: #f3f4f6;
          --sim-bg-elevated: #e5e7eb;
          --sim-border: rgba(0, 0, 0, 0.08);
          --sim-border-hover: rgba(0, 0, 0, 0.15);
          --sim-text-primary: #000000;
          --sim-text-secondary: #374151;
          --sim-text-muted: #6b7280;
          --sim-input-bg: #ffffff;
          --sim-modal-bg: #ffffff;
          --sim-window-bg: #f3f4f6;
          --sim-window-border: rgba(0, 0, 0, 0.06);
          --sim-address-bg: #ffffff;
          --sim-address-border: rgba(0, 0, 0, 0.1);
          --sim-divider: rgba(0, 0, 0, 0.06);
          color: var(--sim-text-primary) !important;
        }
        @keyframes slide-in {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .demo-step-btn:hover {
          background: rgba(255,255,255,0.02) !important;
        }
        .animate-fade-in {
          animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-scale-up {
          animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes scale-up {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
