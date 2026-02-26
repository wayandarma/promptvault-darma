import { useState, useEffect, useRef } from 'react';
import { fetchPrompts, fetchCategories, toggleFavorite, addPrompt, triggerIngest, DEFAULT_FILTERS } from './api';
import Header from './components/Header';
import CategorySidebar from './components/CategorySidebar';
import PromptCard from './components/PromptCard';
import AddPromptModal from './components/AddPromptModal';
import Toast from './components/Toast';
import SkeletonCard from './components/SkeletonCard';
import EmptyState from './components/EmptyState';
import Pagination from './components/Pagination';

export default function App() {
    const [prompts, setPrompts] = useState([]);
    const [total, setTotal] = useState(0);
    const [categories, setCategories] = useState([]);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [activeTab, setActiveTab] = useState('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ message: '', type: 'success', isVisible: false });
    const toastTimer = useRef(null);

    const showToast = (message, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ message, type, isVisible: true });
        toastTimer.current = setTimeout(() => {
            setToast(prev => ({ ...prev, isVisible: false }));
        }, 2200);
    };

    useEffect(() => {
        fetchCategories()
            .then(data => setCategories(data.categories))
            .catch(err => setError(err.message));
    }, []);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            fetchPrompts(filters)
                .then(data => {
                    setPrompts(data.prompts);
                    setTotal(data.total);
                    setError(null);
                })
                .catch(err => setError(err.message))
                .finally(() => setIsLoading(false));
        }, 200);
        return () => clearTimeout(timer);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
    };

    const handleCategorySelect = (category) => {
        setFilters(prev => ({
            ...prev,
            category: prev.category === category ? '' : category,
            favorites: false,
            offset: 0,
        }));
    };

    const handleTagToggle = (tag) => {
        setFilters(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag],
            offset: 0,
        }));
    };

    const handleFavoritesToggle = () => {
        setFilters(prev => ({ ...prev, favorites: !prev.favorites, category: '', offset: 0 }));
    };

    const handleSearch = (value) => {
        setFilters(prev => ({ ...prev, search: value, offset: 0 }));
    };

    const handleClearFilters = () => {
        setFilters(DEFAULT_FILTERS);
    };

    const handleFavoriteToggle = (id) => {
        const prompt = prompts.find(p => p.id === id);
        const wasFavorite = prompt?.is_favorite;
        setPrompts(prev =>
            prev.map(p => p.id === id ? { ...p, is_favorite: p.is_favorite ? 0 : 1 } : p)
        );
        toggleFavorite(id)
            .then(() => {
                if (!wasFavorite) showToast('Added to favorites', 'success');
            })
            .catch(() => {
                setPrompts(prev =>
                    prev.map(p => p.id === id ? { ...p, is_favorite: p.is_favorite ? 0 : 1 } : p)
                );
            });
    };

    const handleAddPrompt = (data) => {
        addPrompt(data)
            .then(newPrompt => {
                setPrompts(prev => [newPrompt, ...prev]);
                setTotal(prev => prev + 1);
                setIsModalOpen(false);
                showToast('Prompt added successfully', 'success');
            })
            .catch(err => setError(err.message));
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        triggerIngest()
            .then(() => fetchPrompts(filters))
            .then(data => {
                setPrompts(data.prompts);
                setTotal(data.total);
                showToast('Prompts refreshed', 'info');
            })
            .catch(err => setError(err.message))
            .finally(() => setIsRefreshing(false));
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
            <Header
                total={total}
                search={filters.search}
                onSearch={handleSearch}
                onAddPrompt={() => setIsModalOpen(true)}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
            />

            <div className="flex flex-1" style={{ paddingTop: 58 }}>
                <CategorySidebar
                    categories={categories}
                    activeCategory={filters.category}
                    activeTags={filters.tags}
                    isFavoritesActive={filters.favorites}
                    onCategorySelect={handleCategorySelect}
                    onTagToggle={handleTagToggle}
                    onFavoritesToggle={handleFavoritesToggle}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                <main className="main-content flex-1 overflow-y-auto p-4 lg:p-7">
                    {/* lg:marginLeft handled via className */}
                    {error && (
                        <div className="text-sm mb-4 px-4 py-3 rounded-lg" style={{ color: '#c46a6a', background: 'rgba(196,106,106,0.1)', border: '1px solid rgba(196,106,106,0.3)' }}>
                            {error}
                        </div>
                    )}

                    {isLoading && (
                        <div
                            className="grid gap-3.5"
                            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}
                        >
                            {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
                        </div>
                    )}

                    {!isLoading && prompts.length === 0 && (
                        <EmptyState
                            message="Try a different search or category."
                            onClear={handleClearFilters}
                        />
                    )}

                    {!isLoading && prompts.length > 0 && (
                        <>
                            <div
                                className="grid gap-3.5"
                                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
                            >
                                {prompts.map(p => (
                                    <PromptCard
                                        key={p.id}
                                        {...p}
                                        onFavoriteToggle={handleFavoriteToggle}
                                        onTagClick={handleTagToggle}
                                    />
                                ))}
                            </div>
                            <Pagination
                                currentPage={Math.floor(filters.offset / filters.limit) + 1}
                                totalPages={Math.ceil(total / filters.limit)}
                                onPageChange={(page) => {
                                    setFilters(prev => ({ ...prev, offset: (page - 1) * prev.limit }));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            />
                        </>
                    )}
                </main>
            </div>

            <AddPromptModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddPrompt}
                categories={categories}
            />

            <Toast {...toast} />
        </div>
    );
}
