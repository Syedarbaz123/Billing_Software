const db = require("../models");
const UnitAdjustment = db.UnitAdjustment;
const Meter = db.Meter;
const UnitAdjustmentResource = require('../resources/UnitAdjustmentResource')
const UnitAdjustmentCollection = require('../resources/collections/UnitAdjustmentCollection')
const MeterResource = require('../resources/MeterResource')
const Paging = require('../helpers/Paging')
const { Op } = require('sequelize')
const ResponseType = require('../enums/ResponseType');
const moment = require('moment');
const ChartController = require('./ChartController')

module.exports = {
    async performUnitAdjustment(res, fromDate, toDate, finalUnitsTonHour, diffUnitsTonHour, HistoryTableID, isMBTU, TableName) {
        let response = null;
        // if final units = 0 then update all values to zero
        let spResult = {};
        try {
            spResult = await db.sequelize.query('EXEC proc_AdjustUnits @HistoryTableID = :HistoryTableID, @fromDate = :fromDate, @toDate = :toDate, @units= :units',
                {
                    replacements: {
                        HistoryTableID: HistoryTableID,
                        fromDate: moment(fromDate).format('YYYY-MM-DD HH:mm:ss'),
                        toDate: moment(toDate).format('YYYY-MM-DD HH:mm:ss'),
                        // if final units = 0 then update all values to zero
                        units: finalUnitsTonHour == 0 ? 0 : diffUnitsTonHour,
                    },
                    type: db.sequelize.QueryTypes.RAW,
                },
            ).then(async spResult => {

                let data = spResult[0];
                console.log(data);
 
                // now reset totalizer
                try {
                    spResult = await db.sequelize.query('EXEC ResetTotalizer_New @HistoryTableID = :HistoryTableID, @fromDate = :fromDate',
                        {
                            replacements: {
                                HistoryTableID: HistoryTableID,
                                fromDate: moment(fromDate).format('YYYY-MM-DD HH:mm:ss'),
                            },
                            type: db.sequelize.QueryTypes.RAW,
                        },
                    ).then(async spResult => {
                        console.log(spResult[0]);

                        try {
                            spResult = await db.sequelize.query('EXEC Totalizer @TableName = :TableName',
                                {
                                    replacements: {
                                        TableName: TableName,
                                    },
                                    type: db.sequelize.QueryTypes.RAW,
                                },
                            )
                        } catch (error) {
                            console.error('Error calling stored procedure: Run Totalizer', error);
                            response = res.status(404).json({ error: 'Run Totalizer, Some Error occured' });
                        }
                    })
                } catch (error) {
                    console.error('Error calling stored procedure: Reset not done', error);

                    response = res.status(404).json({ error: 'Reset not done, Some Error occured' });

                }
            });
        } catch (error) {
            console.error('Error calling stored procedure: Units not adjusted', error);
            response = res.status(404).json({ error: 'Units not adjusted, Some Error occured' });
        }
        console.log(`response  ---------------${response}`);
        return response;
    },

    async create(req, res) {
        let response = null;
        const { MeterId, docNo, docDate = new Date(), fromDate, toDate, finalUnitsTonHour } = req.body;
        // get current units from DB and not from body input
        const hourwiseData = await ChartController.getHourwiseData(fromDate, toDate, false, [MeterId]);
        const currentUnitsTonHour_Ori = hourwiseData[0].Value;
        // final units should not be -ive
        if (finalUnitsTonHour < 0) {
            // do not allow 
            return res.status(409).json({ 'message': 'Error: Negative values not allowed for final units' });
        }

        const diffUnitsTonHour = finalUnitsTonHour - currentUnitsTonHour_Ori;
        const unitAdjustment = await UnitAdjustment.create({
            MeterId: MeterId,
            docNo: docNo,
            docDate: moment(docDate).format('YYYY-MM-DD HH:mm:ss'),
            fromDate: fromDate,//moment(fromDate).utc().format('YYYY-MM-DD HH:mm:ss'),
            toDate: toDate, //moment(toDate).utc().format('YYYY-MM-DD HH:mm:ss'),
            currentUnitsTonHour: currentUnitsTonHour_Ori,
            finalUnitsTonHour: finalUnitsTonHour,
            diffUnitsTonHour: diffUnitsTonHour,
            created_by: req.query.user_id,

        });

        const unitAdjustmentRes = await UnitAdjustmentResource(unitAdjustment);
        // now run totalizer for this table
        const meterRes = await MeterResource(unitAdjustmentRes.meter);

        response = await module.exports.performUnitAdjustment(res, fromDate, toDate, finalUnitsTonHour, diffUnitsTonHour,
            unitAdjustmentRes.meter.history_config_id, false, meterRes.history_config.TABLE_NAME,)

        if (response == null) {
            //logging data
            await ActivityLogController.create(
                'Create UnitAdjustment',
                'Unit adjustment id = ' + docNo + ' is created',
                req.query.user_id
            );
            response = res.status(201).json({
                message: 'UnitAdjustment created successfully.',
                unitAdjustment: unitAdjustmentRes
            });
        }
        return response;
    },
    
    async unitAdjustments(req, res) {
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
                        docNo: {
                            [Op.like]: `%${search}%`
                        }
                    },
                ]
            }
            let order = [
                ['id', 'DESC']
            ];

            await UnitAdjustment.findAndCountAll({
                where: condition,
                include: [
                    {
                        model: Meter,
                        as: 'meter',
                        where: {
                            name: {
                                [Op.like]: `%${search}%`
                            }
                        }
                    }
                ],
                order: order,
                limit,
                offset
            })
                .then(async data => {
                    const unitAdjustments = await UnitAdjustmentCollection(data.rows);
                    const pagination = await Paging.getPagingData(data, currentPage, limit, search);
                    res.send({ unitAdjustments, pagination });
                });
        } else if (responseType === ResponseType.FULL) {
            const condition = {};
            let unitAdjustments = await UnitAdjustment.findAll({
                where: condition,
            });
            return res.status(200).json({ unitAdjustments })
        }

    },

    async unitAdjustment(req, res) {
        let response = null;
        const id = req.params.id;
        const unitAdjustment = await UnitAdjustment.findByPk(id);
        response = res.status(200).json({ unitAdjustment: await UnitAdjustmentResource(unitAdjustment) });
        return response;
    },
    async update(req, res) {
        const id = req.params.id;
        const { MeterId, docNo, docDate = new Date(), fromDate, toDate, currentUnitsTonHour, finalUnitsTonHour } = req.body;

        // check last unit adjustment
        const lastUnitdjustment = await UnitAdjustment.findAndCountAll({
            //where: condition,
            order: order,
            limit: 1,
        });

        if (lastUnitdjustment[0].id > id) {
            // do not allow update/ delete
            return res.status(409).json({ 'message': 'Error updating: Unit Adjustment(s) created after this adjustment' });
        }

        const diffUnitsTonHour = finalUnitsTonHour - currentUnitsTonHour;

        let unitAdjustment = await UnitAdjustment.findByPk(id);
        unitAdjustment.set({
            MeterId: MeterId,
            docNo: docNo,
            docDate: docDate,
            fromDate: fromDate,
            toDate: toDate,
            currentUnitsTonHour: currentUnitsTonHour,
            finalUnitsTonHour: finalUnitsTonHour,
            diffUnitsTonHour: diffUnitsTonHour,
            updated_by: req.query.user_id,
        })

        await unitAdjustment.save();
        //logging data
        await ActivityLogController.create(
            'Update UnitAdjustment',
            'Unit adjustment id = ' + docNo + ' is updated',
            req.query.user_id
        );
        // perform DB operations
        // if final units = 0 then update all values to zero
        return res.status(201).json({ unitAdjustment: await UnitAdjustmentResource(unitAdjustment) });
    },

    async destroy(req, res) {
        let response = null;

        const id = req.params.id;
        let unitAdjustment = await UnitAdjustment.findByPk(id);

        // check if this is the last adjustment of selected meter
        // of selected hour. like same meter 9am can be deleted even if 10am adjustment is present. 
        // but cannot delete if there are multiple 9 am adjustments. only delete last one.
        const dtFrom = moment(unitAdjustment.fromDate).utc().format('YYYY-MM-DD HH:mm:ss');

        const condition = {
            [Op.and]: [
                {
                    MeterId: unitAdjustment.MeterId,
                    fromDate: dtFrom,
                },
            ]
        }

        let order = [
            ['id', 'DESC']
        ];

        // check last unit adjustment
        const lastUnitdjustment = await UnitAdjustment.findAll({
            where: condition,
            order: order,
            limit: 1,
        });

        if (lastUnitdjustment.length > 0 && lastUnitdjustment[0].id > id) {
            // do not allow update/ delete
            return res.status(409).json({ 'message': 'Error deleting: Unit Adjustment(s) created after this adjustment' });
        }

        // perform db operations
        const unitAdjustmentRes = await UnitAdjustmentResource(unitAdjustment);
        // now run totalizer for this table
        const meterRes = await MeterResource(unitAdjustmentRes.meter);

        /// as we are doing reverse operation diff units will be reversed
        /// final units should be current units
        const finalUnitsTonHour = unitAdjustmentRes.currentUnitsTonHour;
        const diffUnitsTonHour = 0 - unitAdjustmentRes.diffUnitsTonHour;

        /// sequelize get date results as per timezone, to avoid convert to UTC
        const fromDate = moment(unitAdjustmentRes.fromDate).utc().format('YYYY-MM-DD HH:mm:ss');
        const toDate = moment(unitAdjustmentRes.toDate).utc().format('YYYY-MM-DD HH:mm:ss');

        response = await module.exports.performUnitAdjustment(res, fromDate, toDate, finalUnitsTonHour, diffUnitsTonHour,
            unitAdjustmentRes.meter.history_config_id, false, meterRes.history_config.TABLE_NAME,)
        try {

            // Delete the parent Billing record
            const ua = await UnitAdjustment.destroy({
                where: { id: id }
            });

            //logging data
            await ActivityLogController.create(
                'Delete UnitAdjustment',
                'Unit adjustment id = ' + ua.docNo + ' is deleted',
                req.query.user_id
            );

        } catch (error) {
            console.error('Error deleting records:', error);
            response = res.status(409).json({ 'message': 'Some error occured' });
        }

        // if (response == null) {
        response = res.status(200).json({ message: 'Unit Adjustment deleted successfully.' });
        // }
        return response;
    },
}

