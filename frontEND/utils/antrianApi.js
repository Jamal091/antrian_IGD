const API_BASE_URL = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000/` : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/');

const joinUrl = (path) => {
    return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

export const antrianRequest = async (path, options = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch(joinUrl(path), {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
        cache: 'no-store',
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        const error = new Error(data?.message || 'Layanan antrean tidak tersedia');
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
};

export const createTicket = (type) => {
    return antrianRequest('/antrian/tickets', {
        method: 'POST',
        body: JSON.stringify({ type }),
    });
};

export const getWaitingTickets = () => {
    return antrianRequest('/antrian/waiting');
};

export const getCallLockStatus = () => {
    return antrianRequest('/antrian/call-lock');
};

export const callNextTicket = (type, counterName) => {
    return antrianRequest('/antrian/call-next', {
        method: 'POST',
        body: JSON.stringify({ type, counter_name: counterName }),
    });
};

export const callAutoTicket = (counterName) => {
    return antrianRequest('/antrian/call-auto', {
        method: 'POST',
        body: JSON.stringify({ counter_name: counterName }),
    });
};

export const callSpecificTicket = (ticket, counterName) => {
    return antrianRequest('/antrian/call-specific', {
        method: 'POST',
        body: JSON.stringify({
            ticket_id: ticket.id,
            number: ticket.number,
            counter_name: counterName,
        }),
    });
};

export const recallTicket = (ticket, counterName) => {
    return antrianRequest('/antrian/recall', {
        method: 'POST',
        body: JSON.stringify({
            ticket_id: ticket?.id,
            number: ticket?.number,
            counter_name: counterName,
        }),
    });
};

export const getDisplayTickets = (counterName) => {
    const params = counterName ? `?counter_name=${encodeURIComponent(counterName)}` : '';
    return antrianRequest(`/antrian/display${params}`);
};
