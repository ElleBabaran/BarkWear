// src/App.tsx
import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./components/AdminDashboard";
import StaffDashboard from "./components/StaffDashboard";
import { User } from "./types";

const App: React.FC = () => {
  const [role, setRole] = useState<"admin" | "staff" | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    setRole(null);
    setUser(null);
  };

  if (!role) return <LandingPage setRole={setRole} />;
  if (!user) return <LoginPage role={role} onLogin={setUser} onBack={() => setRole(null)} />;
  if (role === "admin") return <AdminDashboard user={user} onLogout={handleLogout} />;
  return <StaffDashboard user={user} onLogout={handleLogout} />;
};

export default App;