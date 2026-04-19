import { Routes, Route } from "react-router-dom";

import InfiniteCanvas from "./components/InfiniteCanvas/InfiniteCanvas";
import OnTheBeat from "./components/OnTheBeat/OnTheBeat";
import HomePage from "./components/HomePage/HomePage";
import StudentPicker from "./components/StudentPicker/StudentPicker";
import GroupMaker from "./components/GroupMaker/GroupMaker";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/whiteboard" element={<InfiniteCanvas />} />
            <Route path="/beatGame" element={<OnTheBeat />} />
            <Route path="/picker" element={<StudentPicker />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/groups" element={<GroupMaker />} />
        </Routes>
    );
}
