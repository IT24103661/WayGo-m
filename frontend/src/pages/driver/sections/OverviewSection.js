import { useEffect, useState } from 'react';
import {
  MdCircle,
  MdLocalTaxi,
  MdLocationOn,
  MdAccessTime,
  MdDirectionsCar,
  MdCheckCircle
} from 'react-icons/md';
import { useDriverAPI } from '../../../hooks/useDriverAPI';

const STATUS_OPTIONS = ['Online', 'Offline', 'On Trip'];
const DRIVER_STATUS_KEY = 'waygo_driver_status';

const getInitialStatus = () => {
  if (typeof window === 'undefined') return 'Offline';
  const cached = window.localStorage.getItem(DRIVER_STATUS_KEY);
  return STATUS_OPTIONS.includes(cached) ? cached : 'Offline';
};

export default function OverviewSection() {
  const [status, setStatus] = useState(getInitialStatus);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const { getAvailableJobs, getMyJobs, getStatus, updateStatus, updateJobStatus } = useDriverAPI();

  useEffect(() => {
    loadJobs();
    syncStatus();
    // eslint-disable-next-line
  }, []);

  const syncStatus = async () => {
    const serverStatus = await getStatus();
    if (STATUS_OPTIONS.includes(serverStatus)) {
      setStatus(serverStatus);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DRIVER_STATUS_KEY, serverStatus);
      }
    }
  };

  const loadJobs = async () => {
    const avail = await getAvailableJobs();
    setAvailableJobs(avail || []);
    const mine = await getMyJobs();
    setMyJobs(mine || []);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await updateStatus(newStatus);
      const savedStatus = response?.data?.status;
      const nextStatus = STATUS_OPTIONS.includes(savedStatus) ? savedStatus : newStatus;
      setStatus(nextStatus);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DRIVER_STATUS_KEY, nextStatus);
      }
    } catch (e) {
      alert(e.message || 'Failed to update status');
    }
  };

  const handleCompleteJob = async (jobId) => {
    try {
      await updateJobStatus(jobId, 'Completed');
      alert('Job completed successfully!');
      loadJobs();
    } catch (e) {
      alert(e.message || 'Failed to complete job');
    }
  };

  const activeMyJobs = myJobs.filter(j => ['Accepted', 'In Progress'].includes(j.status));

  return (
    <div className="space-y-8">
      <section className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_20px_50px_-40px_rgba(8,145,178,0.3)] border border-cyan-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-cyan-700 uppercase">Availability</p>
            <h2 className="text-2xl font-bold text-cyan-950 mt-2">Driver Status</h2>
            <p className="text-sm text-cyan-700/80 mt-2">Toggle your availability to accept new rides.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full border ${status === 'Online' ? 'text-cyan-600 border-cyan-300 bg-cyan-50' : status === 'On Trip' ? 'text-amber-600 border-amber-300 bg-amber-50' : 'text-cyan-700/80 border-cyan-200 bg-white'}`}>
              <MdCircle className={`text-[10px] ${status === 'Online' ? 'animate-pulse' : ''}`} />
              {status}
            </span>
            <div className="flex items-center bg-cyan-50 p-1 rounded-2xl border border-cyan-100">
              {STATUS_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => handleStatusChange(option)}
                  className={`px-4 py-2 text-xs font-semibold rounded-2xl transition-all ${
                    status === option
                      ? 'bg-white shadow text-cyan-800 border border-cyan-200'
                      : 'text-cyan-600/80 hover:text-cyan-900'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-[0_20px_50px_-40px_rgba(8,145,178,0.3)] border border-cyan-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center">
              <MdLocalTaxi className="text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cyan-950">Active Requests</h3>
              <p className="text-sm text-cyan-700/80">Available pending rides around you.</p>
            </div>
          </div>

          <div className="space-y-4">
            {availableJobs.length === 0 ? (
              <p className="text-sm text-cyan-600/80 italic text-center py-4">No active requests.</p>
            ) : availableJobs.slice(0, 3).map(request => (
              <div key={request._id} className="border border-cyan-100 rounded-2xl p-4 bg-cyan-50/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-cyan-950">{request.touristeId?.name || 'Local Rider'}</p>
                  <span className="text-xs font-semibold text-cyan-700 bg-white px-2.5 py-1 rounded-full border border-cyan-200">
                    {request.bookingType}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-cyan-800">
                  <div className="flex items-center gap-2">
                    <MdLocationOn className="text-cyan-500" />
                    Pickup: {request.pickupLocation || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <MdLocationOn className="text-rose-500" />
                    Dropoff: {request.dropoffLocation || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <MdAccessTime className="text-cyan-600/80" />
                    {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-100 via-sky-50 to-white rounded-3xl shadow-[0_20px_50px_-40px_rgba(8,145,178,0.3)] border border-cyan-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <MdDirectionsCar className="text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cyan-950">My Current Jobs</h3>
              <p className="text-sm text-cyan-700/80">Rides or tours you have accepted.</p>
            </div>
          </div>
          <div className="space-y-4">
            {activeMyJobs.length === 0 ? (
               <p className="text-sm text-cyan-600/80 italic text-center py-4">No jobs currently in progress.</p>
            ) : activeMyJobs.map(job => (
              <div key={job._id} className="border border-cyan-200 rounded-2xl p-4 bg-white/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-bold text-cyan-950">{job.bookingType}</h4>
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    {job.status}
                  </span>
                </div>
                 <div className="mt-3 space-y-2 text-sm text-cyan-800">
                   {job.assignedVehicle && (
                     <div className="flex flex-col gap-1 mb-2">
                       <span className="text-xs text-cyan-600 uppercase font-bold">Vehicle</span>
                       <span>{job.assignedVehicle?.licensePlate} ({job.assignedVehicle?.make} {job.assignedVehicle?.model})</span>
                     </div>
                   )}
                  <div className="flex items-center gap-2">
                    <MdLocationOn className="text-cyan-500" />
                    From: {job.pickupLocation || 'Starting Point'}
                  </div>
                 </div>
                 <div className="mt-4 pt-3 border-t border-cyan-100 flex justify-end">
                    <button onClick={() => handleCompleteJob(job._id)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 transition">
                      <MdCheckCircle /> Complete Job
                    </button>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
