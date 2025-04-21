const db = require("../models");
const Meter = db.Meter;
const HistoryConfig = db.HistoryConfig;
const Space = db.Space;
const Customer = db.Customer;
const MeterResource = require('../resources/MeterResource')
const MeterCollection = require('../resources/collections/MeterCollection')
const Paging = require('../helpers/Paging')
const { Op } = require('sequelize')
const ResponseType = require('../enums/ResponseType')
const excelJS = require("exceljs");
const path = require('path');
const fs = require("fs");
const PDFDocument = require("pdfkit-table");
const moment = require('moment');
const ActivityLogController = require('../controllers/ActivityLogController.js');

module.exports = {
    async create(req, res) {
        try {
            const { name, description, history_config_id, status } = req.body;

            const meterData = {
                name,
                description,
                status,
                created_by: req.query.user_id,
            };

            if (history_config_id !== null && history_config_id !== undefined && history_config_id !== '') {
                meterData.history_config_id = history_config_id;
            }

            const meter = await Meter.create(meterData);

            await ActivityLogController.create(
                'Create Meter',
                `Meter name = ${name} is created`,
                req.query.user_id
            );

            return res.status(201).json({
                message: 'Meter created successfully.',
                meter: MeterResource(meter),
            });

        } catch (error) {
            console.log("ERROR!!!!!!!!!!!!!", error);
            return res.status(422).json({
                message: "Failed to create meter",
                errors: error?.errors || error?.message
            });
        }
    },
    async meters(req, res) {
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
                    },
                    {
                        status: {
                            [Op.like]: `%${search}%`
                        }
                    },
                ]
            }
            let order = [
                ['id', 'ASC']
            ];
            if (sortBy) {
                order = [[sortBy, orderBy]]
            }
            await Meter.findAndCountAll({
                where: condition,
                order: order,
                limit,
                offset
            })
                .then(async data => {
                    const meters = await MeterCollection(data.rows);
                    const pagination = await Paging.getPagingData(data, currentPage, limit, search);
                    res.status(200).json({ meters, pagination });
                });
        } else if (responseType === ResponseType.FULL) {
            const condition = {
                status: true,
            };
            let meters = await Meter.findAll({
                where: condition,
            });
            // get compact results for combo
            meters = await MeterCollection(meters, ResponseType.COMPACT);
            return res.status(200).json({ meters: meters })
        }

    },

    async meter(req, res) {
        let response = null;
        const id = req.params.id;
        const meter = await Meter.findByPk(id);
        response = res.status(200).json({ meter: await MeterResource(meter) });
        return response;
    },

    async update(req, res) {
        const id = req.params.id;
        const { name, description, history_config_id, status } = req.body;
        console.log("meter save " + req.body);
        let meter = await Meter.findByPk(id);
        meter.set({
            name: name,
            description: description,
            history_config_id: history_config_id,
            status: status,
            updated_by: req.query.user_id,
        })
        await meter.save();

        //logging data
        await ActivityLogController.create(
            'Update Meter',
            'meter name = ' + name + ' is updated',
            req.query.user_id
        );
        return res.status(201).json({ message: "meter updated successfully", meter: await MeterResource(meter) });
    },
    async destroy(req, res) {
        const id = req.params.id;

        let space = await Space.findAndCountAll({
            where: {
                meter_id: id
            },
        });

        if (space.count > 0) {
            return res.status(409).json({ 'message': 'This meter cannot be deleted as it is associated with a space' });
        } else {
            const meter = await Meter.destroy({
                where: {
                    id: id
                }
            });
            //logging data
            await ActivityLogController.create(
                'Delete Meter',
                'meter name = ' + meter.name + ' is deleted',
                req.query.user_id
            );
        }
        return res.status(200).json({ 'message': 'Meter deleted successfully.' });
    },
    async metersForTag(req, res) {
        let space_id = req.query.space_id;
        if (space_id) {
            console.log("getting only booked/tagged meters")

            let meter_ids = await module.exports.getMeterIdsBySpace(space_id)
            let meters = await Meter.findAll({
                where: {
                    id: { [Op.in]: meter_ids },
                }
            })
            return res.status(200).json({ meters: await MeterCollection(meters, ResponseType.COMPACT) })
        } else {
            console.log("getting free meters / not associated with any space")
            //enabled meters and meters which are not attached to customers(or attached to disable customers)
            const meter_ids = await module.exports.getMetersIdsForTagging();
            let meters = await Meter.findAll({
                where: {
                    id: { [Op.in]: meter_ids },
                }
            })
            console.log("173 " + JSON.stringify(await MeterCollection(meters, ResponseType.COMPACT)))
            return res.status(200).json({ meters: await MeterCollection(meters, ResponseType.COMPACT) })
        }
    },

    async consumptionDetails(req, res) {
        let { site_id, building_id, floor_id, customer_id, start_date, end_date } = req.query;
        let records = await module.exports.extractRecords(site_id, building_id, floor_id, customer_id, start_date, end_date);
        return res.status(200).json({ records: records })
    }, 

    async exportAsExcel(req, res) {
        if (!fs.existsSync('./public/files')) {
            await fs.mkdirSync('./public/files', { recursive: true }); 
        }
        let { site_id, building_id, floor_id, customer_id, start_date, end_date } = req.query;
        let records = await module.exports.extractRecords(site_id, building_id, floor_id, customer_id, start_date, end_date);

        // sort records by meter description (numeric way)
        records.sort((a, b) => a.meter.description - b.meter.description);

        const workbook = new excelJS.Workbook();  // Create a new workbook
        const worksheet = workbook.addWorksheet("Meter Consumption Report"); // New Worksheet
        let alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

        let doubleBorder = { style: 'double' };
        let thinBorder = { style: 'thin' };
        let mediumBorder = { style: 'medium' };

        const firstRow = worksheet.addRow(["Meter Consumption Report"]);
        firstRow.alignment = alignment;

        let font = { color: { argb: '000000' }, bold: true };
        firstRow.eachCell((cell) => {
            cell.font = { bold: true, size: 15 }
        })
        worksheet.mergeCells(1, 1, 1, 13);
        worksheet.getCell('C3').value = 'From'
        worksheet.getCell('D3').value = moment.unix(start_date / 1000).format('DD-MMM-yyyy')
        worksheet.getCell('E3').value = 'To'
        worksheet.getCell('F3').value = moment.unix(end_date / 1000).format('DD-MMM-yyyy')
        worksheet.getCell('D3').border = { bottom: thinBorder }
        worksheet.getCell('F3').border = { bottom: thinBorder }
        worksheet.getRow(3).font = font;
        worksheet.getRow(3).alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.getCell('A5').value = ''
        worksheet.getCell('B5').value = ''
        worksheet.getCell('A5').font = { bold: true };

        worksheet.getRow(7).values = ['S.No', 'Name Of Tenant', 'Site', 'Building', 'Floor', 'Office No',
            'Reading Start (A)', 'Reading End (B)', 'Difference X=(B-A)', 'New Reading Start (C)', 'New Reading End (D)',
            'Difference Y=(D-C)', 'Total X+Y'
        ];
        worksheet.getRow(7).alignment = alignment;
        worksheet.getRow(7).font = font;
        worksheet.getRow(7).eachCell((cell) => {
            cell.border = { top: mediumBorder, right: mediumBorder, bottom: doubleBorder }
        })

        worksheet.columns = [
            { key: 'sno' },
            { key: 'customer' },
            { key: 'site' },
            { key: 'building' },
            { key: 'floor' },
            { key: 'office_number' },
            { key: 'reading_start_a' },
            { key: 'reading_end_b' },
            { key: 'difference_b_a' },
            { key: 'reading_start_c' },
            { key: 'reading_end_d' },
            { key: 'difference_d_c' },
            { key: 'total' },
        ]

        let counter = 7;
        let fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '00767676' }
        };
        let allTotal = 0;
        let sno = 1;

        records.forEach((item) => {
            let readings = item.reading;
            let a = 0
            let b = 0
            let c = 0
            let d = 0
            let x = 0;
            let y = 0;
            let ab = readings[0];
            if (ab) {
                a = ab.start_reading;
                b = ab.end_reading;
                x = b - a;
            }
            let cd = readings[1];
            if (cd) {
                c = cd.start_reading;
                d = cd.end_reading;
                y = d - c;
            }
            let total = x + y;
            allTotal = allTotal + total;
            let row = {
                sno: sno, // + ' ' + item.meter.description,
                customer: item.customer.name,
                building: item.building.name,
                site: item.site.name,
                floor: item.floor.name,
                office_number: item.meter.office_number,
                reading_start_a: a.toFixed(2),
                reading_end_b: b.toFixed(2),
                difference_b_a: x.toFixed(2),
                reading_start_c: c.toFixed(2),
                reading_end_d: d.toFixed(2),
                difference_d_c: y.toFixed(2),
                total: total.toFixed(2)
            }
            let newRow = worksheet.addRow(row);
            newRow.alignment = { vertical: 'middle', horizontal: 'center' };

            newRow.eachCell((cell) => {
                cell.border = { left: mediumBorder, right: mediumBorder, bottom: thinBorder }
            })
            worksheet.getCell('F' + counter).fill = fill;
            worksheet.getCell('G' + counter).fill = fill;
            worksheet.getCell('I' + counter).fill = fill;
            worksheet.getCell('J' + counter).fill = fill;
            worksheet.getCell('L' + counter).fill = fill;
            counter++;
            sno++;
        })
        worksheet.getCell('F' + counter).fill = fill;
        worksheet.getCell('G' + counter).fill = fill;
        worksheet.getCell('I' + counter).fill = fill;
        worksheet.getCell('J' + counter).fill = fill;
        worksheet.getCell('L' + counter).fill = fill;

        counter = counter + 1;
        let totalCell = worksheet.getCell('L' + counter);
        totalCell.value = 'Total'
        totalCell.border = { top: doubleBorder, bottom: doubleBorder, left: mediumBorder, right: mediumBorder };
        totalCell.font = font;
        totalCell.alignment = alignment;

        let totalValCell = worksheet.getCell('M' + counter);
        totalValCell.value = allTotal.toFixed(2);
        totalValCell.border = { top: doubleBorder, bottom: doubleBorder, left: mediumBorder, right: mediumBorder };
        totalValCell.fill = fill;
        totalValCell.alignment = alignment;

        worksheet.columns.forEach(function (column, i) {
            column.width = 12;
            if (i == 0) //sno
                column.width = 6;
            else if (i == 1) //custommer
                column.width = 34;
            else if (i == 3) // building
                column.width = 18;
            else if (i == 5) // office no
                column.width = 15;

        });

        try {
            await workbook.xlsx.writeFile('./public/files/consumption_report.xlsx')
                .then(() => {
                    res.send({
                        status: "success",
                        message: "File successfully downloaded",
                        path: path.relative(process.cwd(), 'files/consumption_report.xlsx'),
                    });
                });
        } catch (err) {
            res.send({
                status: "error",
                error: err.message,
                message: "Something went wrong",
            });
        }
    },
    async exportAsPdf(req, res) {
        if (!fs.existsSync('./public/files')) {
            fs.mkdirSync('./public/files', { recursive: true });
        }
        let { site_id, building_id, floor_id, customer_id, start_date, end_date } = req.query;
        let records = await module.exports.extractRecords(site_id, building_id, floor_id, customer_id = -1, start_date, end_date);
        console.log(records);
        start_date = moment(start_date).format('DD-MMM-yyyy');
        end_date = moment(end_date).format('DD-MMM-yyyy')

        let data = [];
        let allTotal = 0;
        records.forEach((item) => {
            let readings = item.reading;
            let a = 0
            let b = 0
            let c = 0
            let d = 0
            let x = 0;
            let y = 0;
            let ab = readings[0];
            if (ab) {
                a = ab.start_reading;
                b = ab.end_reading;
                x = b - a;
            }
            let cd = readings[1];
            if (cd) {
                c = cd.start_reading;
                d = cd.end_reading;
                y = d - c;
            }
            let total = x + y;
            allTotal = allTotal + total;
            data.push([
                item.customer?.CName,
                item.building?.name,
                item.floor?.name,
                item.meter?.office_number,
                a.toFixed(2), b.toFixed(2), x.toFixed(2),
                c.toFixed(2), d.toFixed(2), y.toFixed(2),
                total.toFixed(2)
            ])
        })
        data.push(['', '', '', '', '', '', '', '', '', 'Total', allTotal.toFixed(2)])

        let doc = new PDFDocument({ margin: 20, size: 'Tabloid' });
        doc.pipe(fs.createWriteStream("./public/files/document.pdf"));
        const table = {
            title: "Meter Consumption Report",
            subtitle: `From ${start_date} to ${end_date}`,
            headers: [
                { label: "Name of Tenant", property: 'name', width: 70, renderer: null },
                { label: "Building", property: 'building', width: 50, renderer: null },
                { label: "Floor", property: 'floor', width: 50, renderer: null },
                { label: "Office No.", property: 'office_number', width: 50, renderer: null },
                { label: "Reading Start (A)", property: 'reading_start_a', width: 80, renderer: null },
                { label: "Reading End (B)", property: 'reading_end_b', width: 80, renderer: null },
                { label: "Difference X=(B-A)", property: 'difference_x', width: 80, renderer: null },
                { label: "New Reading Start (C)", property: 'reading_start_c', width: 80, renderer: null },
                { label: "New Reading End (D)", property: 'reading_end_d', width: 80, renderer: null },
                { label: "Difference Y=(D-C)", property: 'difference_y', width: 80, renderer: null },
                { label: "Total X+Y", property: 'total', width: 60, renderer: null },
            ],
            rows: data,
        };
        // the magic
        doc.table(table, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                doc.font("Helvetica").fontSize(8);
                indexColumn === 0 && doc.addBackground(rectRow, 'blue', 0.15);
            },
        });
        // done!
        doc.end();
        return res.send({ path: 'files/document.pdf' });
    },

    async getMetersIdsForTagging() {
        let spaces = await Space.findAll();
        let meter_ids = [];
        let count = 0;
        for (const space of spaces) {
            const meter = await Meter.findOne({
                where: {
                    id: space.meter_id,
                    status: true
                }
            });
            console.log("meter : ", JSON.stringify(meter))
            if (meter) {
                count = count + 1;
                meter_ids.push(meter.id);
            }
        }
        console.log('total meters ocuupied : ', count)
        //enabled meters and meters which are not attached to customers(or attached to disable customers)
        return await Meter.findAll({
            where: {
                id: { [Op.notIn]: meter_ids },
                status: true
            },
            // attributes: ['id'],
            raw: true
        }).then(meters => meters.map(meter => meter.id));
    }
    ,
    async getMeterIdsByCustomer(customer_id) {

        return await Customer.findByPk(
            customer_id
        ).then(async (customer) => {
            return await Space.findByPk(
                customer.SpID
            ).then(async (space) => {
                return await Meter.findByPk(
                    space.meter_id
                )
            })
        });
    }
    ,
    getMeterIds: async function () {
        return await Meter.findAll({
            attributes: ['id'],
            raw: true,
        }).then(meters => meters.map(meter => meter.id));
    }
    ,
    getMeterIdsByMeters: async function (meter_ids) {
        return await Meter.findAll({
            raw: true,
            where: {
                id: { [Op.in]: meter_ids },
            }
        }).then(meters => meters.map(meter => meter.meter_id));
    }
    ,
    getMeterIdsByFloor: async function (floor_id) {
        return await Space.findAll({
            attributes: ['meter_id'],
            raw: true,
            where: { status: true, floor_id: floor_id },
            order: [['id', 'asc']]
        }).then(ids => ids.map(item => item.id));
    }
    ,
    extractRecords: async function (site_id = -1, building_id = -1, floor_id = -1, customer_id = -1, start_date, end_date) {
        if (!fs.existsSync('./public/files')) {
            await fs.mkdirSync('./public/files', { recursive: true });
        }
        let records = [];
        let meter_ids = [];
        if (site_id == -1 && building_id == -1 && floor_id == -1 && customer_id == -1) {//fetch all meters
            meter_ids = await module.exports.getMeterIds();
        } else if (site_id != -1 && building_id == -1 && floor_id == -1 && customer_id == -1) {//fetch site meters
            meter_ids = await module.exports.getMeterIdsBySite(site_id);
            meter_ids = await module.exports.getMeterIdsByMeters(meter_ids)
        } else if (site_id == -1 && building_id != -1 && floor_id == -1 && customer_id == -1) {//fetch building meters
            meter_ids = await module.exports.getMeterIdsByBuilding(building_id);
            meter_ids = await module.exports.getMeterIdsByMeters(meter_ids)
        } else if (site_id == -1 && building_id == -1 && floor_id != -1 && customer_id == -1) {//fetch floor meters
            meter_ids = await module.exports.getMeterIdsByFloor(floor_id);
            meter_ids = await module.exports.getMeterIdsByMeters(meter_ids)
        } else if (site_id == -1 && building_id == -1 && customer_id != -1) {//fetch customer meters
            meter_ids = await module.exports.getMeterIdsByCustomer(customer_id);
            // meter_ids = await module.exports.getMeterIdsByMeters(meter_ids);
            console.log("meter ids : ", meter_ids)
        }
        let config_ids = await module.exports.getConfigIds(meter_ids);
        // let config_ids = meter_ids.history_config_id;
        console.log("configs : ", config_ids);
        let tables = await module.exports.getMeterTables(config_ids);
        console.log("tables : ", tables);
        records = await module.exports.meterRecordsByTables(tables, start_date, end_date);
        return records;
    }
    ,

    getConfigIds: async function (meter_ids) {
        return await Meter.findAll({
            attributes: ['history_config_id'],
            raw: true,
            where: {
                id: { [Op.in]: meter_ids },
                status: true
            }
        }).then(meters => meters.map(meter => meter.history_config_id));
    }
    ,

    meterRecordsByTables: async function (tables, start_date, end_date) {
        let data = [];
        for (let i = 0; i < tables.length; i++) {
            let item = tables[i];
            let meter = await Meter.findOne({
                where: {
                    history_config_id: item.id
                }
            })
            let customer = null;
            let space = null;
            if (meter) {
                space = await Space.findOne({
                    where: {
                        meter_id: meter.id
                    }
                })
                if (space) {
                    console.log('space exist')
                    customer = await Customer.findOne({
                        where: {
                            SpID: space.id
                        }
                    })
                }
                console.log('\n\n\n');
                console.log("Meter ID " + meter.id);
                console.log('Customer IDs ' + JSON.stringify(customer?.CId) + '\n\n\n')
                if (customer) {
                    let enable_date = new Date(customer.enable_date).getTime();
                    let disable_date = new Date(customer.disable_date).getTime();
                    start_date = enable_date > start_date ? enable_date : start_date;
                    end_date = (disable_date != 0 && disable_date != null && end_date > disable_date) ? disable_date : end_date;
                }
            }

            let tableName = item.table.toLowerCase();
            let records = await db.sequelize.query(`SELECT value from ${tableName} where status=0 and timestamp >= :startDate AND timestamp <= :endDate`, {
                type: db.sequelize.QueryTypes.SELECT,
                replacements: { startDate: start_date, endDate: end_date }
            })
            let reading = module.exports.reading(records)
            let row = {};
            if (meter && customer) {
                if (reading.length) {
                    row = {
                        meter: meter,
                        floor: await space.getFloor(),
                        customer: customer,
                        reading: reading
                    }
                    data.push(row)
                }
            }
        }
        return data;
    }
    ,
    getMeterTables: async function (config_ids) {
        return await HistoryConfig.findAll({
            attributes: ['TABLE_NAME', 'ID'],
            raw: true,
            where: {
                ID: { [Op.in]: config_ids }
            }
        }).then(configs => configs.map(config => {
            return {
                table: config.TABLE_NAME,
                id: config.ID
            }
        }));
    }
    ,

    reading(records) {
        if (!records.length) {
            return [];
        }
        let obj = [];
        obj.push({ start_reading: records[0].value, end_reading: records[records.length - 1].value })
        let meter_reset = false;

        for (let i = 0; i < records.length; i++) {
            let reading = records[i].value;
            let prev_reading = records[i - 1]?.value
            // if meter is reset then next value will be >0 and <15
            if (reading < prev_reading && reading <= 15 && !meter_reset) {
                if (obj.length == 1) {
                    obj[0].end_reading = records[i - 1]?.value;
                }
                obj.push({ start_reading: 0, end_reading: 0 });
                meter_reset = true;
            } else if (meter_reset && reading < prev_reading && reading <= 15) {
                meter_reset = false;
                obj[obj.length - 1].end_reading = prev_reading;
            } else if (meter_reset && records.length - 1 == i) {
                meter_reset = false;
                obj[obj.length - 1].end_reading = reading;
            }
        }
        return obj;
    }
}

