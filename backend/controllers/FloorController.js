const db = require("../models");
const Floor = db.Floor;
const Space = db.Space;
const FloorResource = require('../resources/FloorResource')
const FloorCollection = require('../resources/collections/FloorCollection')
const Paging = require('../helpers/Paging') 
const { Op } = require('sequelize')
const ResponseType = require('../enums/ResponseType')
const ActivityLogController = require('../controllers/ActivityLogController.js');

module.exports = { 
    // async create(req, res) {
    //     try {
    //         let response = null;
    //         const { name, description, building_id } = req.body;
    
    //         if (!building_id) {
    //             return res.status(400).json({ message: "Building ID is required." });
    //         }
    
    //         const floor = await Floor.create({
    //             name: name,
    //             description: description,
    //             building_id: building_id,  // Store building_id
    //             created_by: req.query.user_id,
    //         });
    
    //         // Logging Activity
    //         await ActivityLogController.create(
    //             "Create Floor",
    //             `Floor name = ${name} is created`,
    //             req.query.user_id
    //         );
    
    //         response = res.status(201).json({
    //             message: "Floor created successfully.",
    //             floor: await FloorResource(floor), // Make sure FloorResource supports building_id
    //         });
    
    //         return response;
    //     } catch (error) {
    //         console.error("❌ Error Creating Floor:", error);
    //         return res.status(500).json({ message: "Internal Server Error", error });
    //     }
    // },
    async create(req, res) {
    
        const { name, description, building_id , Bname } = req.body;
    
        if (!building_id) {
            return res.status(400).json({ error: "Building ID is required." });
        }
    
        const floor = await Floor.create({
            name: name,
            description: description,
            Bname: Bname,
            building_id: building_id,  // Ensure integer or NULL
            created_by: req.query.user_id,
        });
    
        res.status(201).json({
            message: "Floor created successfully.",
            floor : FloorResource(floor),
        });
    },    
     
    async floors(req, res) {
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
            await Floor.findAndCountAll({
                where: condition,
                order: order,
                limit,
                offset
            })
                .then(async data => {
                    const floors = await FloorCollection(data.rows);
                    const pagination = await Paging.getPagingData(data, currentPage, limit, search);
                    res.send({ floors, pagination });
                });
        } else if (responseType === ResponseType.FULL) {

            const condition = {};
            let floors = await Floor.findAll({
                where: condition,
            });
            return res.status(200).json({ floors })
        }

    },

    async floor(req, res) {
        let response = null;
        const id = req.params.id;
        const floor = await Floor.findByPk(id);
        response = res.status(200).json({ floor: await FloorResource(floor) });
        return response;
    },
    async update(req, res) {
        const id = req.params.id;
       
        const { name, description,building_id, Bname } = req.body;
    
        let floor = await Floor.findByPk(id);
        floor.set({
            name: name,
            description: description,
            Bname: Bname,
            building_id:building_id,  
            updated_by: req.query.user_id, 
        })
        await floor.save();
        //logging data
        await ActivityLogController.create(
            'Update Floor',
            'floor name = ' + name + ' is updated',
            req.query.user_id
        );
        return res.status(201).json({ message: 'Floor updated successfully.', floor: await FloorResource(floor) });
    },
    async destroy(req, res) {
        const id = req.params.id;

        let space = await Space.findAndCountAll({
            where: {
                floor_id: id
            },
        });

        if (space.count > 0) {
            return res.status(409).json({ message: 'This floor is associated with some spaces' });
        } else {
            const floor  = await Floor.destroy({
                where: {
                    id: id
                }
            })
            //logging data
            await ActivityLogController.create(
                'Delete Floor',
                'floor name = ' + floor.name + ' is deleted',
                req.query.user_id
            );
        }
        return res.status(200).json({ 'message': 'Floor deleted successfully.' });
    },
}

