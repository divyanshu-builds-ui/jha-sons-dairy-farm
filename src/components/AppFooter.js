import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../utils/config';

export default function AppFooter({ type = 'retailer' }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      {/* Desktop */}
      <div className="hidden lg:block mt-8">
        <div className="bg-gradient-to-b from-[#f8fafc] to-[#eef2ff] dark:from-[#0a0a0a] dark:to-[#000000] border-t border-royal-100/40 dark:border-[#222222] px-8 pt-8 pb-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-start justify-between gap-8">
              {/* Brand */}
              <div>
                <div>
                  <p className="text-sm font-black text-gray-800 dark:text-white">{APP_CONFIG.appName}</p>
                  <p className="text-[9px] text-royal-600 dark:text-royal-400 font-bold uppercase tracking-wider">{APP_CONFIG.tagline}</p>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3 max-w-[220px] leading-relaxed">Fresh dairy delivered daily. Trusted by 50+ retailers in Madhubani.</p>
              </div>

              {/* Quick Links */}
              <div className="flex gap-10">
                <div>
                  <p className="text-[9px] font-bold text-royal-600/60 dark:text-royal-400/60 uppercase tracking-widest mb-2.5">Links</p>
                  <div className="space-y-1.5">
                    {type === 'retailer' ? (
                      <>
                        <Link to="/about" className="block text-[11px] text-gray-500 dark:text-gray-400 hover:text-royal-600 dark:hover:text-royal-400 transition-colors">About</Link>
                        <Link to="/privacy" className="block text-[11px] text-gray-500 dark:text-gray-400 hover:text-royal-600 dark:hover:text-royal-400 transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="block text-[11px] text-gray-500 dark:text-gray-400 hover:text-royal-600 dark:hover:text-royal-400 transition-colors">Terms</Link>
                        <Link to="/support" className="block text-[11px] text-gray-500 dark:text-gray-400 hover:text-royal-600 dark:hover:text-royal-400 transition-colors">Support</Link>
                      </>
                    ) : (
                      <>
                        <Link to="/admin/settings" className="block text-[11px] text-gray-500 dark:text-gray-400 hover:text-royal-600 dark:hover:text-royal-400 transition-colors">Settings</Link>
                        <Link to="/admin/support" className="block text-[11px] text-gray-500 dark:text-gray-400 hover:text-royal-600 dark:hover:text-royal-400 transition-colors">Tickets</Link>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-royal-600/60 dark:text-royal-400/60 uppercase tracking-widest mb-2.5">Contact</p>
                  <div className="space-y-1.5">
                    <a href={`tel:+91${APP_CONFIG.phone}`} className="block text-[11px] text-gray-500 dark:text-gray-400 hover:text-royal-600 transition-colors">{APP_CONFIG.phone}</a>
                    <a href={`https://wa.me/91${APP_CONFIG.phone}`} target="_blank" rel="noreferrer" className="block text-[11px] text-green-600 dark:text-green-400 font-medium">WhatsApp</a>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Madhubani, Bihar</p>
                  </div>
                </div>
              </div>

              {/* Developer */}
              <div className="text-right">
                <p className="text-[9px] font-bold text-royal-600/60 dark:text-royal-400/60 uppercase tracking-widest mb-2.5">Developed By</p>
                <a href={APP_CONFIG.developer.portfolio} target="_blank" rel="noreferrer" className="group">
                  <p className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-royal-600 dark:group-hover:text-royal-400 transition-colors">{APP_CONFIG.developer.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Full-Stack Developer</p>
                  <span className="inline-block mt-2 text-[10px] text-royal-600 dark:text-royal-400 font-semibold border border-royal-200 dark:border-royal-800 px-2.5 py-1 rounded-lg group-hover:bg-royal-50 dark:group-hover:bg-royal-900/30 transition-colors">
                    View Portfolio →
                  </span>
                </a>
              </div>
            </div>

            {/* Bottom */}
            <div className="mt-6 pt-4 border-t border-royal-100/30 dark:border-[#222222] flex items-center justify-between">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">&copy; {year} {APP_CONFIG.appName}. All rights reserved.</p>
              <p className="text-[10px] text-gray-300 dark:text-gray-600">Made by <a href={APP_CONFIG.developer.portfolio} target="_blank" rel="noreferrer" className="font-bold text-gray-500 dark:text-gray-400 hover:text-royal-600 transition-colors">{APP_CONFIG.developer.name}</a></p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile - minimal above bottom nav */}
      <div className="lg:hidden py-5 pb-24">
        <div className="flex flex-col items-center gap-2">
          <a href={APP_CONFIG.developer.portfolio} target="_blank" rel="noreferrer"
            className="text-[11px] text-gray-400 dark:text-gray-500">
            Made by <span className="font-bold text-gray-600 dark:text-gray-300">{APP_CONFIG.developer.name}</span>
          </a>
          <p className="text-[9px] text-gray-300 dark:text-gray-600">&copy; {year} {APP_CONFIG.appName} &middot; v{APP_CONFIG.version}</p>
        </div>
      </div>
    </footer>
  );
}
