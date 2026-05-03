import { useState, useEffect, useCallback } from 'react';
import { touristAPI } from '../services/touristAPI';

/**
 * Hook to manage tourist bookings and interactions with drivers/tour managers
 */
export const useTouristBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sortByNewest = (items = []) => {
    return [...items].sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      return bTime - aTime;
    });
  };

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await touristAPI.getBookings();
      setBookings(sortByNewest(Array.isArray(data) ? data : []));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBooking = async (bookingData) => {
    try {
      setLoading(true);
      const newBooking = await touristAPI.createBooking(bookingData);
      setBookings((prev) => sortByNewest([newBooking, ...prev]));
      setError(null);
      return newBooking;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      setLoading(true);
      const result = await touristAPI.cancelBooking(bookingId);
      const cancelled = result?.booking || null;
      setBookings((prev) => prev.map((b) => (b._id === bookingId
        ? { ...b, ...(cancelled || {}), status: 'Cancelled' }
        : b)));
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBooking = async (bookingId) => {
    try {
      setLoading(true);
      await touristAPI.deleteBooking(bookingId);
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBooking = async (bookingId, updatedData) => {
    try {
      setLoading(true);
      const updatedBooking = await touristAPI.updateBooking(bookingId, updatedData);
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? updatedBooking : b)));
      setError(null);
      return updatedBooking;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    loading,
    error,
    createBooking,
    cancelBooking,
    deleteBooking,
    updateBooking,
    refetch: fetchBookings
  };
};

export const useTouristFleetBookings = () => {
  const [fleetBookings, setFleetBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFleetBookings = async () => {
    try {
      setLoading(true);
      const data = await touristAPI.getFleetBookings();
      setFleetBookings(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createFleetBooking = async (payload) => {
    try {
      setLoading(true);
      const created = await touristAPI.createFleetBooking(payload);
      setFleetBookings((prev) => [created, ...prev]);
      setError(null);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateFleetBooking = async (bookingId, payload) => {
    try {
      setLoading(true);
      const updated = await touristAPI.updateFleetBooking(bookingId, payload);
      setFleetBookings((prev) => prev.map((b) => (b._id === bookingId ? updated : b)));
      setError(null);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelFleetBooking = async (bookingId) => {
    try {
      setLoading(true);
      const result = await touristAPI.cancelFleetBooking(bookingId);
      setFleetBookings((prev) => prev.map((b) => (b._id === bookingId ? result.booking : b)));
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteFleetBooking = async (bookingId) => {
    try {
      setLoading(true);
      await touristAPI.deleteFleetBooking(bookingId);
      setFleetBookings((prev) => prev.filter((b) => b._id !== bookingId));
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetBookings();
  }, []);

  return {
    fleetBookings,
    loading,
    error,
    refetch: fetchFleetBookings,
    createFleetBooking,
    updateFleetBooking,
    cancelFleetBooking,
    deleteFleetBooking
  };
};

/**
 * Hook to manage tourist tours (from tour managers)
 */
export const useTouristTours = (filters = {}) => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        const data = await touristAPI.getTours(filters);
        setTours(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [filters]);

  return { tours, loading, error };
};

/**
 * Hook to manage available drivers
 */
export const useAvailableDrivers = (location, date) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      if (location && date) {
        try {
          setLoading(true);
          const data = await touristAPI.getAvailableDrivers(location, date);
          setDrivers(data);
          setError(null);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDrivers();
  }, [location, date]);

  return { drivers, loading, error };
};

/**
 * Hook to manage reviews (feedback to drivers/tour managers)
 */
export const useTouristReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await touristAPI.getReviews();
      setReviews(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (bookingId, rating, comment) => {
    try {
      setLoading(true);
      const newReview = await touristAPI.submitReview(bookingId, rating, comment);
      setReviews((prev) => [...prev, newReview]);
      setError(null);
      return newReview;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return { reviews, loading, error, submitReview, refetch: fetchReviews };
};

/**
 * Hook to manage notifications from drivers/tour managers
 */
export const useTouristNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await touristAPI.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await touristAPI.markNotificationRead(notificationId);
      setNotifications((prev) => prev.map((n) =>
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await touristAPI.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await touristAPI.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications
  };
};

/**
 * Hook to contact driver
 */
export const useContactDriver = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async (driverId, message) => {
    try {
      setLoading(true);
      const result = await touristAPI.contactDriver(driverId, message);
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
};

/**
 * Hook to manage tourist support tickets
 */
export const useTouristSupport = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await touristAPI.getSupportRequests();
      setRequests(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (payload) => {
    try {
      setLoading(true);
      const created = await touristAPI.createSupportRequest(payload);
      setRequests((prev) => [created, ...prev]);
      setError(null);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRequest = async (requestId, payload) => {
    try {
      setLoading(true);
      const updated = await touristAPI.updateSupportRequest(requestId, payload);
      setRequests((prev) => prev.map((item) => (item._id === requestId ? updated : item)));
      setError(null);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (requestId) => {
    try {
      setLoading(true);
      await touristAPI.deleteSupportRequest(requestId);
      setRequests((prev) => prev.filter((item) => item._id !== requestId));
      setError(null);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return {
    requests,
    loading,
    error,
    createRequest,
    updateRequest,
    deleteRequest,
    refetch: fetchRequests
  };
};

export const useTouristEmergency = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendSOSAlert = async (payload) => {
    try {
      setLoading(true);
      const result = await touristAPI.sendSOSAlert(payload);
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendSOSAlert,
    loading,
    error
  };
};