import { PERIOD_FIELD } from "../domain/leaderBoard.domain.js";

export const weekStart = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
};

export const monthStart = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
};

export const getUserStars = (user, period) => user[PERIOD_FIELD[period]];