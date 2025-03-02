# 2048 Game with Google OAuth Authentication

## Overview
This project is a web-based implementation of the classic 2048 game with Google OAuth authentication. It allows users to log in using their Google accounts, play the game, and save their high scores to a leaderboard stored in a Microsoft SQL Server database.

## Features
- Google OAuth authentication for secure user login
- Interactive 2048 game built with React.js (Vite)
- Server-side logic implemented with Node.js and Express
- REST API for communication between the client and server
- Microsoft SQL Server database for storing users and game data
- Leaderboard system displaying top players

## Technologies Used
### Frontend:
- React.js (Vite)
- Google OAuth Client
- Fetch API for server communication

### Backend:
- Node.js with Express.js
- Google-auth-library for authentication
- Microsoft SQL Server for database management

## Installation
### Prerequisites
- Node.js and npm installed
- Microsoft SQL Server configured

### Setup Instructions
1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/2048-game.git
   cd 2048-game
   ```
2. Install dependencies for the client:
   ```sh
   cd client
   npm install
   ```
3. Install dependencies for the server:
   ```sh
   cd server
   npm install
   ```
4. Configure environment variables:
   - Create a `.env` file in the `server` directory and add:
     ```env
     CLIENT_ID=your-google-client-id
     DATABASE_URL=your-mssql-connection-string
     ```
5. Start the backend server:
   ```sh
   cd server
   npm start
   ```
6. Start the frontend:
   ```sh
   cd client
   npm run dev
   ```

## API Endpoints
### Authentication
- **POST /api/auth/google** – Verifies Google token and stores user data in the database.

### Game Management
- **POST /api/game/start** – Initializes a new game session.
- **POST /api/game/move** – Processes user moves and updates the game board.
- **POST /api/game/end** – Ends the game and saves the final score.
- **GET /api/leaderboard** – Retrieves the top 10 players with the highest scores.

## Database Schema
### Users Table
| Column    | Type      | Description         |
|-----------|----------|---------------------|
| google_id | NVARCHAR | Primary key, user ID from Google |
| email     | NVARCHAR | User email |
| name      | NVARCHAR | User name |
| picture   | NVARCHAR | User profile picture |

### Games Table
| Column   | Type      | Description         |
|----------|----------|---------------------|
| id       | INT      | Primary key |
| user_id  | NVARCHAR | Foreign key referencing `users.google_id` |
| score    | INT      | User's final score |
| board    | NVARCHAR | JSON representation of the game board |
| status   | NVARCHAR | Game status ('in_progress' or 'finished') |

## License
This project is licensed under the MIT License.

## Author
[Your Name](https://github.com/your-username)

