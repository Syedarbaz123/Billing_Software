const userResource = async (user) => {
    return {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        type: user.type,
        role_id: user.role_id,
        created_at: user.createdAt,
        role: await user.getRole()
    }
}
module.exports = userResource;