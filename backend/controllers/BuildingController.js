const db = require("../models");
const Building = db.Building;
const Floor = db.Floor;
const BuildingResource = require('../resources/BuildingResource');
const BuildingCollection = require('../resources/collections/BuildingCollection');
const Paging = require('../helpers/Paging');
const { Op } = require('sequelize');
const ResponseType = require('../enums/ResponseType');
const ActivityLogController = require('../controllers/ActivityLogController.js');

module.exports = {
    async create(req, res) {
        let response = null;
        const { name, description } = req.body;

        const building = await Building.create({
            name: name,
            description: description,
            created_by: req.query.user_id,
        });

        // Logging data
        await ActivityLogController.create(
            'Create Building',
            'Building name = ' + name + ' is created',
            req.query.user_id
        );

        response = res.status(201).json({
            message: 'Building created successfully.',
            building: BuildingResource(building)
        });

        return response;
    },

    async buildings(req, res) {
        let responseType = req.params.response_type;
        if (!responseType) { 
            responseType = ResponseType.FULL;
        }

        if (responseType === ResponseType.PAGINATED) {
            const { size, currentPage, search, sortBy, orderBy } = req.query;
            const { limit, offset } = Paging.getPagination(currentPage, size);
            const condition = {
                [Op.or]: [
                    {
                        name: {
                            [Op.like]: `%${search}%`
                        }
                    },
                    {
                        description: {
                            [Op.like]: `%${search}%`
                        }
                    }
                ]
            };
            let order = [['id', 'ASC']];
            if (sortBy) {
                order = [[sortBy, orderBy]];
            }

            await Building.findAndCountAll({
                where: condition,
                order: order,
                limit,
                offset
            })
                .then(async data => {
                    const buildings = await BuildingCollection(data.rows);
                    const pagination = await Paging.getPagingData(data, currentPage, limit, search);
                    res.send({ buildings, pagination });
                });

        } else if (responseType === ResponseType.FULL) {
            const condition = {};
            let buildings = await Building.findAll({
                where: condition,
            });
            return res.status(200).json({ buildings });
        }
    },

    async building(req, res) {
        let response = null;
        const id = req.params.id;
        const building = await Building.findByPk(id);
        response = res.status(200).json({ building: await BuildingResource(building) });
        return response;
    },

    async update(req, res) {
        const id = req.params.id;
        const { name, description } = req.body;
        let building = await Building.findByPk(id);

        building.set({
            name: name,
            description: description,
            updated_by: req.query.user_id,
        });

        await building.save();

        // Logging data
        await ActivityLogController.create(
            'Update Building',
            'Building name = ' + name + ' is updated',
            req.query.user_id
        );

        return res.status(201).json({ message: 'Building updated successfully.', building: await BuildingResource(building) });
    },

    async destroy(req, res) {
        const id = req.params.id;

        let floors = await Floor.findAndCountAll({
            where: {
                building_id: id
            },
        });

        if (floors.count > 0) {
            return res.status(409).json({ message: 'This building has associated floors' });
        } else {
            const building = await Building.findByPk(id);
            await Building.destroy({
                where: { id: id }
            });

            // Logging data
            await ActivityLogController.create(
                'Delete Building',
                'Building name = ' + building.name + ' is deleted',
                req.query.user_id
            );
        }
        return res.status(200).json({ message: 'Building deleted successfully.' });
    },
};
