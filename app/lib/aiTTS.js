export function speakText(text) {
    return new Promise((resolve, reject) => {
        if (!window.speechSynthesis) {
            reject('Speech Synthesis not supported in this browser');
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        let finished = false;

        utterance.onend = () => {
            if (!finished) {
                finished = true;
                resolve();
            }
        };

        utterance.onerror = (err) => {
            if (!finished) {
                // 'interrupted' or 'canceled' are common when we stop current speech to start new one
                // We should not treat them as fatal errors that bubble up to the global handler
                if (err.error === 'interrupted' || err.error === 'canceled' || err.error === 'not-allowed') {
                    finished = true;
                    resolve(); // Resolve silently as this is expected behavior
                    return;
                }
                finished = true;
                console.error('SpeechSynthesis Error:', err);
                reject(err.error || 'Unknown speech error');
            }
        };

        // Only cancel if another speech is currently playing
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        // Speak this utterance
        window.speechSynthesis.speak(utterance);
    });
}
export function stopSpeaking() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}
