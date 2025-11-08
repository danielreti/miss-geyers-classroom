import { useRef, useEffect, useState, useCallback } from "react";

// Dice dot patterns
const getDiceDots = (value) => {
    const patterns = {
        1: [[0.5, 0.5]],
        2: [
            [0.25, 0.25],
            [0.75, 0.75],
        ],
        3: [
            [0.25, 0.25],
            [0.5, 0.5],
            [0.75, 0.75],
        ],
        4: [
            [0.25, 0.25],
            [0.75, 0.25],
            [0.25, 0.75],
            [0.75, 0.75],
        ],
        5: [
            [0.25, 0.25],
            [0.75, 0.25],
            [0.5, 0.5],
            [0.25, 0.75],
            [0.75, 0.75],
        ],
        6: [
            [0.25, 0.25],
            [0.75, 0.25],
            [0.25, 0.5],
            [0.75, 0.5],
            [0.25, 0.75],
            [0.75, 0.75],
        ],
    };
    return patterns[value] || patterns[1];
};

const InfiniteCanvas = () => {
    const canvasRef = useRef(null);
    const gridCanvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [paths, setPaths] = useState([]);
    const [currentPath, setCurrentPath] = useState([]);
    const [gridType, setGridType] = useState("none"); // 'none', 'lined', 'dotted'
    const [showWidgetMenu, setShowWidgetMenu] = useState(false);
    const [widgets, setWidgets] = useState([]);
    const [selectedWidget, setSelectedWidget] = useState(null);
    const [resizeHandle, setResizeHandle] = useState(null);

    // Transform screen coordinates to canvas coordinates
    const screenToCanvas = useCallback(
        (x, y) => {
            return {
                x: (x - offset.x) / scale,
                y: (y - offset.y) / scale,
            };
        },
        [offset, scale]
    );

    // Draw grid on separate canvas
    const drawGrid = useCallback(() => {
        const gridCanvas = gridCanvasRef.current;
        if (!gridCanvas || gridType === "none") {
            if (gridCanvas) {
                const ctx = gridCanvas.getContext("2d");
                ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
            }
            return;
        }

        const ctx = gridCanvas.getContext("2d");
        ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

        ctx.save();
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);

        const gridSize = 50;
        const startX = Math.floor(-offset.x / scale / gridSize) * gridSize;
        const endX =
            Math.ceil((gridCanvas.width - offset.x) / scale) * gridSize;
        const startY = Math.floor(-offset.y / scale / gridSize) * gridSize;
        const endY =
            Math.ceil((gridCanvas.height - offset.y) / scale) * gridSize;

        if (gridType === "lined") {
            ctx.strokeStyle = "#e0e0e0";
            ctx.lineWidth = 1 / scale;
            ctx.beginPath();

            for (let x = startX; x <= endX; x += gridSize) {
                ctx.moveTo(x, startY);
                ctx.lineTo(x, endY);
            }
            for (let y = startY; y <= endY; y += gridSize) {
                ctx.moveTo(startX, y);
                ctx.lineTo(endX, y);
            }
            ctx.stroke();
        } else if (gridType === "dotted") {
            ctx.fillStyle = "#c0c0c0";
            const dotRadius = 1.5 / scale;

            for (let x = startX; x <= endX; x += gridSize) {
                for (let y = startY; y <= endY; y += gridSize) {
                    ctx.beginPath();
                    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }, [gridType, offset, scale]);

    // Update grid when relevant state changes
    useEffect(() => {
        drawGrid();
    }, [drawGrid]);

    // Redraw all paths
    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply transformations
        ctx.save();
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);

        // Draw all saved paths
        paths.forEach((path) => {
            if (path.length < 2) return;

            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);

            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        });

        // Draw current path
        if (currentPath.length > 1) {
            ctx.beginPath();
            ctx.moveTo(currentPath[0].x, currentPath[0].y);

            for (let i = 1; i < currentPath.length; i++) {
                ctx.lineTo(currentPath[i].x, currentPath[i].y);
            }

            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
        }

        ctx.restore();
    }, [paths, currentPath, offset, scale]);

    useEffect(() => {
        redraw();
    }, [redraw]);

    // Mouse down handler
    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (e.button === 1 || e.button === 2 || e.ctrlKey || e.metaKey) {
            // Middle mouse or right click or ctrl/cmd + click for panning
            setIsPanning(true);
            setLastPos({ x, y });
            e.preventDefault();
        } else {
            // Left click for drawing
            const canvasPoint = screenToCanvas(x, y);
            setIsDrawing(true);
            setCurrentPath([canvasPoint]);
        }
    };

    // Mouse move handler
    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (selectedWidget !== null && resizeHandle) {
            const dx = (e.clientX - lastPos.x) / scale;
            const dy = (e.clientY - lastPos.y) / scale;

            setWidgets((prev) => {
                const updated = [...prev];
                const widget = { ...updated[selectedWidget] };

                if (resizeHandle === "move") {
                    widget.x += dx;
                    widget.y += dy;
                } else {
                    // Resize logic
                    if (resizeHandle.includes("n")) {
                        widget.y += dy;
                        widget.height -= dy;
                    }
                    if (resizeHandle.includes("s")) {
                        widget.height += dy;
                    }
                    if (resizeHandle.includes("w")) {
                        widget.x += dx;
                        widget.width -= dx;
                    }
                    if (resizeHandle.includes("e")) {
                        widget.width += dx;
                    }

                    // Minimum size
                    widget.width = Math.max(50, widget.width);
                    widget.height = Math.max(50, widget.height);
                }

                updated[selectedWidget] = widget;
                return updated;
            });

            setLastPos({ x: e.clientX, y: e.clientY });
        } else if (isPanning) {
            const dx = x - lastPos.x;
            const dy = y - lastPos.y;
            setOffset((prev) => ({
                x: prev.x + dx,
                y: prev.y + dy,
            }));
            setLastPos({ x, y });
        } else if (isDrawing) {
            const canvasPoint = screenToCanvas(x, y);
            setCurrentPath((prev) => [...prev, canvasPoint]);
        }
    };

    // Mouse up handler
    const handleMouseUp = () => {
        if (isDrawing && currentPath.length > 0) {
            setPaths((prev) => [...prev, currentPath]);
            setCurrentPath([]);
        }
        setIsDrawing(false);
        setIsPanning(false);
        setSelectedWidget(null);
        setResizeHandle(null);
    };

    // Wheel handler for zooming
    const handleWheel = (e) => {
        e.preventDefault();

        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom factor
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(10, scale * zoomFactor));

        // Adjust offset to zoom towards mouse position
        const scaleChange = newScale / scale;
        setOffset((prev) => ({
            x: mouseX - (mouseX - prev.x) * scaleChange,
            y: mouseY - (mouseY - prev.y) * scaleChange,
        }));

        setScale(newScale);
    };

    // Prevent context menu on right click
    const handleContextMenu = (e) => {
        e.preventDefault();
    };

    // Clear canvas
    const handleClearCanvas = () => {
        setPaths([]);
        setCurrentPath([]);
    };

    // Reset viewport
    const handleResetViewport = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    // Add dice widget
    const addDiceWidget = () => {
        const newWidget = {
            type: "dice",
            x: (window.innerWidth / 2 - 75 - offset.x) / scale,
            y: (window.innerHeight / 2 - 75 - offset.y) / scale,
            width: 150,
            height: 150,
            value: Math.floor(Math.random() * 6) + 1,
        };
        setWidgets((prev) => [...prev, newWidget]);
        setShowWidgetMenu(false);
    };

    // Roll dice
    const rollDice = (index) => {
        // Animate the dice roll
        let rollCount = 0;
        const rollInterval = setInterval(() => {
            setWidgets((prev) => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    value: Math.floor(Math.random() * 6) + 1,
                };
                return updated;
            });
            rollCount++;
            if (rollCount >= 10) {
                clearInterval(rollInterval);
            }
        }, 100);
    };

    // Handle global mouse move and mouse up for widget interactions
    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            if (selectedWidget !== null && resizeHandle) {
                handleMouseMove(e);
            }
        };

        const handleGlobalMouseUp = (e) => {
            if (selectedWidget !== null && resizeHandle) {
                handleMouseUp();
            }
        };

        if (selectedWidget !== null && resizeHandle) {
            document.addEventListener("mousemove", handleGlobalMouseMove);
            document.addEventListener("mouseup", handleGlobalMouseUp);
            return () => {
                document.removeEventListener(
                    "mousemove",
                    handleGlobalMouseMove
                );
                document.removeEventListener("mouseup", handleGlobalMouseUp);
            };
        }
    }, [selectedWidget, resizeHandle, handleMouseMove, handleMouseUp]);

    // Resize canvas to fill window
    useEffect(() => {
        const canvas = canvasRef.current;
        const gridCanvas = gridCanvasRef.current;
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gridCanvas.width = window.innerWidth;
            gridCanvas.height = window.innerHeight;
            drawGrid();
            redraw();
        };

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        return () => window.removeEventListener("resize", resizeCanvas);
    }, [drawGrid, redraw]);

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                overflow: "hidden",
                margin: 0,
                padding: 0,
            }}
        >
            {/* Grid canvas layer */}
            <canvas
                ref={gridCanvasRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "block",
                    pointerEvents: "none",
                    zIndex: 1,
                }}
            />
            {/* Drawing canvas layer */}
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onContextMenu={handleContextMenu}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "block",
                    cursor: isPanning
                        ? "grabbing"
                        : isDrawing
                        ? "crosshair"
                        : "crosshair",
                    touchAction: "none",
                    zIndex: 2,
                }}
            />

            {/* Widgets layer */}
            {widgets.map((widget, index) => {
                const screenX = widget.x * scale + offset.x;
                const screenY = widget.y * scale + offset.y;
                const screenWidth = widget.width * scale;
                const screenHeight = widget.height * scale;

                if (widget.type === "dice") {
                    return (
                        <div
                            key={index}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                const rect =
                                    e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;

                                // Check if clicking on a resize handle
                                const handleSize = 8;
                                const handles = [
                                    { name: "nw", x: 0, y: 0 },
                                    { name: "ne", x: rect.width, y: 0 },
                                    { name: "sw", x: 0, y: rect.height },
                                    {
                                        name: "se",
                                        x: rect.width,
                                        y: rect.height,
                                    },
                                    { name: "n", x: rect.width / 2, y: 0 },
                                    {
                                        name: "s",
                                        x: rect.width / 2,
                                        y: rect.height,
                                    },
                                    { name: "w", x: 0, y: rect.height / 2 },
                                    {
                                        name: "e",
                                        x: rect.width,
                                        y: rect.height / 2,
                                    },
                                ];

                                for (const handle of handles) {
                                    if (
                                        Math.abs(x - handle.x) <
                                            handleSize * 2 &&
                                        Math.abs(y - handle.y) < handleSize * 2
                                    ) {
                                        setSelectedWidget(index);
                                        setResizeHandle(handle.name);
                                        setLastPos({
                                            x: e.clientX,
                                            y: e.clientY,
                                        });
                                        return;
                                    }
                                }

                                // Otherwise it's a move
                                setSelectedWidget(index);
                                setResizeHandle("move");
                                setLastPos({ x: e.clientX, y: e.clientY });
                            }}
                            style={{
                                position: "absolute",
                                left: screenX,
                                top: screenY,
                                width: screenWidth,
                                height: screenHeight,
                                background: "white",
                                border:
                                    selectedWidget === index
                                        ? "3px solid #007bff"
                                        : "2px solid #333",
                                borderRadius: "12px",
                                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor:
                                    selectedWidget === index && resizeHandle
                                        ? resizeHandle === "move"
                                            ? "move"
                                            : `${resizeHandle}-resize`
                                        : "move",
                                userSelect: "none",
                                pointerEvents: "auto",
                                zIndex: 10,
                            }}
                        >
                            {/* Dice dots */}
                            <div
                                style={{
                                    width:
                                        Math.min(screenWidth, screenHeight) *
                                        0.75,
                                    height:
                                        Math.min(screenWidth, screenHeight) *
                                        0.75,
                                    position: "relative",
                                    pointerEvents: "none",
                                }}
                            >
                                {getDiceDots(widget.value).map(
                                    (dot, dotIndex) => (
                                        <div
                                            key={dotIndex}
                                            style={{
                                                position: "absolute",
                                                left: `${dot[0] * 100}%`,
                                                top: `${dot[1] * 100}%`,
                                                transform:
                                                    "translate(-50%, -50%)",
                                                width:
                                                    Math.min(
                                                        screenWidth,
                                                        screenHeight
                                                    ) * 0.15,
                                                height:
                                                    Math.min(
                                                        screenWidth,
                                                        screenHeight
                                                    ) * 0.15,
                                                borderRadius: "50%",
                                                background: "#333",
                                            }}
                                        />
                                    )
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    rollDice(index);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                style={{
                                    marginTop: "8px",
                                    padding: `${screenHeight * 0.05}px ${
                                        screenWidth * 0.1
                                    }px`,
                                    fontSize:
                                        Math.min(screenWidth, screenHeight) *
                                        0.12,
                                    background: "#007bff",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    pointerEvents: "auto",
                                }}
                            >
                                Roll
                            </button>

                            {/* Resize handles */}
                            {selectedWidget === index && (
                                <>
                                    {[
                                        "nw",
                                        "ne",
                                        "sw",
                                        "se",
                                        "n",
                                        "s",
                                        "w",
                                        "e",
                                    ].map((handle) => {
                                        const positions = {
                                            nw: {
                                                left: -4,
                                                top: -4,
                                                cursor: "nw-resize",
                                            },
                                            ne: {
                                                right: -4,
                                                top: -4,
                                                cursor: "ne-resize",
                                            },
                                            sw: {
                                                left: -4,
                                                bottom: -4,
                                                cursor: "sw-resize",
                                            },
                                            se: {
                                                right: -4,
                                                bottom: -4,
                                                cursor: "se-resize",
                                            },
                                            n: {
                                                left: "50%",
                                                top: -4,
                                                transform: "translateX(-50%)",
                                                cursor: "n-resize",
                                            },
                                            s: {
                                                left: "50%",
                                                bottom: -4,
                                                transform: "translateX(-50%)",
                                                cursor: "s-resize",
                                            },
                                            w: {
                                                left: -4,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                cursor: "w-resize",
                                            },
                                            e: {
                                                right: -4,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                cursor: "e-resize",
                                            },
                                        };
                                        return (
                                            <div
                                                key={handle}
                                                style={{
                                                    position: "absolute",
                                                    width: 8,
                                                    height: 8,
                                                    background: "#007bff",
                                                    border: "1px solid white",
                                                    borderRadius: "50%",
                                                    pointerEvents: "none",
                                                    ...positions[handle],
                                                }}
                                            />
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    );
                }
                return null;
            })}

            <div
                style={{
                    position: "fixed",
                    top: 10,
                    left: 10,
                    background: "rgba(255, 255, 255, 0.8)",
                    padding: "10px",
                    borderRadius: "5px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                }}
            >
                <div>Zoom: {(scale * 100).toFixed(0)}%</div>
                <div>Pan: Hold right-click or Ctrl/Cmd + click</div>
                <div>Draw: Left-click and drag</div>
                <div>Zoom: Scroll wheel</div>
            </div>

            {/* Bottom toolbar */}
            <div
                style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "rgba(255, 255, 255, 0.95)",
                    borderTop: "1px solid #ddd",
                    padding: "12px 20px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                }}
            >
                <button
                    onClick={() => setGridType("lined")}
                    style={{
                        padding: "8px 16px",
                        background:
                            gridType === "lined" ? "#007bff" : "#f0f0f0",
                        color: gridType === "lined" ? "white" : "#333",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: gridType === "lined" ? "600" : "normal",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        if (gridType !== "lined") {
                            e.target.style.background = "#e0e0e0";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (gridType !== "lined") {
                            e.target.style.background = "#f0f0f0";
                        }
                    }}
                >
                    Lined Grid
                </button>

                <button
                    onClick={() => setGridType("dotted")}
                    style={{
                        padding: "8px 16px",
                        background:
                            gridType === "dotted" ? "#007bff" : "#f0f0f0",
                        color: gridType === "dotted" ? "white" : "#333",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: gridType === "dotted" ? "600" : "normal",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        if (gridType !== "dotted") {
                            e.target.style.background = "#e0e0e0";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (gridType !== "dotted") {
                            e.target.style.background = "#f0f0f0";
                        }
                    }}
                >
                    Dotted Grid
                </button>

                <button
                    onClick={() => setGridType("none")}
                    style={{
                        padding: "8px 16px",
                        background: gridType === "none" ? "#007bff" : "#f0f0f0",
                        color: gridType === "none" ? "white" : "#333",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: gridType === "none" ? "600" : "normal",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        if (gridType !== "none") {
                            e.target.style.background = "#e0e0e0";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (gridType !== "none") {
                            e.target.style.background = "#f0f0f0";
                        }
                    }}
                >
                    Blank Canvas
                </button>

                <div
                    style={{
                        width: "1px",
                        height: "30px",
                        background: "#ccc",
                        margin: "0 5px",
                    }}
                />

                <button
                    onClick={handleClearCanvas}
                    style={{
                        padding: "8px 16px",
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = "#c82333";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = "#dc3545";
                    }}
                >
                    Clear Canvas
                </button>

                <button
                    onClick={handleResetViewport}
                    style={{
                        padding: "8px 16px",
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = "#218838";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = "#28a745";
                    }}
                >
                    Reset Viewport
                </button>

                <div
                    style={{
                        width: "1px",
                        height: "30px",
                        background: "#ccc",
                        margin: "0 5px",
                    }}
                />

                <button
                    onClick={() => setShowWidgetMenu(!showWidgetMenu)}
                    style={{
                        padding: "8px 16px",
                        background: showWidgetMenu ? "#6f42c1" : "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = showWidgetMenu
                            ? "#5a32a3"
                            : "#5a6268";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = showWidgetMenu
                            ? "#6f42c1"
                            : "#6c757d";
                    }}
                >
                    Widgets {showWidgetMenu ? "▼" : "▲"}
                </button>
            </div>

            {/* Widget menu */}
            {showWidgetMenu && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 60,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "white",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "16px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        zIndex: 1001,
                        minWidth: "200px",
                    }}
                >
                    <h3
                        style={{
                            margin: "0 0 12px 0",
                            fontSize: "16px",
                            color: "#333",
                        }}
                    >
                        Add Widget
                    </h3>
                    <button
                        onClick={addDiceWidget}
                        style={{
                            width: "100%",
                            padding: "10px",
                            background: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                            marginBottom: "8px",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = "#0056b3";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = "#007bff";
                        }}
                    >
                        🎲 Dice (1-6)
                    </button>
                </div>
            )}
        </div>
    );
};

export default InfiniteCanvas;
