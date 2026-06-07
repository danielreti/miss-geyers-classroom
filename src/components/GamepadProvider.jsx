// GamepadProvider.jsx
import { createContext, useContext, useEffect, useRef } from "react";

const GamepadContext = createContext(null);

export function GamepadProvider({ children }) {
    const handlers = useRef(new Map()); // buttonIndex -> Set<callback>

    useEffect(() => {
        let rafId;
        const prev = {};
        const poll = () => {
            const pads = navigator.getGamepads ? navigator.getGamepads() : [];
            const pressed = {};
            for (const pad of pads) {
                if (!pad) continue;
                pad.buttons.forEach((b, i) => {
                    if (b.pressed) pressed[i] = true;
                });
            }
            // Single edge-detection source of truth
            for (const [i, cbs] of handlers.current) {
                if (pressed[i] && !prev[i]) cbs.forEach((cb) => cb());
            }
            Object.keys(prev).forEach((k) => (prev[k] = false));
            Object.assign(prev, pressed);
            rafId = requestAnimationFrame(poll);
        };
        rafId = requestAnimationFrame(poll);
        return () => cancelAnimationFrame(rafId);
    }, []);

    return (
        <GamepadContext.Provider value={handlers}>
            {children}
        </GamepadContext.Provider>
    );
}

export function useGamepadButton(buttonIndex, callback) {
    const handlers = useContext(GamepadContext);
    const cbRef = useRef(callback);
    cbRef.current = callback;
    useEffect(() => {
        const fn = () => cbRef.current();
        if (!handlers.current.has(buttonIndex)) {
            handlers.current.set(buttonIndex, new Set());
        }
        handlers.current.get(buttonIndex).add(fn);
        return () => handlers.current.get(buttonIndex)?.delete(fn);
    }, [buttonIndex, handlers]);
}
