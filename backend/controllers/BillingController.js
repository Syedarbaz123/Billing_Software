const db = require("../models");
const Billing = db.Billing;
const BillingDetails = db.BillingDetails;
const BillingResource = require('../resources/BillingResource')
const BillingCollection = require('../resources/collections/BillingCollection')
const Customer = db.Customer;
const Paging = require('../helpers/Paging')
const { Op } = require('sequelize')
const ResponseType = require('../enums/ResponseType')
const moment = require('moment');
const BillingDetailsResource = require("../resources/BillingDetailsResource");
const path = require('path');
const fs = require("fs");
const PDFDocument = require("pdfkit-table");
const ActivityLogController = require('../controllers/ActivityLogController.js');

module.exports = {
    async getNewId() {
        let id = 1;
        let limit = 1;
        let order = [
            ['BillingId', 'DESC']
        ];

        await Billing.findAll({
            order: order,
            limit,
        })
            .then(async data => {
                if (data[0] !== undefined)
                    id = BigInt(data[0].BillingId) + BigInt(1);
            });

        return id;
    },
    async getResolvedBillingDetails(BillingId, previewData, DocNo, RatePerTonHour) {
        //' do not generate bill if consumed =0
        const filteredBillingDetails = previewData.filter((data) => {
            return data && parseFloat(data.UnitsConsumedTonHour) > 0;
        });

        const billingDetailsConverted = filteredBillingDetails.map(async (billingDetail) => {
            return await BillingDetailsResource(BillingId, billingDetail, DocNo, RatePerTonHour);
        })

        const resolvedBillingDetailsConverted = await Promise.all(billingDetailsConverted); // Resolve the promises

        return resolvedBillingDetailsConverted;
    },

    async create(req, res) {
        let response = null;
        const { DocDate, DocNo, IssueDate, DueDate, fromDate, toDate, RatePerTonHour, previewData } = req.body;

        const id = await module.exports.getNewId();

        const resolvedBillingDetailsConverted = await module.exports.getResolvedBillingDetails(id, previewData, DocNo, RatePerTonHour);
        if (resolvedBillingDetailsConverted.length == 0) {
            // no need to save the bill if no customer has consumed anything
            console.error('Cannot create billing as no consumption made');
            return res.status(409).json({ 'message': 'Cannot create billing as no consumption made' });
        }

        const newBilling = {
            // fields for Billing table
            BillingId: id,
            DocDate: DocDate,
            DocNo: DocNo,
            IssueDate: IssueDate,
            DueDate: DueDate,
            fromDate: fromDate,
            toDate: toDate,
            RatePerTonHour: RatePerTonHour,
            BoardMsg: "",
            Remarks: "",
            headingText: "",
            TransUID: req.query.user_id,
        };

        let billing = {};
        try {

            db.sequelize.transaction((transaction) => {
                return Billing.create(newBilling, {
                    include: [{
                        model: BillingDetails,
                        as: 'billingDetails', // Specify the alias here
                    }],
                    transaction: transaction,
                })
                    .then(async (savedBilling) => {
                        billing = savedBilling;

                        // Access the saved billing ID
                        const billingId = BigInt(savedBilling.BillingId);

                        //logging data
                        await ActivityLogController.create(
                            'Create Billing',
                            'Bill id = ' + billingId + ' is created',
                            req.query.user_id
                        );
                        // Create an array of BillingDetails objects with the associated billingId
                        const billingDetails = resolvedBillingDetailsConverted.map((details) => {
                            return {
                                ...details,
                                BillingId: billingId,
                            };
                        });
                        // Save the billing details
                        return BillingDetails.bulkCreate(billingDetails, { transaction: transaction });
                    })
                    .then((savedBillingDetails) => {
                        console.log('Billing details saved:', savedBillingDetails);
                    });
            })
                .then(async () => {
                    // no need to send back billing
                    response = res.status(201).json({
                        message: 'Bill(s) generated successfully.',
                    });
                    return response;
                })
                .catch((error) => {
                    console.error('Error saving billing:', error);
                });


        } catch (error) {
            console.error('Some error occured:', error);
            return res.status(409).json({ 'message': 'Some error occured' });
        }
    },

    async billings(req, res) {
        let responseType = req.params.response_type;
        if (!responseType) {
            responseType = ResponseType.FULL;
        }
        if (responseType == ResponseType.PAGINATED) {
            const { size, currentPage, search, sortBy, orderBy } = req.query;
            const { limit, offset } = Paging.getPagination(currentPage, size);
            let condition = {
                [Op.or]: [
                    {
                        DocNo: {
                            [Op.like]: `%${search}%`
                        }
                    },
                ]
            }

            let order = [
                ['BillingId', 'DESC']
            ];
            if (sortBy) {
                order = [[sortBy, orderBy]]
            }
            await Billing.findAndCountAll({
                include: [{
                    model: BillingDetails,
                    as: 'billingDetails', // Specify the alias here
                    where: {
                        CID_web: { [Op.ne]: null }, // Add condition for CID_web directly in the include
                    },
                }],
                where: condition,
                order: order,
                limit,
                offset
            })
                .then(async data => {
                    const billings = await BillingCollection(data.rows);
                    const pagination = await Paging.getPagingData(data, currentPage, limit, search);
                    res.send({ billings, pagination });
                });
        } else if (responseType === ResponseType.FULL) {
            let condition = {};
            let order = [
                ['BillingId', 'DESC']
            ];

            let billings = await Billing.findAll({
                include: [{
                    model: BillingDetails,
                    as: 'billingDetails', // Specify the alias here
                    where: {
                        CID_web: { [Op.ne]: null }, // Add condition for CID_web directly in the include
                    },
                }],
                where: condition,
                order: order,
            });
            // no need to send full object with billing details as of now.
            //return res.status(200).json({billings: await BillingCollection(billings)})
            return res.status(200).json({ billings: await BillingCollection(billings) })
        }
    },

    async billing(req, res) {
        let response = null;
        const id = req.params.id;
        const billing = await Billing.findByPk(id);
        response = res.status(200).json({ billing: await BillingResource(billing) });
        return response;
    },
    async billingWithHistory(req, res) {
        let response = null;
        const id = req.params.id;
        const { CID_web, } = req.query;

        // params are sent as string
        if (id === 'null' || id.trim() === '') {
            return res.status(409).json({ 'message': 'Error fetching bill(s)' });
        }

        let combinedBillingWithHistory;

        try {
            const billing = await Billing.findByPk(id);
            let billingWithHistory_ = await BillingResource(billing);

            // filter billings if CID_web is not null
            if (CID_web != null && CID_web > 0) {

                const filteredBillingDetails = billingWithHistory_.billingDetails.filter(
                    billingDetail => billingDetail.CID_web == CID_web);

                //update billing details parent object
                billingWithHistory_.billingDetails = filteredBillingDetails;
            }

            // get last 15 billing details for each customer
            const billingDetailsWithHistory_ = await Promise.all(
                billingWithHistory_.billingDetails.map(async (billingDetail) => {
                    let order = [
                        ['BillingId', 'DESC']
                    ];

                    let billingDetailsHistory = await BillingDetails.findAll({
                        where: {
                            CID_web: billingDetail.CID_web,
                            BillingId:
                            {
                                [Op.ne]: id,
                            }
                        },
                        order: order,
                    })
                    // add DocNo to billingDetailsHistory from its parent
                    billingDetailsHistory = await Promise.all(
                        billingDetailsHistory.map(async (billingDetail) => {
                            // get billingDetail parent
                            const bill = await billingDetail.getBilling();
                            //console.log('\n\n bill',bill);
                            const DocNo = { DocNo: bill.DocNo };

                            // note that actual object properties are present in .dataValues object
                            return { ...billingDetail.dataValues, ...DocNo };
                        })
                    );
                    return { ...billingDetail, billingDetailsHistory };
                })
            );

            // remove billingsDetails object as details are already there in historyObject
            delete billingWithHistory_.billingDetails;

            combinedBillingWithHistory = { ...billingWithHistory_, billingDetailsWithHistory_ };

        } catch (error) {
            console.error('Error fetching bill(s):', error);
            return res.status(409).json({ 'message': 'Error fetching bill(s)' });
        }

        response = res.status(200).json({ billing: combinedBillingWithHistory });
        return response;
    },

    async update(req, res) {
        const id = req.params.id;
        const { DocDate, DocNo, IssueDate, DueDate, fromDate, toDate, RatePerTonHour, previewData, } = req.body;

        const order = [
            ['BillingId', 'DESC']
        ];


        // check if there are any billings created after this billing, then do not allow update
        const lastBilling = await BillingDetails.findAll({
            order: order,
            limit: 1,
        })
        if (lastBilling[0].BillingId > id) {
            // do not allow update
            return res.status(409).json({ 'message': 'Error updating: Bill(s) created after this bill' });
        }

        let billing = {
            BillingId: id,
            DocDate: DocDate,
            DocNo: DocNo,
            IssueDate: IssueDate,
            DueDate: DueDate,
            fromDate: fromDate,
            toDate: toDate,
            RatePerTonHour: RatePerTonHour,
            BoardMsg: "",
            Remarks: "",
            headingText: "",
            TransUID: req.query.user_id,
        }

        /////////// wrap all in transaction ////////////
        db.sequelize.transaction(async (transaction) => {

            //await billing.save()
            await Billing.update(billing,
                { where: { BillingId: id } },
                { transaction: transaction, }
            )

            //logging data
            await ActivityLogController.create(
                'Update Billing',
                'Bill id = ' + id + ' is updated',
                req.query.user_id
            );

            // delete billingDetails and create again
            await BillingDetails.destroy(
                { where: { BillingId: id } },
                { transaction: transaction, }
            );

            const resolvedBillingDetailsConverted = await module.exports.getResolvedBillingDetails(id, previewData, DocNo, RatePerTonHour);

            // Save the billing details
            await BillingDetails.bulkCreate(resolvedBillingDetailsConverted,
                { transaction: transaction }
            );
        })
            .then(async () => {
                // get updated record
                billing = await Billing.findByPk(id);

                // no need to send back billing
                response = res.status(201).json({
                    message: 'Bill(s) updated successfully.',
                });
                return response;
            })
            .catch((error) => {
                console.error('Error updating bill(s):', error);
                return res.status(409).json({ 'message': 'Error updating bill(s)' });
            });
    },

    async destroy(req, res) {
        const id = req.params.id;

        const order = [
            ['BillingId', 'DESC']
        ];

        let condition = {};

        // check if there are any billings created after this billing, then do not allow delete
        const lastBilling = await BillingDetails.findAll({
            where: condition,
            order: order,
            limit: 1,
        })

        if (lastBilling[0].BillingId > id) {
            // do not allow update
            return res.status(409).json({ 'message': 'Error deleting: Bill(s) created after this bill' });
        }

        try {
            // Delete associated BillingDetails first
            await BillingDetails.destroy({
                where: { BillingId: id }
            });

            // Delete the parent Billing record
            await Billing.destroy({
                where: { BillingId: id }
            });

            //logging data
            await ActivityLogController.create(
                'Delete Billing',
                'Bill id = ' + id + ' is deleted',
                req.query.user_id
            );

        } catch (error) {
            console.error('Error deleting records:', error);
            return res.status(409).json({ 'message': 'Some error occured' });
        }

        return res.status(200).json({ message: 'Billing deleted successfully.' });
    },

    async getPreviewData(req, res) {
        let response = null;
        let { fromDate, toDate, id } = req.query;
        let customers = [];
        let returnData = [];
        console.log(fromDate, toDate)

        if (fromDate == undefined || toDate == undefined)
            return res.status(404).json({ error: 'Invalid from/to Date' });

        fromDate = fromDate.replace(/"/g, ''); // remove "" quotes from string
        toDate = toDate.replace(/"/g, ''); // remove "" quotes from string

        // get customer list where status = true and meter status=true
        const query = `Select cs.* from customer_web as cs where cs.status=1 and cs.SpID in 
        (Select s.id from spaces as s where s.meter_id in (Select m.id from meters as m where m.status=1))
        order by cs.CId`

        try {

            customers = await db.sequelize.query(query, {
                type: db.sequelize.QueryTypes.SELECT
            });
        } catch (error) {
            // Handle the error
            console.log('Error executing the query:', error);
            response = res.status(404).json({ error: error });
            return response;
        }



        returnData = await Promise.all(
            customers.map(async (customer) => {
                let billingDetails;
                let PreviousReadingTonHour = 0;
                let CurrentReadingTonHour = 0;
                let UnitsConsumedTonHour = 0;

                // check if there exist previous bill of this customer
                try {
                    const order = [
                        ['ToDate', 'DESC']
                    ];

                    let condition = {
                        CID_web: customer.CId,
                    };
                    // check if billingId is there, then get reading details from there.
                    if (id >= 0) {
                        condition = Object.assign(
                            condition, {
                            BillingId: id,
                        });
                    } else {
                        condition = Object.assign(
                            {
                                fromDate: fromDate,
                                toDate: toDate
                            }, condition);
                    }

                    // get last billing details
                    billingDetails = await BillingDetails.findOne({
                        where: condition,
                        // order: order,
                    })

                    let fromTotalValue = 0;
                    let toTotalValue = 0;
                    ////////////////////////// from total value ////////////////////
                    try {
                        await db.sequelize.query('EXEC proc_getFromTotalValue @Cid = :CId, @fromDate = :fromDate, @toDate = :toDate',
                            {
                                replacements: {
                                    CId: customer.CId,
                                    fromDate: moment(fromDate).startOf('day').format('YYYY-MM-DD HH:mm:ss'), // + ' 00:00',
                                    toDate: moment(toDate).endOf('day').format('YYYY-MM-DD HH:mm:ss'), // + ' 23:59:59',
                                },
                                type: db.sequelize.QueryTypes.RAW,
                            },
                        ).then(spResult => {
                            // note: stored procedure returns result as [ [], 3]
                            // where first item is an array or results
                            let data = spResult[0];

                            // if no data found as per criteria then return 0
                            if (data.length > 0) {
                                fromTotalValue = data[0].fromTotalValue;
                            }

                        });
                    } catch (error) {
                        console.error('Error calling stored procedure:', error);
                    }

                    // if there is any previous billing, then previous reading will not be zero.
                    // if zero it means no previous billing, get previous reading from sp result
                    if (PreviousReadingTonHour == 0)
                        PreviousReadingTonHour = fromTotalValue;
                    ////////////////////////// to total value ////////////////////
                    try {
                        await db.sequelize.query('EXEC proc_getToTotalValue @Cid = :CId, @fromDate = :fromDate, @toDate = :toDate',
                            {
                                replacements: {
                                    CId: customer.CId,
                                    fromDate: moment(fromDate).startOf('day').format('YYYY-MM-DD HH:mm:ss'), // + ' 00:00',
                                    toDate: moment(toDate).endOf('day').format('YYYY-MM-DD HH:mm:ss'), // + ' 23:59:59',
                                },
                                type: db.sequelize.QueryTypes.RAW,
                            },
                        ).then(spResult => {
                            // note: stored procedure returns result as [ [], 3]
                            // where first item is an array or results
                            let data = spResult[0];
                            // if no data found as per criteria then return 0
                            if (data.length > 0) {
                                toTotalValue = data[0].toTotalValue;
                            }

                        });
                    } catch (error) {
                        console.error('Error calling stored procedure:', error);
                    }
                    // set current reading 
                    if (toTotalValue != 0) {
                        CurrentReadingTonHour = toTotalValue;
                    }
                } catch (error) {
                    console.error('\nSome error occured', error);
                    return res.status(404).json({ error: error });
                }

                UnitsConsumedTonHour = CurrentReadingTonHour - PreviousReadingTonHour;

                if (billingDetails == null) {
                    billingDetails = {
                        RowNo: '',
                        BillingId: 0,
                        CID_web: customer.CId,
                        CName: customer.CName,
                        Code: customer.Code,
                        claimedPer: customer.claimedPer,
                        OtherChargesText: "",
                        OtherCharges: "",
                        ArrearsText: "",
                        Arrears: "",
                        ServiceChargesText: "",
                        ServiceCharges: "",
                        AdditionalChargesText: "",
                        AdditionalCharges: "",
                        CodeName: customer.Code + ' - ' + customer.CName,
                    }
                }
                // complete 1st customer
                const data = {
                    CId: customer.CId,
                    CName: customer.CName,
                    Code: customer.Code,
                    fromDate: fromDate,
                    toDate: toDate,
                    PreviousReadingTonHour: Math.round(PreviousReadingTonHour),
                    CurrentReadingTonHour: Math.round(CurrentReadingTonHour),
                    UnitsConsumedTonHour: Math.round(UnitsConsumedTonHour),
                    details: billingDetails,
                }
                return data;
            })
        )
        return res.status(200).json({ previewData: returnData });
    },

    async getNewBillingDetails(req, res) {
        // get customer list and return empty billing details object
        let condition = {
            status: true,
        };
        let order = [
            ['Code', 'ASC']
        ];

        let customers = await Customer.findAll({
            where: condition,
            order: order,
        });

        const billingDetails = customers.map((customer, index) => {
            const data = {
                RowNo: index,
                BillingId: 0,
                CID_web: customer.CId,
                CName: customer.CName,
                Code: customer.Code,
                claimedPer: customer.claimedPer,
                OtherChargesText: "",
                OtherCharges: "",
                ArrearsText: "",
                Arrears: "",
                ServiceChargesText: "",
                ServiceCharges: "",
                AdditionalChargesText: "",
                AdditionalCharges: "",
                CodeName: customer.Code + ' - ' + customer.CName,
            };

            return data;
        });

        return res.status(200).json({ billingDetails: billingDetails })

    },

    async getNewBillingMonthDetails(req, res) {
        let response = null;
        let dtBillingMonth = moment().startOf('M') //.utcOffset(0); //.format('YYYY-MM-DD HH:mm:ss')

        const issueDateThreshold = 4;
        const dueDateThreshold = 14;

        // default values
        let DocNo = moment(dtBillingMonth).format('MMM-YYYY');
        let IssueDate = moment(dtBillingMonth).add(1, 'M').add(issueDateThreshold, 'd').format('YYYY-MM-DD');
        let DueDate = moment(dtBillingMonth).add(1, 'M').add(dueDateThreshold, 'd').format('YYYY-MM-DD');

        // from value take from previous toDate value. if not present then previous month 1st day
        let fromDate = moment(dtBillingMonth).subtract(1, 'M').startOf('month').format('YYYY-MM-DD');
        //let toDate = moment(fromDate).endOf('M').format('YYYY-MM-DD');
        let fromDateDisabled = false;

        const order = [
            ['BillingId', 'DESC']
        ];

        try {
            // get last billing month
            await Billing.findAll({
                order: order,
                limit: 1,
            }).then(async data => {
                // first record only
                let lastBilling = data[0];
                lastBilling = await BillingResource(lastBilling);
                dtBillingMonth = moment(lastBilling.DocDate).add(1, 'M').startOf('month').format('YYYY-MM-DD');

                // doc-name as MMM-YYYY
                DocNo = moment(dtBillingMonth).format('MMM-YYYY');
                IssueDate = moment(dtBillingMonth).add(1, 'M').add(issueDateThreshold, 'd').format('YYYY-MM-DD');
                DueDate = moment(dtBillingMonth).add(1, 'M').add(dueDateThreshold, 'd').format('YYYY-MM-DD');

                // from value take from previous toDate value. if not present then previous month 1st day
                fromDate = moment(lastBilling.toDate).add(1, 'd').format('YYYY-MM-DD');
                fromDateDisabled = true;
            })
        } catch (error) {
            console.error('\nSome error occured', error);
            response = res.status(404).json({ error: error });
            return response;
        }
        const returnData = {
            DocDate: dtBillingMonth,
            DocNo: DocNo,
            IssueDate: IssueDate,
            DueDate: DueDate,
            fromDate: fromDate,
            toDate: moment(fromDate).endOf('M').format('YYYY-MM-DD'),
            fromDateDisabled,
        };
        response = res.status(200).json(returnData);
        return response;
    },

    async generateBillPdf(req, res) {

        let { billing_id, customer_id } = req.query;
        console.log(`billing id ${billing_id}`);
        console.log(`customer id ${customer_id}`);

        let billing = await Billing.findByPk(billing_id);
        billing = await BillingResource(billing)

        let order = [
            ['BillingId', 'DESC']
        ];

        let billingHistory = await BillingDetails.findAll({
            where: {
                CID_web: customer_id,
                BillingId:
                {
                    [Op.ne]: billing_id,

                },
                RowNo:
                {
                    [Op.lt]: billing.billingDetails[0].RowNo
                }
            },
            order: order,
            limit: 12,
        })

        billingHistory = await Promise.all(
            billingHistory.map(async (billingDetail) => {
                return { ...billingDetail.dataValues };
            })
        );

        const billingDetails = billing.billingDetails.filter(billingDetail => billingDetail.CID_web == customer_id);
        billing.billingDetails = billingDetails;

        if (!fs.existsSync(`./public/files/${billing.DocNo.split('-')[1]}/${billing.DocNo.split('-')[0]}`)) {
            fs.mkdirSync(`./public/files/${billing.DocNo.split('-')[1]}/${billing.DocNo.split('-')[0]}`, { recursive: true });
        }

        var doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(`./public/files/${billing.DocNo.split('-')[1]}/${billing.DocNo.split('-')[0]}/${billing.billingDetails[0].CodeName}.pdf`));

        const backgroundColor = '#d9d9d9';
        const textColor = '#333333';

        doc.rect(0, 0, doc.page.width, 100).fill(backgroundColor);
        doc.fillColor(textColor);

        const companyInfoX = 30;
        const companyInfoY = 20;

        doc.fontSize(16)
            .font('Helvetica-Bold')
            .text('JS Lands (Private) Limited', companyInfoX, companyInfoY);

        doc.fontSize(10)
            .font('Helvetica')
            .text('The Centre, Plot No. 28, S5,\nAbdullah Haroon Road,\nSaddar, Karachi-75400,\nPakistan', companyInfoX, companyInfoY + 20);

        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Powered By Digilabs.Co', 20, 20, {
                align: 'right',

            })
            .text('UAN: +92 21 111 574 111', 20, 35, {
                align: 'right',
            });


        var xPos = doc.page.width * 0.4;
        var yPos = 70;

        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('Bill Reference:', xPos + 20, yPos)
            .moveUp()
            .text('Issue Date:', xPos + 130, yPos)
            .moveUp()
            .text('Billing Month:', xPos + 220, yPos);

        yPos += 15;

        doc.font('Helvetica').fontSize(10);
        doc.text(billing?.billingDetails[0].BillNo, xPos + 20, yPos, { align: 'left' })
            .moveUp()
            .text(billing?.IssueDate, xPos + 130, yPos, { align: 'left' })
            .moveUp()
            .text(billing?.DocNo, xPos + 220, yPos, { align: 'left' });

        doc.moveTo(xPos + 10, yPos - 20)
            .lineTo(560, yPos - 20)
            .strokeColor('black')
            .lineWidth(1)
            .stroke();

        doc.rect(30, 130, 210, 85).stroke()
        const leftBlockX = 35;
        const rightBlockX = 35;
        const initialY = 140;
        const finalY = 260;
        const lineHeight = 20;
        const lineLength = 200;
        const valueOffset = 50;

        doc.fontSize(10).font('Helvetica');
        doc.text('Customer: ', leftBlockX, initialY);
        doc.text('Floor: ', leftBlockX, initialY + lineHeight);
        doc.text('Space: ', leftBlockX, initialY + lineHeight * 2);
        doc.text('Meter: ', leftBlockX, initialY + lineHeight * 3);
        doc.fontSize(10).font('Helvetica-Bold');

        doc.text(billing.billingDetails[0].CName, leftBlockX + valueOffset, initialY);
        doc.text(await billing.billingDetails[0].customer.space.floor.name, leftBlockX + valueOffset, initialY + lineHeight);
        doc.text(await billing.billingDetails[0].customer.space.name, leftBlockX + valueOffset, initialY + lineHeight * 2);
        doc.text(await billing.billingDetails[0].customer.space.meter.name, leftBlockX + valueOffset, initialY + lineHeight * 3);
        doc.moveTo(leftBlockX, initialY + 15)
            .lineTo(leftBlockX + lineLength, initialY + 15)
            .moveTo(leftBlockX, initialY + lineHeight + 15)
            .lineTo(leftBlockX + lineLength, initialY + lineHeight + 15)
            .moveTo(leftBlockX, initialY + 2 * lineHeight + 15)
            .lineTo(leftBlockX + lineLength, initialY + 2 * lineHeight + 15)
            .stroke();

        const blockPadding = 5;
        const boxWidth = lineLength + blockPadding * 2;
        const boxHeight = lineHeight * 2 + blockPadding * 4;

        doc.rect(rightBlockX - blockPadding, finalY, boxWidth, boxHeight)
            .fillOpacity(1)
            .fill('yellow')
            .fillOpacity(1);

        doc.fontSize(12).font('Helvetica');
        doc.fillColor('black')
            .text('Payable Amount', rightBlockX + boxWidth * 0.26, finalY + 10)
            .fontSize(20).font('Helvetica-Bold')
            .text(billing.billingDetails[0].TotalPayableAmount, rightBlockX + boxWidth * 0.25, finalY + lineHeight + 10);

        doc.rect(rightBlockX - blockPadding, finalY + 80, boxWidth, boxHeight)
            .fillOpacity(0.6)
            .fill('blue')
            .fillOpacity(1);

        doc.fontSize(14).font('Helvetica');
        doc.fillColor('white')
            .text('Due Date', rightBlockX + boxWidth * 0.34, finalY + 90 + blockPadding)
            .fontSize(20).font('Helvetica-Bold')
            .text(billing.DueDate, rightBlockX + boxWidth * 0.20, finalY + 90 + lineHeight + blockPadding);


        var yPos = 110;
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('Billing History', 270, yPos, { align: 'center' });

        doc.rect(260, yPos + 20, 310, 20).fillAndStroke('#000000', '#FFFFFF');

        doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#FFFFFF')
            .text('Billing Month', 270, yPos + 25, { continued: true })
            .text('Units (Kilo Watt-Hour)', 290, yPos + 25, { continued: true })
            .text('Billing Amount', 320, yPos + 25);

        doc.fillColor('#000000');

        let rowYPos = yPos + 45;

        await Promise.all(
            billingHistory.map(async (item, index) => {

                if (index % 2 === 0) {
                    doc.rect(260, rowYPos, 310, 20).fillAndStroke('#D3D3D3', '#000000');
                } else {
                    doc.strokeColor('#000000').rect(260, rowYPos, 310, 20).stroke();
                }

                doc.fillColor('#000000');
                doc.fontSize(10)
                    .font('Helvetica')
                    .text(item.BillNo.split('-')[2] + '-' + item.BillNo.split('-')[3], 270, rowYPos + 5, { width: 140, align: 'left' })
                    .text(item.UnitsConsumedTonHour, 290, rowYPos + 5, { width: 140, align: 'right' })
                    .text(item.TotalPayableAmount, 410, rowYPos + 5, { width: 140, align: 'right' });
                rowYPos += 20;
            })
        );

        var yPos = 400;
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('Electrical Energy Consumption', 70, yPos + 20, { align: 'center' });

        doc.rect(50, yPos + 40, 500, 240).stroke();
        doc.fontSize(10)
            .font('Helvetica')
            .text('Energy Consumed', 80, yPos + 65);
        doc.fontSize(10)
            .font('Helvetica')
            .rect(80, yPos + 80, 220, 20).stroke()
            .font('Helvetica-Bold')
            .text('Previous Reading', 90, yPos + 85)
            .rect(300, yPos + 80, 220, 20).stroke()
            .text('Current Reading', 310, yPos + 85);

        doc.fontSize(10)
            .font('Helvetica')
            .text(billing.fromDate, 90, yPos + 105)
            .text(billing.billingDetails[0].PreviousReadingTonHour, 200, yPos + 105)
            .text('KW-Hour', 240, yPos + 105)
            .text(billing.toDate, 310, yPos + 105)
            .text(billing.billingDetails[0].CurrentReadingTonHour, 420, yPos + 105)
            .text('KW-Hour', 460, yPos + 105);

        doc.fontSize(10)
            .text('Your Energy Charges for the Period', 80, yPos + 135);

        doc.fontSize(10)
            .rect(80, yPos + 150, 120, 15).stroke()
            .text('Units(Kilo Watt-Hour)', 90, yPos + 152)
            .rect(200, yPos + 150, 100, 15).stroke()
            .text('Rate/Unit', 210, yPos + 152)
            .rect(300, yPos + 150, 220, 15).stroke()
            .text('Amount', 310, yPos + 152);

        doc.fontSize(10)
            .text(billing.billingDetails[0].UnitsConsumedTonHour, 100, yPos + 170, { width: 90, align: 'right' })
            .text(billing.RatePerTonHour, 200, yPos + 170, { width: 90, align: 'right' })
            .font('Helvetica-Bold')
            .text(billing.billingDetails[0].Amount, 385, yPos + 170, { width: 130, align: 'right' });

        doc.fontSize(10).font('Helvetica')
            .text('Other Charges', 90, yPos + 190)
            .rect(300, yPos + 185, 220, 15).stroke()
            .text(billing.billingDetails[0].OtherCharges, 385, yPos + 190, { width: 130, align: 'right' });

        doc.fontSize(10)
            .text('Arrears', 90, yPos + 210)
            .rect(300, yPos + 205, 220, 15).stroke()
            .text(billing.billingDetails[0].Arrears, 385, yPos + 210, { width: 130, align: 'right' });

        doc.fontSize(10)
            .text('Service Charges', 90, yPos + 230)
            .rect(300, yPos + 225, 220, 15).stroke()
            .text(billing.billingDetails[0].ServiceCharges, 385, yPos + 230, { width: 130, align: 'right' });

        doc.fontSize(10)
            .font('Helvetica-Bold')
            .text('Total Payable Amount', 90, yPos + 250);

        doc.fontSize(10)
            .font('Helvetica')
            .rect(300, yPos + 245, 220, 20).stroke().font('Helvetica-Bold')
            .text(billing.billingDetails[0].TotalPayableAmount, 385, yPos + 250, { width: 130, align: 'right' });

        let footerTop = yPos + 305;
        doc.fontSize(10)
            .text('Prepared By', 70, footerTop)
            .text('Checked By', 320, footerTop);

        doc.moveTo(130, footerTop + 15)
            .lineTo(280, footerTop + 15)
            .stroke();
        doc.moveTo(380, footerTop + 15)
            .lineTo(530, footerTop + 15)
            .stroke();

        doc.end();

        return res.status(200).json({ message: "Bill pdf exported successfully" });
    }
}