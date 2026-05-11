const _checkOwnerOrAdmin = (user, survey) => {
    return (
        user &&
        (survey.created_by === user.id || user.role === "ADMIN")
    );
};

export default _checkOwnerOrAdmin;