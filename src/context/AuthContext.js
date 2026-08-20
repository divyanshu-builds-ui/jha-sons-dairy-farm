import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext(null);

// Admin phone numbers — these users get admin role
const ADMIN_PHONES = ['+917493832037']; // Babloo/Prabhat ka number

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null); // 'admin' | 'customer' | null
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mock user first
    const mockUser = localStorage.getItem('mockUser');
    if (mockUser) {
      const parsed = JSON.parse(mockUser);
      setUser(parsed);
      setRole(parsed.role || 'customer');
      setProfile(parsed);
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Check if admin
        const phone = firebaseUser.phoneNumber;
        if (phone && ADMIN_PHONES.includes(phone)) {
          setRole('admin');
          setProfile(null);
          setLoading(false);
          return;
        }

        // Load customer profile from Firestore
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            setProfile(snap.data());
            setRole('customer');
          } else {
            // New user — needs to complete signup
            setProfile(null);
            setRole('new');
          }
        } catch {
          setRole('customer');
        }
      } else {
        setUser(null);
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function logout() {
    // Clear mock user if exists
    localStorage.removeItem('mockUser');
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, logout, setProfile, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
