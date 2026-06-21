import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../../utils/config';

export default function Terms() {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Acceptance of Terms',
      content: 'By accessing and using the Lucy Garden platform, you agree to be bound by these terms and conditions. If you do not agree, please do not use our services.'
    },
    {
      title: 'Account & Access',
      content: 'Access is provided via phone number and PIN. You are responsible for maintaining the confidentiality of your login credentials. One account per retailer. Unauthorized sharing of access is prohibited.'
    },
    {
      title: 'Order Placement',
      content: 'Orders must be placed within the designated order window. Orders placed are confirmed immediately and scheduled for next-day delivery. Modification is allowed only before the order window closes.'
    },
    {
      title: 'Delivery',
      content: 'We aim to deliver all orders within the specified delivery window (typically 6 AM – 12 PM). Delivery times may vary due to weather, route optimization, or unforeseen circumstances. Actual delivered quantities may differ from ordered quantities based on availability.'
    },
    {
      title: 'Pricing & Payment',
      content: 'Product prices are set by Lucy Garden and may change without prior notice. All deliveries are recorded in your digital ledger. Payment is expected as per agreed terms. Outstanding dues may affect future order processing.'
    },
    {
      title: 'Ledger & Balance',
      content: 'Your ledger reflects all orders (debits) and payments (credits). The closing balance represents your current outstanding amount. Disputes regarding ledger entries must be raised within 7 days.'
    },
    {
      title: 'Product Quality',
      content: 'We ensure all dairy products meet quality standards at the time of delivery. Any quality concerns must be reported within 2 hours of delivery. Perishable items are non-returnable after acceptance.'
    },
    {
      title: 'Account Termination',
      content: 'We reserve the right to suspend or terminate accounts that: have prolonged outstanding dues, violate these terms, or engage in fraudulent activity. Outstanding balances remain payable upon termination.'
    },
    {
      title: 'Limitation of Liability',
      content: 'Lucy Garden shall not be liable for: delays due to force majeure, temporary service interruptions, or indirect/consequential damages arising from use of the platform.'
    },
    {
      title: 'Changes to Terms',
      content: 'We may modify these terms at any time. Continued use of the platform after modifications constitutes acceptance of updated terms.'
    },
    {
      title: 'Contact',
      content: `For questions regarding these terms, contact us at: Phone: ${APP_CONFIG.phone}`
    },
  ];

  return (
    <div className="pb-24 space-y-5 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
        <ArrowLeft size={16} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-black text-gray-800 dark:text-white mb-1">Terms & Conditions</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>

        <div className="card !p-5 space-y-5">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            These terms govern your use of the {APP_CONFIG.appName} platform for dairy supply management services.
          </p>

          {sections.map((section, i) => (
            <div key={i}>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1.5">{i + 1}. {section.title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
