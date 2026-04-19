import React, { useState } from "react";
import NAMES from "../studentList";
import "./GroupMaker.css";

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

const GroupMaker = () => {
    const [groupCount, setGroupCount] = useState(2);
    const [groups, setGroups] = useState([]);

    const handleGroupCountChange = (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 1;
        if (val > NAMES.length) val = NAMES.length;
        setGroupCount(val);
    };

    const makeGroups = () => {
        const shuffled = shuffle(NAMES);
        const newGroups = Array.from({ length: groupCount }, () => []);
        shuffled.forEach((name, idx) => {
            newGroups[idx % groupCount].push(name);
        });
        setGroups(newGroups);
    };

    return (
        <div className="group-maker-container">
            <div className="group-maker-sentence">
                I want to make
                <input
                    type="number"
                    min={1}
                    max={NAMES.length}
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
