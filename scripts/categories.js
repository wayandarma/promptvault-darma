const CATEGORY_MAP = {
    'Writing & Editing': ['writer', 'editor', 'copywriter', 'poet', 'journalist', 'novelist', 'proofreader', 'ghostwriter'],
    'Development': ['developer', 'programmer', 'terminal', 'linux', 'sql', 'regex', 'debugger', 'engineer', 'python', 'javascript'],
    'Business': ['marketing', 'sales', 'startup', 'ceo', 'product manager', 'recruiter', 'advertiser', 'entrepreneur'],
    'Education': ['teacher', 'tutor', 'instructor', 'academic', 'researcher', 'professor', 'mentor'],
    'Creative': ['storyteller', 'character', 'screenwriter', 'comedian', 'artist', 'rapper', 'composer', 'director'],
    'Personal & Wellness': ['life coach', 'therapist', 'advisor', 'motivational', 'psychologist', 'career counselor'],
    'Language': ['translator', 'english', 'language', 'pronunciation', 'interpreter', 'grammar'],
    'Data & Analysis': ['data scientist', 'statistician', 'analyst', 'excel', 'spreadsheet', 'database'],
};

export function assignCategory(act) {
    const lower = act.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some(k => lower.includes(k))) return category;
    }
    return 'Uncategorized';
}

export function extractTags(act) {
    return act
        .toLowerCase()
        .replace(/^act as (a|an) /i, '')
        .split(/[\s,]+/)
        .filter(w => w.length > 3)
        .slice(0, 4)
        .join(',');
}
