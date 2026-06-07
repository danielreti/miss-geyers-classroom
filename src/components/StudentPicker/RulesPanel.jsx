import React, { useState, useEffect } from "react";

function getRulesCookieKey(studentListKey) {
    return `groupmaker_rules_${studentListKey}`;
}

function getCookie(name) {
    const match = document.cookie.match(
        new RegExp("(^| )" + name + "=([^;]+)"),
    );
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

export default function RulesPanel({
    studentList,
    rules,
    setRules,
    studentListKey,
    animationOn,
    setAnimationOn,
    neverExclude,
    setNeverExclude,
    setCount,
    count,
    setUsed,
    used,
}) {
    const [open, setOpen] = useState(false);
    // Track rule type for each rule
    const ruleTypes = ["cant_be_with", "omit"];

    // Load rules from cookies on mount or when studentListKey changes
    useEffect(() => {
        const saved = getCookie(getRulesCookieKey(studentListKey));
        if (saved) {
            try {
                setRules(JSON.parse(saved));
            } catch {}
        } else {
            setRules([]);
        }
        // eslint-disable-next-line
    }, [studentListKey]);

    // Save rules to cookies whenever they change
    useEffect(() => {
        setCookie(getRulesCookieKey(studentListKey), JSON.stringify(rules));
    }, [rules, studentListKey]);

    const handleRuleChange = (idx, field, value) => {
        setRules((rules) =>
            rules.map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
        );
    };

    const addRule = (type = "cant_be_with") => {
        if (type === "cant_be_with") {
            setRules((rules) => [
                ...rules,
                {
                    type: "cant_be_with",
                    a: studentList[0] || "",
                    b: studentList[1] || "",
                },
            ]);
        } else if (type === "omit") {
            setRules((rules) => [
                ...rules,
                { type: "omit", a: studentList[0] || "" },
            ]);
        } else if (type === "extra") {
            setRules((rules) => [...rules, { type: "extra", a: "" }]);
        }
    };

    const removeRule = (idx) => {
        setRules((rules) => rules.filter((_, i) => i !== idx));
    };

    return (
        <div className={`rules-panel-outer${open ? " open" : ""}`}>
            <div
                className="rules-panel-toggle"
                onClick={() => setOpen((o) => !o)}
                title="Show rules"
            >
                <span className="rules-panel-plus">+</span>
            </div>
            {open && (
                <div className="rules-panel-box">
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
                            Allow repeat students (never exclude)
                        </label>
                    </div>
                    <div className="rules-panel-title">Special Rules</div>
                    {rules.map((rule, idx) => (
                        <div className="rules-panel-rule-row" key={idx}>
                            {rule.type === "cant_be_with" ? (
                                <>
                                    <select
                                        value={rule.a}
                                        onChange={(e) =>
                                            handleRuleChange(
                                                idx,
                                                "a",
                                                e.target.value,
                                            )
                                        }
                                        className="rules-panel-dropdown"
                                    >
                                        {studentList.map((name) => (
                                            <option value={name} key={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="rules-panel-cant">
                                        can't be with
                                    </span>
                                    <select
                                        value={rule.b}
                                        onChange={(e) =>
                                            handleRuleChange(
                                                idx,
                                                "b",
                                                e.target.value,
                                            )
                                        }
                                        className="rules-panel-dropdown"
                                    >
                                        {studentList.map((name) => (
                                            <option value={name} key={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                </>
                            ) : rule.type === "omit" ? (
                                <>
                                    <span className="rules-panel-cant">
                                        Omit
                                    </span>
                                    <select
                                        value={rule.a}
                                        onChange={(e) =>
                                            handleRuleChange(
                                                idx,
                                                "a",
                                                e.target.value,
                                            )
                                        }
                                        className="rules-panel-dropdown"
                                    >
                                        {studentList.map((name) => (
                                            <option value={name} key={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                    {/* <span className="rules-panel-cant">
                                        from groups
                                    </span> */}
                                </>
                            ) : (
                                <>
                                    <span className="rules-panel-cant">
                                        Extra
                                    </span>
                                    <input
                                        type="text"
                                        value={rule.a}
                                        onChange={(e) =>
                                            handleRuleChange(
                                                idx,
                                                "a",
                                                e.target.value,
                                            )
                                        }
                                        className="rules-panel-dropdown"
                                    />
                                    {/* <span className="rules-panel-cant">
                                        in groups
                                    </span> */}
                                </>
                            )}
                            <button
                                className="rules-panel-remove"
                                onClick={() => removeRule(idx)}
                                title="Remove rule"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <div style={{ display: "flex", gap: 8 }}>
                        <button
                            className="rules-panel-add"
                            onClick={() => addRule("extra")}
                        >
                            + Add
                        </button>
                        <button
                            className="rules-panel-add"
                            onClick={() => addRule("omit")}
                        >
                            + Omit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
