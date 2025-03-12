import React from 'react';
import { useParams } from 'react-router-dom';

const DomainPage: React.FC = () => {
  const { domain } = useParams<{ domain: string }>();

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Domain: {domain}</h1>
      <p className="text-gray-600 mb-4">
        Content for this domain
      </p>
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md">
        <p>Domain content functionality coming soon</p>
      </div>
    </div>
  );
};

export default DomainPage; 