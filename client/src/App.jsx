import { useState, useEffect } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import "./App.css";
import Leaderboard from "./Leaderboard";
import Game from "./Game";

function App() {
  const clientId = "Id";
  const [userId, setUserId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const getLeaderboard = async () => {
    try {
      const response = await fetch("/api/leaderboard", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setLeaderboard(data);
      console.log("Leaderboard:", data);
    } catch (error) {
      console.error("Error receiving leaderboard:", error);
    }
  };

  const handleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse.credential;

    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await response.json();
      setUserId(data.user.google_id);
      console.log("Server response:", data);
    } catch (error) {
      console.error("Error sending token:", error);
    }
  };

  useEffect(() => {
    getLeaderboard();
  }, []);

  return (
    <>
      <GoogleOAuthProvider clientId={clientId}>
        <div>
          {userId ? (
            <Game userId={userId} />
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => console.log("Login Failed")}
            />
          )}
        </div>
      </GoogleOAuthProvider>
      <Leaderboard players={leaderboard} maxPlayers={10} />
    </>
  );
}

export default App;
