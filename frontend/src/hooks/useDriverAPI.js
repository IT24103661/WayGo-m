import { useState, useCallback } from 'react';

const API_URL = 'http://localhost:5001/api';

export function useDriverAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUnauthorized = useCallback((json) => {
    const message = json?.message || 'Session expired. Please log in again.';
    localStorage.removeItem('waygo_token');
    localStorage.removeItem('waygo_role');
    localStorage.removeItem('user');

    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }

    throw new Error(message);
  }, []);

  const ensureSuccess = useCallback((res, json, fallbackMessage) => {
    if (res.ok) return;
    if (res.status === 401) {
      handleUnauthorized(json);
    }
    throw new Error(json?.message || fallbackMessage);
  }, [handleUnauthorized]);

  const parseResponse = useCallback(async (res) => {
    const text = await res.text();
    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch (parseError) {
      throw new Error(
        'Server returned a non-JSON response. Please verify backend API URL and server status.'
      );
    }
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('waygo_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const getAvailableJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/driver/jobs/available`, {
        headers: getAuthHeaders()
      });
      const json = await parseResponse(res);
      ensureSuccess(res, json, 'Failed to fetch available jobs');
      return json.data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [ensureSuccess, parseResponse]);

  const getMyJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/driver/jobs/mine`, {
        headers: getAuthHeaders()
      });
      const json = await parseResponse(res);
      ensureSuccess(res, json, 'Failed to fetch your jobs');
      return json.data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [ensureSuccess, parseResponse]);

  const updateStatus = async (status) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/driver/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      const json = await parseResponse(res);
      ensureSuccess(res, json, 'Failed to update status');
      return json;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/driver/status`, {
        headers: getAuthHeaders()
      });
      const json = await parseResponse(res);
      ensureSuccess(res, json, 'Failed to fetch driver status');
      return json?.data?.status || 'Offline';
    } catch (err) {
      setError(err.message);
      return 'Offline';
    } finally {
      setLoading(false);
    }
  }, [ensureSuccess, parseResponse]);

  const acceptJob = async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/driver/bookings/${bookingId}/accept`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      const json = await parseResponse(res);
      ensureSuccess(res, json, 'Failed to accept job');
      return json;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (bookingId, status) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/driver/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      const json = await parseResponse(res);
      ensureSuccess(res, json, 'Failed to update job status');
      return json;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const submitSupportRequest = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/driver/support`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const json = await parseResponse(res);
      ensureSuccess(res, json, 'Failed to submit support request');
      return json.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMySupportRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/driver/support`, {
        headers: getAuthHeaders()
      });
      const json = await parseResponse(res);
      ensureSuccess(res, json, 'Failed to fetch support requests');
      return json.data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [ensureSuccess, parseResponse]);

  const updateSupportRequest = async (requestId, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/driver/support/${requestId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const json = await parseResponse(res);
      ensureSuccess(res, json, 'Failed to update support request');
      return json.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSupportRequest = async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/driver/support/${requestId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const json = await parseResponse(res);
      ensureSuccess(res, json, 'Failed to delete support request');
      return json;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getAvailableJobs,
    getMyJobs,
    getStatus,
    updateStatus,
    acceptJob,
    updateJobStatus,
    submitSupportRequest,
    getMySupportRequests,
    updateSupportRequest,
    deleteSupportRequest
  };
}