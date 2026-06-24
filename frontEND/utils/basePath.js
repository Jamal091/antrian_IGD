const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const BASE_PATH = rawBasePath && rawBasePath !== '/'
    ? rawBasePath.replace(/\/$/, '')
    : '';

export const withBasePath = (path) => {
    if (!path || !BASE_PATH) return path;
    if (/^(https?:)?\/\//.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }
    if (!path.startsWith('/')) return path;
    if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;

    return `${BASE_PATH}${path}`;
};
