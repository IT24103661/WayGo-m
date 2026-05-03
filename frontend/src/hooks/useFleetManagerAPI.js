import { useEffect, useState } from 'react';
import { fleetManagerAPI } from '../services/fleetManagerAPI';

export const useFleetVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const result = await fleetManagerAPI.getVehicles();
      setVehicles(result.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const addVehicle = async (payload) => {
    const result = await fleetManagerAPI.addVehicle(payload);
    await fetchVehicles();
    return result;
  };

  const updateVehicle = async (vehicleId, payload) => {
    const result = await fleetManagerAPI.updateVehicle(vehicleId, payload);
    await fetchVehicles();
    return result;
  };

  const deleteVehicle = async (vehicleId) => {
    const result = await fleetManagerAPI.deleteVehicle(vehicleId);
    await fetchVehicles();
    return result;
  };

  return {
    vehicles,
    loading,
    error,
    refetch: fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle
  };
};

export const useFleetMaintenanceAlerts = () => {
  const [serviceDue, setServiceDue] = useState([]);
  const [complianceDue, setComplianceDue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const result = await fleetManagerAPI.getMaintenanceAlerts();
      setServiceDue(result.data?.serviceDue || []);
      setComplianceDue(result.data?.complianceDue || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return { serviceDue, complianceDue, loading, error, refetch: fetchAlerts };
};

export const useFleetProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const result = await fleetManagerAPI.getProfile();
      setProfile(result.user || null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload) => {
    const result = await fleetManagerAPI.updateProfile(payload);

    const updatedUser = result.user || null;
    setProfile(updatedUser);

    if (updatedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }

    window.dispatchEvent(new CustomEvent('userUpdated', {
      detail: { user: updatedUser }
    }));

    return result;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return { profile, loading, error, refetch: fetchProfile, updateProfile };
};

export const useFleetNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const notificationsResult = await fleetManagerAPI.getNotifications();
      setNotifications(notificationsResult.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    await fleetManagerAPI.markNotificationRead(id);
    await fetchNotifications();
  };

  const markAllAsRead = async () => {
    await fleetManagerAPI.markAllNotificationsRead();
    await fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    loading,
    error,
    refetch: fetchNotifications,
    markRead,
    markAllAsRead
  };
};

export const useFleetSalaries = () => {
  const [drivers, setDrivers] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (month) => {
    try {
      setLoading(true);
      const [driversResult, salariesResult] = await Promise.all([
        fleetManagerAPI.getManagedDrivers(),
        fleetManagerAPI.getSalaries(month)
      ]);
      setDrivers(driversResult.data || []);
      setSalaries(salariesResult.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSalary = async (payload) => {
    const result = await fleetManagerAPI.saveSalary(payload);
    await fetchData(payload.month);
    return result;
  };

  const updateSalary = async (salaryId, payload) => {
    const result = await fleetManagerAPI.updateSalary(salaryId, payload);
    await fetchData(payload.month);
    return result;
  };

  const deleteSalary = async (salaryId, month) => {
    const result = await fleetManagerAPI.deleteSalary(salaryId);
    await fetchData(month);
    return result;
  };

  useEffect(() => {
    fetchData();

    const intervalId = window.setInterval(() => {
      fetchData();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return { drivers, salaries, loading, error, refetch: fetchData, saveSalary, updateSalary, deleteSalary };
};

export const useFleetDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const result = await fleetManagerAPI.getManagedDrivers();
      setDrivers(result.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createManualDriver = async (payload) => {
    const result = await fleetManagerAPI.createManualDriver(payload);
    await fetchDrivers();
    return result;
  };

  const updateManualDriver = async (driverId, payload) => {
    const result = await fleetManagerAPI.updateManualDriver(driverId, payload);
    await fetchDrivers();
    return result;
  };

  const deleteManualDriver = async (driverId) => {
    const result = await fleetManagerAPI.deleteManualDriver(driverId);
    await fetchDrivers();
    return result;
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  return {
    drivers,
    loading,
    error,
    refetch: fetchDrivers,
    createManualDriver,
    updateManualDriver,
    deleteManualDriver
  };
};

export const useFleetBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = async (status) => {
    try {
      setLoading(true);
      const [bookingsResult, driversResult, vehiclesResult] = await Promise.all([
        fleetManagerAPI.getFleetBookings(status),
        fleetManagerAPI.getAvailableDrivers(),
        fleetManagerAPI.getAvailableVehicles()
      ]);
      setBookings(bookingsResult.data || []);
      setDrivers(driversResult.data || []);
      setVehicles(vehiclesResult.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFleetBooking = async (bookingId, payload) => {
    const result = await fleetManagerAPI.updateFleetBooking(bookingId, payload);
    await fetchBookings();
    return result;
  };

  const deleteFleetBooking = async (bookingId) => {
    const result = await fleetManagerAPI.deleteFleetBooking(bookingId);
    await fetchBookings();
    return result;
  };

  const assignBooking = async (bookingId, payload) => {
    const result = await fleetManagerAPI.assignBooking(bookingId, payload);
    await fetchBookings();
    return result;
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return {
    bookings,
    drivers,
    vehicles,
    loading,
    error,
    refetch: fetchBookings,
    updateFleetBooking,
    deleteFleetBooking,
    assignBooking
  };
};
