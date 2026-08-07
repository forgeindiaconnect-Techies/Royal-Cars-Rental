import React from 'react';

const BACKEND_URL = 'http://localhost:5000';

export const Step1Illustration = () => (
  <img
    src={`${BACKEND_URL}/brain-assets/step_01_search_vehicle_1785992143351.png`}
    alt="Search Vehicle"
    className="fleet-v2-how-img"
    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
  />
);

export const Step2Illustration = () => (
  <img
    src={`${BACKEND_URL}/brain-assets/step_02_ai_recommends_1785992158216.png`}
    alt="AI Recommends"
    className="fleet-v2-how-img"
    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
  />
);

export const Step3Illustration = () => (
  <img
    src={`${BACKEND_URL}/brain-assets/step_03_book_pay_1785992172827.png`}
    alt="Book & Pay"
    className="fleet-v2-how-img"
    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
  />
);

export const Step4Illustration = () => (
  <img
    src={`${BACKEND_URL}/brain-assets/step_04_pickup_drive_1785992187556.png`}
    alt="Pick Up & Drive"
    className="fleet-v2-how-img"
    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
  />
);

export const ShieldCheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B47A32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#FEF3C7" fillOpacity="0.4" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const SupportIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B47A32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" fill="#FEF3C7" fillOpacity="0.4" />
  </svg>
);

export const WalletIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B47A32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="14" rx="4" fill="#FEF3C7" fillOpacity="0.4" />
    <path d="M16 14h.01" strokeWidth="3" />
    <path d="M2 10h20" />
  </svg>
);

export const MedalIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B47A32" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6" fill="#FEF3C7" fillOpacity="0.4" />
    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
);

export const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B47A32" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
