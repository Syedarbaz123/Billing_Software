const SpaceResource = async (space) => {
    return {
        id: space.id,
        name: space.name,
        type: space.type,
        description: space.description,
        floor_id: await space.getFloor(),
        meter_id: await space.getMeter(),
    } 
}
module.exports = SpaceResource;
