const _checkOwnerOrAdmin = (user, survey) => {
    if (!user) return false;
    if (survey.created_by === user.id) {
        return true;
    }
    if (user.role === "admin") {
        return true;
    }
    return false;
}

export default _checkOwnerOrAdmin;