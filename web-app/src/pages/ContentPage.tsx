import React from 'react';
import { useParams } from 'react-router-dom';

const ContentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Content #{id}</h1>
      <p className="text-gray-600 mb-4">
        Viewing specific content
      </p>
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-md">
        <p>Content view functionality coming soon</p>
      </div>
    </div>
  );
};

export default ContentPage; 