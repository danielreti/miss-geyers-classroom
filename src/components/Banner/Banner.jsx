import { Link, useLocation } from "react-router-dom";
import "./Banner.css";

export default function Banner() {
    const location = useLocation();
    return (
        <nav className="banner-nav">
            <Link
                to="/"
                className={`banner-link${location.pathname === "/" ? " active" : ""}`}
            >
                Miss Geyer's Classroom
            </Link>
            <Link
                to="/picker"
                className={`banner-link${location.pathname === "/picker" ? " active" : ""}`}
            >
                Student Picker
            </Link>
            <Link
                to="/groups"
                className={`banner-link${location.pathname === "/groups" ? " active" : ""}`}
            >
                Group Maker
            </Link>
            <Link
                to="/whiteboard"
                className={`banner-link${location.pathname === "/whiteboard" ? " active" : ""}`}
            >
                Infinite Canvas
            </Link>

            <Link
                to="/beatGame"
                className={`banner-link${location.pathname === "/beatGame" ? " active" : ""}`}
            >
                On The Beat
            </Link>
        </nav>
    );
}
