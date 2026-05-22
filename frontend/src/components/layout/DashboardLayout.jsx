import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ children }) => {
  // Map page titles based on standard window pathname in MPA mode
  const path = window.location.pathname;
  let title = 'CloudyAI';
  if (path.includes('dashboard')) title = 'Dashboard';
  else if (path.includes('generate')) title = 'Architecture Generator';
  else if (path.includes('analyse')) title = 'Architecture Analyser';
  else if (path.includes('history')) title = 'Generation History';

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
