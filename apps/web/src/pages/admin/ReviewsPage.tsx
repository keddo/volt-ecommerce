import { useEffect, useState } from "react";
import type { AdminReviewDTO, AdminReviewListResponse } from "@personal-ecommerce/shared";
import { api, ApiError } from "../../lib/apiClient";
import { useToast } from "../../context/ToastContext";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { formatDate } from "../../lib/format";

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-white/10 text-surface-muted",
  APPROVED: "bg-emerald-500/20 text-emerald-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

export function ReviewsPage() {
  const { showToast } = useToast();
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AdminReviewListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminReviewDTO | null>(null);

  function fetchReviews() {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    api
      .get<AdminReviewListResponse>(`/admin/reviews?${params.toString()}`)
      .then(setResult)
      .finally(() => setLoading(false));
  }

  useEffect(fetchReviews, [status, page]);
  useEffect(() => setPage(1), [status]);

  async function handleStatusChange(review: AdminReviewDTO, newStatus: "APPROVED" | "REJECTED") {
    try {
      await api.patch(`/admin/reviews/${review.id}/status`, { status: newStatus });
      showToast(newStatus === "APPROVED" ? "Review approved" : "Review rejected");
      fetchReviews();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to update review", "error");
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/reviews/${deleteTarget.id}`);
      showToast("Review deleted");
      fetchReviews();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Failed to delete review", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <h1 className="text-2xl font-bold">Reviews</h1>

      <div className="mt-6 flex gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-white/10 bg-navy-soft px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-navy-soft p-5">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded bg-white/5" />
            ))}
          </div>
        ) : !result || result.items.length === 0 ? (
          <div className="py-16 text-center text-sm text-surface-muted">No reviews found.</div>
        ) : (
          <div className="space-y-3">
            {result.items.map((review) => (
              <div key={review.id} className="rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-white">{review.productName}</div>
                    <div className="text-xs text-surface-muted">
                      {review.customerName} · {formatDate(review.createdAt)} · ★ {review.rating}
                    </div>
                    {review.comment && <p className="mt-2 text-sm text-surface-muted">{review.comment}</p>}
                  </div>
                  <span className={`shrink-0 rounded-xl px-2 py-1 text-xs font-medium ${STATUS_STYLES[review.status]}`}>
                    {review.status}
                  </span>
                </div>
                <div className="mt-3 flex gap-3 text-xs">
                  {review.status !== "APPROVED" && (
                    <button
                      onClick={() => handleStatusChange(review, "APPROVED")}
                      className="text-emerald-400 hover:underline"
                    >
                      Approve
                    </button>
                  )}
                  {review.status !== "REJECTED" && (
                    <button
                      onClick={() => handleStatusChange(review, "REJECTED")}
                      className="text-amber-400 hover:underline"
                    >
                      Reject
                    </button>
                  )}
                  <button onClick={() => setDeleteTarget(review)} className="text-red-400 hover:underline">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {result && result.total > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-surface-muted">
            <span>
              {result.total} review{result.total === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl px-3 py-1 hover:bg-white/5 disabled:opacity-30"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl px-3 py-1 hover:bg-white/5 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete review"
        message="Delete this review? This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
