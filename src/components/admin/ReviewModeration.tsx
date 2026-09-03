import React, { useState } from 'react';
import { 
  Star, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Trash2, 
  Filter, 
  Search, 
  ShieldCheck, 
  Car, 
  Clock, 
  Download,
  MessageSquare,
  Edit3
} from 'lucide-react';
import { VehicleReview, ReviewModerationStatus, Vehicle } from '../../types';

interface ReviewModerationProps {
  reviews: VehicleReview[];
  vehicles: Vehicle[];
  onUpdateReviewStatus: (reviewId: string, status: ReviewModerationStatus, adminNotes?: string) => void;
  onDeleteReview: (reviewId: string) => void;
}

export const ReviewModeration: React.FC<ReviewModerationProps> = ({
  reviews,
  vehicles,
  onUpdateReviewStatus,
  onDeleteReview,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | ReviewModerationStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCarFilter, setSelectedCarFilter] = useState('ALL');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Stats
  const totalReviews = reviews.length;
  const pendingCount = reviews.filter(r => r.status === 'PENDING').length;
  const approvedCount = reviews.filter(r => r.status === 'APPROVED').length;
  const flaggedCount = reviews.filter(r => r.status === 'FLAGGED').length;
  const avgOverall = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0';

  // Filtered reviews
  const filteredReviews = reviews.filter(rev => {
    if (filterStatus !== 'ALL' && rev.status !== filterStatus) return false;
    if (selectedCarFilter !== 'ALL' && rev.vehicleId !== selectedCarFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rev.customerName.toLowerCase().includes(q);
      const matchCar = rev.vehicleName.toLowerCase().includes(q);
      const matchComment = rev.comment.toLowerCase().includes(q);
      const matchBooking = rev.bookingNumber.toLowerCase().includes(q);
      return matchName || matchCar || matchComment || matchBooking;
    }
    return true;
  });

  // Export reviews to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Vehicle', 'Customer', 'Rating', 'Status', 'Date', 'Title', 'Comment', 'Admin Notes'];
    const rows = reviews.map(r => [
      r.id,
      `"${r.vehicleName.replace(/"/g, '""')}"`,
      `"${r.customerName.replace(/"/g, '""')}"`,
      r.rating,
      r.status,
      r.createdAt,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${r.comment.replace(/"/g, '""')}"`,
      `"${(r.adminNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CRMS_Customer_Reviews_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Bento Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
              Feedback & Trust Center
            </span>
            <span className="text-xs text-slate-400 font-mono">Customer Rating Moderation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Customer Reviews & Ratings Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Review, approve, flag, or respond to verified customer feedback. Approved ratings automatically update vehicle average scores and public catalog badges.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-semibold border border-slate-700 transition-colors shrink-0"
        >
          <Download className="w-4 h-4 text-amber-400" />
          Export Reviews (CSV)
        </button>
      </div>

      {/* KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Customer Reviews</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{totalReviews}</div>
            <p className="text-[11px] text-slate-400 mt-1">Verified completed rentals</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Pending Review Queue</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{pendingCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting admin moderation</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Approved & Live</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{approvedCount}</div>
            <p className="text-[11px] text-slate-400 mt-1">Displayed on vehicle pages</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Fleet Average Rating</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
              <span>{avgOverall}</span>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{flaggedCount} flagged for follow-up</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Bento Container */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {(['ALL', 'PENDING', 'APPROVED', 'FLAGGED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {st} {st === 'PENDING' && pendingCount > 0 && `(${pendingCount})`}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Vehicle Selector */}
          <select
            value={selectedCarFilter}
            onChange={(e) => setSelectedCarFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden"
          >
            <option value="ALL">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer, vehicle, comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Reviews Moderation List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/90 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No reviews found</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting the status filter or search term.</p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const isEditingNote = editingNotesId === review.id;

            return (
              <div
                key={review.id}
                id={`moderation-review-${review.id}`}
                className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 transition-all hover:border-slate-300"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{review.customerName}</h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Verified Rental
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Reviewed <strong>{review.vehicleName}</strong> • Booking #{review.bookingNumber} • {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        review.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : review.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : review.status === 'FLAGGED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {review.status}
                    </span>
                  </div>
                </div>

                {/* Rating Stars & Aspect Ratings */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${review.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                    <span className="font-bold text-amber-900 ml-1">{review.rating}.0 / 5.0</span>
                  </div>

                  {review.cleanlinessRating && (
                    <span className="text-slate-500">
                      Cleanliness: <strong className="text-slate-800 font-semibold">{review.cleanlinessRating}/5</strong>
                    </span>
                  )}
                  {review.comfortRating && (
                    <span className="text-slate-500">
                      Comfort: <strong className="text-slate-800 font-semibold">{review.comfortRating}/5</strong>
                    </span>
                  )}
                  {review.serviceRating && (
                    <span className="text-slate-500">
                      Staff Service: <strong className="text-slate-800 font-semibold">{review.serviceRating}/5</strong>
                    </span>
                  )}
                </div>

                {/* Review Title & Written Comment */}
                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-1">
                  {review.title && (
                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                      &ldquo;{review.title}&rdquo;
                    </h5>
                  )}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {review.comment}
                  </p>
                </div>

                {/* Admin internal notes */}
                {review.adminNotes && !isEditingNote && (
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs flex items-start justify-between gap-2">
                    <div>
                      <strong className="text-amber-900 font-semibold block mb-0.5">Admin Moderation Note:</strong>
                      <span className="text-amber-800">{review.adminNotes}</span>
                    </div>
                    <button
                      onClick={() => {
                        setEditingNotesId(review.id);
                        setAdminNoteInput(review.adminNotes || '');
                      }}
                      className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 shrink-0"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                )}

                {/* Edit Note Form */}
                {isEditingNote && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                    <label className="font-semibold text-slate-700 block">Add / Edit Internal Moderation Note:</label>
                    <input
                      type="text"
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      placeholder="e.g. Verified with station manager. Photo checklist confirmed spotless."
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setEditingNotesId(null)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onUpdateReviewStatus(review.id, review.status, adminNoteInput);
                          setEditingNotesId(null);
                        }}
                        className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Moderation Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Approve button */}
                    <button
                      onClick={() => onUpdateReviewStatus(review.id, 'APPROVED')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        review.status === 'APPROVED'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {review.status === 'APPROVED' ? 'Approved (Active)' : 'Approve & Publish'}
                    </button>

                    {/* Flag button */}
                    <button
                      onClick={() => onUpdateReviewStatus(review.id, 'FLAGGED')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        review.status === 'FLAGGED'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Flag Review
                    </button>

                    {/* Reject button */}
                    <button
                      onClick={() => onUpdateReviewStatus(review.id, 'REJECTED')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        review.status === 'REJECTED'
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject / Hide
                    </button>

                    {/* Add note toggle */}
                    {!review.adminNotes && !isEditingNote && (
                      <button
                        onClick={() => {
                          setEditingNotesId(review.id);
                          setAdminNoteInput('');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        + Add Note
                      </button>
                    )}
                  </div>

                  {/* Delete Review */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Permanently delete review from ${review.customerName}?`)) {
                        onDeleteReview(review.id);
                      }
                    }}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete review permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
