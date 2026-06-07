import React, { useState } from "react";
import "./GroupMaker.css";
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

const GroupMaker = ({ studentList }) => {
    const [groupCount, setGroupCount] = useState(2);
    const [groups, setGroups] = useState([]);
    const [rules, setRules] = useState([]);
    const [error, setError] = useState("");

    const handleGroupCountChange = (e) => {
        let val = parseInt(e.target.value, 10);
        // if (isNaN(val) || val < 1) val = 1;
        if (val > studentList.length) val = studentList.length;
        setGroupCount(val);
    };

    function tryMakeGroups() {
        // Omit students
        const omitSet = new Set(
            rules.filter((r) => r.type === "omit").map((r) => r.a),
        );
        const filteredList = studentList.filter((name) => !omitSet.has(name));
        // Try to make groups that satisfy rules, up to 1000 attempts
        for (let attempt = 0; attempt < 1000; ++attempt) {
            const shuffled = shuffle(filteredList);
            const newGroups = Array.from({ length: groupCount }, () => []);
            shuffled.forEach((name, idx) => {
                newGroups[idx % groupCount].push(name);
            });
            if (!violatesRules(newGroups, rules)) {
                return newGroups;
            }
        }
        return null;
    }

    const makeGroups = () => {
        setError("");
        if (impossibleRules(studentList, groupCount, rules)) {
            setGroups([]);
            setError(
                "Impossible: Too many conflicting rules for this number of groups.",
            );
            return;
        }
        const result = tryMakeGroups();
        if (result) {
            setGroups(result);
        } else {
            setGroups([]);
            setError(
                "Couldn't find a valid grouping after many tries. Try relaxing the rules or increasing group count.",
            );
        }
    };

    return (
        <div className="group-maker-container">
            <RulesPanel
                studentList={studentList}
                rules={rules}
                setRules={setRules}
                studentListKey={
                    typeof window !== "undefined" && window.location
                        ? window.location.pathname + "_" + studentList.length
                        : studentList.length
                }
            />
            <div className="group-maker-sentence">
                I want to make
                <input
                    type="number"
                    min={1}
                    max={studentList.length}
                    value={groupCount}
                    onChange={handleGroupCountChange}
                    className="group-maker-input"
                />
                groups
                <div className="group-maker-btn-container">
                    <button className="group-maker-btn" onClick={makeGroups}>
                        Make Groups
                    </button>
                </div>
            </div>
            {error && <div className="group-maker-error">{error}</div>}
            <div className="group-maker-groups-grid">
                {groups.map((group, i) => (
                    <div className="group-maker-squarcle" key={i}>
                        <div className="group-maker-group-title">
                            Group {i + 1}
                        </div>
                        <div className="group-maker-names-col">
                            {group.map((name) => (
                                <div className="group-maker-name" key={name}>
                                    {name}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GroupMaker;
