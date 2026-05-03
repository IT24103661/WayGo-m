const TOURIST_ROLE_POLICY = {
  role: 'Tourist',
  coreUseCases: [
    'Register and authenticate',
    'Browse tours and transport options',
    'Create and manage own bookings',
    'Manage own profile and preferences',
    'Leave ratings and reviews for completed trips',
  ],
  rbac: {
    allowedPages: [
      '/dashboard/tourist/overview',
      '/dashboard/tourist/tours',
      '/dashboard/tourist/taxis',
      '/dashboard/tourist/bookings',
      '/dashboard/tourist/reviews',
      '/dashboard/tourist/profile',
    ],
    allowedData: [
      'Own profile',
      'Own bookings',
      'Own payment records',
      'Public tours and transport catalog',
      'Assigned driver basic details for active ride',
    ],
    restrictedFrom: [
      'Admin and manager dashboards',
      'Other users personal information and bookings',
      'Driver earnings and internal staff records',
      'System configuration and analytics administration',
    ],
  },
  crud: {
    create: ['Own account', 'Own bookings', 'Own reviews', 'Own support requests'],
    read: ['Public catalog', 'Own account', 'Own bookings', 'Own reviews'],
    update: ['Own profile', 'Own pending bookings', 'Own reviews (policy-based)'],
    delete: ['Own pending booking cancellations', 'Own reviews (policy-based)', 'Own account closure request'],
  },
  interactions: {
    driver: 'Receives assigned ride and can view limited driver and vehicle details for active bookings.',
    tourManager: 'Consumes packages managed by TourManager and raises change/refund requests.',
    fleetManager: 'Interacts indirectly through vehicle availability and trip fulfillment.',
  },
};

module.exports = { TOURIST_ROLE_POLICY };