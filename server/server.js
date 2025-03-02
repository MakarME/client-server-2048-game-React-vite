const express = require('express');
const { sql, poolPromise } = require("./db");
const { OAuth2Client } = require("google-auth-library");
const cors = require("cors");
const app = express();

const CLIENT_ID = "Id";
const PORT = 5000;

const client = new OAuth2Client(CLIENT_ID);

app.use(express.json());
app.use(cors());

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

const gridSize = 4;

function getRandom() {
    const weights = [0.9, 0.1];
    const results = [2, 4];
    let num = Math.random(),
        s = 0,
        lastIndex = weights.length - 1;

    for (let i = 0; i < lastIndex; ++i) {
        s += weights[i];
        if (num < s) {
            return results[i];
        }
    }

    return results[lastIndex];
};

function createGrid(gridSize) {

    let rows = [];
    let columns = [];

    for (let x = 0; x < gridSize; x++) {
        columns.push([])
    }

    for (let x = 0; x < gridSize; x++) {
        row = [];
        for (let y = 0; y < gridSize; y++) {
            row.push(0)
        }
        rows.push(row)
    }

    for (let x = 0; x < gridSize; x++) {
        row = rows[x]
        for (let y = 0; y < gridSize; y++) {
            columns[y][x] = row[y]
        }
    }
    return rows//, columns
}

function move(grid, direction) {
    let newGrid = JSON.parse(JSON.stringify(grid));
    let isVertical = direction == "up" || direction == "down";
    let isReverse = direction == "down" || direction == "right";

    let lines = isVertical ? transposeGrid(newGrid) : newGrid;

    for (let i = 0; i < gridSize; i++) {
        let line = isReverse ? lines[i].reverse() : lines[i];
        line = shiftLine(line);
        if (isReverse) line.reverse();
        lines[i] = line;
    }

    return isVertical ? transposeGrid(lines) : lines;
}

function shiftLine(line) {
    let filtered = line.filter(v => v !== 0);
    for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
            filtered[i] *= 2;
            filtered[i + 1] = 0;
            i++;
        }
    }
    filtered = filtered.filter(v => v !== 0);
    return filtered.concat(Array(gridSize - filtered.length).fill(0));
}

function transposeGrid(grid) {
    return grid[0].map((_, i) => grid.map(row => row[i]));
}

function addRandomTiles(grid, count = 1) {
    let emptyCells = [];

    for (let x = 0; x < grid.length; x++) {
        for (let y = 0; y < grid[x].length; y++) {
            if (grid[x][y] == 0) {
                emptyCells.push({ x, y });
            }
        }
    }

    if (emptyCells.length == 0) return grid;

    shuffleArray(emptyCells);

    for (let i = 0; i < Math.min(count, emptyCells.length); i++) {
        let { x, y } = emptyCells[i];
        grid[x][y] = getRandom();
    }

    return grid;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = getRandomInt(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function calculateScore(grid) {
    return grid.flat().reduce((sum, value) => sum + value, 0);
}

function hasAvailableMoves(grid) {
    for (let row of grid) {
        if (row.includes(0)) {
            return true;
        }
    }

    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length - 1; j++) {
            if (grid[i][j] === grid[i][j + 1]) {
                return true;
            }
        }
    }

    for (let j = 0; j < grid[0].length; j++) {
        for (let i = 0; i < grid.length - 1; i++) {
            if (grid[i][j] === grid[i + 1][j]) {
                return true;
            }
        }
    }

    return false;
}

app.post("/api/auth/google", async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: google_id, email, name, picture } = payload;

        const pool = await poolPromise;

        const result = await pool
            .request()
            .input("google_id", sql.NVarChar, google_id)
            .query("SELECT * FROM users WHERE google_id = @google_id");

        if (result.recordset.length === 0) {
            await pool
                .request()
                .input("google_id", sql.NVarChar, google_id)
                .input("email", sql.NVarChar, email)
                .input("name", sql.NVarChar, name)
                .input("picture", sql.NVarChar, picture)
                .query(
                    "INSERT INTO users (google_id, email, name, picture) VALUES (@google_id, @email, @name, @picture)"
                );
        }

        res.json({ message: "Auth success", user: { google_id, email, name, picture } });
    } catch (error) {
        res.status(401).json({ error: "Error veryfying token" });
    }
});

app.post("/api/game/start", async (req, res) => {
    try {
        const { user_id } = req.body;
        const pool = await poolPromise;

        let grid = createGrid(gridSize);
        addRandomTiles(grid, 2);
        score = calculateScore(grid)

        const result = await pool
            .request()
            .input("user_id", sql.NVarChar, user_id)
            .input("board", sql.NVarChar, JSON.stringify(grid))
            .input("score", sql.Int, score)
            .input("status", sql.NVarChar, 'in_progress')
            .query(
                `INSERT INTO games (user_id, score, board, status) 
                 OUTPUT INSERTED.id 
                 VALUES (@user_id, @score, @board, @status)`
            );

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(500).json({ error: "Error creating game" });
        }

        res.json({ message: "Game started", game_id: result.recordset[0].id, board: grid, score: 0 });
    } catch (error) {
        console.error("Error starting game:", error);
        res.status(500).json({ error: "Server error" });
    }
});


app.post("/api/game/move", async (req, res) => {
    try {
        const { game_id, move: moveDirection } = req.body;
        const pool = await poolPromise;

        const gameResult = await pool
            .request()
            .input("game_id", sql.Int, game_id)
            .query("SELECT * FROM games WHERE id = @game_id");

        if (gameResult.recordset.length === 0) {
            return res.status(404).json({ error: "Game not found" });
        }

        const game = gameResult.recordset[0];
        let board = JSON.parse(game.board);
        let score = game.score;

        let newBoard = move(board, moveDirection);

        newBoard = addRandomTiles(newBoard, 1);
        let newScore = calculateScore(newBoard);

        if (!hasAvailableMoves(newBoard)) {
            await pool
                .request()
                .input("game_id", sql.Int, game_id)
                .input("board", sql.NVarChar, JSON.stringify(newBoard))
                .input("score", sql.Int, newScore)
                .query("UPDATE games SET board = @board, score = @score, status = 'finished' WHERE id = @game_id");

            return res.json({ message: "Game ended", newBoard, newScore });
        }

        await pool
            .request()
            .input("game_id", sql.Int, game_id)
            .input("board", sql.NVarChar, JSON.stringify(newBoard))
            .input("score", sql.Int, newScore)
            .query("UPDATE games SET board = @board, score = @score WHERE id = @game_id");

        res.json({ newBoard, newScore });
    } catch (error) {
        console.error("Error making move:", error);
        res.status(500).json({ error: "Server error" });
    }
});

app.post("/api/game/end", async (req, res) => {
    const { game_id } = req.body;

    const pool = await poolPromise;

    await pool
        .request()
        .input("game_id", sql.Int, game_id)
        .query("UPDATE games SET status = 'finished' WHERE id = @game_id");

    res.json({ message: "Game ended" });
});

app.get("/api/leaderboard", async (req, res) => {
    const pool = await poolPromise;

    const result = await pool
        .request()
        .query(`
            SELECT TOP 10 users.name, games.score 
            FROM games 
            INNER JOIN users ON games.user_id = users.google_id
            WHERE games.status = 'finished' 
            ORDER BY games.score DESC
        `);

    res.json(result.recordset);
});

app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
