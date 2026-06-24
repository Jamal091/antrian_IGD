import { withBasePath } from './basePath';

let queueAudioChain = Promise.resolve();

export const unlockQueueAudio = async () => {
    const audio = new Audio(withBasePath('/sounds/in.mp3'));
    audio.volume = 0;

    try {
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        return true;
    } catch {
        return false;
    }
};

export const playQueueAudio = (queueNumber, loketName = 'admisi1') => {
    const playback = queueAudioChain
        .catch(() => undefined)
        .then(() => playQueueAudioSequence(queueNumber, loketName));

    queueAudioChain = playback.catch(() => undefined);

    return playback;
};

const playQueueAudioSequence = async (queueNumber, loketName = 'admisi1') => {
    if (!queueNumber) return;

    const parts = queueNumber.split('-');
    if (parts.length !== 2) return;

    const prefix = parts[0].toLowerCase(); // 'i' or 'e'
    const numbers = parts[1].split(''); // e.g. ['0', '0', '5']

    const playlist = [
        withBasePath('/sounds/in.mp3'),
        withBasePath('/sounds/nomor_antrian.mp3'),
        withBasePath(`/sounds/${prefix}.mp3`),
        ...numbers.map(n => withBasePath(`/sounds/${n}.mp3`)),
        withBasePath('/sounds/silahkan_ke_loket.mp3'),
        withBasePath(`/sounds/${loketName}.mp3`),
        withBasePath('/sounds/out.mp3')
    ];

    for (const src of playlist) {
        await playSound(src);
    }
};

const playSound = (src) => {
    return new Promise((resolve, reject) => {
        const audio = new Audio(src);
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(reject);
    });
};
