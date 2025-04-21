const BuildingResource = async (building) => {
    return {
        id: building.id,
        name: building.name,
        description: building.description,
    };
};

module.exports = BuildingResource;
