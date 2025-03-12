import React from 'react';
import { NavLink } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  GlobeAltIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  open: boolean;
  closeSidebar: () => void;
}

const navItems = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Fetch', href: '/fetch', icon: ArrowDownTrayIcon },
  { name: 'Browse', href: '/browse', icon: GlobeAltIcon },
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Stats', href: '/stats', icon: ChartBarIcon },
  { name: 'Manage', href: '/manage', icon: Cog6ToothIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ open, closeSidebar }) => {
  return (
    <>
      {/* Mobile sidebar overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-neutral-900 bg-opacity-50 transition-opacity md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-neutral-800 shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:relative md:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center">
            <span className="text-2xl font-semibold text-primary-600 dark:text-primary-400">⚡</span>
            <span className="ml-2 text-xl font-semibold text-neutral-900 dark:text-white">webs</span>
          </div>
          <button
            className="p-2 rounded-md text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={closeSidebar}
          >
            <span className="sr-only">Close sidebar</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <nav className="py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                    : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`
              }
              onClick={closeSidebar}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar; 