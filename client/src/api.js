export const DEFAULT_FILTERS = {
    search: '',
    category: '',
    tags: [],
    favorites: false,
    limit: 30,
    offset: 0,
};

async function request(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
}

export async function fetchPrompts({ search, category, tags, favorites, limit = 30, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (tags?.length) params.set('tags', tags.join(','));
    if (favorites) params.set('favorites', '1');
    params.set('limit', limit);
    params.set('offset', offset);
    return request(`/api/prompts?${params}`);
}

export async function fetchCategories() {
    return request('/api/prompts/categories');
}

export async function addPrompt(data) {
    return request('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function toggleFavorite(id) {
    return request(`/api/prompts/${id}/favorite`, { method: 'PATCH' });
}

export async function triggerIngest() {
    return request('/api/ingest', { method: 'POST' });
}
