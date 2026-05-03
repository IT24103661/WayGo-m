import { useCallback, useEffect, useState } from 'react';
import { tourManagerAPI } from '../services/tourManagerAPI';

export const useTourManagerPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.getPackages();
      setPackages(result.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createPackage = async (payload) => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.createPackage(payload);
      if (!result || result.success === false) throw new Error(result?.message || 'Failed to create package');
      if (result?.data) {
        setPackages((prev) => [result.data, ...prev]);
      }
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePackage = async (packageId, payload) => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.updatePackage(packageId, payload);
      if (!result || result.success === false) throw new Error(result?.message || 'Failed to update package');
      if (result?.data) {
        setPackages((prev) => prev.map((pkg) => (pkg._id === packageId ? result.data : pkg)));
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePackage = async (packageId) => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.deletePackage(packageId);
      if (!result || result.success === false) throw new Error(result?.message || 'Failed to delete package');
      if (result?.success) {
        setPackages((prev) => prev.filter((pkg) => pkg._id !== packageId));
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return { packages, loading, error, createPackage, updatePackage, deletePackage, refetch: fetchPackages };
};

export const useTourManagerTours = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.getTours();
      setTours(result.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTour = async (payload) => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.createTour(payload);
      if (!result || result.success !== true) {
        throw new Error(result?.message || 'Failed to create tour');
      }
      await fetchTours();
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTour = async (tourId, payload) => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.updateTour(tourId, payload);
      if (!result || result.success !== true) {
        throw new Error(result?.message || 'Failed to update tour');
      }
      await fetchTours();
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTour = async (tourId) => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.deleteTour(tourId);
      if (!result || result.success !== true) {
        throw new Error(result?.message || 'Failed to delete tour');
      }
      await fetchTours();
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  return { tours, loading, error, createTour, updateTour, deleteTour, refetch: fetchTours };
};

export const useTourManagerQuotes = (status = 'Pending') => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.getQuotes(status);
      setQuotes(result.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  const updateQuote = async (quoteId, payload) => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.updateQuote(quoteId, payload);
      if (result?.data) {
        setQuotes(quotes.map(q => (q._id === quoteId ? result.data : q)));
      }
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return { quotes, loading, error, updateQuote, refetch: fetchQuotes };
};

export const useTourManagerStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.getStats();
      setStats(result.data || null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};

export const useTourManagerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.getBookings();
      setBookings(result.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const assignDriver = async (bookingId, driverId) => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.assignDriver(bookingId, { driverId });
      if (result?.data) {
        setBookings(bookings.map(b => (b._id === bookingId ? result.data : b)));
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return { bookings, loading, error, assignDriver, refetch: fetchBookings };
};

export const useTourManagerStayRequests = (status = '') => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const result = await tourManagerAPI.getStayRequests(status);
      setRequests(result.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [status]);

  const allocateStay = async (bookingId, payload) => {
    try {
      const result = await tourManagerAPI.allocateStay(bookingId, payload);
      if (!result || result.success !== true) throw new Error(result?.message || 'Failed to allocate stay.');
      if (result?.data?._id) {
        setRequests((prev) => prev.map((item) => (item._id === result.data._id ? result.data : item)));
      } else {
        await fetchRequests({ showLoader: false });
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateStayStatus = async (bookingId, payload) => {
    try {
      const result = await tourManagerAPI.updateStayStatus(bookingId, payload);
      if (!result || result.success !== true) throw new Error(result?.message || 'Failed to update stay status.');
      if (result?.data?._id) {
        setRequests((prev) => prev.map((item) => (item._id === result.data._id ? result.data : item)));
      } else {
        await fetchRequests({ showLoader: false });
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteStayAllocation = async (bookingId, allocationId) => {
    try {
      const result = await tourManagerAPI.deleteStayAllocation(bookingId, allocationId);
      if (!result || result.success !== true) throw new Error(result?.message || 'Failed to delete stay allocation.');
      if (result?.data?._id) {
        setRequests((prev) => prev.map((item) => (item._id === result.data._id ? result.data : item)));
      } else {
        await fetchRequests({ showLoader: false });
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    allocateStay,
    updateStayStatus,
    deleteStayAllocation
  };
};

export const useTourManagerStayInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.getStayInventory();
      setInventory(result.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createInventory = async (payload) => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.createStayInventory(payload);
      if (!result || result.success !== true) throw new Error(result?.message || 'Failed to create stay inventory.');
      if (result?.data) {
        setInventory((prev) => [result.data, ...prev.filter((item) => item._id !== result.data._id)]);
      } else {
        await fetchInventory();
      }
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateInventory = async (inventoryId, payload) => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.updateStayInventory(inventoryId, payload);
      if (!result || result.success !== true) throw new Error(result?.message || 'Failed to update stay inventory.');
      if (result?.data) {
        setInventory((prev) => prev.map((item) => (item._id === inventoryId ? result.data : item)));
      } else {
        await fetchInventory();
      }
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteInventory = async (inventoryId) => {
    try {
      setLoading(true);
      const result = await tourManagerAPI.deleteStayInventory(inventoryId);
      if (!result || result.success !== true) throw new Error(result?.message || 'Failed to delete stay inventory.');
      setInventory((prev) => prev.filter((item) => item._id !== inventoryId));
      setError(null);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return {
    inventory,
    loading,
    error,
    refetch: fetchInventory,
    createInventory,
    updateInventory,
    deleteInventory
  };
};
