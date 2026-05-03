import React, { useState, useEffect } from "react";
import { MdStar, MdDelete, MdEdit, MdClose, MdRefresh } from "react-icons/md";
import { touristAPI as api } from "../../../services/touristAPI";

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [completedRides, setCompletedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [formData, setFormData] = useState({ tourName: "", score: 5, text: "", driverId: "", bookingId: "" });
  const [formError, setFormError] = useState("");

  const mapRideFromBooking = (booking) => {
    const pickup = String(booking?.pickupLocation || '').trim();
    const dropoff = String(booking?.dropoffLocation || '').trim();
    const routeLabel = pickup && dropoff ? `${pickup} -> ${dropoff}` : pickup || dropoff || 'Ride';
    const pickupDate = booking?.pickupTime ? new Date(booking.pickupTime).toLocaleDateString() : '';
    const tourTitle = booking?.packageOptions?.tourTitle || booking?.tourPackage?.title || routeLabel;
    const driverName = booking?.assignedDriver?.name || '';

    return {
      bookingId: booking?._id || '',
      driverId: booking?.assignedDriver?._id || '',
      driverName,
      tourName: tourTitle,
      label: `${tourTitle} - Driver: ${driverName}${pickupDate ? ` - ${pickupDate}` : ''}`
    };
  };

  const getInitialFormData = (rides = []) => {
    const latestRide = rides[0] || null;
    return {
      tourName: latestRide?.tourName || '',
      score: 5,
      text: '',
      driverId: latestRide?.driverId || '',
      bookingId: latestRide?.bookingId || ''
    };
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const [reviewData, bookingData] = await Promise.all([
        api.getReviews(),
        api.getBookings()
      ]);

      setReviews(Array.isArray(reviewData) ? reviewData : []);

      const rides = (Array.isArray(bookingData) ? bookingData : [])
        .filter((booking) => String(booking?.status || '').toLowerCase() === 'completed')
        .filter((booking) => Boolean(booking?.assignedDriver?._id))
        .map(mapRideFromBooking)
        .filter((ride) => ride.bookingId && ride.driverId)
        .sort((a, b) => {
          const aBooking = (Array.isArray(bookingData) ? bookingData : []).find((item) => item?._id === a.bookingId);
          const bBooking = (Array.isArray(bookingData) ? bookingData : []).find((item) => item?._id === b.bookingId);
          const aTime = new Date(aBooking?.pickupTime || aBooking?.createdAt || 0).getTime();
          const bTime = new Date(bBooking?.pickupTime || bBooking?.createdAt || 0).getTime();
          return bTime - aTime;
        });

      setCompletedRides(rides);
    } catch (error) {
      console.error("Error fetching reviews", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const openCreateModal = () => {
    setCurrentReview(null);
    setFormData(getInitialFormData(completedRides));
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (review) => {
    setCurrentReview(review);
    setFormData({
      tourName: review.tourName,
      score: Number(review.rating) || 5,
      text: review.text,
      driverId: review?.driver?._id || '',
      bookingId: ''
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleRideSelect = (bookingId) => {
    const selectedRide = completedRides.find((ride) => ride.bookingId === bookingId);
    if (!selectedRide) {
      setFormData((prev) => ({ ...prev, bookingId: '', driverId: '' }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      bookingId: selectedRide.bookingId,
      driverId: selectedRide.driverId,
      tourName: selectedRide.tourName || prev.tourName
    }));
  };

  const validateForm = () => {
    const tourName = String(formData.tourName || "").trim();
    const text = String(formData.text || "").trim();
    const score = Number(formData.score);

    if (!tourName || tourName.length > 120) {
      return "Tour/Activity name is required and should be 120 characters or fewer.";
    }
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return "Score must be between 1 and 5.";
    }
    if (text.length < 10 || text.length > 1000) {
      return "Review text must be between 10 and 1000 characters.";
    }
    return "";
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await api.deleteReview(id);
        fetchReviews();
      } catch (error) {
        console.error("Failed to delete review", error);
        alert("Failed to delete review");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");
    try {
      if (currentReview) {
        await api.updateReview(currentReview._id, {
          tourName: formData.tourName.trim(),
          score: Number(formData.score),
          text: formData.text.trim(),
          driverId: formData.driverId || undefined
        });
      } else {
        await api.createReview({
          tourName: formData.tourName.trim(),
          score: Number(formData.score),
          text: formData.text.trim(),
          driverId: formData.driverId || undefined
        });
      }
      setIsModalOpen(false);
      fetchReviews();
    } catch (error) {
      console.error("Failed to save review", error);
      alert("Failed to save review");
    }
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Loading reviews...</div>;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">My Reviews</h2>
        <button onClick={fetchReviews} className="text-gray-500 hover:text-blue-600 transition-colors">
          <MdRefresh className="text-2xl" />
        </button>
      </div>

      <button
        onClick={openCreateModal}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3 px-6 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2"
      >
        <MdStar className="text-lg" />
        Write a Review
      </button>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">No reviews found. Write your first review!</div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">{review.tourName}</h3>
                  <p className="text-xs text-gray-500 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(review)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <MdEdit className="text-lg" />
                  </button>
                  <button onClick={() => handleDelete(review._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <MdDelete className="text-lg" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <MdStar
                    key={star}
                    className={`text-lg ${star <= review.rating ? "text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
                <span className="text-sm font-semibold text-gray-800 ml-2">{review.rating}.0</span>
              </div>

              <p className="text-gray-600 mb-4">{review.text}</p>
              <div className="text-xs text-gray-500 font-medium">👍 {review.helpful || 0} found this helpful</div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">{currentReview ? "Edit Review" : "Write a Review"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <MdClose className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!currentReview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Completed Ride (Auto-selected)</label>
                  <select
                    value={formData.bookingId}
                    onChange={(e) => handleRideSelect(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  >
                    {completedRides.length === 0 ? (
                      <option value="">No completed rides with assigned drivers</option>
                    ) : (
                      <>
                        {completedRides.map((ride) => (
                          <option key={ride.bookingId} value={ride.bookingId}>{ride.label}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {formData.driverId && (
                    <p className="mt-2 text-xs font-semibold text-sky-700">
                      Driver selected: {completedRides.find((ride) => ride.driverId === formData.driverId)?.driverName || 'Assigned driver'}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tour/Activity Name</label>
                <input
                  type="text"
                  required
                  value={formData.tourName}
                  onChange={(e) => setFormData({ ...formData, tourName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  placeholder="e.g. Sigiriya Rock Tour"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Score (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFormData({ ...formData, score: star })}
                      className="focus:outline-none transition-transform hover:scale-110"
                      aria-label={`Set score to ${star}`}
                    >
                      <MdStar className={`text-3xl ${star <= formData.score ? "text-yellow-400" : "text-gray-200"}`} />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs font-semibold text-gray-600">Selected score: {Number(formData.score)}/5</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                <textarea
                  required
                  rows="4"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white resize-none"
                  placeholder="Share your experience..."
                />
              </div>
              {formError && <p className="text-sm font-semibold text-rose-600">{formError}</p>}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                >
                  {currentReview ? "Update Review" : "Post Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}