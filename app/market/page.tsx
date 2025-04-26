"use client"; // Mark as a client component

import React from 'react';

const MarketPage = () => {
  console.log('Rendering minimal MarketPage Client Component'); // Updated log
  return (
    <div>
      <h1>Market Page (Minimal)</h1>
      <p>This is a simplified market page to test for hydration errors.</p>
    </div>
  );
};

export default MarketPage;