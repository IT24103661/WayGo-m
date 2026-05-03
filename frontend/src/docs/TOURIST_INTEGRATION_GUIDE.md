# Tourist-Driver-TourManager Integration Guide

## Architecture Overview

The WayGo Tourist interface connects with **Drivers** and **Tour Managers** through the following interaction flows:

---

## 1. TOUR BOOKING FLOW (Tourist → Tour Manager)

```
Tourist            Tour Manager
   |                    |
   |--Browse Tours----->|
   |<--Tour List--------|
   |                    |
   |--Book Tour-------->|
   |<--Confirmation----|
   |                    |
```

### API Endpoints:
- `GET /api/tours` - Fetch all tours from tour managers
- `GET /api/tours/:id` - Get specific tour details
- `POST /api/bookings` - Create a booking (connects tourist to tour)

### Code Example:
```javascript
import { touristAPI } from '../services/touristAPI';

// Get available tours
const tours = await touristAPI.getTours({ destination: 'Sigiriya' });

// Book a tour
await touristAPI.createBooking({
  tourId: 1,
  date: '2026-03-15',
  passengers: 2,
  totalAmount: 12500
});
```

---

## 2. TAXI/RIDE BOOKING FLOW (Tourist → Driver)

```
Tourist            Driver          System
   |                 |               |
   |--Request Ride-->|               |
   |                 |--Check Availability
   |<--Offer---------|               |
   |--Accept-------->|               |
   |<--Confirmed-----|               |
   |                 |               |
```

### API Endpoints:
- `GET /api/drivers/available` - Find available drivers
- `POST /api/bookings` - Create ride booking
- `POST /api/messages` - Send message to driver

### Code Example:
```javascript
// Find available drivers
const drivers = await touristAPI.getAvailableDrivers('Colombo', '2026-03-15');

// Send ride request
const booking = await touristAPI.createBooking({
  type: 'taxi',
  pickup: 'Colombo Fort',
  destination: 'Kandy',
  date: '2026-03-15'
});

// Contact driver directly
await touristAPI.contactDriver(driverId, 'Can you arrive 30 mins earlier?');
```

---

## 3. REVIEW & FEEDBACK FLOW (Tourist → Driver/TourManager)

```
Tourist            Driver/TourManager    System
   |                      |               |
   |--Submit Review------>|               |
   |                      |<--Update Rating
   |<--Confirmation-------|-----------→Rating System
```

### API Endpoints:
- `POST /api/reviews` - Submit review/rating
- `GET /api/reviews/tourist` - Get user's reviews

### Code Example:
```javascript
// Submit review after completed booking
await touristAPI.submitReview(
  bookingId: '#BK-0041',
  rating: 5,
  comment: 'Amazing experience! Driver was very professional.'
);
```

---

## 4. NOTIFICATION FLOW (All Roles → Tourist)

Messages flow from both Drivers and Tour Managers to Tourist:

```
Driver/TourManager  →  Notification System  →  Tourist
   |                        |                     |
   |-Trip Update--------->System              Tourist Receives
   |-Status Change--------->|              Notification Alert
   |-Emergency Alert------->|                   |
```

### Code Example:
```javascript
// Get all notifications from drivers and tour managers
const notifications = await touristAPI.getNotifications();

// Mark as read
await touristAPI.markNotificationRead(notificationId);
```

---

## 5. ROLE INTERACTION DIAGRAM

```
                    TOURIST
                      |
           ___________|___________
           |           |         |
        DRIVER    TOUR MANAGER  SYSTEM
           |           |         |
    • Ride Bookings  • Tour Bookings  • Payment
    • Contact       • Tour Details    • Notifications
    • Reviews       • Itineraries     • Ratings
```

---

## Data Flow Summary

| Interaction | Tourist | Driver | TourManager | Purpose |
|---|---|---|---|---|
| Book Tour | ✓ | - | ✓ | Tourist books tour package |
| Book Ride | ✓ | ✓ | - | Tourist requests vehicle |
| Submit Review | ✓ | ✓ | ✓ | Feedback for service quality |
| Check Availability | ✓ | ✓ | ✓ | Real-time availability |
| Send Message | ✓ | ✓ | ✓ | Direct communication |
| Track Trip | ✓ | ✓ | - | Live location tracking |

---

## Backend Requirements for Connections

To enable these connections, your backend needs:

### 1. **Booking Model**
```javascript
// Connects Tourist to Driver or TourManager
{
  _id: ObjectId,
  touristId: ObjectId,      // Reference to Tourist user
  driverId: ObjectId,        // Reference to Driver (if taxi)
  tourId: ObjectId,          // Reference to Tour (if tour package)
  type: 'taxi' | 'tour',
  status: 'pending' | 'accepted' | 'completed' | 'cancelled',
  createdAt: Date,
  completedAt: Date
}
```

### 2. **Review Model**
```javascript
// Tourist feedback about Driver or Tour
{
  _id: ObjectId,
  bookingId: ObjectId,       // Reference to booking
  touristId: ObjectId,
  rating: Number (1-5),
  comment: String,
  targetType: 'driver' | 'tour',
  targetId: ObjectId,        // driverId or tourId
  createdAt: Date
}
```

### 3. **Notification Model**
```javascript
// Notifications from drivers/tour managers to tourists
{
  _id: ObjectId,
  recipientId: ObjectId,     // Tourist userId
  senderId: ObjectId,        // Driver or TourManager userId
  type: 'booking_update' | 'status_change' | 'message',
  message: String,
  bookingId: ObjectId,
  read: Boolean,
  createdAt: Date
}
```

### 4. **Message Model** (for direct communication)
```javascript
{
  _id: ObjectId,
  senderId: ObjectId,
  receiverId: ObjectId,
  bookingId: ObjectId,
  message: String,
  timestamp: Date
}
```

---

## Implementation Checklist

- [ ] Backend API endpoints created for all tourist operations
- [ ] Authentication middleware to identify tourist user role
- [ ] Booking engine to connect tourist with driver/tour manager
- [ ] Real-time notifications system
- [ ] Review/rating system integrated with driver and tour manager profiles
- [ ] Payment gateway integration
- [ ] Message queue system for driver-tourist communication
- [ ] Real-time tracking for taxi rides

---

## Usage in Components

### OverviewSection.js
- Uses `touristAPI.getBookings()` to show recent bookings

### ToursSection.js
- Uses `touristAPI.getTours()` to display tour packages from tour managers

### BookingsSection.js
- Manages bookings connected to drivers and tour managers
- Uses `touristAPI.getBookings()` and `touristAPI.cancelBooking()`

### ReviewsSection.js
- Uses `touristAPI.getReviews()` and `touristAPI.submitReview()`
- Connects tourist feedback with drivers and tour managers

### NotificationsSection.js
- Uses `touristAPI.getNotifications()` for updates from all roles

---

## Next Steps

1. Update your backend routes to support these endpoints
2. Implement actual driver and tour manager dashboard
3. Add real-time updates using WebSockets
4. Integrate payment processing
5. Add location tracking for active bookings