export function buildAgeComparison(rows, { calculateAge, ageGroup }) {
    const result = {};

    for (const r of rows) {
        const option = r.option_label || "UNKNOWN";
        const count = Number(r.total);
        const group = ageGroup(calculateAge(r.dob));

        if (!result[group]) result[group] = { total: 0, data: {} };
        result[group].total += count;
        result[group].data[option] = (result[group].data[option] || 0) + count;
    }

    for (const group in result) {
        const { total, data } = result[group];
        for (const opt in data) {
            data[opt] = Math.round((data[opt] / (total || 1)) * 100);
        }
    }

    return result;
}

export function buildAgeGenderInsight(rows, { calculateAge, ageGroup, normalizeGender }) {
    const raw = {};

    for (const r of rows) {
        const group = ageGroup(calculateAge(r.dob));
        const gender = normalizeGender(r.gender);
        const option = r.option_label || "UNKNOWN";
        const count = Number(r.total);

        if (!raw[group]) raw[group] = {};
        if (!raw[group][gender]) raw[group][gender] = {};

        raw[group][gender][option] = (raw[group][gender][option] || 0) + count;
    }

    const result = {};
    for (const group in raw) {
        result[group] = {};
        for (const gender in raw[group]) {
            const data = raw[group][gender];
            const total = Object.values(data).reduce((s, v) => s + v, 0);
            result[group][gender] = {
                total,
                data: Object.fromEntries(
                    Object.entries(data).map(([opt, cnt]) => [
                        opt,
                        Math.round((cnt / total) * 100),
                    ])
                ),
            };
        }
    }

    return result;
}
