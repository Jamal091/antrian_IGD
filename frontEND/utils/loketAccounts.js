export const LOKET_ACCOUNTS = [
    {
        username: 'loket1',
        password: 'loket1',
        name: 'Petugas Loket 1',
        counterName: 'Loket 1 Admisi IGD',
    },
    {
        username: 'loket2',
        password: 'loket2',
        name: 'Petugas Loket 2',
        counterName: 'Loket 2 Admisi IGD',
    },
];

export const findLoketAccount = (username, password) => {
    return LOKET_ACCOUNTS.find((account) => {
        return account.username === username.trim().toLowerCase() && account.password === password;
    }) || null;
};
