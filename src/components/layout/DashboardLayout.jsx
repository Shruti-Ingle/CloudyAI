import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PageWrapper from './PageWrapper';

const DashboardLayout = () => {
  const location = useLocation();
  
  // Simple title mapping
  const titles = {
    '/dashboard': 'Dashboard',
    '/generate': 'Architecture Generator',
    '/analyse': 'Architecture Analyser',
    '/history': 'Generation History'
  };
  
  const title = titles[location.pathname] || 'CloudyAI';

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Navbar title={title} />
        <main className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
