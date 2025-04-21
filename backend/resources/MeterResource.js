const MeterResource = async (meter) => {
    return {
        id: meter.id,
        name: meter.name,
        description: meter.description,
        created_at: meter.createdAt,
        history_config: await meter.getHistoryConfig(),
        status: meter.status,
        history_config_id: meter.history_config_id
    }
}
module.exports = MeterResource;