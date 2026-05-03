import { useState } from 'react';
import { MdHelp, MdSend, MdPhone, MdEmail, MdAccessTime } from 'react-icons/md';
import { useTouristSupport } from '../../../hooks/useTouristAPI';

const FAQ_ITEMS = [
  { id: 1, question: 'How do I book a tour?', answer: 'Simply browse available tours, select your preferred date, and click "Book Now" to proceed with payment.' },
  { id: 2, question: 'Can I cancel or modify my booking?', answer: 'Yes, you can cancel up to 24 hours before your booking. Modifications can be made through the My Bookings section.' },
  { id: 3, question: 'What payment methods are accepted?', answer: 'We accept credit cards, debit cards, and mobile payments like Dialog, Mobitel, and Airtel.' },
  { id: 4, question: 'How do I contact my driver?', answer: 'Once your booking is confirmed, you can contact your driver through the WhatsApp link provided in your booking details.' },
  { id: 5, question: 'What if I have an emergency during my trip?', answer: 'Call our 24/7 emergency hotline at +94 11 234 5678. Your safety is our priority.' },
];

const SUPPORT_CHANNELS = [
  { icon: MdPhone, label: 'Call Us', value: '+94 11 234 5678', color: 'blue' },
  { icon: MdEmail, label: 'Email', value: 'support@waygo.lk', color: 'purple' },
  { icon: MdAccessTime, label: 'Hours', value: '24/7 Available', color: 'emerald' },
];

const SUPPORT_CATEGORIES = ['Booking Issue', 'Payment Issue', 'Driver/Vehicle Issue', 'General Inquiry', 'Complaint'];

const validateSupportInput = ({ subject, message, category }) => {
  const safeSubject = String(subject || '').trim();
  const safeMessage = String(message || '').trim();

  if (!safeSubject || safeSubject.length < 5 || safeSubject.length > 120) {
    return 'Subject must be between 5 and 120 characters.';
  }
  if (!safeMessage || safeMessage.length < 10 || safeMessage.length > 1200) {
    return 'Message must be between 10 and 1200 characters.';
  }
  if (!SUPPORT_CATEGORIES.includes(category)) {
    return 'Please select a valid category.';
  }
  return '';
};

export default function SupportSection() {
  const { requests, loading, error, createRequest, updateRequest, deleteRequest } = useTouristSupport();
  const [form, setForm] = useState({
    subject: '',
    category: 'General Inquiry',
    message: ''
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState('');
  const [editForm, setEditForm] = useState({
    subject: '',
    category: 'General Inquiry',
    message: ''
  });
  const [message, setMessage] = useState('');

  const resetCreateForm = () => {
    setForm({ subject: '', category: 'General Inquiry', message: '' });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRequestId('');
    setEditForm({ subject: '', category: 'General Inquiry', message: '' });
  };

  const splitCategoryFromSubject = (subjectText) => {
    const text = String(subjectText || '').trim();
    const match = text.match(/^\[(.+?)\]\s*(.*)$/);
    if (!match) {
      return { category: 'General Inquiry', subject: text };
    }
    return {
      category: match[1] || 'General Inquiry',
      subject: match[2] || ''
    };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const validationError = validateSupportInput(form);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    const subject = form.subject.trim();
    const body = form.message.trim();

    try {
      await createRequest({
        issueType: 'SystemSupport',
        subject: `[${form.category}] ${subject}`,
        description: body
      });
      setMessage('Support ticket sent successfully.');
      resetCreateForm();
    } catch (err) {
      setMessage(err.message || 'Failed to save support ticket.');
    }
  };

  const onEdit = (request) => {
    const parsed = splitCategoryFromSubject(request.subject || '');
    setEditingRequestId(request._id);
    setEditForm({
      category: parsed.category,
      subject: parsed.subject,
      message: request.description || request.message || ''
    });
    setIsEditModalOpen(true);
  };

  const onSaveEdit = async (e) => {
    e.preventDefault();
    setMessage('');

    const validationError = validateSupportInput(editForm);
    if (validationError) {
      setMessage(validationError);
      return;
    }

    const subject = editForm.subject.trim();
    const body = editForm.message.trim();

    try {
      await updateRequest(editingRequestId, {
        subject: `[${editForm.category}] ${subject}`,
        description: body
      });
      setMessage('Support ticket updated successfully.');
      closeEditModal();
    } catch (err) {
      setMessage(err.message || 'Failed to update support ticket.');
    }
  };

  const onDelete = async (requestId) => {
    if (!window.confirm('Delete this support ticket?')) return;
    try {
      await deleteRequest(requestId);
      setMessage('Support ticket deleted.');
    } catch (err) {
      setMessage(err.message || 'Failed to delete support ticket.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Support Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SUPPORT_CHANNELS.map((channel) => {
          const Icon = channel.icon;
          const colorMap = {
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
            purple: 'bg-purple-50 border-purple-200 text-purple-700',
            emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          };
          return (
            <div key={channel.label} className={`${colorMap[channel.color]} rounded-2xl border-2 p-6 text-center hover:shadow-md transition-shadow`}>
              <Icon className="text-3xl mx-auto mb-2" />
              <p className="font-semibold">{channel.label}</p>
              <p className="text-sm font-bold mt-2">{channel.value}</p>
            </div>
          );
        })}
      </div>

      {/* Submit Ticket */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Submit a Support Ticket</h3>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              placeholder="Describe your issue..."
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUPPORT_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
            <textarea
              placeholder="Describe your issue in detail..."
              rows="5"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {message && <p className="text-sm font-semibold text-cyan-700">{message}</p>}
          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            <MdSend className="text-lg" />
            {loading ? 'Sending...' : 'Send Ticket'}
          </button>
        </form>
      </div>

      {/* Ticket History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">My Support Tickets</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {!loading && requests.length === 0 && (
            <p className="p-4 text-sm text-gray-500">No support tickets yet.</p>
          )}
          {requests.map((item) => (
            <div key={item._id} className="p-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.subject || item.issueType}</p>
                <p className="text-sm text-gray-600 mt-1">{item.description || item.message || '-'}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Status: {item.status || 'Open'} | {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="px-3 py-1.5 rounded-lg border border-cyan-200 bg-cyan-50 text-cyan-700 text-xs font-semibold hover:bg-cyan-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item._id)}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-zinc-950/45 px-4 pt-16 sm:pt-20 overflow-y-auto"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-xl rounded-3xl border border-cyan-100 bg-white p-6 shadow-[0_30px_60px_-30px_rgba(8,145,178,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-xl font-bold text-cyan-950">Edit Support Ticket</h4>
            <p className="mt-1 text-sm text-cyan-700/80">Update your ticket details and save changes.</p>

            <form className="mt-5 space-y-4" onSubmit={onSaveEdit}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Describe your issue..."
                  value={editForm.subject}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SUPPORT_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                <textarea
                  placeholder="Describe your issue in detail..."
                  rows="5"
                  value={editForm.message}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
                >
                  {loading ? 'Saving...' : 'Save Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <MdHelp className="text-lg text-blue-600" />
            Frequently Asked Questions
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {FAQ_ITEMS.map((item) => (
            <details key={item.id} className="p-4 hover:bg-gray-50 cursor-pointer">
              <summary className="font-semibold text-gray-800 flex items-center justify-between">
                {item.question}
                <span className="text-gray-400">▼</span>
              </summary>
              <p className="text-gray-600 mt-3 text-sm">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}