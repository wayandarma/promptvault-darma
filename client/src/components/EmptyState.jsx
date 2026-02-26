export default function EmptyState({ message, onClear }) {
    return (
        <div className="flex flex-col items-center justify-center py-24">
            <span className="text-6xl mb-4" style={{ color: 'var(--border2)' }}>◈</span>
            <h3 className="font-serif text-lg mb-2" style={{ color: 'var(--muted2)' }}>
                No prompts found
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                {message}
            </p>
            {onClear && (
                <button
                    onClick={onClear}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
                    style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }}
                >
                    Clear filters
                </button>
            )}
        </div>
    );
}
