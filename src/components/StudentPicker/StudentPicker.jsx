import React, { useState, useRef } from "react";
import "./StudentPicker.css";

const NAMES = [
    "Ava",
    "Ben",
    "Chloe",
    "Daniel",
    "Ella",
    "Finn",
    "Grace",
    "Henry",
    "Isla",
    "Jack",
    "Kara",
    "Liam",
    "Mia",
    "Noah",
    "Olivia",
    "Paul",
    "Quinn",
    "Ruby",
    "Sam",
    "Tara",
    "Uma",
    "Vera",
    "Will",
    "Xander",
    "Yara",
    "Zane",
    "Sophie",
    "Leo",
    "Hazel",
    "Miles",
];

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const StudentPicker = () => {
    const [count, setCount] = useState(1);
    const [animating, setAnimating] = useState(false);
    const [result, setResult] = useState([]);
    const [slotIndexes, setSlotIndexes] = useState(Array(1).fill(0));
    const [used, setUsed] = useState([]); // students already picked
    const [animationOn, setAnimationOn] = useState(true);
    const [neverExclude, setNeverExclude] = useState(false);
    const intervalRef = useRef(null);

    const handleCountChange = (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        let maxCount = neverExclude ? NAMES.length : NAMES.length - used.length;
        if (val > maxCount) val = maxCount;
        setCount(val);
        setSlotIndexes(Array(val).fill(0));
    };

    const startAnimation = () => {
        setResult([]);
        const slotCount = count;
        setSlotIndexes(Array(slotCount).fill(0));
        // Determine available names based on neverExclude
        const availableNames = neverExclude
            ? NAMES
            : NAMES.filter((n) => !used.includes(n));
        if (!animationOn) {
            // No animation, just pick instantly
            const picked = shuffle(availableNames).slice(0, slotCount);
            setResult(picked);
            setSlotIndexes(picked.map((name) => NAMES.indexOf(name)));
            if (!neverExclude) setUsed((prev) => [...prev, ...picked]);
            setAnimating(false);
            return;
        }
        setAnimating(true);
        let ticks = 0;
        intervalRef.current = setInterval(() => {
            setSlotIndexes((prev) =>
                prev.map(() =>
                    Math.floor(Math.random() * availableNames.length),
                ),
            );
            ticks++;
            if (ticks > 20) {
                clearInterval(intervalRef.current);
                const picked = shuffle(availableNames).slice(0, slotCount);
                setResult(picked);
                setSlotIndexes(picked.map((name) => NAMES.indexOf(name)));
                if (!neverExclude) setUsed((prev) => [...prev, ...picked]);
                setAnimating(false);
            }
        }, 50);
    };

    React.useEffect(() => {
        return () => clearInterval(intervalRef.current);
    }, []);

    return (
        <div className="student-picker-grid">
            <div className="student-picker-used-col">
                <div className="student-picker-used-title">Picked Students</div>
                {used.length === 0 && (
                    <div className="student-picker-used-empty">None</div>
                )}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "4px",
                    }}
                >
                    {used.map((name) => (
                        <div key={name} className="student-picker-used-name">
                            <span style={{ marginRight: "auto" }}>{name}</span>
                            <button
                                className="student-picker-remove-btn"
                                title="Allow this student to be picked again"
                                onClick={() =>
                                    setUsed((prev) =>
                                        prev.filter((n) => n !== name),
                                    )
                                }
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="student-picker-center-col">
                <div className="student-picker-sentence">
                    I want to pick
                    <input
                        type="number"
                        min={1}
                        max={
                            neverExclude
                                ? NAMES.length
                                : NAMES.length - used.length
                        }
                        value={count}
                        onChange={handleCountChange}
                        className="student-picker-input"
                        disabled={
                            animating ||
                            (!neverExclude && NAMES.length - used.length === 0)
                        }
                    />
                    student{count > 1 ? "s" : "\u00A0"}
                    <div className="student-picker-pick-btn-row">
                        <button
                            onClick={startAnimation}
                            disabled={
                                animating ||
                                (!neverExclude &&
                                    NAMES.length - used.length === 0)
                            }
                            className="student-picker-pick-btn"
                        >
                            Pick
                        </button>
                    </div>
                </div>

                <div
                    className={`student-picker-animation${animating ? " student-picker-animation-active" : ""}`}
                    style={{
                        "--student-picker-animation-height": `${count * 44}px`,
                    }}
                >
                    {animating ? (
                        <div className="student-picker-slots-col">
                            {slotIndexes.map((idx, i) => (
                                <div
                                    key={i}
                                    className="student-picker-slot student-picker-name-box"
                                >
                                    <span>
                                        {
                                            (neverExclude
                                                ? NAMES
                                                : NAMES.filter(
                                                      (n) => !used.includes(n),
                                                  ))[idx]
                                        }
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : result.length > 0 ? (
                        <div className="student-picker-result student-picker-slots-col">
                            {result.map((name, i) => (
                                <div
                                    key={i}
                                    className="student-picker-slot student-picker-name-box"
                                >
                                    {name}
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>
            <div className="student-picker-options-col">
                <div className="student-picker-options-title">Options</div>
                <div className="student-picker-option">
                    <label>
                        <input
                            type="checkbox"
                            checked={animationOn}
                            onChange={() => setAnimationOn((v) => !v)}
                            className="toggle"
                        />
                        Animation
                    </label>
                </div>
                <div className="student-picker-option">
                    <label>
                        <input
                            type="checkbox"
                            checked={neverExclude}
                            className="toggle"
                            onChange={() => {
                                setNeverExclude((v) => !v);
                                setCount(1); // reset count to avoid over-pick
                                setUsed([]); // reset used if toggling
                            }}
                        />
                        Allow repeats students (never exclude)
                    </label>
                </div>
            </div>
        </div>
    );
};

export default StudentPicker;
