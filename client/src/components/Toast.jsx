const TYPE_STYLES = {
    success: { color: 'var(--green)', icon: '✓' },
    info: { color: '#5b9bd5', icon: '↺' },
    error: { color: '#c46a6a', icon: '✕' },
};

export default function Toast({ message, type = 'success', isVisible }) {
    const { color, icon } = TYPE_STYLES[type] || TYPE_STYLES.success;

    return (
        <div
            className="fixed z-[300] font-mono text-xs flex items-center gap-2 px-4 py-2.5 rounded-lg"
            style={{
                bottom: 28,
                right: 28,
                background: 'var(--card)',
                border: `1px solid ${color}`,
                color,
                transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
                opacity: isVisible ? 1 : 0,
                pointerEvents: isVisible ? 'auto' : 'none',
                transition: 'transform 0.25s ease, opacity 0.25s ease',
            }}
        >
            <span>{icon}</span>
            {message}
        </div>
    );
}
