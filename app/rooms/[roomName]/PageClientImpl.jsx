'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
    useLocalParticipant,
    useParticipants,
    useRoomContext,
    ControlBar,
    DisconnectButton,
} from '@livekit/components-react';
import '@livekit/components-styles';

import StudentHandRaise from './StudentHandRaise';
import StudentTextDoubt from './StudentTextDoubt';
import TeacherHandPanel from './TeacherHandPanel';
import TeacherVideoController from './TeacherVideoController';
import StudentVideoViewer from './StudentVideoViewer';
import AISidebar from './AISidebar';

import { GiNotebook } from "react-icons/gi";
import { FaRobot } from "react-icons/fa6";
import { MdOutlineQuiz } from "react-icons/md";

import ParticipantList from './ParticipantList';

import { speakText, stopSpeaking } from '@/app/lib/aiTTS';

import HistorySidebar from './HistorySidebar';
import AttendanceSidebar from './AttendanceSidebar';
import VoiceDoubt from './VoiceDoubt';
import { IoIosPeople } from "react-icons/io";
import { LuLogs } from "react-icons/lu";
import { BsQuestionSquareFill } from "react-icons/bs";
import { LuPanelLeftClose } from "react-icons/lu";
import { FaArrowRightToBracket, FaArrowRightFromBracket } from "react-icons/fa6";
import { MdLogout, MdDeleteForever } from "react-icons/md";


/* ---------------- MEETING ENDED OVERLAY ---------------- */
function MeetingEndedOverlay() {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(6px)',
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: '1px solid rgba(244, 67, 54, 0.4)',
                borderRadius: '20px',
                padding: '52px 60px',
                textAlign: 'center',
                boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
                maxWidth: '440px',
                width: '90%',
                animation: 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🚫</div>
                <h2 style={{
                    color: '#fff', fontSize: '1.6rem', fontWeight: 700,
                    margin: '0 0 12px', fontFamily: 'Inter, sans-serif',
                    letterSpacing: '-0.5px'
                }}>
                    Meeting Ended
                </h2>
                <p style={{
                    color: 'rgba(255,255,255,0.7)', fontSize: '1rem',
                    margin: '0 0 24px', fontFamily: 'Inter, sans-serif', lineHeight: 1.6
                }}>
                    Teacher has closed the meeting.
                </p>
            </div>
            <style>{`
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.85); }
                    to   { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}

/* ---------------- TEACHER ONLY UI ---------------- */
function TeacherOnlyUI({ doubts, onShowDoubts, onShowHistory, onShowAttendance, onShowQuiz, onGenerateQuiz, onEndMeeting, onLeaveMeeting }) {
    const { localParticipant } = useLocalParticipant();
    const [showExitMenu, setShowExitMenu] = useState(false);

    let role = '';
    try {
        role = localParticipant?.metadata
            ? JSON.parse(localParticipant.metadata).role
            : '';
    } catch {
        role = localParticipant?.metadata || '';
    }

    if (role !== 'teacher') return null;

    const unreadCount = doubts.filter(d => !d.answer).length;

    return (
        <>
            {/* 📁 Teacher Upload/Class tool */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 14,
                    left: '50%',
                    transform: 'translateX(-365px)',
                    zIndex: 100,
                }}
            >
                <TeacherVideoController onGenerateQuiz={onGenerateQuiz} />
            </div>

            {/* 🔔 Notifications & History (Near Leave button) */}
            <div style={{
                position: 'absolute',
                bottom: 14,
                left: '50%',
                transform: 'translateX(365px)',
                zIndex: 100,
                display: 'flex',
                gap: '12px'
            }}>
                {/* 📜 History Button */}
                <button
                    onClick={onShowHistory}
                    title="Activity Log"
                    style={{
                        width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s', borderRadius: '8px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                    <LuLogs />
                </button>

                {/* 📋 Attendance Button */}
                <button
                    onClick={() => onShowAttendance && onShowAttendance()}
                    title="Attendance List"
                    style={{
                        width: 44, height: 44, borderRadius: '8px', background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(33, 150, 243, 0.4)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                    <GiNotebook />
                </button>

                {/* 📝 Quiz Results Button */}
                <button
                    onClick={() => onShowQuiz && onShowQuiz()}
                    title="View Quiz Results"
                    style={{
                        width: 44, height: 44, borderRadius: '8px', background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(76, 175, 80, 0.4)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                    <MdOutlineQuiz />
                </button>

                {/* 💬 AI Assistant / Doubt Notification */}
                <button
                    onClick={onShowDoubts}
                    title="AI Support"
                    style={{
                        width: 44, height: 44, borderRadius: '8px',
                        background: unreadCount > 0 ? '#f44336' : 'rgba(33, 150, 243, 0.2)',
                        border: unreadCount > 0 ? 'none' : '1px solid rgba(33, 150, 243, 0.4)',
                        color: '#fff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        position: 'relative',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = unreadCount > 0 ? '#d32f2f' : 'rgba(33, 150, 243, 0.4)'}
                    onMouseOut={(e) => e.currentTarget.style.background = unreadCount > 0 ? '#f44336' : 'rgba(33, 150, 243, 0.2)'}
                >
                    {unreadCount > 0 ? <BsQuestionSquareFill /> : <FaRobot />}
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute', top: -5, right: -5, background: '#fff',
                            color: '#f44336', borderRadius: '50%', width: 20, height: 20,
                            fontSize: '0.75rem', fontWeight: 'bold', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* ❌ Unified Exit Menu (Right Corner) */}
            <div style={{
                position: 'absolute',
                bottom: 14,
                right: 20,
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '10px'
            }}>
                {/* Expandable Menu */}
                {showExitMenu && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(12px)',
                        padding: '12px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
                        animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}>
                        {/* 🚫 Leave Button (Premium Dark Style) */}
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure you want to leave? Students will remain in the room.")) {
                                    onLeaveMeeting && onLeaveMeeting();
                                }
                            }}
                            className="lk-disconnect-button"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 20px',
                                background: 'linear-gradient(to right, #2c2c2c, #1a1a1a)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#e0e0e0',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontSize: '14px',
                                fontWeight: '600',
                                width: '200px',
                                justifyContent: 'flex-start',
                                letterSpacing: '0.3px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(to right, #3d3d3d, #2a2a2a)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                e.currentTarget.style.transform = 'translateX(-5px)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(to right, #2c2c2c, #1a1a1a)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
                            }}
                        >
                            <div style={{
                                width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)',
                                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <FaArrowRightFromBracket size={16} />
                            </div>
                            <span>Leave Meeting</span>
                        </button>

                        {/* 🛑 End Button (Vibrant Danger Style) */}
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure you want to end the meeting for everyone?")) {
                                    onEndMeeting && onEndMeeting();
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 20px',
                                background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                                border: 'none',
                                color: '#fff',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontSize: '14px',
                                fontWeight: '700',
                                width: '200px',
                                justifyContent: 'flex-start',
                                letterSpacing: '0.3px',
                                boxShadow: '0 4px 15px rgba(255, 75, 43, 0.3)',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateX(-5px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 75, 43, 0.5)';
                                e.currentTarget.style.filter = 'brightness(1.1)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 75, 43, 0.3)';
                                e.currentTarget.style.filter = 'brightness(1)';
                            }}
                        >
                            <div style={{
                                width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)',
                                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <MdDeleteForever size={20} />
                            </div>
                            <span>End Meeting</span>
                        </button>
                    </div>
                )}

                {/* Main Toggle Button */}
                <button
                    onClick={() => setShowExitMenu(!showExitMenu)}
                    title="Exit Options"
                    style={{
                        width: '44px',
                        height: '44px',
                        background: showExitMenu ? '#f44336' : '#242323ff',
                        border: showExitMenu ? 'none' : '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '22px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        transform: showExitMenu ? 'rotate(90deg)' : 'rotate(0)'
                    }}
                >
                    {showExitMenu ? <MdLogout /> : <FaArrowRightToBracket />}
                </button>

                <style>{`
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(15px) scale(0.9); }
                        to { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    /* Ensure inbuilt leave button is hidden for teacher */
                    .lk-control-bar button.lk-disconnect-button {
                        display: none !important;
                    }
                `}</style>
            </div>
        </>
    );
}

/* ---------------- STUDENT ONLY UI ---------------- */
function StudentOnlyUI({ participants, showAI, setShowAI, doubtsWithAnswers, isHandRaised, onToggleHand, activeQuiz, onQuizSubmit, onCloseQuiz }) {
    const { localParticipant } = useLocalParticipant();
    const [showPeople, setShowPeople] = useState(false);

    let role = '';
    try {
        role = localParticipant?.metadata
            ? JSON.parse(localParticipant.metadata).role
            : '';
    } catch {
        role = localParticipant?.metadata || '';
    }

    if (role !== 'student') return null;

    return (
        <>
            {/* 📺 Student video viewer (Full Screen Background) */}
            <StudentVideoViewer />

            {/* 🎤 Voice Doubt Tracking */}
            <VoiceDoubt />

            {/* ✋ Hand raise - positioned BEFORE Microphone button */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 14,
                    left: '50%',
                    transform: 'translateX(-465px)',
                    zIndex: 100,
                }}
            >
                <StudentHandRaise isHandRaised={isHandRaised} onToggle={onToggleHand} />
            </div>

            {/* 🎤 Ask doubt & 👥 People - Right side controls */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 14,
                    right: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 100,
                }}
            >
                {/* 🤖 AI Sidebar Toggle removed for students */}

                {/* 💬 Ask doubt - ONLY VISIBLE IF HAND IS RAISED */}
                {isHandRaised && <StudentTextDoubt />}

                {/* 👥 People Button */}
                <button
                    onClick={() => setShowPeople(!showPeople)}
                    style={{
                        padding: '0 16px',
                        height: '44px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '16px',
                        fontWeight: 500,
                        fontFamily: 'Inter, sans-serif',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                    <IoIosPeople size={22} style={{ fontSize: '18px' }}></IoIosPeople>
                    Participants
                    <span style={{
                        background: '#2196F3',
                        color: '#fff',
                        borderRadius: '10px',
                        minWidth: '20px',
                        height: '20px',
                        padding: '0 6px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>
                        {participants.length}
                    </span>
                </button>
            </div>

            {/* 📝 Quiz View for Students */}
            {activeQuiz && (
                <StudentQuizView
                    quiz={activeQuiz}
                    onSubmit={onQuizSubmit}
                    onClose={onCloseQuiz}
                />
            )}

            {/* 👥 Participant List Popup */}
            {showPeople && <ParticipantList onClose={() => setShowPeople(false)} />}
        </>
    );
}

import QuizSidebar from './QuizSidebar';
import StudentQuizView from './StudentQuizView';

/* ---------------- PAGE CLIENT ---------------- */
/* ---------------- MAIN ROOM CONTENT ---------------- */
function RoomContent() {
    const { localParticipant } = useLocalParticipant();
    const participants = useParticipants();
    const [doubts, setDoubts] = useState([]); // Pending doubts (Teacher only)
    const [doubtsWithAnswers, setDoubtsWithAnswers] = useState([]); // Solved doubts (All)
    const [showAI, setShowAI] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showAttendance, setShowAttendance] = useState(false);
    const [attendance, setAttendance] = useState({}); // { identity: { identity, role, firstJoined, lastJoined, lastLeft, totalStayTime, joinCount, status } }
    const [loadingAI, setLoadingAI] = useState(null);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [showQuizResults, setShowQuizResults] = useState(false);
    const [classSummary, setClassSummary] = useState(null);
    const [meetingEnded, setMeetingEnded] = useState(false); // 🚫 Meeting ended state
    const [handRaiseQueue, setHandRaiseQueue] = useState([]); // ✋ Sequential Queue for Hand Raises
    const room = useRoomContext();

    let role = '';
    let meetingTopic = '';
    try {
        const metadata = localParticipant?.metadata ? JSON.parse(localParticipant.metadata) : {};
        role = metadata.role || '';
        meetingTopic = metadata.topic || '';
    } catch {
        role = localParticipant?.metadata || '';
    }

    // Memoize custom layout components to prevent unmount/remount on every render
    const NoComponent = useMemo(() => () => null, []);
    const TeacherControlBar = useMemo(() => () => <ControlBar controls={{ leave: false }} />, []);

    const customComponents = useMemo(() => ({
        Chat: NoComponent,
        ParticipantGrid: role === 'teacher' ? undefined : NoComponent,
        ControlBar: role === 'teacher' ? TeacherControlBar : undefined,
        DisconnectButton: role === 'teacher' ? NoComponent : undefined
    }), [role, TeacherControlBar, NoComponent]);

    // Attendance Tracker
    useEffect(() => {
        if (!room || role !== 'teacher') return;

        const updateParticipantStatus = (participant, eventType) => {
            const identity = participant.identity;
            let pRole = 'student';
            try {
                pRole = JSON.parse(participant.metadata || '{}').role || 'student';
            } catch { }

            setAttendance(prev => {
                const now = Date.now();
                const existing = prev[identity] || {
                    identity,
                    role: pRole,
                    firstJoined: now,
                    lastJoined: now,
                    lastLeft: null,
                    totalStayTime: 0,
                    joinCount: 0,
                    status: 'online',
                    sessions: []
                };

                if (eventType === 'connected') {
                    // Prevent adding redundant sessions if already online
                    if (existing.status === 'online' && existing.sessions?.length > 0 && !existing.sessions[existing.sessions.length - 1].leftAt) {
                        return prev;
                    }

                    return {
                        ...prev,
                        [identity]: {
                            ...existing,
                            lastJoined: now,
                            joinCount: (existing.joinCount || 0) + 1,
                            status: 'online',
                            role: pRole, // update role in case it changed
                            sessions: [...(existing.sessions || []), { joinedAt: now, leftAt: null }]
                        }
                    };
                } else if (eventType === 'disconnected') {
                    // Prevent updating leave time if already offline
                    if (existing.status === 'offline') return prev;

                    const stayDuration = now - (existing.lastJoined || existing.firstJoined || now);
                    const updatedSessions = [...(existing.sessions || [])];
                    if (updatedSessions.length > 0) {
                        updatedSessions[updatedSessions.length - 1].leftAt = now;
                    }

                    return {
                        ...prev,
                        [identity]: {
                            ...existing,
                            lastLeft: now,
                            totalStayTime: (existing.totalStayTime || 0) + stayDuration,
                            status: 'offline',
                            sessions: updatedSessions
                        }
                    };
                }
                return prev;
            });
        };

        // Track existing participants
        room.remoteParticipants.forEach(p => {
            updateParticipantStatus(p, 'connected');
        });
        if (room.localParticipant) {
            updateParticipantStatus(room.localParticipant, 'connected');
        }

        const onConnected = (p) => updateParticipantStatus(p, 'connected');
        const onDisconnected = (p) => updateParticipantStatus(p, 'disconnected');

        room.on('participantConnected', onConnected);
        room.on('participantDisconnected', onDisconnected);

        return () => {
            room.off('participantConnected', onConnected);
            room.off('participantDisconnected', onDisconnected);
        };
    }, [room, role]);

    // Listen for AI results and new doubts
    useEffect(() => {
        if (!room) return;
        const handleData = (payload) => {
            try {
                const msg = JSON.parse(new TextDecoder().decode(payload));

                // Teacher: Receive new doubts
                if (msg.action === 'STUDENT_DOUBT' && role === 'teacher') {
                    const doubtId = msg.id || Date.now();
                    const newDoubt = {
                        ...msg,
                        id: doubtId
                    };
                    setDoubts(prev => [...prev, newDoubt]);

                    // AUTO-COLLECT: Add to history immediately using ID
                    setDoubtsWithAnswers(prev => {
                        if (prev.some(d => d.id === doubtId)) return prev;
                        return [...prev, { id: doubtId, name: msg.name, text: msg.text, answer: null }];
                    });
                }

                // Teacher: Process Hand Raise Queue
                if (msg.action === 'HAND_RAISE' && role === 'teacher') {
                    setHandRaiseQueue(prev => {
                        let nextQueue = [...prev];
                        if (msg.raised) {
                            if (!nextQueue.includes(msg.name)) {
                                nextQueue.push(msg.name);
                            }
                        } else {
                            nextQueue = nextQueue.filter(name => name !== msg.name);
                        }

                        // Notify ONLY the first person if they just became the lead OR if they were already lead and someone new joined (noop)
                        // But more importantly, if the lead CHANGES, notify the new lead.
                        return nextQueue;
                    });
                }

                // Student: React to remote hand lowering (e.g. when teacher resolves doubt)
                if (msg.action === 'HAND_RAISE' && role === 'student' && msg.name === localParticipant?.identity) {
                    setIsHandRaised(msg.raised);
                }

                // AI Result: Broadcast to everyone
                if (msg.action === 'AI_ANSWER_BROADCAST') {
                    // Everyone gets it in history
                    setDoubtsWithAnswers(prev => {
                        const exists = prev.find(d => d.id === msg.id);
                        if (exists) {
                            // Update the existing entry with the answer
                            return prev.map(d => (d.id === msg.id) ? { ...d, answer: msg.answer } : d);
                        }
                        return [...prev, msg];
                    });

                    // Only Teacher opens sidebar for active management
                    if (role === 'teacher') {
                        setShowAI(true);
                    }

                    // Everyone/Student gets audio
                    if (msg.answer) {
                        const audioString = `${msg.name} asked: ${msg.text}. The answer is: ${msg.answer}`;
                        speakText(audioString).catch(err => console.error('TTS error:', err));
                    }
                }

                // STOP AI AUDIO
                if (msg.action === 'STOP_AUDIO') {
                    stopSpeaking();
                }

                // QUIZ START (Students)
                if (msg.action === 'QUIZ_START' && role === 'student') {
                    setActiveQuiz(msg.quiz);
                }

                // MEETING ENDED (Students)
                if (msg.action === 'MEETING_ENDED' && role === 'student') {
                    setMeetingEnded(true);
                }
            } catch { }
        };
        room.on('dataReceived', handleData);
        return () => room.off('dataReceived', handleData);
    }, [room, role]);

    /* 👩‍🏫 Teacher Handlers (Centralized) */
    const askAI = async (doubt) => {
        if (!doubt) return;
        setLoadingAI(doubt.id);
        try {
            const res = await fetch('http://localhost:3001/ask-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: doubt.text }),
            });
            const data = await res.json();
            const answer = data.answer || 'No answer received.';

            // Store locally for teacher preview
            setDoubts(prev => prev.map(d => d.id === doubt.id ? { ...d, answer } : d));
        } catch (e) {
            console.error('AI error', e);
        } finally {
            setLoadingAI(null);
        }
    };

    const sendToStudent = (doubt) => {
        if (!doubt.answer || !room) return;

        room.localParticipant.publishData(
            new TextEncoder().encode(
                JSON.stringify({
                    action: 'AI_ANSWER_BROADCAST',
                    id: doubt.id,
                    text: doubt.text,
                    answer: doubt.answer,
                    name: doubt.name
                })
            ),
            { reliable: true }
        );

        // Mark as broadcasting instead of removing
        setDoubts(prev => prev.map(d => d.id === doubt.id ? { ...d, isBroadcasting: true } : d));
    };

    const stopAIAudio = () => {
        if (!room) return;
        room.localParticipant.publishData(
            new TextEncoder().encode(
                JSON.stringify({ action: 'STOP_AUDIO' })
            ),
            { reliable: true }
        );
        stopSpeaking(); // Also stop locally
    };

    const resolveDoubt = (id) => {
        const doubt = doubts.find(d => d.id === id);
        if (doubt) {
            // Ensure entry in history has the answer if available locally
            setDoubtsWithAnswers(prev => {
                const exists = prev.find(h => h.id === doubt.id);
                if (exists) {
                    return prev.map(h => (h.id === doubt.id) ? { ...h, answer: doubt.answer || h.answer } : h);
                }
                return [...prev, { id: doubt.id, name: doubt.name, text: doubt.text, answer: doubt.answer }];
            });
        }
        setDoubts(prev => prev.filter(d => d.id !== id));
        // Also remove from hand raise queue if they are in there
        if (doubt) {
            setHandRaiseQueue(prev => prev.filter(name => name !== doubt.name));

            // BROADCAST: Remotely lower student's hand
            if (room) {
                room.localParticipant.publishData(
                    new TextEncoder().encode(
                        JSON.stringify({
                            action: 'HAND_RAISE',
                            name: doubt.name,
                            raised: false
                        })
                    ),
                    { reliable: true }
                );
            }
        }
    };

    const updateDoubtText = (id, newText) => {
        setDoubts(prev => prev.map(d => d.id === id ? { ...d, text: newText } : d));
        // Also update history to prevent duplicates
        setDoubtsWithAnswers(prev => prev.map(h => h.id === id ? { ...h, text: newText } : h));
    };

    /* 📝 QUIZ HANDLERS */
    const handleGenerateQuiz = async () => {
        if (!room) return;

        // Collect all student questions from history
        const studentQuestions = doubtsWithAnswers.map(d => d.text);
        const finalTopic = meetingTopic || 'General Class';

        try {
            const res = await fetch('http://localhost:3001/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: finalTopic,
                    studentQuestions,
                    roomName: room.name
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Backend error message:', errorText);
                throw new Error(`Server returned ${res.status}: ${errorText.substring(0, 100)}`);
            }

            const data = await res.json();

            if (data.quizId) {
                // Broadcast quiz to all students
                room.localParticipant.publishData(
                    new TextEncoder().encode(
                        JSON.stringify({
                            action: 'QUIZ_START',
                            quiz: {
                                id: data.quizId,
                                topic: finalTopic,
                                questions: data.questions
                            }
                        })
                    ),
                    { reliable: true }
                );

                // Teacher: Open quiz results sidebar
                setActiveQuiz({ ...data, topic: finalTopic });
                setShowQuizResults(true);

                // ⭐ GENERATE CLASS SUMMARY
                try {
                    const summaryRes = await fetch('http://localhost:3001/generate-summary', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            topic: finalTopic,
                            studentQuestions
                        }),
                    });
                    const summaryData = await summaryRes.json();
                    if (summaryData.summary) {
                        setClassSummary(summaryData.summary);
                    }
                } catch (summaryErr) {
                    console.error('Summary generation error', summaryErr);
                }

                alert("✅ Quiz generated and broadcast to all students!");
            }
        } catch (e) {
            console.error('Quiz generation error', e);
            alert("❌ Failed to generate quiz.");
        }
    };

    const handleQuizSubmit = async (answers) => {
        if (!activeQuiz || !localParticipant) return;

        try {
            const res = await fetch('http://localhost:3001/submit-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quizId: activeQuiz.id,
                    studentName: localParticipant.identity,
                    answers: answers
                }),
            });
            return await res.json();
        } catch (e) {
            console.error('Quiz submission error', e);
            return null;
        }
    };

    const handleEndMeeting = async () => {
        if (!room) return;
        try {
            // 1️⃣ Broadcast MEETING_ENDED to all participants FIRST
            await room.localParticipant.publishData(
                new TextEncoder().encode(
                    JSON.stringify({ action: 'MEETING_ENDED' })
                ),
                { reliable: true }
            );

            // Small delay so data message is delivered before room is deleted
            await new Promise(resolve => setTimeout(resolve, 800));

            // 2️⃣ Tell backend to delete room & mark it as ended
            await fetch('http://localhost:3001/end-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName: room.name }),
            });

            // 3️⃣ Disconnect teacher
            if (room.state !== 'disconnected') {
                await room.disconnect();
            }

            // 4️⃣ Redirect teacher
            window.location.href = '/';
        } catch (e) {
            console.error('Failed to end meeting properly', e);
            window.location.href = '/';
        }
    };

    const handleLeaveMeeting = async () => {
        if (!room) return;
        try {
            if (room.state !== 'disconnected') {
                await room.disconnect();
            }
        } catch (e) {
            console.error('Failed to leave meeting', e);
        }
    };

    return (
        <>
            {/* 🚫 Meeting Ended Overlay (Students only) */}
            {meetingEnded && <MeetingEndedOverlay />}
            {/* 🔊 REQUIRED: hear others */}
            <RoomAudioRenderer />

            {/* 🎥 Full screen Teacher Video renders here when active */}
            <StudentOnlyUI
                participants={participants}
                showAI={showAI}
                setShowAI={setShowAI}
                doubtsWithAnswers={doubtsWithAnswers}
                isHandRaised={isHandRaised}
                onToggleHand={() => setIsHandRaised(!isHandRaised)}
                activeQuiz={role === 'student' ? activeQuiz : null}
                onQuizSubmit={handleQuizSubmit}
                onCloseQuiz={() => setActiveQuiz(null)}
            />

            {/* 📜 Dedicated History Sidebar (Teacher Only) - Now on FAR RIGHT */}
            {role === 'teacher' && showHistory && (
                <HistorySidebar
                    doubtsWithAnswers={doubtsWithAnswers}
                    right={0}
                    onClose={() => setShowHistory(false)}
                />
            )}

            {/* 🤖 Centralized AI Sidebar (Teacher Only) - Shifting left if History is open */}
            {role === 'teacher' && showAI && (
                <AISidebar
                    role={role}
                    doubts={doubts}
                    loadingAI={loadingAI}
                    onAskAI={askAI}
                    onSendToStudent={sendToStudent}
                    onStopAudio={stopAIAudio}
                    onUpdateDoubt={updateDoubtText}
                    onResolve={resolveDoubt}
                    onClose={() => setShowAI(false)}
                    right={showHistory ? 380 : 0}
                />
            )}

            {/* 📋 Attendance Sidebar (Teacher Only) */}
            {role === 'teacher' && showAttendance && (
                <AttendanceSidebar
                    attendance={attendance}
                    doubtsWithAnswers={doubtsWithAnswers}
                    classSummary={classSummary}
                    topic={meetingTopic}
                    onClose={() => setShowAttendance(false)}
                    right={(showHistory || showAI) ? 380 : 0}
                />
            )}

            {/* 📊 Quiz Results Sidebar (Teacher Only) */}
            {role === 'teacher' && showQuizResults && activeQuiz && (
                <QuizSidebar
                    quizId={activeQuiz.id || activeQuiz.quizId}
                    topic={activeQuiz.topic}
                    onClose={() => setShowQuizResults(false)}
                    right={(showHistory || showAI || showAttendance) ? 380 : 0}
                />
            )}

            {/* 🎥 Control bar + Optional default logic */}
            <VideoConference
                components={customComponents}
            />

            {/* 👩‍🏫 Teacher hand raise list */}
            <TeacherHandPanel />

            {/* 👩‍🏫 Teacher-only controls & notifications */}
            <TeacherOnlyUI
                doubts={doubts}
                onShowDoubts={() => setShowAI(true)}
                onShowHistory={() => setShowHistory(true)}
                onShowAttendance={() => setShowAttendance(prev => !prev)}
                onShowQuiz={() => setShowQuizResults(prev => !prev)}
                onGenerateQuiz={handleGenerateQuiz}
                onEndMeeting={handleEndMeeting}
                onLeaveMeeting={handleLeaveMeeting}
            />

            {/* Sequential Hand Raise Audio Notification Trigger */}
            <HandRaiseAudioNotifier queue={handRaiseQueue} role={role} />
        </>
    );
}

/* 🔊 COMPONENT: Handles sequential audio so it doesn't re-trigger on every render of RoomContent */
function HandRaiseAudioNotifier({ queue, role }) {
    const lastNotified = useRef(null);
    const delayTimerRef = useRef(null);
    const hasSpokenBatchMsg = useRef(false);

    useEffect(() => {
        if (role !== 'teacher' || queue.length === 0) {
            if (queue.length === 0) {
                lastNotified.current = null;
                hasSpokenBatchMsg.current = false;
                if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
            }
            return;
        }

        // ⭐ Special Case: 5+ Students
        if (queue.length >= 5 && !hasSpokenBatchMsg.current) {
            hasSpokenBatchMsg.current = true;
            if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
            speakText("As several students have raised doubts, I will now conclude the session and proceed to clarify each of your questions.").catch(err => console.error('TTS Error:', err));
            return;
        }

        // Regular individual notifications (only if queue is manageable or batch msg already fired)
        if (queue.length < 5 || hasSpokenBatchMsg.current) {
            const currentLead = queue[0];
            if (currentLead !== lastNotified.current) {
                lastNotified.current = currentLead;

                // Clear any existing timer
                if (delayTimerRef.current) clearTimeout(delayTimerRef.current);

                // Set a 3-second delay before speaking
                delayTimerRef.current = setTimeout(() => {
                    speakText(`${currentLead}, you raised your hand. Do you have any doubts? If so, please click the ‘Ask a Doubt’ button to submit your question.`).catch(err => console.error('TTS Error:', err));
                }, 3000);
            }
        }

        return () => {
            if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
        };
    }, [queue, role]);

    return null;
}

/* ---------------- PAGE CLIENT ---------------- */
export function PageClientImpl({ token, url }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <p style={{ color: 'white', padding: 20 }}>Joining room…</p>;
    }

    return (
        <LiveKitRoom
            token={token}
            serverUrl={url}
            connect={true}
            video={{ enabled: true }}
            audio={{ enabled: true }}
            data-lk-theme="default"
            style={{ height: '100vh', position: 'relative', background: '#000' }}
            onError={(error) => {
                console.error('LiveKit Room Error:', error);
                alert(`Connection Error: ${error.message}`);
            }}
        >
            <RoomContent />
        </LiveKitRoom>
    );
}


