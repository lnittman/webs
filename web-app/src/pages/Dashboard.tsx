import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowDownTrayIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface DomainStats {
  domain: string;
  pageCount: number;
}

interface Stats {
  pages: number;
  links: number;
  unprocessedLinks: number;
  domainStats: DomainStats[];
}

const DashboardCard: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  linkTo: string;
  color: string;
}> = ({ title, description, icon: Icon, linkTo, color }) => (
  <Link
    to={linkTo}
    className="flex flex-col p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
  >
    <div className={`p-3 rounded-full w-12 h-12 flex items-center justify-center ${color}`}>
      <Icon className="h-6 w-6 text-white" aria-hidden="true" />
    </div>
    <h3 className="mt-4 text-lg font-medium text-neutral-900 dark:text-white">{title}</h3>
    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
  </Link>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get<Stats>('/api/stats');
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-6">Dashboard</h1>
      
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading statistics...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-700 dark:text-red-400 mb-6">
          {error}
        </div>
      ) : (
        <>
          {/* Stats overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Pages</h3>
              <p className="mt-2 text-3xl font-semibold text-primary-600 dark:text-primary-400">{stats?.pages || 0}</p>
            </div>
            
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Domains</h3>
              <p className="mt-2 text-3xl font-semibold text-primary-600 dark:text-primary-400">{stats?.domainStats.length || 0}</p>
            </div>
            
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white">Links</h3>
              <p className="mt-2 text-3xl font-semibold text-primary-600 dark:text-primary-400">{stats?.links || 0}</p>
            </div>
          </div>
          
          {/* Quick actions */}
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <DashboardCard
              title="Fetch Content"
              description="Add new web content to your database"
              icon={ArrowDownTrayIcon}
              linkTo="/fetch"
              color="bg-blue-500"
            />
            
            <DashboardCard
              title="Browse Content"
              description="Explore your indexed web content"
              icon={GlobeAltIcon}
              linkTo="/browse"
              color="bg-green-500"
            />
            
            <DashboardCard
              title="Chat with Content"
              description="Have a conversation about your content"
              icon={ChatBubbleLeftRightIcon}
              linkTo="/chat"
              color="bg-purple-500"
            />
            
            <DashboardCard
              title="View Statistics"
              description="Analyze your content collection"
              icon={ChartBarIcon}
              linkTo="/stats"
              color="bg-orange-500"
            />
            
            <DashboardCard
              title="Manage Database"
              description="Clean and maintain your data"
              icon={Cog6ToothIcon}
              linkTo="/manage"
              color="bg-red-500"
            />
          </div>
          
          {/* Recent domains */}
          {stats?.domainStats && stats.domainStats.length > 0 && (
            <>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">Recent Domains</h2>
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden">
                <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {stats.domainStats.slice(0, 5).map((domain) => (
                    <li key={domain.domain} className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                      <Link to={`/domains/${domain.domain}`} className="flex justify-between items-center">
                        <span className="text-neutral-900 dark:text-white font-medium">{domain.domain}</span>
                        <span className="text-neutral-500 dark:text-neutral-400">{domain.pageCount} pages</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                
                {stats.domainStats.length > 5 && (
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
                    <Link
                      to="/browse"
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      View all domains
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard; 