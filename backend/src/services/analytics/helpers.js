export const STOP_WORDS = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "is", "it", "i", "you", "we", "they", "this", "that",
    "was", "are", "be", "have", "has", "do", "did", "not", "no", "so",
    "my", "your", "our", "their", "its", "như", "và", "là", "của", "có",
    "được", "trong", "với", "cho", "một", "các", "những", "này", "đó",
]);

export function formatDuration(seconds) {
    if (!seconds) return "0s";
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m ? `${m}m ${s}s` : `${s}s`;
}

export function toPercent(count, total) {
    return total ? parseFloat(((count / total) * 100).toFixed(2)) : 0;
}

export function computeWordFrequency(texts) {
    const freq = {};
    for (const text of texts) {
        const words = text
            .toLowerCase()
            .replace(/[^a-zA-ZÀ-ỹ\s]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
        for (const w of words) {
            freq[w] = (freq[w] || 0) + 1;
        }
    }
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .map(([word, count]) => ({ word, count }));
}

export function calculateAge(dob) {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

export function ageGroup(age) {
    if (age < 18) return "UNDER_18";
    if (age <= 24) return "18-24";
    if (age <= 34) return "25-34";
    if (age <= 44) return "35-44";
    if (age <= 54) return "45-60";
    return "60+";
}

export function normalizeGender(g) {
    if (!g) return "UNKNOWN";
    const val = g.trim().toUpperCase();
    if (val === "MALE" || val === "FEMALE" || val === "OTHER") return val;
    return "UNKNOWN";
}