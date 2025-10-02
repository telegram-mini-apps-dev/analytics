export function generateUUID(userId: string) {
    let uidPlaceholder = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    let dt = new Date().getTime();

    const seed = userId + dt;

    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0; // Convert to 32-bit integer
        }
        return hash;
    }

    let seedHash = simpleHash(seed).toString(16);

    while (seedHash.length < 32) {
        seedHash += seedHash;
    }
    seedHash = seedHash.slice(0, 32);

    let index = 0;
    return uidPlaceholder.replace(/[xy]/g, function (c) {
        const r = (dt + parseInt(seedHash[index], 16)) % 16 | 0;
        dt = Math.floor(dt / 16);
        index++;

        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
