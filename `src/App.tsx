import React from 'react';
import ChatWidget from './components/ChatWidget';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* restul conținutului aplicației */}
      <ChatWidget />
    </div>
  );
}
