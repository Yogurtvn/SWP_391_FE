import { Outlet, useLocation } from "react-router";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isDashboardPage = location.pathname.startsWith("/admin") || location.pathname.startsWith("/staff");

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {!isLoginPage && !isDashboardPage && <Header />}
      <main className={isLoginPage || isDashboardPage ? "flex-1" : "flex-1"}>
        <Outlet />
      </main>
      {!isLoginPage && !isDashboardPage && <Footer />}
    </div>
  );
}