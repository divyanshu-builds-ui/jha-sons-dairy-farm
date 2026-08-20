export const SUBSCRIPTION = {
  milkType: 'Cow + Buffalo',
  cowQty: 1,
  buffaloQty: 0.5,
  totalQty: 1.5,
  status: 'active',
  nextDelivery: '6:00 AM – 8:00 AM',
  since: 'Jan 2025',
  cowRate: 60,
  buffaloRate: 70,
};

export const MONTH_STATS = {
  daysDelivered: 18,
  totalLitres: 27,
  cowLitres: 18,
  buffaloLitres: 9,
  estimatedBill: 1755,
  daysLeft: 12,
  month: 'July 2025',
  streak: 7,
};

export const DELIVERIES = [
  { date: 'Today, 15 Jul',    qty: 1.5, cow: 1, buffalo: 0.5, status: 'delivered' },
  { date: 'Yesterday, 14 Jul',qty: 1.5, cow: 1, buffalo: 0.5, status: 'delivered' },
  { date: '13 Jul',           qty: 1.5, cow: 1, buffalo: 0.5, status: 'delivered' },
  { date: '12 Jul',           qty: 0,   cow: 0, buffalo: 0,   status: 'paused'    },
  { date: '11 Jul',           qty: 1.5, cow: 1, buffalo: 0.5, status: 'delivered' },
  { date: '10 Jul',           qty: 1.5, cow: 1, buffalo: 0.5, status: 'delivered' },
  { date: '9 Jul',            qty: 1.5, cow: 1, buffalo: 0.5, status: 'delivered' },
  { date: '8 Jul',            qty: 1.5, cow: 1, buffalo: 0.5, status: 'delivered' },
];

export const BILLING = [
  { month: 'June 2025',  litres: 45, amount: 2925, status: 'paid',    date: '1 Jul 2025' },
  { month: 'May 2025',   litres: 46.5, amount: 3022, status: 'paid',  date: '1 Jun 2025' },
  { month: 'April 2025', litres: 45, amount: 2925, status: 'paid',    date: '1 May 2025' },
];

export const ACTIVE_SCHEME = {
  name: 'Monthly Loyalty Bonus',
  desc: 'Complete 30 litres — get 1 litre free.',
  progress: 27,
  target: 30,
};

export const REFERRAL = {
  code: 'JHA-1234',
  earned: 4,
  pending: 2,
};

export const UPCOMING_HOLIDAYS = [
  { date: '19 Jul', reason: 'Farm Maintenance' },
  { date: '15 Aug', reason: 'Independence Day' },
];
