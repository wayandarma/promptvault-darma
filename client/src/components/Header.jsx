import { useRef, useEffect } from 'react';

export default function Header({ total, search, onSearch, onAddPrompt, onRefresh, isRefreshing, onToggleSidebar }) {
    const inputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                inputRef.current?.blur();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-5"
            style={{
                height: 58,
                background: 'var(--bg)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--border)',
            }}
        >
            {/* Hamburger — mobile only */}
            <button
                onClick={onToggleSidebar}
                className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                style={{ color: 'var(--muted2)', border: '1px solid var(--border)' }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-serif text-base font-bold"
                    style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                >
                    P
                </div>
                <span className="hidden sm:inline font-serif text-xl tracking-tight" style={{ color: 'var(--text)' }}>
                    Prompt<span style={{ color: 'var(--accent)' }}>Vault</span>
                </span>
            </div>

            {/* Search */}
            <div className="flex-1 flex justify-center mx-4">
                <div
                    className="relative flex items-center w-full rounded-lg transition-colors"
                    style={{ maxWidth: 520, background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                    <svg
                        className="absolute left-3 shrink-0"
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder={`Search ${total.toLocaleString()} prompts...`}
                        className="w-full bg-transparent outline-none text-sm pl-10 pr-16 py-2.5 font-sans"
                        style={{ color: 'var(--text)' }}
                    />
                    <kbd
                        className="absolute right-3 text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--card)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                    >
                        ⌘K
                    </kbd>
                </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3 shrink-0">
                <span
                    className="hidden sm:inline text-xs font-mono px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--surface)', color: 'var(--muted2)', border: '1px solid var(--border)' }}
                >
                    {total.toLocaleString()}
                </span>

                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80 disabled:opacity-40"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    title="Refresh prompts"
                >
                    <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="var(--muted2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className={isRefreshing ? 'animate-spin' : ''}
                    >
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                </button>

                <button
                    onClick={onAddPrompt}
                    className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg transition-opacity hover:opacity-90"
                    style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="hidden sm:inline">Add Prompt</span>
                </button>
            </div>
        </header>
    );
}
