const _checkOwnerOrAdmin = (user, survey) => {
    return (
        user &&
        (survey.created_by === user.id || user.role === "admin")
    );
};

export default _checkOwnerOrAdmin;