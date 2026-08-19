import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <p className="text-[80px] font-black text-sand-200 leading-none mb-4">404</p>
        <h1 className="heading-md mb-2">Page Not Found</h1>
        <p className="body-md mb-6">The page you are looking for does not exist.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );
}
