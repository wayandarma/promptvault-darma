const PAGES_VISIBLE = 5;

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const pages = buildPageRange(currentPage, totalPages);

    return (
        <div className="flex items-center justify-center gap-1.5 pt-8 pb-4">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                style={{ color: 'var(--muted2)', border: '1px solid var(--border)' }}
            >
                ← Prev
            </button>

            {pages.map((page, i) =>
                page === '...' ? (
                    <span key={`dots-${i}`} className="px-1 text-xs" style={{ color: 'var(--muted)' }}>
                        …
                    </span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className="w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        style={{
                            background: page === currentPage ? 'var(--accent)' : 'transparent',
                            color: page === currentPage ? 'var(--bg)' : 'var(--muted2)',
                            border: page === currentPage ? 'none' : '1px solid var(--border)',
                        }}
                    >
                        {page}
                    </button>
                )
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                style={{ color: 'var(--muted2)', border: '1px solid var(--border)' }}
            >
                Next →
            </button>
        </div>
    );
}

function buildPageRange(current, total) {
    if (total <= PAGES_VISIBLE + 2) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [1];
    let start = Math.max(2, current - Math.floor(PAGES_VISIBLE / 2));
    let end = Math.min(total - 1, start + PAGES_VISIBLE - 1);
    start = Math.max(2, end - PAGES_VISIBLE + 1);

    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push('...');
    pages.push(total);

    return pages;
}
