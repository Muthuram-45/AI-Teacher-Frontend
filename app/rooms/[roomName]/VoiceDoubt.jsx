'use client';
import { useEffect, useState, useRef } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';

export default function VoiceDoubt() {
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        // Check if browser supports SpeechRecognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('Speech Recognition not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            setTranscript(prev => prev + ' ' + currentTranscript);
        };

        recognition.onerror = (event) => {
            if (event.error === 'no-speech') {
                return; // Ignore "no-speech" as it's common and handled by onend
            }
            console.error('Speech Recognition Error:', event.error);
        };

        recognition.onend = () => {
            if (isRecording) {
                recognition.start();
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Monitor microphone state
    useEffect(() => {
        if (!localParticipant || !recognitionRef.current) return;

        const handleTrackSubscribed = () => {
            const isMicOn = localParticipant.isMicrophoneEnabled;

            if (isMicOn && !isRecording) {
                setIsRecording(true);
                setTranscript('');

                // Notify teacher that a voice doubt is starting
                localParticipant.publishData(
                    new TextEncoder().encode(
                        JSON.stringify({
                            action: 'VOICE_DOUBT_START',
                            name: localParticipant.identity,
                        })
                    ),
                    { reliable: true }
                );

                try {
                    recognitionRef.current.start();
                } catch (e) { console.error(e); }
            } else if (!isMicOn && isRecording) {
                // Publish end event for UI indicators
                localParticipant.publishData(
                    new TextEncoder().encode(
                        JSON.stringify({
                            action: 'VOICE_DOUBT_END',
                            name: localParticipant.identity,
                        })
                    ),
                    { reliable: true }
                );
                setIsRecording(false);
                recognitionRef.current.stop();
                handleExtraction(transcript);
            }
        };

        // LiveKit events for track changes
        localParticipant.on('trackMuted', handleTrackSubscribed);
        localParticipant.on('trackUnmuted', handleTrackSubscribed);

        return () => {
            localParticipant.off('trackMuted', handleTrackSubscribed);
            localParticipant.off('trackUnmuted', handleTrackSubscribed);
        };
    }, [localParticipant, isRecording, transcript]);

    const handleExtraction = async (fullTranscript) => {
        if (!fullTranscript.trim()) return;

        console.log('🎤 Finished recording. Transcript:', fullTranscript);

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
            const res = await fetch(`${backendUrl}/extract-question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: fullTranscript }),
            });

            const data = await res.json();
            const extracted = data.extractedQuestion;

            if (extracted && extracted.trim() && extracted.trim().toUpperCase() !== '<NONE>') {
                console.log('🤖 Extracted Question:', extracted);

                // Extra check: ignore if AI returned meta-talk or filler
                const cleanExtracted = extracted.replace(/[?.!]/g, '').trim().toLowerCase();
                const blacklistedPatterns = [
                    /^i (have|got) (a|one|some) (doubt|question)s?$/i,
                    /^i (have|got) one more (doubt|question)$/i,
                    /^can you hear me$/i,
                    /^hi (ma'am|sir|teacher)$/i,
                    /^one (more )?(doubt|question) please$/i,
                    /^wait a (second|moment)$/i
                ];

                const isBlacklisted = blacklistedPatterns.some(pattern => pattern.test(cleanExtracted));

                if (isBlacklisted || cleanExtracted.length < 5) {
                    console.log('🚫 Ignoring meta-talk or too short question:', extracted);
                    return;
                }

                // Publish as STUDENT_DOUBT
                localParticipant.publishData(
                    new TextEncoder().encode(
                        JSON.stringify({
                            action: 'STUDENT_DOUBT',
                            id: Date.now() + '-' + Math.random().toString(36).substring(7),
                            text: extracted.trim(),
                            name: localParticipant.identity,
                            voiceGenerated: true // Mark for identification
                        })
                    ),
                    { reliable: true }
                );
            }
        } catch (err) {
            console.error('Extraction failed:', err);
        }
    };

    return null; // This is a logic-only component
}
