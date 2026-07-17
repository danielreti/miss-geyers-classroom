import React, { useState, useRef } from "react";
import "./StudentPicker.css";
import RulesPanel from "./RulesPanel";

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function violatesRules(groups, rules) {
    // Returns true if any rule is violated in the groups
    for (const rule of rules) {
        if (rule.type === "cant_be_with") {
            if (!rule.a || !rule.b || rule.a === rule.b) continue;
            for (const group of groups) {
                if (group.includes(rule.a) && group.includes(rule.b)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function impossibleRules(studentList, groupCount, rules) {
    // Returns true if the rules make the task impossible (e.g., 3 students all can't be together but only 2 groups)
    // Simple check: if there is a clique of N students all can't be together, and groupCount < N, it's impossible
    // Build a graph of can't-be-with relationships
    const graph = {};
    for (const name of studentList) graph[name] = new Set();
    for (const rule of rules) {
        if (
            rule.type === "cant_be_with" &&
            rule.a &&
            rule.b &&
            rule.a !== rule.b
        ) {
            graph[rule.a].add(rule.b);
            graph[rule.b].add(rule.a);
        }
    }
    // Find largest clique (brute force, ok for small N)
    const names = studentList;
    let maxClique = 1;
    function dfs(path, idx) {
        maxClique = Math.max(maxClique, path.length);
        for (let i = idx; i < names.length; ++i) {
            if (path.every((n) => graph[names[i]].has(n))) {
                dfs([...path, names[i]], i + 1);
            }
        }
    }
    for (let i = 0; i < names.length; ++i) dfs([names[i]], i + 1);
    return maxClique > groupCount;
}

const StudentPicker = ({ studentList }) => {
    const [count, setCount] = useState(1);
    const [animating, setAnimating] = useState(false);
    const [result, setResult] = useState([]);
    const [slotIndexes, setSlotIndexes] = useState(Array(1).fill(0));
    const [used, setUsed] = useState([]); // students already picked
    const [animationOn, setAnimationOn] = useState(false);
    const [neverExclude, setNeverExclude] = useState(false);
    const intervalRef = useRef(null);
    const [rules, setRules] = useState([]);
    const [error, setError] = useState("");
    const [usedOpen, setUsedOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const poolRef = useRef([]);

    // Responsive layout based on how many are picked at once
    const pickColumns = count <= 3 ? 1 : count <= 8 ? 2 : 3;
    const pickFontSize =
        count <= 1 ? 150 : count <= 3 ? 90 : count <= 8 ? 54 : 34;
    const pickBoxHeight =
        count <= 1 ? 250 : count <= 3 ? 150 : count <= 8 ? 110 : 80;

    // Apply rules: add "extra" students and remove "omit" students from the pool
    const effectiveStudentList = React.useMemo(() => {
        const omitted = new Set(
            rules.filter((r) => r.type === "omit" && r.a).map((r) => r.a),
        );
        const extras = rules
            .filter((r) => r.type === "extra" && r.a && r.a.trim())
            .map((r) => r.a.trim());
        return [
            ...studentList.filter((n) => !omitted.has(n)),
            ...extras.filter(
                (n, i) => !studentList.includes(n) && extras.indexOf(n) === i,
            ),
        ];
    }, [studentList, rules]);

    const handleCountChange = (e) => {
        let val = parseInt(e.target.value, 10);
        setCount(val);
        setSlotIndexes(Array(val).fill(0));
    };

    const startAnimation = () => {
        setResult([]);
        setIsVisible(true);

        // Current pool of pickable students
        let pool = neverExclude
            ? effectiveStudentList
            : effectiveStudentList.filter((n) => !used.includes(n));
        let baseUsed = used;

        // Exhausted → reset and pick fresh in this SAME click
        if (!neverExclude && pool.length === 0) {
            pool = effectiveStudentList;
            baseUsed = [];
        }

        // Pick at most what's available (5 requested, 2 left → 2)
        const slotCount = Math.min(count, pool.length);
        poolRef.current = pool;
        setSlotIndexes(Array(slotCount).fill(0));

        if (slotCount === 0) return; // no students at all

        if (!animationOn) {
            const picked = shuffle(pool).slice(0, slotCount);
            setResult(picked);
            setSlotIndexes(
                picked.map((name) => effectiveStudentList.indexOf(name)),
            );
            if (!neverExclude) setUsed([...baseUsed, ...picked]);
            setAnimating(false);
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, 5000);
            return;
        }

        setAnimating(true);
        let ticks = 0;
        intervalRef.current = setInterval(() => {
            setSlotIndexes((prev) =>
                prev.map(() => Math.floor(Math.random() * pool.length)),
            );
            ticks++;
            if (ticks > 20) {
                clearInterval(intervalRef.current);
                const picked = shuffle(pool).slice(0, slotCount);
                setResult(picked);
                setSlotIndexes(
                    picked.map((name) => effectiveStudentList.indexOf(name)),
                );
                if (!neverExclude) setUsed([...baseUsed, ...picked]);
                setAnimating(false);
            }
        }, 50);
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 5000);
    };

    const resetPicker = () => {
        clearInterval(intervalRef.current);
        setUsed([]);
        setResult([]);
        setAnimating(false);
        setSlotIndexes(Array(count).fill(0));
    };

    React.useEffect(() => {
        return () => clearInterval(intervalRef.current);
    }, []);

    // Keep a ref to the latest startAnimation so the gamepad loop
    // never calls a stale closure.
    const startAnimationRef = useRef(startAnimation);
    startAnimationRef.current = startAnimation;
    const animatingRef = useRef(animating);
    animatingRef.current = animating;

    // Poll for a gamepad and trigger Pick when the bottom face button
    // is pressed.
    React.useEffect(() => {
        let rafId;
        let prevPressed = false;
        const BUTTON_INDEX = 0; // bottom face button in the standard mapping

        const poll = () => {
            const pads =
                typeof navigator !== "undefined" && navigator.getGamepads
                    ? navigator.getGamepads()
                    : [];
            let pressed = false;
            for (const pad of pads) {
                if (pad && pad.buttons[BUTTON_INDEX]?.pressed) {
                    pressed = true;
                    break;
                }
            }
            // Edge detection: fire only on the press, not while held.
            if (pressed && !prevPressed && !animatingRef.current) {
                startAnimationRef.current();
            }
            prevPressed = pressed;
            rafId = requestAnimationFrame(poll);
        };

        rafId = requestAnimationFrame(poll);
        return () => cancelAnimationFrame(rafId);
    }, []);

    return (
        <div className="student-picker-grid">
            <RulesPanel
                setAnimationOn={setAnimationOn}
                animationOn={animationOn}
                neverExclude={neverExclude}
                setNeverExclude={setNeverExclude}
                setCount={setCount}
                count={count}
                setUsed={setUsed}
                used={used}
                studentList={studentList}
                rules={rules}
                setRules={setRules}
                studentListKey={
                    typeof window !== "undefined" && window.location
                        ? window.location.pathname + "_" + studentList.length
                        : studentList.length
                }
            />
            <div className="student-picker-center-col">
                <div className="student-picker-sentence">
                    I want to pick
                    <input
                        type="number"
                        value={count}
                        onChange={handleCountChange}
                        className="student-picker-input"
                    />
                    student{count > 1 ? "s" : "\u00A0"}
                    <div className="student-picker-pick-btn-row">
                        <button
                            onClick={startAnimation}
                            disabled={animating}
                            className="student-picker-pick-btn"
                        >
                            Pick
                        </button>
                        <button
                            onClick={resetPicker}
                            disabled={animating || used.length === 0}
                            className="student-picker-pick-btn student-picker-reset-btn"
                        >
                            Reset
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
                        <div
                            className="student-picker-slots-col"
                            style={{
                                "--picker-columns": pickColumns,
                                "--picker-font-size": `${pickFontSize}px`,
                                "--picker-box-height": `${pickBoxHeight}px`,
                            }}
                        >
                            {slotIndexes.map((idx, i) => (
                                <div
                                    key={i}
                                    className="student-picker-slot student-picker-name-box"
                                >
                                    <span>{poolRef.current[idx]}</span>
                                </div>
                            ))}
                        </div>
                    ) : result.length > 0 ? (
                        <div
                            className="student-picker-result student-picker-slots-col"
                            style={{
                                "--picker-columns": pickColumns,
                                "--picker-font-size": `${pickFontSize}px`,
                                "--picker-box-height": `${pickBoxHeight}px`,
                            }}
                        >
                            {isVisible &&
                                result.map((name, i) => (
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
            <div
                className={`student-picker-used-col${usedOpen ? " open" : ""}`}
            >
                <div
                    className="student-picker-used-title"
                    onClick={() => setUsedOpen((o) => !o)}
                >
                    Picked Students ({used.length})
                    <span className="student-picker-used-caret">
                        {usedOpen ? "▼" : "▲"}
                    </span>
                </div>
                <div className="student-picker-used-body">
                    {used.length === 0 && (
                        <div className="student-picker-used-empty">None</div>
                    )}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            margin: "0 auto",
                            maxWidth: "600px",
                            gap: "4px",
                        }}
                    >
                        {used.map((name) => (
                            <div
                                key={name}
                                className="student-picker-used-name"
                            >
                                <span style={{ marginRight: "auto" }}>
                                    {name}
                                </span>
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
            </div>
        </div>
    );
};

export default StudentPicker;
