import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./components/AdminDashboard";
import StaffDashboard from "./components/StaffWelcomeDashboard";
import { User } from "./types";

// These MUST match StaffWelcomeDashboard
type StaffPage = "attendance" | "students" | "schedule";

const App: React.FC = () => {
  const [role, setRole] = useState<"admin" | "staff" | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [staffPage, setStaffPage] = useState<StaffPage>("attendance");

  const handleLogout = () => {
    setRole(null);
    setUser(null);
    setStaffPage("attendance");
  };

  const handleStaffNavigate = (page: StaffPage) => {
    console.log("Navigating to:", page);
    setStaffPage(page);
  };

  // Landing screen
  if (!role) {
    return <LandingPage setRole={setRole} />;
  }

  // Login screen
  if (!user) {
    return (
      <LoginPage
        role={role}
        onLogin={setUser}
        onBack={() => setRole(null)}
      />
    );
  }

  // Admin dashboard
  if (role === "admin") {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  // Staff dashboard
  return (
    <StaffDashboard
      user={user}
      onLogout={handleLogout}
      onNavigate={handleStaffNavigate}
    />
  );
};

export default App;
