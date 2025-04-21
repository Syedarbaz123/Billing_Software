const Role = require('../models').Role;
const User = require('../models').User;
const ResponseType = require('../enums/ResponseType')
const RoleCollection = require('../resources/collections/RoleCollection');
const Paging = require('../helpers/Paging')
const { Op } = require("sequelize");
const func = require('../middleware/permissions/CommonFunc');
const ActivityLogController = require('./ActivityLogController');

const roleController = {
    async getModules(req, res) {
        let response = null;

        let groups = ['ActivityLog', 'Floor', 'Meter', 'Customer', 'User', 'Role', 'Graphs', 'Billing', 'UnitAdjustment'];
        let permissionTypes = ['View', 'Create', 'Update', 'Delete', 'Print'];

        response = res.status(201).json({ message: 'Registered Modules and Permission Types', groups : groups , permissionTypes: permissionTypes });
        return response;
    },

    async create(req, res) {
        let response = null;
        const { name, description, permissions } = req.body;
        const role = await Role.create({
            name: name,
            description: description,
            permissions: JSON.stringify(permissions),
            key: name.replace(' ', '_').toLowerCase(),
            created_by: req.query.user_id,
        }); 
        //logging data
        await ActivityLogController.create(
            'Create Role',
            'Role = ' + name + ' is created',
            req.query.user_id
        );
        response = res.status(201).json({ message: 'Role created successfully.', role: role });
        return response;
    },
    async update(req, res) {
        let response = null;
        const id = req.params.id;
        const { name, description, permissions } = req.body;

        const role = await Role.update({
            name: name,
            description: description,
            permissions: JSON.stringify(permissions),
            updated_by: req.params.user_id,
        }, { where: { id: id } });

        //logging data
        await ActivityLogController.create(
            'UPDATE Role',
            'Role = ' + name + ' is updated',
            req.query.user_id
        );

        response = res.status(201).json({ message: 'Role updated successfully.', role: role });
        return response;
    },
    async role(req, res) {
        let role = await Role.findByPk(req.params.id);
        console.log("first " + role.permissions);
        if (role) {
            return res.status(200).json({ role: role });
        } else {
            return res.status(404).json({ 'message': 'Role not found' });
        }
    },
    async roles(req, res) {
        let roles = await Role.findAll();
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
            }
            let order = [
                ['id', 'ASC']
            ];
            if (sortBy) {
                order = [[sortBy, orderBy]]
            }
            await Role.findAndCountAll({
                where: condition,
                order: order,
                limit,
                offset
            })
                .then(async data => {
                    const roles = await RoleCollection(data.rows.filter(item => item.key !== '@super_user'), responseType);
                    const pagination = await Paging.getPagingData(data, currentPage, limit, search);
                    res.send({ roles, pagination });
                });
        } else {
            const isSuper = await func.isSuperUser(req.user.user_id);
            // only allow super user role if logged in by super user
            if (!isSuper) {
                roles = roles.filter(role => role.key !== '@super_user');
            }
            return res.status(200).json({ roles: await RoleCollection(roles, responseType) })
        }
    },
    async destroy(req, res) {
        let id = req.params.id;
        let users = await User.findAll({
            where: {
                role_id: id
            }
        })
        if (users.length > 0) {
            return res.status(409).json({ message: 'This role is associated with some users.' });
        } else {
            // cannot delete super user role-main
            if (id == 1) {
                return res.status(409).json({ message: 'Unauthorized action' });
            }
            else {
                const role = await Role.destroy({
                    where: {
                        id: id
                    }
                })
                //logging data
                await ActivityLogController.create(
                    'Delete Role',
                    'Role = ' + role.name + ' is deleted',
                    req.query.user_id
                );
                return res.status(200).json({ message: 'Role deleted successfully.' });
            }
        }

    }
}
module.exports = roleController;