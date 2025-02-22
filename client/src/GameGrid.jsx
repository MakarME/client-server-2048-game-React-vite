import React from "react";
import "./GameGrid.css";

const GameGrid = ({ board }) => {
    return (
        <div className="game-grid">
            {board.map((row, rowIndex) => (
                <div key={rowIndex} className="grid-row">
                    {row.map((cell, cellIndex) => (
                        <div key={cellIndex} className={`grid-cell value-${cell}`}>
                            {cell !== 0 ? cell : ""}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default GameGrid;
