import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, doc, cachedGetDoc } from '../services/firebase';

const FeatureFlagContext = createContext({});

export function FeatureFlagProvider({ children }) {
  const [flags, setFlags] = useState({
    seasonalProducts: true,
    supportTickets: true,
    orderHistory: true,
    ledgerView: true,
    darkMode: true,
    pdfInvoice: true,
    duplicateOrderCheck: true,
    balanceWarning: true,
    companyOrder: true,
    bulkPriceUpdate: true,
    cancelOrder: true,
    priceList: true,
    pullToRefresh: true,
    welcomePopup: true,
    installPrompt: true,
    orderPlacement: true,
    rateCard: true,
    announcements: true,
    autoCleanup: true,
    usageTracking: true,
  });

  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const snap = await cachedGetDoc(doc(db, 'settings', 'featureFlags'), 5 * 60 * 1000);
        if (snap.exists()) setFlags(prev => ({ ...prev, ...snap.data() }));
      } catch {}
    };
    fetchFlags();
  }, []);

  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export const useFlags = () => useContext(FeatureFlagContext);
