export const mapAchievement = (ach) => {
    return {
        code: ach.code,
        name: ach.name,
        icon: ach.icon,
        description: ach.description,
        tier: ach.tier,
        star_reward: ach.star_reward,
    };
};