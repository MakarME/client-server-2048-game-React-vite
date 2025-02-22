import { useState, useEffect } from "react";
import "./GameGrid.css";

const gridSize = 4;

const Game = ({ userId }) => {
    const [gameId, setGameId] = useState(null);
    const [board, setBoard] = useState(Array(gridSize).fill().map(() => Array(gridSize).fill(0)));
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const startGame = async () => {
        try {
            const response = await fetch("/api/game/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId }),
            });

            const data = await response.json();

            if (!data.board || data.score === undefined || !data.game_id) {
                throw new Error("Incorrect server response");
            }

            setGameId(data.game_id);
            setBoard(data.board);
            setScore(data.score);
            setGameOver(false);
        } catch (error) {
            console.error("Error starting game:", error);
        }
    };

    const makeMove = async (move) => {
        if (!gameId || gameOver) return;

        try {
            const response = await fetch("/api/game/move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ game_id: gameId, move }),
            });

            const data = await response.json();

            if (data.message === "Game ended") {
                setGameOver(true);
                return;
            }

            if (!data.newBoard || data.newScore === undefined) {
                throw new Error("Incorrect server response");
            }

            setBoard(data.newBoard);
            setScore(data.newScore);
        } catch (error) {
            console.error("Move error:", error);
        }
    };

    useEffect(() => {
        startGame();
    }, []);

    return (
        <div className="game-container">
            <h1>2048</h1>
            <p>Score: {score}</p>
            {gameOver && <p className="game-over">Игра завершена!</p>}
            <div className="game-grid">
                {board.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid-row">
                        {row.map((tile, colIndex) => (
                            <div key={`${rowIndex}-${colIndex}`} className={`grid-cell value-${tile || "empty"}`}>
                                {tile !== 0 ? tile : ""}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div className="controls">
                <button onClick={() => makeMove("up")} disabled={gameOver}>⬆️</button>
                <div>
                    <button onClick={() => makeMove("left")} disabled={gameOver}>⬅️</button>
                    <button onClick={() => makeMove("right")} disabled={gameOver}>➡️</button>
                </div>
                <button onClick={() => makeMove("down")} disabled={gameOver}>⬇️</button>
            </div>
        </div>
    );
};

export default Game;
