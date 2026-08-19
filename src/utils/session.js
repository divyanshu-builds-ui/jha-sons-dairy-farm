/**
 * Session isolation utility — prevents session collision when multiple users
 * log in from the same browser. Uses sessionStorage (per-tab) to track which
 * user is active in the current tab, and stores user data per-phone in localStorage.
 */

export function getActivePhone() {
  return sessionStorage.getItem('lg_active_phone') || localStorage.getItem('lg_last_login') || null;
}

export function getSessionUser() {
  const phone = getActivePhone();
  if (!phone) return null;
  const data = localStorage.getItem(`lg_user_${phone}`);
  return data ? JSON.parse(data) : null;
}

export function setSessionUser(userData) {
  if (!userData?.phone) return;
  localStorage.setItem(`lg_user_${userData.phone}`, JSON.stringify(userData));
  localStorage.setItem('lg_last_login', userData.phone);
  sessionStorage.setItem('lg_active_phone', userData.phone);
}

export function clearSession(phone) {
  const p = phone || getActivePhone();
  if (p) localStorage.removeItem(`lg_user_${p}`);
  sessionStorage.removeItem('lg_active_phone');
}
