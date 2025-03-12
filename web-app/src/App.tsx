import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import FetchPage from './pages/FetchPage';
import BrowsePage from './pages/BrowsePage';
import DomainPage from './pages/DomainPage';
import ContentPage from './pages/ContentPage';
import ChatPage from './pages/ChatPage';
import StatsPage from './pages/StatsPage';
import ManagePage from './pages/ManagePage';
import NotFoundPage from './pages/NotFoundPage';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider>
      <Router>
        <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
          <Sidebar open={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar toggleSidebar={toggleSidebar} />
            
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/fetch" element={<FetchPage />} />
                <Route path="/browse" element={<BrowsePage />} />
                <Route path="/domains/:domain" element={<DomainPage />} />
                <Route path="/content/:id" element={<ContentPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/manage" element={<ManagePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            
            <footer className="bg-white dark:bg-neutral-800 shadow-md py-3 px-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">
              <p>⚡ Webs - A modern web content tool</p>
            </footer>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App; 