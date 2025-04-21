const db = require("../models");
const Space = db.Space;
const Customer = db.Customer;
const SpaceResource = require('../resources/SpaceResource')
const SpaceCollection = require('../resources/collections/SpaceCollection')
const Paging = require('../helpers/Paging')
const { Op } = require('sequelize')
const ResponseType = require('../enums/ResponseType')
const ActivityLogController = require('../controllers/ActivityLogController.js');

module.exports = {
    async create(req, res) {
        let response = null;

        const { name, description, type, meter_id, floor_id } = req.body;

        const space = await Space.create({
            name: name,
            type: type,
            description: description,
            meter_id: meter_id,
            floor_id: floor_id,
            created_by: req.query.user_id,
        }); 

        //logging data
        await ActivityLogController.create(
            'Create Space',
            'space name = ' + name + ' is created',
            req.query.user_id
        );

        response = res.status(201).json({
            message: 'Space created successfully.',
            space: SpaceResource(space)
        });

        return response;
    },
    async spaces(req, res) {
        let responseType = req.params.response_type;
        if (!responseType) {
            responseType = ResponseType.FULL;
        }

        if (responseType == ResponseType.PAGINATED) {
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
                        type: {
                            [Op.like]: `%${search}%`
                        }
                    },
                    {
                        description: {
                            [Op.like]: `%${search}%`
                        }
                    }
                ]
            }
            let order = [
                ['id', 'ASC']
            ];
            if (sortBy) {
                order = [[sortBy, orderBy]]
            }
            await Space.findAndCountAll({
                where: condition,
                order: order,
                limit,
                offset
            })
                .then(async data => {
                    const spaces = await SpaceCollection(data.rows);
                    const pagination = await Paging.getPagingData(data, currentPage, limit, search);
                    res.status(200).json({ spaces: spaces, pagination: pagination });
                });
        } else if (responseType === ResponseType.FULL) {
            let spaces = await Space.findAll();
            let free_spaces = [];

            for (const space of spaces) {
                const customer = await Customer.findOne({
                    where: {
                        SpID: space.id,
                        status: true
                    }
                });
                if (!customer) {
                    free_spaces.push(space);
                }
            }

            return res.status(200).json({ spaces: free_spaces })
        }

    },

    async space(req, res) {
        let response = null;
        const id = req.params.id;
        const space = await Space.findByPk(id);
        response = res.status(200).json({ space: await SpaceResource(space) });
        return response;
    },
    async update(req, res) {
        const id = req.params.id;
        const { name, description, type, meter_id, floor_id } = req.body;
        let space = await Space.findByPk(id);
        space.set({
            name: name,
            type: type, 
            description: description, 
            meter_id: meter_id,
            floor_id: floor_id,
            updated_by: req.query.user_id,
        })

        await space.save();

        //logging data
        await ActivityLogController.create(
            'Update Space',
            'space name = ' + name + ' is updated',
            req.query.user_id
        );
        return res.status(201).json({ message: 'Space updated successfully.', space: await SpaceResource(space) });
    },
    async destroy(req, res) {
        const id = req.params.id;
        let customer = await Customer.findAndCountAll({
            where: {
                SpID: id
            },
        });

        if (customer.count > 0) {
            return res.status(409).json({ 'message': 'This space cannot be deleted as it is associated with a customer' });
        } else {

            const space = await Space.destroy({
                where: {
                    id: id
                }
            })
            //logging data
            await ActivityLogController.create(
                'Delete Space',
                'space name = ' + space.name + ' is deleted',
                req.query.user_id
            );
        }
        return res.status(200).json({ 'message': 'Space deleted successfully.' });
    },
}

