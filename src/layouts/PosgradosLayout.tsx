import { useState } from "react";
import { Outlet, Navigate, useNavigate } from "react-router";
import ufpsLogo from "../assets/logoufps.png";
import { MenuIcon } from "../assets/icons";
import { posgradosAuthService } from "../services/posgrados/posgradosService";

function LogoutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 17l5-5-5-5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 4H5a1 1 0 00-1 1v14a1 1 0 001 1h5" />
    </svg>
  );
}

export default function PosgradosLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const session = posgradosAuthService.getSession();

  if (!session) {
    return <Navigate to="/posgrados/login" replace />;
  }

  const handleLogout = () => {
    posgradosAuthService.logout();
    navigate("/posgrados/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="flex items-center justify-between gap-3 px-6 py-3 bg-red-700 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menú"
            className="p-2 rounded-lg hover:bg-red-800 transition-colors md:hidden"
          >
            <MenuIcon />
          </button>
          <img src={ufpsLogo} alt="UFPS" className="h-8 w-auto" />
          <span className="text-sm font-bold hidden md:inline">Usuario Posgrados</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm hidden md:inline">{session.displayName ?? session.username}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors"
          >
            <LogoutIcon />
            <span className="hidden md:inline">Cerrar sesión</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
