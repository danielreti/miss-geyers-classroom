import { Routes, Route } from "react-router-dom";

import InfiniteCanvas from "./components/InfiniteCanvas/InfiniteCanvas";
import OnTheBeat from "./components/OnTheBeat/OnTheBeat";
import HomePage from "./components/HomePage/HomePage";
import StudentPicker from "./components/StudentPicker/StudentPicker";
import GroupMaker from "./components/GroupMaker/GroupMaker";
import CountdownTimer from "./components/CountdownTimer/CountdownTimer";

export default function AppRoutes({
    studentListKey,
    setStudentListKey,
    studentList,
    studentListOptions,
}) {
    return (
        <Routes>
            <Route path="/whiteboard" element={<InfiniteCanvas />} />
            <Route path="/beatGame" element={<OnTheBeat />} />
            <Route
                path="/picker"
                element={<StudentPicker studentList={studentList} />}
            />
            <Route
                path="/"
                element={
                    <HomePage
                        studentListKey={studentListKey}
                        setStudentListKey={setStudentListKey}
                        studentListOptions={studentListOptions}
                    />
                }
            />
            <Route
                path="/groups"
                element={<GroupMaker studentList={studentList} />}
            />
            <Route path="/timer" element={<CountdownTimer />} />
        </Routes>
    );
}
