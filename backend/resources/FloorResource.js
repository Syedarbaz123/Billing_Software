const FloorResource = async (floor) => {
    return {
        id: floor.id,
        name: floor.name,
        description: floor.description,  
        Bname: floor.Bname,  
        building_id: await floor.getBuilding(), 
    };
};

module.exports = FloorResource;