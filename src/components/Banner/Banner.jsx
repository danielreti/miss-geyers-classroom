import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRef } from "react";
import "./Banner.css";
import { useGamepadButton } from "../GamepadProvider.jsx";

const TAB_ORDER = [
    "/",
    "/picker",
    "/groups",
    "/whiteboard",
    "/timer",
    "/beatGame",
];

export default function Banner() {
    const location = useLocation();
    const navigate = useNavigate();

    const navigateRef = useRef(navigate);
    navigateRef.current = navigate;
    const pathRef = useRef(location.pathname);
    pathRef.current = location.pathname;

    useGamepadButton(14, () => {
        const idx = TAB_ORDER.indexOf(pathRef.current);
        if (idx > 0) navigateRef.current(TAB_ORDER[idx - 1]);
    });
    useGamepadButton(15, () => {
        const idx = TAB_ORDER.indexOf(pathRef.current);
        if (idx >= 0 && idx < TAB_ORDER.length - 1)
            navigateRef.current(TAB_ORDER[idx + 1]);
    });

    // const pad = navigator.getGamepads()[0];

    return (
        <nav className="banner-nav">
            {/* {pad && JSON.stringify(pad.axes)} */}
            {/* {pad && JSON.stringify(pad.buttons.map((b) => b.pressed))} */}
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
                to="/timer"
                className={`banner-link${location.pathname === "/timer" ? " active" : ""}`}
            >
                Countdown Timer
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
