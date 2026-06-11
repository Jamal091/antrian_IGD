export const playQueueAudio = async (queueNumber, loketName = 'admisi1') => {
    if (!queueNumber) return;

    const parts = queueNumber.split('-');
    if (parts.length !== 2) return;

    const prefix = parts[0].toLowerCase(); // 'i' or 'e'
    const numbers = parts[1].split(''); // e.g. ['0', '0', '5']

    const playlist = [
        '/sounds/in.mp3',
        '/sounds/nomor_antrian.mp3',
        `/sounds/${prefix}.mp3`,
        ...numbers.map(n => `/sounds/${n}.mp3`),
        '/sounds/silahkan_ke_loket.mp3',
        `/sounds/${loketName}.mp3`, // defaults to admisi1.mp3
        '/sounds/out.mp3'
    ];

    for (const src of playlist) {
        await playSound(src);
    }
};

const playSound = (src) => {
    return new Promise((resolve) => {
        const audio = new Audio(src);
        audio.onended = resolve;
        audio.onerror = resolve; // Skip if error occurs
        audio.play().catch(resolve); // Handle browser autoplay restrictions silently
    });
};
