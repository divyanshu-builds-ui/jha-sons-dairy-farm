import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../../utils/config';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Information We Collect',
      content: 'We collect the following information when you register and use our platform: your name, phone number, shop name, delivery area, and order history. This information is necessary to provide our dairy supply services.'
    },
    {
      title: 'How We Use Your Information',
      content: 'Your information is used to: process and deliver your orders, maintain your account and ledger, send order status updates, provide customer support, and improve our services. We do not sell your personal information to third parties.'
    },
    {
      title: 'Data Storage & Security',
      content: 'Your data is stored securely on Google Firebase cloud infrastructure. We implement industry-standard security measures to protect your information from unauthorized access, alteration, or destruction.'
    },
    {
      title: 'Order & Payment Data',
      content: 'We maintain records of your orders, payments, and ledger entries for business accounting purposes. This data is retained as long as your account is active and as required by applicable laws.'
    },
    {
      title: 'Cookies & Local Storage',
      content: 'Our app uses local storage to maintain your login session and preferences (such as dark mode). No third-party tracking cookies are used.'
    },
    {
      title: 'Your Rights',
      content: 'You have the right to: access your personal data, request correction of inaccurate data, and request deletion of your account. Contact us to exercise these rights.'
    },
    {
      title: 'Changes to This Policy',
      content: 'We may update this privacy policy from time to time. Any changes will be reflected in the app with an updated date. Continued use of the app after changes constitutes acceptance.'
    },
    {
      title: 'Contact Us',
      content: `For any privacy-related concerns, contact us at: Phone: ${APP_CONFIG.phone}`
    },
  ];

  return (
    <div className="pb-24 space-y-5 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
        <ArrowLeft size={16} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-black text-gray-800 dark:text-white mb-1">Privacy Policy</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Last updated: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>

        <div className="card !p-5 space-y-5">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {APP_CONFIG.appName} ("we", "our", "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our dairy supply management platform.
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
