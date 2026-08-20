export const ADMIN_STATS = {
  totalCustomers: 152,
  activeToday: 141,
  pausedToday: 11,
  monthlyRevenue: 187450,
  pendingPayments: 3,
  totalLitresToday: 211.5,
  month: 'July 2025',
};

export const CUSTOMERS = [
  { id: 1, name: 'Ramesh Kumar',   phone: '9876543210', area: 'Kaluahi',          cow: 1,   buffalo: 0.5, status: 'active',  bill: 1755, paid: true  },
  { id: 2, name: 'Sunita Devi',    phone: '9812345678', area: 'Haripur Baxitol',  cow: 2,   buffalo: 0,   status: 'active',  bill: 2400, paid: true  },
  { id: 3, name: 'Mohan Jha',      phone: '9898989898', area: 'Benta',            cow: 0,   buffalo: 1,   status: 'active',  bill: 1400, paid: false },
  { id: 4, name: 'Priya Singh',    phone: '9765432109', area: 'Rahika',           cow: 1.5, buffalo: 0.5, status: 'paused',  bill: 1050, paid: true  },
  { id: 5, name: 'Vijay Yadav',    phone: '9654321098', area: 'Ladania',          cow: 1,   buffalo: 1,   status: 'active',  bill: 2100, paid: false },
  { id: 6, name: 'Anita Kumari',   phone: '9543210987', area: 'Jhanjharpur',      cow: 2,   buffalo: 0.5, status: 'active',  bill: 2750, paid: true  },
  { id: 7, name: 'Deepak Mishra',  phone: '9432109876', area: 'Kaluahi',          cow: 0.5, buffalo: 0.5, status: 'active',  bill: 1050, paid: true  },
  { id: 8, name: 'Kavita Sharma',  phone: '9321098765', area: 'Madhubani Town',   cow: 1,   buffalo: 0,   status: 'active',  bill: 1200, paid: false },
];

export const TODAY_DELIVERIES = [
  { id: 1, name: 'Ramesh Kumar',  area: 'Kaluahi',         qty: 1.5, status: 'delivered' },
  { id: 2, name: 'Sunita Devi',   area: 'Haripur Baxitol', qty: 2,   status: 'delivered' },
  { id: 3, name: 'Mohan Jha',     area: 'Benta',           qty: 1,   status: 'pending'   },
  { id: 4, name: 'Vijay Yadav',   area: 'Ladania',         qty: 2,   status: 'pending'   },
  { id: 5, name: 'Anita Kumari',  area: 'Jhanjharpur',     qty: 2.5, status: 'delivered' },
  { id: 6, name: 'Deepak Mishra', area: 'Kaluahi',         qty: 1,   status: 'delivered' },
  { id: 7, name: 'Kavita Sharma', area: 'Madhubani Town',  qty: 1,   status: 'pending'   },
];

export const MONTHLY_BILLS = [
  { id: 1, name: 'Ramesh Kumar',  amount: 1755, status: 'paid',    month: 'July 2025' },
  { id: 2, name: 'Sunita Devi',   amount: 2400, status: 'paid',    month: 'July 2025' },
  { id: 3, name: 'Mohan Jha',     amount: 1400, status: 'pending', month: 'July 2025' },
  { id: 4, name: 'Priya Singh',   amount: 1050, status: 'paid',    month: 'July 2025' },
  { id: 5, name: 'Vijay Yadav',   amount: 2100, status: 'pending', month: 'July 2025' },
  { id: 6, name: 'Anita Kumari',  amount: 2750, status: 'paid',    month: 'July 2025' },
  { id: 7, name: 'Deepak Mishra', amount: 1050, status: 'paid',    month: 'July 2025' },
  { id: 8, name: 'Kavita Sharma', amount: 1200, status: 'pending', month: 'July 2025' },
];
