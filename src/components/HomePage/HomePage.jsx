import "./HomePage.css";

export default function HomePage({
    studentListKey,
    setStudentListKey,
    studentListOptions,
}) {
    return (
        <div className="homepage-wrapper">
            <div className="homepage-title">
                Welcome to Miss Geyer's Classroom
            </div>
            <div className="homepage-desc">
                Select a page above to get started!
            </div>
            <div style={{ marginTop: "2rem", textAlign: "center" }}>
                <label
                    htmlFor="student-list-select"
                    style={{
                        fontWeight: 500,
                        fontSize: "1.1rem",
                        marginRight: 8,
                    }}
                >
                    Choose student list:
                </label>
                <select
                    id="student-list-select"
                    value={studentListKey}
                    onChange={(e) => setStudentListKey(e.target.value)}
                    style={{
                        fontSize: "1.1rem",
                        padding: "0.3rem 1rem",
                        borderRadius: 6,
                    }}
                >
                    {studentListOptions.map((key) => (
                        <option value={key} key={key}>
                            {key}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
