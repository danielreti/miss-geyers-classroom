import React, { useState, useRef, useEffect } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import "./CountdownTimer.css";

function parseTimeInput(input) {
    // Accepts HH:MM:SS, MM:SS, or SS
    const parts = input.split(":").map(Number);
    if (parts.some(isNaN)) return 0;
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        return parts[0];
    }
    return 0;
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s]
        .map((v, i) => (i === 0 ? v : v.toString().padStart(2, "0")))
        .join(":");
}

function padTimeDigits(str) {
    // Pads or trims to 6 digits (hhmmss)
    let digits = str.replace(/\D/g, "");
    if (digits.length > 6) digits = digits.slice(-6);
    return digits.padStart(6, "0");
}

function splitTimeDigits(digits) {
    // Returns [hh, mm, ss] as strings
    return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)];
}

function digitsToSeconds(digits) {
    const [hh, mm, ss] = splitTimeDigits(digits).map(Number);
    return hh * 3600 + mm * 60 + ss;
}

const CountdownTimer = () => {
    const [digits, setDigits] = useState("000000");
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [key, setKey] = useState(0);
    const [initialDigits, setInitialDigits] = useState("000000");
    const [finished, setFinished] = useState(false);
    const remainingRef = useRef(0);
    const [canResume, setCanResume] = useState(false);

    const handleDigitInput = (e) => {
        const val = e.target.value.replace(/\D/g, "");
        if (val.length > 6) return;
        setDigits(padTimeDigits(val));
        setCanResume(false);
    };

    const handleKeyDown = (e) => {
        if (e.key >= "0" && e.key <= "9") {
            setDigits((prev) => padTimeDigits(prev.slice(1) + e.key));
            setCanResume(false);
            e.preventDefault();
        } else if (e.key === "Backspace") {
            setDigits((prev) => padTimeDigits("0" + prev.slice(0, -1)));
            setCanResume(false);
            e.preventDefault();
        }
    };

    const handleStart = () => {
        const secs = digitsToSeconds(digits);
        setDuration(secs);
        setKey((k) => k + 1);
        setIsPlaying(true);
        setInitialDigits(digits);
        setFinished(false);
        setCanResume(true);
    };

    const handleReset = () => {
        setIsPlaying(false);
        setDigits(initialDigits);
        setDuration(digitsToSeconds(initialDigits));
        setKey((k) => k + 1);
        setCanResume(false);
        setFinished(false);
    };

    const handleStop = () => {
        setIsPlaying(false);
    };

    const [hh, mm, ss] = splitTimeDigits(digits);

    // Allow Enter key to start timer
    const handleInputKeyDown = (e) => {
        handleKeyDown(e);
        if (e.key === "Enter" && digitsToSeconds(digits) > 0 && !isPlaying) {
            handleStart();
            e.preventDefault();
        }
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            setIsPlaying(false); // pause (stays resumable)
            return;
        }
        if (canResume && duration > 0 && !finished) {
            setIsPlaying(true); // resume where it left off
            return;
        }
        const secs = digitsToSeconds(digits);
        if (secs === 0) return;
        setDuration(secs);
        setKey((k) => k + 1);
        setInitialDigits(digits);
        setFinished(false);
        setCanResume(true);
        setIsPlaying(true);
    };

    const playAlarm = () => {
        try {
            const ctx = new (
                window.AudioContext || window.webkitAudioContext
            )();
            [0, 0.4, 0.8].forEach((t) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g);
                g.connect(ctx.destination);
                o.frequency.value = 880;
                g.gain.setValueAtTime(0.2, ctx.currentTime + t);
                o.start(ctx.currentTime + t);
                o.stop(ctx.currentTime + t + 0.25);
            });
        } catch {}
    };

    const handleAddMinute = () => {
        if (isPlaying) {
            const newRemaining = Math.min(remainingRef.current + 60, 359999);
            setDuration(newRemaining);
            setKey((k) => k + 1); // remount with new duration, stays playing
            setDigits(secondsToDigits(newRemaining));
            return;
        }
        const total = Math.min(digitsToSeconds(digits) + 60, 359999);
        setDigits(secondsToDigits(total));
    };

    const playPauseRef = useRef(handlePlayPause);
    playPauseRef.current = handlePlayPause;
    const addMinuteRef = useRef(handleAddMinute);
    addMinuteRef.current = handleAddMinute;

    useEffect(() => {
        let rafId;
        let prevTop = false;
        let prevRight = false;
        const TOP = 3; // X
        const RIGHT = 1; // A

        const poll = () => {
            const pads = navigator.getGamepads ? navigator.getGamepads() : [];
            let top = false;
            let right = false;
            for (const pad of pads) {
                if (!pad) continue;
                if (pad.buttons[TOP]?.pressed) top = true;
                if (pad.buttons[RIGHT]?.pressed) right = true;
            }
            if (top && !prevTop) addMinuteRef.current();
            if (right && !prevRight) playPauseRef.current();
            prevTop = top;
            prevRight = right;
            rafId = requestAnimationFrame(poll);
        };

        rafId = requestAnimationFrame(poll);
        return () => cancelAnimationFrame(rafId);
    }, []);

    function secondsToDigits(total) {
        const h = Math.floor(total / 3600)
            .toString()
            .padStart(2, "0");
        const m = Math.floor((total % 3600) / 60)
            .toString()
            .padStart(2, "0");
        const s = (total % 60).toString().padStart(2, "0");
        return h + m + s;
    }

    return (
        <div
            className={`countdown-timer-container${finished ? " finished" : ""}`}
        >
            <div className="countdown-timer-input-row">
                <div className="countdown-timer-input-group">
                    <input
                        type="text"
                        className="countdown-timer-input"
                        value={`${hh}${mm}${ss}`}
                        onChange={handleDigitInput}
                        onKeyDown={handleInputKeyDown}
                        maxLength={6}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        aria-label="Timer input"
                        style={{ width: "250px", letterSpacing: "0.1em" }}
                    />
                    <div className="countdown-timer-labels">
                        <span>{hh}h</span> <span>{mm}m</span> <span>{ss}s</span>
                    </div>
                </div>
            </div>
            <div className="countdown-timer-controls-row">
                <button
                    className="countdown-timer-start-btn"
                    onClick={handleStart}
                    disabled={digitsToSeconds(digits) === 0 || isPlaying}
                >
                    Start
                </button>
                <button
                    className="countdown-timer-stop-btn"
                    onClick={handleStop}
                    disabled={!isPlaying}
                >
                    Pause
                </button>
                <button
                    className="countdown-timer-reset-btn"
                    onClick={handleReset}
                    disabled={duration === 0 && !isPlaying}
                >
                    Reset
                </button>
                <button
                    className="countdown-timer-add-btn"
                    onClick={handleAddMinute}
                >
                    +1 min
                </button>
            </div>
            <div className="countdown-timer-circle" onClick={handlePlayPause}>
                <CountdownCircleTimer
                    key={key}
                    isPlaying={isPlaying}
                    duration={duration}
                    colors={["#646cff", "#f6f6ff"]}
                    size={550}
                    strokeWidth={20}
                    onComplete={() => {
                        setIsPlaying(false);
                        setFinished(true);
                        setCanResume(false);
                        playAlarm();
                    }}
                    rotation="counterclockwise"
                >
                    {({ remainingTime }) => {
                        remainingRef.current = remainingTime;
                        return (
                            <span className="countdown-timer-time">
                                {formatTime(remainingTime)}
                            </span>
                        );
                    }}
                </CountdownCircleTimer>
            </div>
        </div>
    );
};

export default CountdownTimer;
