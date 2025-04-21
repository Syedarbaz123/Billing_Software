const ActivityLogResource = async (log) => {
    return {
        op_type: log.OperationType,
        description: log.Description,
        timestamp: log.createdAt,
        user: await log.getUser(),
    }
}
module.exports = ActivityLogResource;