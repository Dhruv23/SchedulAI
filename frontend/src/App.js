import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

function App() {
  const [user, setUser] = useState(null);

  return user ? (
    <Dashboard user={user} />
  ) : (
    <LoginPage onLogin={setUser} />
  );
}

export default App;