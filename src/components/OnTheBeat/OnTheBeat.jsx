import "./OnTheBeat.css";
import { useState, useEffect, useRef } from "react";
import beatTrack from "./W17.2 Say the beat - climb, cool, dear.mp3";

const duration = 0.33; // Duration of each panel animation in seconds
const delay = 4.05;
const roundDelay = duration * 16; // Time between the start of each round

const OnTheBeat = () => {
    const [word1, setWord1] = useState("");
    const [word2, setWord2] = useState("");
    const [word3, setWord3] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [currentLevel, setCurrentLevel] = useState(0); // 0: easy, 1: medium, 2: hard
    const audioRef = useRef(null);

    const easy = [
        [word1, word1, word1, word1, word1, word1, word1, word1],
        [word2, word2, word2, word2, word2, word2, word2, word2],
        [word2, word1, word1, word2, word2, word1, word1, word2],
        [word2, word1, word2, word1, word2, word1, word2, word1],
        [word1, word1, word2, word2, word1, word1, word2, word2],
    ];
    const medium = [
        [word1, word1, word1, word1, word1, word1, word1, word1],
        [word3, word3, word3, word3, word3, word3, word3, word3],
        [word3, word3, word3, word3, word1, word1, word1, word1],
        [word3, word1, word3, word1, word3, word1, word3, word1],
        [word1, word3, word1, word3, word1, word3, word1, word3],
    ];
    const hard = [
        [word2, word2, word2, word2, word2, word2, word3, word2],
        [word3, word3, word3, word3, word3, word3, word1, word3],
        [word2, word1, word2, word3, word2, word1, word2, word3],
        [word3, word2, word2, word3, word3, word2, word3, word2],
        [word1, word1, word2, word2, word1, word3, word2, word1],
    ];

    // Animation timing: each roundDelay per round, 5 rounds per level
    const [showEnd, setShowEnd] = useState(false);
    useEffect(() => {
        if (!submitted) return;
        if (showEnd) return;
        if (currentLevel > 2) {
            setShowEnd(true);
            return;
        }
        // Advance to next level after all rounds in this level finish
        const timer = setTimeout(
            () => {
                if (currentLevel < 2) {
                    setCurrentLevel((prev) => prev + 1);
                } else if (currentLevel === 2) {
                    setShowEnd(true);
                }
            },
            delay * 1000 +
                roundDelay * 5 * 1000 +
                1650 +
                (currentLevel === 1 ? -600 : 0),
        ); // Wait for all rounds in this level
        return () => clearTimeout(timer);
    }, [submitted, currentLevel, showEnd]);

    const levelsArr = [easy, medium, hard];
    const levelNames = ["EASY", "MEDIUM", "HARD"];

    return (
        <div className="onthebeat-wrapper">
            {submitted ? (
                showEnd ? (
                    <div className="end-screen">
                        <div className="end-title">YOU DID IT!</div>
                        <button
                            onClick={() => {
                                if (audioRef.current) {
                                    audioRef.current.pause();
                                    audioRef.current.currentTime = 0;
                                }
                                setSubmitted(false);
                                setCurrentLevel(0);
                                setShowEnd(false);
                            }}
                        >
                            Play Again
                        </button>
                    </div>
                ) : (
                    <div className="animation">
                        <div className="animation-header first">
                            Say the words <br /> on the beat!
                        </div>
                        {currentLevel <= 2 && (
                            <div key={currentLevel}>
                                <div className="animation-header second">
                                    Level {currentLevel + 1} <br />
                                    {levelNames[currentLevel]}!
                                </div>
                                {levelsArr[currentLevel].map(
                                    (pattern, index) => (
                                        <div
                                            className="animation-body"
                                            key={index}
                                        >
                                            <div
                                                style={{
                                                    animation: `fadeIn ${duration}s ease-in-out ${delay + index * roundDelay}s, fadeOut ${duration}s ease-in-out ${delay + 16 * duration + index * roundDelay - 0.2}s`,
                                                    animationFillMode:
                                                        "forwards",
                                                }}
                                                className="animation-round"
                                            >
                                                Round {index + 1}
                                            </div>
                                            <div className="animation-panels">
                                                {pattern.map((x, i) => (
                                                    <div
                                                        key={i}
                                                        className="animation-panel"
                                                        style={{
                                                            animation: `growIn ${duration - 0.1}s ease-in-out ${delay + i * duration + index * roundDelay}s, border ${duration}s ease-in-out ${delay + i * duration + index * roundDelay + duration * 8}s,fadeOut ${duration}s ease-in-out ${delay + 16 * duration + index * roundDelay - 0.2}s`,
                                                            animationFillMode:
                                                                "forwards",
                                                        }}
                                                    >
                                                        {x}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        )}
                    </div>
                )
            ) : (
                <div className="form">
                    <div className="header">Enter three words</div>
                    <input
                        className="onthebeat-input"
                        type="text"
                        placeholder="Word 1"
                        value={word1}
                        onChange={(e) => setWord1(e.target.value)}
                    />
                    <input
                        className="onthebeat-input"
                        type="text"
                        placeholder="Word 2"
                        value={word2}
                        onChange={(e) => setWord2(e.target.value)}
                    />
                    <input
                        className="onthebeat-input"
                        type="text"
                        placeholder="Word 3"
                        value={word3}
                        onChange={(e) => setWord3(e.target.value)}
                    />
                    <button
                        className="onthebeat-submit"
                        onClick={() => {
                            setSubmitted(true);
                            setCurrentLevel(0);
                            setShowEnd(false);
                            if (audioRef.current) {
                                audioRef.current.currentTime = 0;
                                audioRef.current.play();
                            }
                        }}
                    >
                        Let's go!
                    </button>
                </div>
            )}
            <audio ref={audioRef} src={beatTrack} />
        </div>
    );
};

export default OnTheBeat;
