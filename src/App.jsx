import { BrowserRouter as Router } from "react-router-dom";
import Banner from "./components/Banner/Banner.jsx";
import AppRoutes from "./AppRoutes.jsx";
import STUDENT_LISTS from "./components/studentList";
import { useState } from "react";

function App() {
    const [studentListKey, setStudentListKey] = useState(
        Object.keys(STUDENT_LISTS)[0],
    );
    const studentList = STUDENT_LISTS[studentListKey];
    return (
        <Router basename="/miss-geyers-classroom">
            <Banner />
            <AppRoutes
                studentListKey={studentListKey}
                setStudentListKey={setStudentListKey}
                studentList={studentList}
                studentListOptions={Object.keys(STUDENT_LISTS)}
            />
        </Router>
    );
}

export default App;
