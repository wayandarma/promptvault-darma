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
}) {
    const isAllActive = !activeCategory && !isFavoritesActive;

    return (
        <aside
            className="fixed left-0 bottom-0 overflow-y-auto flex flex-col"
            style={{
                top: 58,
                width: 240,
                background: 'var(--surface)',
                borderRight: '1px solid var(--border)',
            }}
        >
            {/* Browse */}
            <div className="px-4 pt-5 pb-2">
                <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--muted)' }}>
                    Browse
                </h3>
                <NavItem
                    label="All Prompts"
                    icon="◈"
                    isActive={isAllActive}
                    onClick={() => { onCategorySelect(''); }}
                />
                <NavItem
                    label="Favorites"
                    icon="♦"
                    isActive={isFavoritesActive}
                    onClick={onFavoritesToggle}
                />
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
                        onClick={() => onCategorySelect(cat.name)}
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
                                onClick={() => onTagToggle(tag)}
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
        </aside>
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
