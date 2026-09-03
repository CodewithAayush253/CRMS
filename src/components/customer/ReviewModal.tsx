import React, { useState } from 'react';
import { Star, X, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Booking, VehicleReview } from '../../types';

interface ReviewModalProps {
  booking: Booking;
  existingReview?: VehicleReview;
  onClose: () => void;
  onSubmitReview: (reviewData: {
    rating: number;
    cleanlinessRating: number;
    comfortRating: number;
    serviceRating: number;
    title: string;
    comment: string;
  }) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  booking,
  existingReview,
  onClose,
  onSubmitReview,
}) => {
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);

  const [cleanlinessRating, setCleanlinessRating] = useState<number>(existingReview?.cleanlinessRating || 5);
  const [comfortRating, setComfortRating] = useState<number>(existingReview?.comfortRating || 5);
  const [serviceRating, setServiceRating] = useState<number>(existingReview?.serviceRating || 5);

  const [title, setTitle] = useState<string>(existingReview?.title || '');
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const ratingDescriptions = [
    '',
    'Disappointing (1/5)',
    'Fair, could improve (2/5)',
    'Good experience (3/5)',
    'Very Good (4/5)',
    'Exceptional & Flawless (5/5)',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitReview({
        rating,
        cleanlinessRating,
        comfortRating,
        serviceRating,
        title: title.trim() || `${rating}-Star Experience with ${booking.vehicleName}`,
        comment: comment.trim(),
      });
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div 
        id="crms-customer-review-modal"
        className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200/90 animate-in fade-in zoom-in-95 duration-200 my-6"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <Star className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                {existingReview ? 'Update Your Rental Review' : 'Rate & Review Your Experience'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {booking.vehicleName} • Booking #{booking.bookingNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Verified badge */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span><strong>Verified Completed Rental:</strong> Your review will receive a certified badge on {booking.vehicleName}&apos;s public profile.</span>
          </div>

          {/* Primary 1-5 Star Rating */}
          <div className="space-y-2 text-center py-2 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Overall Vehicle & Rental Rating
            </label>
            <div className="flex items-center justify-center gap-2 my-1">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = (hoverRating || rating) >= starValue;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-hidden"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-semibold text-slate-700">
              {ratingDescriptions[hoverRating || rating]}
            </p>
          </div>

          {/* Detailed Aspect Ratings (Cleanliness, Comfort, Service) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
              <span className="font-semibold text-slate-700 block mb-1.5">Vehicle Cleanliness</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCleanlinessRating(val)}
                    className="p-0.5"
                  >
                    <Star className={`w-4 h-4 ${cleanlinessRating >= val ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
              <span className="font-semibold text-slate-700 block mb-1.5">Ride Comfort</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setComfortRating(val)}
                    className="p-0.5"
                  >
                    <Star className={`w-4 h-4 ${comfortRating >= val ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
              <span className="font-semibold text-slate-700 block mb-1.5">Hub & Service Staff</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setServiceRating(val)}
                    className="p-0.5"
                  >
                    <Star className={`w-4 h-4 ${serviceRating >= val ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Headline Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Review Headline (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Smooth highway drive, impeccably clean vehicle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Written Feedback Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Written Feedback & Experience <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="How was the pickup, vehicle condition, performance, and return process? Your review helps future drivers make great choices."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs"
            >
              {isSubmitting ? (
                <>Saving Review...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Submit Certified Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
