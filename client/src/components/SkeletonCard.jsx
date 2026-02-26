export default function SkeletonCard() {
    return (
        <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
            <div className="h-px w-full" style={{ background: 'var(--border2)' }} />
            <div className="p-4 flex flex-col gap-3">
                {/* Title */}
                <div className="flex items-center gap-2">
                    <Shimmer className="w-2.5 h-2.5 rounded-full" />
                    <Shimmer className="h-4 rounded flex-1" style={{ maxWidth: 180 }} />
                </div>
                {/* Body lines */}
                <div className="flex flex-col gap-2">
                    <Shimmer className="h-3 rounded w-full" />
                    <Shimmer className="h-3 rounded w-full" />
                    <Shimmer className="h-3 rounded" style={{ width: '60%' }} />
                </div>
                {/* Footer */}
                <div className="flex items-center gap-2 pt-1">
                    <Shimmer className="h-5 rounded-md" style={{ width: 80 }} />
                    <Shimmer className="h-5 rounded-md" style={{ width: 50 }} />
                    <div className="flex-1" />
                    <Shimmer className="h-5 rounded-md" style={{ width: 64 }} />
                </div>
            </div>
        </div>
    );
}

function Shimmer({ className = '', style = {} }) {
    return (
        <div
            className={`shimmer ${className}`}
            style={{
                background: 'linear-gradient(90deg, var(--border) 25%, var(--border2) 50%, var(--border) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
                ...style,
            }}
        />
    );
}
