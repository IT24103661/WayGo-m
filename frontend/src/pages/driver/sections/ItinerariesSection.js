import { useEffect, useState } from 'react';
import { MdLocationOn, MdAccessTime, MdAttachMoney, MdCheckCircle } from 'react-icons/md';
import { useDriverAPI } from '../../../hooks/useDriverAPI';

export default function ItinerariesSection() {
  const [jobs, setJobs] = useState([]);
  const { getMyJobs, updateJobStatus } = useDriverAPI();

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line
  }, []);

  const loadJobs = async () => {
    try {
      const myJobs = await getMyJobs();
      setJobs(myJobs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    try {
      await updateJobStatus(jobId, newStatus);
      alert(`Job status updated to ${newStatus}`);
      loadJobs();
    } catch (e) {
      alert(e.message || 'Error updating job status');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-[0.3em] text-cyan-600 uppercase">My Jobs</p>
        <h2 className="text-2xl font-bold text-cyan-900">Assigned Jobs & Itineraries</h2>
        <p className="text-cyan-500">View and update statuses for your active and completed jobs.</p>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-[0_20px_45px_-35px_rgba(20,184,166,0.2)] border border-cyan-200 text-center text-cyan-700">
          You don't have any assigned jobs yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.map(job => (
            <div key={job._id} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-[0_20px_45px_-35px_rgba(20,184,166,0.2)] border border-cyan-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-cyan-900">{job.bookingType === 'Tour' ? job.tourId?.title || 'Tour Booking' : 'Taxi Ride'}</p>
                  <p className="text-xs text-cyan-400">ID: {job._id.slice(-6).toUpperCase()}</p>
                </div>
                <span className="text-sm font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
                  {job.status}
                </span>
              </div>

              <div className="mt-5 space-y-2 text-sm text-cyan-600">
                <div className="flex items-center gap-2">
                  <MdLocationOn className="text-cyan-500" />
                  <strong>Pickup:</strong> {job.pickupLocation || 'Not specified'}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <MdLocationOn className="text-rose-500" />
                    <strong>Drop-off:</strong> {job.dropoffLocation || 'Not specified'}
                  </div>
                </div>
                {job.pickupTime && (
                  <div className="flex items-center gap-2">
                    <MdAccessTime className="text-cyan-400" />
                    {new Date(job.pickupTime).toLocaleString()}
                  </div>
                )}
                {job.totalPrice && (
                  <div className="flex items-center gap-2">
                    <MdAttachMoney className="text-cyan-400" />
                    LKR {job.totalPrice}
                  </div>
                )}
              </div>

              {job.status === 'Accepted' && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleUpdateStatus(job._id, 'En Route')}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors"
                  >
                    Start Trip
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(job._id, 'Cancelled')}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 font-semibold hover:bg-rose-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {job.status === 'En Route' && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleUpdateStatus(job._id, 'Completed')}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-sky-600 text-white font-semibold hover:bg-sky-700 transition-colors"
                  >
                    <MdCheckCircle /> Complete Trip
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
