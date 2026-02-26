import { useEffect } from 'react';

const CATEGORY_COLORS = {
    'Writing & Editing': '#5b9bd5',
    'Development': '#5eb87f',
    'Business': '#e8c97a',
    'Education': '#c47bb0',
    'Creative': '#d4845a',
    'Personal & Wellness': '#4fa8a0',
    'Language': '#8b7acc',
    'Data & Analysis': '#c46a6a',
};

const POPULAR_TAGS = [
    'writing', 'code', 'seo', 'roleplay', 'analysis', 'debate',
    'tutor', 'terminal', 'email', 'ux', 'finance', 'language',
];

export default function CategorySidebar({
    categories,
    activeCategory,
    activeTags,
    isFavoritesActive,
    onCategorySelect,
    onTagToggle,
    onFavoritesToggle,
    isOpen,
    onClose,
}) {
    const isAllActive = !activeCategory && !isFavoritesActive;

    // Close sidebar on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Wrap category/tag/fav clicks to auto-close on mobile
    const handleCategoryClick = (cat) => {
        onCategorySelect(cat);
        onClose();
    };
    const handleTagClick = (tag) => {
        onTagToggle(tag);
        onClose();
    };
    const handleFavClick = () => {
        onFavoritesToggle();
        onClose();
    };
    const handleAllClick = () => {
        onCategorySelect('');
        onClose();
    };

    const sidebarContent = (
        <>
            {/* Browse */}
            <div className="px-4 pt-5 pb-2">
                <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                    Browse
                </h3>
                <NavItem label="All Prompts" icon="◈" isActive={isAllActive} onClick={handleAllClick} />
                <NavItem label="Favorites" icon="♦" isActive={isFavoritesActive} onClick={handleFavClick} />
            </div>

            <hr className="mx-4 border-0" style={{ borderTop: '1px solid var(--border)' }} />

            {/* Categories */}
            <div className="px-4 pt-4 pb-2">
                <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                    Categories
                </h3>
                {categories.map(cat => (
                    <CategoryItem
                        key={cat.name}
                        name={cat.name}
                        count={cat.count}
                        color={CATEGORY_COLORS[cat.name] || '#606870'}
                        isActive={activeCategory === cat.name}
                        onClick={() => handleCategoryClick(cat.name)}
                    />
                ))}
            </div>

            <hr className="mx-4 border-0" style={{ borderTop: '1px solid var(--border)' }} />

            {/* Popular Tags */}
            <div className="px-4 pt-4 pb-6">
                <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                    Popular Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    {POPULAR_TAGS.map(tag => {
                        const isActive = activeTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => handleTagClick(tag)}
                                className="font-mono text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                                style={{
                                    background: isActive ? 'rgba(232,201,122,0.1)' : 'transparent',
                                    color: isActive ? 'var(--accent)' : 'var(--muted2)',
                                    border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                                }}
                            >
                                {tag}
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop sidebar — always visible */}
            <aside
                className="hidden lg:flex fixed left-0 bottom-0 overflow-y-auto flex-col"
                style={{
                    top: 58,
                    width: 240,
                    background: 'var(--surface)',
                    borderRight: '1px solid var(--border)',
                }}
            >
                {sidebarContent}
            </aside>

            {/* Mobile overlay */}
            <div
                className="lg:hidden fixed inset-0 z-[60]"
                style={{
                    background: 'rgba(0,0,0,0.5)',
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease',
                }}
                onClick={onClose}
            />

            {/* Mobile sidebar — slides in from left */}
            <aside
                className="lg:hidden fixed left-0 bottom-0 overflow-y-auto flex flex-col z-[70]"
                style={{
                    top: 58,
                    width: 260,
                    background: 'var(--surface)',
                    borderRight: '1px solid var(--border)',
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {/* Close button */}
                <div className="flex justify-end px-4 pt-3">
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                        style={{ color: 'var(--muted2)', border: '1px solid var(--border)' }}
                    >
                        ✕
                    </button>
                </div>
                {sidebarContent}
            </aside>
        </>
    );
}

function NavItem({ label, icon, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg mb-0.5 transition-colors cursor-pointer"
            style={{
                background: isActive ? 'rgba(232,201,122,0.08)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--muted2)',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            }}
        >
            <span className="text-sm">{icon}</span>
            {label}
        </button>
    );
}

function CategoryItem({ name, count, color, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg mb-0.5 transition-colors cursor-pointer"
            style={{
                background: isActive ? 'rgba(232,201,122,0.08)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--muted2)',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
            }}
        >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
            <span className="flex-1 text-left truncate">{name}</span>
            <span
                className="text-xs font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'var(--card)', color: 'var(--muted)' }}
            >
                {count}
            </span>
        </button>
    );
}
