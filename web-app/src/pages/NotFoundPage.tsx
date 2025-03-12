import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="container mx-auto text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-8">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage; 