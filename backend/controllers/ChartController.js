const db = require("../models");
const Meter = db.Meter;
const { Op } = require('sequelize')
const func = require('../middleware/permissions/CommonFunc')
const moment = require('moment');

const getMeters = async (meter_ids) => {
    let allMeters = false;
    if (Array.isArray(meter_ids) && meter_ids.length > 0) {
        // check if there is -1 in meter_ids array. it means return all meters
        meter_ids.map(item => {
            if (item == -1)
                allMeters = true;
        })
    }

    // this is to check for empty meter_ids.
    // if (!(Array.isArray(meter_ids) && meter_ids.length > 0 && meter_ids.every(item => Number.isInteger(Number(item))))) {
    //     //console.log('Variable is not a non-empty array of integers.');
    //     meter_ids = [-1];
    // }

    let meter_tables = [];
    try {
        let query;
        if (allMeters) {
            query = `Select m.name, m.id, h.TABLE_NAME
            , m.history_config_id from meters as m inner join HISTORY_CONFIG as h on h.ID = m.history_config_id
            where m.status = 1 `

        } else {
            query = `Select m.name, m.id, h.TABLE_NAME
            , m.history_config_id from meters as m inner join HISTORY_CONFIG as h on h.ID = m.history_config_id
            where m.status = 1 and m.id = ${meter_ids}`
        }

        meter_tables = await db.sequelize.query(query, {
            type: db.sequelize.QueryTypes.SELECT
        });
        console.log(meter_tables)
    } catch (error) {
        // Handle the error
        console.log('Error executing the query:', error);
    }

    return meter_tables;
};

module.exports = {
    async runTotalizer(req, res) {

        let spResult;

        try {
            spResult = await db.sequelize.query('exec TotalizeAllTables', {
                type: db.sequelize.QueryTypes.RAW,
            },
            ).then(spResult => {
                // Process the result of the stored procedure call
                //console.log("spResult inner",spResult);

                return spResult;
            })
        } catch (error) {
            // Handle the error
            console.log('Error executing the query:', error);
            spResult = error;
        }

        //console.log("spResult",spResult);
        return res.status(200).json({ 'result': spResult });

    },

    //////////////////////////// Comparison Chart //////////
    async comparisonChartData(req, res) {

        let { mon, yr, totalMonths, isMBTU, } = req.query;

        // get month-yr as param and filter records
        //console.log('mon', mon, 'yr ',yr);

        // check if yr and mon are integers
        if (isNaN(mon)) {
            //console.log('Variable is not a valid integer.');
            mon = new Date().getMonth();
        }

        if (isNaN(yr)) {
            //console.log('Variable is not a valid integer.');
            yr = new Date().getFullYear();
        }

        //console.log('new ... mon', mon, 'yr ',yr);

        //const dt = new Date(yr,mon,1);
        //const dt= moment().set({'year': yr, 'month': mon, 'day':1});

        // get current month end               
        const dt = new Date(
            moment().utc().endOf("month").endOf('day')
        );

        // console.log('\n\n current date', dt);

        //const prevDt = new Date(dt.getFullYear(), dt.getMonth() - 1, 1);
        //const prevDt = new Date(dt.getTime()); // Create a copy of the input date
        // const prevDt= new Date(
        //     moment(dt).utc().subtract(1,'month').set('date', 1)
        //     .set('hour', 00)
        //     .set('minute', 00)
        //     .set('second', 00)
        //     .set('millisecond', 000)
        // );

        const prevDt = new Date(
            moment(dt).utc().subtract(1, 'month').startOf('month').startOf('day')
        )

        // console.log('previous date',prevDt);


        //console.log("date.........",func.formatDate(dt));
        //console.log("prev date.........",func.formatDate(prevDt));
        //console.log("isMBTU......",isMBTU);

        const tonFactor = isMBTU == true ? 1 : func.tonFactor();

        let meter_tables = [];
        try {
            meter_tables = await db.sequelize.query(`Select m.name, m.id, h.TABLE_NAME, flr.name as floorName
            , h.id as history_config_id 
            from meters as m inner join HISTORY_CONFIG as h on h.ID = m.history_config_id
            inner join floors_web as flr on flr.id = m.floor_id
            where m.status = 1`, {
                type: db.sequelize.QueryTypes.SELECT
            });
        } catch (error) {
            // Handle the error
            console.log('Error executing the query:', error);
        }

        //--CAST(TIMESTAMP AS DATE) as DateValue, 
        const chartData = await Promise.all(
            meter_tables.map(async item => {

                let data = [];
                let spResult;
                try {
                    // data = await db.sequelize.query(`select year(timestamp) as yr ,month(timestamp) as mon
                    //     , max(TotalValue) as maxValue, min(TotalValue) as minValue 
                    //     , max(TotalValue) - min(TotalValue) as consumedUnits from ${item.TABLE_NAME}
                    //     where CAST(TIMESTAMP AS DATE) between '${func.formatDate(prevDt)} 00:00' and '${func.formatDate(dt)} 23:59:59'
                    //     group by year(timestamp),month(timestamp)`, {
                    //             type: db.sequelize.QueryTypes.SELECT
                    // });
                    spResult = await db.sequelize.query('EXEC proc_getMonthlyConsumption @HistoryTableID = :HistoryTableID, @fromDate = :fromDate, @toDate = :toDate', {
                        replacements: {
                            HistoryTableID: item.history_config_id,
                            fromDate: moment(prevDt).utc().format('YYYY-MM-DD HH:mm:ss'),
                            toDate: moment(dt).utc().format('YYYY-MM-DD HH:mm:ss'),
                        },
                        type: db.sequelize.QueryTypes.RAW,
                    },
                    ).then(spResult => {
                        // Process the result of the stored procedure call
                        //console.log("stored procedure result............",spResult);

                        // note: stored procedure returns result as [ [], 3]
                        // where first item is an array or results
                        let data = spResult[0];

                        // console.log("\n\n server data........", data);

                        // if no data found as per criteria then return 0
                        if (data.length == 0) {
                            data = [
                                {
                                    yr: prevDt.getFullYear(),
                                    mon: prevDt.getMonth(),
                                    maxValue: 0,
                                    minValue: 0,
                                    consumedUnits: 0,
                                },
                                {
                                    yr: dt.getFullYear(),
                                    mon: dt.getMonth(),
                                    maxValue: 0,
                                    minValue: 0,
                                    consumedUnits: 0,
                                },
                            ]
                        }
                        // console.log("\n\n server data........", data);
                        // if we get only one record then add one more and complete the set
                        if (data.length == 1) {
                            const newRow = {
                                yr: dt.getFullYear(),
                                mon: dt.getMonth(),
                                maxValue: 0,
                                minValue: 0,
                                consumedUnits: 0,
                            }
                            data.push(newRow);

                        }

                        let result = data.map(row => {
                            return {
                                ...row,
                                meter_name: item.name,
                                table_name: item.TABLE_NAME,
                                floor_name: item.floorName,
                                tonFactor: tonFactor,
                            };
                        })

                        //console.log("result........", result);
                        return result;
                    })

                    return spResult;

                } catch (error) {
                    // Handle the error
                    console.log('Error executing the query:', error);
                }

            })
        );

        //console.log("Chart data.....",chartData);
        // if (chartData == null){
        return res.status(200).json({ 'chartData': chartData })
        // }

        //     if (data.length == 0){
        //         data = [
        //         {
        //             yr: prevDt.getFullYear(),
        //             mon: prevDt.getMonth(),
        //             maxValue: 0,
        //             minValue: 0,
        //             consumedUnits: 0,
        //         },
        //         {
        //             yr: dt.getFullYear(),
        //             mon: dt.getMonth(),
        //             maxValue: 0,
        //             minValue: 0,
        //             consumedUnits: 0,
        //         },
        //         ]
        //     }
        //     //console.log("server data........", data);
        //     let result = data.map(row => {
        //         return { ...row, 
        //             meter_name: item.name,
        //             table_name: item.TABLE_NAME,
        //             floor_name: item.floorName,
        //             tonFactor: tonFactor,
        //         };
        //     })
        //     //console.log("result........", result);
        //     return result;
        //     })
        // );

        //  //console.log("Chart data.....",chartData);
        // // if (chartData == null){
        //     return res.status(200).json({'chartData': chartData})
        // // }
    },


    /////////// Monthly consumption ////////////////////
    /////////////////////////////////
    async consumptionMonthsChartData(req, res) {

        let { startDate, endDate, isMBTU, meter_ids, } = req.query;

        //console.log("\n\n meter_ids.............",req.query);

        if (meter_ids === undefined) {
            return res.status(409).json({ 'message': 'No meter(s) selected' });
        }

        // startDate = new Date(startDate);
        // endDate = new Date(endDate);

        //console.log("\n\n\n startDate....", startDate, "\n end date.....",endDate);

        let meter_tables = await getMeters(meter_ids);
        const tonFactor = isMBTU == true ? 1 : func.tonFactor();
        //console.log("\n\nTon factor", isMBTU);

        //--CAST(TIMESTAMP AS DATE) as DateValue, 
        const chartData = await Promise.all(
            meter_tables.map(async item => {

                //console.log("\n\n item.....", item);

                // proper string conversion
                //startDate = func.dateStringCorrection(startDate);
                //endDate = func.dateStringCorrection(endDate);

                // check if dates are properly passed
                let newStartDate = startDate.replace(/"/g, ''); // remove "" quotes from string
                // console.log("old date" , startDate,"\nnew start date check",newStartDate);

                if (isNaN(new Date(newStartDate))) {
                    //console.log("Invalid date");
                    // set to start of current month
                    const mon = new Date().getMonth();
                    const yr = new Date().getFullYear();
                    newStartDate = new Date(yr, mon, 1);
                }

                let newEndDate = endDate.replace(/"/g, ''); // remove "" quotes from string

                // console.log("old date" , endDate,"\nnew end date check",newEndDate);

                if (isNaN(new Date(newEndDate))) {
                    // todays date
                    newEndDate = new Date();
                }

                //console.log("\n\n\n 3..... new startDate....", newStartDate, "\n end date.....",newEndDate);
                // Output: Sun Apr 30 2023 22:00:00 GMT+0300 (Eastern European Summer Time)

                let spResult = {};
                try {
                    // note that line graph should be made from 1st minValue to last MaxValue
                    spResult = await db.sequelize.query('EXEC proc_getLineGraph @HistoryTableID = :HistoryTableID, @fromDate = :fromDate, @toDate = :toDate', {
                        replacements: {
                            HistoryTableID: item.history_config_id,
                            fromDate: newStartDate,
                            toDate: newEndDate,
                        },
                        type: db.sequelize.QueryTypes.RAW,
                    },
                    ).then(spResult => {
                        // Process the result of the stored procedure call
                        //console.log("stored procedure result............",spResult);

                        // note: stored procedure returns result as [ [], 3]
                        // where first item is an array or results
                        let data = spResult[0];

                        // if no data found as per criteria then return 0
                        if (data.length == 0) {
                            data = [
                                {
                                    DateValue: newStartDate,
                                    Value: 0,
                                },
                                {
                                    DateValue: newEndDate,
                                    Value: 0,
                                },
                            ]
                        }
                        //console.log("server data........", data);
                        // get max and min values
                        // first record will be min value and last record will be max value
                        const minValue = data[0].MinValue;
                        const maxValue = data[data.length - 1].MaxValue;
                        const consumedUnits = maxValue - minValue;

                        // note that line graph should be made from 1st minValue to last MaxValue

                        let first = true;
                        let result = data.map(row => {
                            // only first value will be min value
                            const value = (first == true) ? row.MinValue : row.MaxValue;
                            first = false;

                            return {
                                ...row,
                                meter_name: item.name,
                                table_name: item.TABLE_NAME,
                                tonFactor: tonFactor,
                                maxValue: maxValue,
                                minValue: minValue,
                                consumedUnits: row.MaxValue - row.MinValue,
                                dayMaxValue: value, //row.Value,
                                startDate: newStartDate,
                                endDate: newEndDate,
                                isMBTU: isMBTU,
                                meter_id: item.id,
                            };
                        })
                        //console.log("result........", result);
                        return result;
                    });


                } catch (error) {
                    console.error('Error calling stored procedure:', error);
                }


                return spResult;
            })
        );
        console.log('chartData', chartData)
        ////////////////////////////////////////
        // method is used to flatten the nested arrays into a single array


        // Flatten the data using .reduce()
        // const flattenedData = spResult.reduce((accumulator, innerArray) => {
        //     return accumulator.concat(innerArray);
        // }, []);                    

        // Flatten the data using .flat()
        const flattenedData = chartData.flat();

        //////////////////////////////////////////////
        //console.log("flattenedData .....",flattenedData);

        //console.log("Chart data.....",chartData);
        // if (chartData == null){
        return res.status(200).json({ 'chartData': flattenedData })
        // }
    },


    ///////////////////// DAy wise ///////////////////
    async consumptionDaywiseChartData(req, res) {

        let { startDate, endDate, isMBTU, meter_ids, } = req.query;

        //console.log("\n\n meter_ids.............",req.query);

        if (meter_ids === undefined) {
            return res.status(409).json({ 'message': 'No meter(s) selected' });
        }

        // startDate = new Date(startDate);
        // endDate = new Date(endDate);

        //console.log("\n\n\n startDate....", startDate, "\n end date.....",endDate);
        let meter_tables = await getMeters(meter_ids);

        const tonFactor = isMBTU == true ? 1 : func.tonFactor();
        //console.log("\n\nTon factor", isMBTU);

        //--CAST(TIMESTAMP AS DATE) as DateValue, 
        const chartData = await Promise.all(
            meter_tables.map(async item => {

                //console.log("\n\n item.....", item);

                // proper string conversion
                //startDate = func.dateStringCorrection(startDate);
                //endDate = func.dateStringCorrection(endDate);

                // check if dates are properly passed
                let newStartDate = startDate.replace(/"/g, ''); // remove "" quotes from string

                if (isNaN(new Date(newStartDate))) {
                    //console.log("Invalid date");
                    // set to start of current month
                    const mon = new Date().getMonth();
                    const yr = new Date().getFullYear();
                    newStartDate = new Date(yr, mon, 1);
                }

                let newEndDate = endDate.replace(/"/g, ''); // remove "" quotes from string

                //console.log("\nnew end date check",newEndDate);

                if (isNaN(new Date(newEndDate))) {
                    // todays date
                    newEndDate = new Date();
                }

                //console.log("\n\n\n 3..... new startDate....", newStartDate, "\n end date.....",newEndDate);
                // Output: Sun Apr 30 2023 22:00:00 GMT+0300 (Eastern European Summer Time)

                let spResult = {};
                try {
                    spResult = await db.sequelize.query('EXEC proc_getDayGraph @HistoryTableID = :HistoryTableID, @fromDate = :fromDate, @toDate = :toDate, @isMBTU = :isMBTU', {
                        replacements: {
                            HistoryTableID: item.history_config_id,
                            fromDate: newStartDate,
                            toDate: newEndDate,
                            isMBTU,
                        },
                        type: db.sequelize.QueryTypes.RAW,
                    },
                    ).then(async spResult => {
                        // Process the result of the stored procedure call
                        //console.log("stored procedure result............",spResult);

                        // note: stored procedure returns result as [ [], 3]
                        // where first item is an array or results
                        let data = spResult[0];

                        // if no data found as per criteria then return 0
                        if (data.length == 0) {
                            data = [
                                {
                                    DateValue: newStartDate,
                                    Value: 0,
                                    MinValue: 0,
                                    MaxValue: 0,
                                },
                                {
                                    DateValue: newEndDate,
                                    Value: 0,
                                    MinValue: 0,
                                    MaxValue: 0,
                                },
                            ]
                        }
                        //round all values
                        // const roundedData = data.map(item => ({
                        //     DateValue: item.DateValue,
                        //     Value: Math.round(item.MaxValue) - Math.round(item.MinValue), //Math.round(item.Value),
                        //     MinValue: Math.round(item.MinValue),
                        //     MaxValue: Math.round(item.MaxValue),
                        // }));
                        const roundedData = data;

                        //console.log("server data........", data);
                        // get max and min values
                        let minAllValues = 0;
                        let maxAllValues = 0;

                        try {
                            const spMinMax = await db.sequelize.query('EXEC proc_getMinMaxValue @HistoryTableID = :HistoryTableID, @fromDate = :fromDate, @toDate = :toDate', {
                                replacements: {
                                    HistoryTableID: item.history_config_id,
                                    fromDate: newStartDate,
                                    toDate: newEndDate,
                                },
                                type: db.sequelize.QueryTypes.RAW,
                            },
                            ).then(spResult => {
                                let data = spResult[0];

                                console.log("data....", data);

                                // if no data found as per criteria then return 0
                                if (data.length > 0) {
                                    // there will be only one result
                                    minAllValues = Math.round(data[0].minValue);
                                    maxAllValues = Math.round(data[0].maxValue);
                                }
                                //console.log("\n\nbefore.... max value:", maxAllValues, "  min value:",minAllValues);
                                return data;
                            })

                            //console.log("\n\nmax value:", maxAllValues, "  min value:",minAllValues);

                            const consumedUnits = maxAllValues - minAllValues;

                            let result = roundedData.map(row => {
                                return {
                                    ...row,
                                    meter_name: item.name,
                                    table_name: item.TABLE_NAME,
                                    tonFactor: tonFactor,
                                    maxAllValues: maxAllValues,
                                    minAllValues: minAllValues,
                                    consumedUnits: consumedUnits,
                                    startDate: newStartDate,
                                    endDate: newEndDate,
                                    isMBTU: isMBTU,
                                    meter_id: item.id,
                                };
                            })
                            //console.log("result........", result);
                            return result;

                        } catch (error) {
                            // Handle any errors that occurred during the query
                            console.error(error);
                        }
                    });


                } catch (error) {
                    console.error('Error calling stored procedure:', error);
                }


                return spResult;
            })
        );

        ////////////////////////////////////////
        // method is used to flatten the nested arrays into a single array


        // Flatten the data using .reduce()
        // const flattenedData = spResult.reduce((accumulator, innerArray) => {
        //     return accumulator.concat(innerArray);
        // }, []);                    

        // Flatten the data using .flat()
        const flattenedData = chartData.flat();

        //////////////////////////////////////////////
        //console.log("flattenedData .....",flattenedData);

        //console.log("Chart data.....",chartData);
        // if (chartData == null){
        return res.status(200).json({ 'chartData' : flattenedData })
        // }
    },


    /////////////////// hour wise consumption //////////////
    async consumptionHourwiseChartData(req, res) {

        let { startDate, endDate, isMBTU, meter_ids, } = req.query;

        if (meter_ids === undefined) {
            return res.status(409).json({ 'message': 'No meter(s) selected' });
        }

        const result = await module.exports.getHourwiseData(startDate, endDate, isMBTU, meter_ids);

        return res.status(200).json({ 'chartData': result })

    },

    async getHourwiseData(startDate, endDate, isMBTU, meter_ids) {

        // allow only one meter
        if (meter_ids.length > 0)
            meter_ids = meter_ids.slice(0, 1);

        let meter_tables = await getMeters(meter_ids);

        const tonFactor = isMBTU == true ? 1 : func.tonFactor();

        //--CAST(TIMESTAMP AS DATE) as DateValue, 
        const chartData = await Promise.all(
            meter_tables.map(async item => {

                // check if dates are properly passed
                let newStartDate = startDate.replace(/"/g, ''); // remove "" quotes from string

                if (isNaN(new Date(newStartDate))) {
                    //console.log("Invalid date");
                    // set to start of current month
                    const mon = new Date().getMonth();
                    const yr = new Date().getFullYear();
                    newStartDate = new Date(yr, mon, 1);
                }

                let newEndDate = endDate.replace(/"/g, ''); // remove "" quotes from string

                if (isNaN(new Date(newEndDate))) {
                    // todays date
                    newEndDate = new Date();
                }

                let spResult = {};
                try {
                    spResult = await db.sequelize.query('EXEC proc_getHourGraph @HistoryTableID = :HistoryTableID, @fromDate = :fromDate, @toDate = :toDate', {
                        replacements: {
                            HistoryTableID: item.history_config_id,
                            fromDate: newStartDate,
                            toDate: newEndDate,
                        },
                        type: db.sequelize.QueryTypes.RAW,
                    },
                    ).then(async spResult => {

                        // note: stored procedure returns result as [ [], 3]
                        // where first item is an array or results
                        let data = spResult[0];

                        // if no data found as per criteria then return 0
                        if (data.length == 0) {
                            data = [
                                {
                                    DateValue: newStartDate,
                                    Value: 0,
                                    MinValue: 0,
                                    MaxValue: 0,
                                },
                                {
                                    DateValue: newEndDate,
                                    Value: 0,
                                    MinValue: 0,
                                    MaxValue: 0,
                                },
                            ]
                        }
                        //console.log("server data........", data);
                        // get max and min values
                        let minAllValues = 0;
                        let maxAllValues = 0;

                        try {
                            const spMinMax = await db.sequelize.query('EXEC proc_getMinMaxValue @HistoryTableID = :HistoryTableID, @fromDate = :fromDate, @toDate = :toDate', {
                                replacements: {
                                    HistoryTableID: item.history_config_id,
                                    fromDate: newStartDate,
                                    toDate: newEndDate,
                                },
                                type: db.sequelize.QueryTypes.RAW,
                            },
                            ).then(spResult => {
                                let data = spResult[0];

                                // if no data found as per criteria then return 0
                                if (data.length > 0) {
                                    // there will be only one result
                                    minAllValues = data[0].minValue;
                                    maxAllValues = data[0].maxValue;
                                }
                                //console.log("\n\nbefore.... max value:", maxAllValues, "  min value:",minAllValues);
                                return data;
                            })

                            const consumedUnits = maxAllValues - minAllValues;

                            let result = data.map(row => {
                                return {
                                    ...row,
                                    meter_name: item.name,
                                    table_name: item.TABLE_NAME,
                                    tonFactor: tonFactor,
                                    maxAllValues: maxAllValues,
                                    minAllValues: minAllValues,
                                    consumedUnits: consumedUnits,
                                    startDate: newStartDate,
                                    endDate: newEndDate,
                                    isMBTU: isMBTU,
                                    meter_id: item.id,
                                };
                            })

                            return result;

                        } catch (error) {
                            // Handle any errors that occurred during the query
                            console.error(error);
                        }
                    });


                } catch (error) {
                    console.error('Error calling stored procedure:', error);
                }


                return spResult;
            })
        );

        // Flatten the data using .flat()
        const flattenedData = chartData.flat();

        return flattenedData;

    },

    // async getHourwiseData(startDate, endDate, isMBTU, meter_ids) {
    //     // Allow only one meter
    //     if (meter_ids.length > 0) meter_ids = meter_ids.slice(0, 1);

    //     let meter_tables = await getMeters(meter_ids);
    //     const tonFactor = isMBTU ? 1 : func.tonFactor();

    //     // Validate Dates
    //     let newStartDate = Date.parse(startDate) ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    //     let newEndDate = Date.parse(endDate) ? new Date(endDate) : new Date();

    //     const chartData = await Promise.all(
    //         meter_tables.map(async (item) => {
    //             try {
    //                 // Call first stored procedure
    //                 let spResult = await db.sequelize.query(
    //                     'EXEC proc_getHourGraph @HistoryTableID = :HistoryTableID, @fromDate = :fromDate, @toDate = :toDate, @isMBTU = :isMBTU',
    //                     {
    //                         replacements: {
    //                             HistoryTableID: item.history_config_id,
    //                             fromDate: newStartDate,
    //                             toDate: newEndDate,
    //                             isMBTU,
    //                         },
    //                         type: db.sequelize.QueryTypes.SELECT, // Correct Query Type
    //                     }
    //                 );

    //                 // If no data found, return default values
    //                 if (!spResult.length) {
    //                     spResult = [
    //                         { DateValue: newStartDate, Value: 0, MinValue: 0, MaxValue: 0 },
    //                         { DateValue: newEndDate, Value: 0, MinValue: 0, MaxValue: 0 },
    //                     ];
    //                 }

    //                 // Call second stored procedure to get min/max values
    //                 let minMaxData = await db.sequelize.query(
    //                     'EXEC proc_getMinMaxValue @HistoryTableID = :HistoryTableID, @fromDate = :fromDate, @toDate = :toDate, @isMBTU = :isMBTU',
    //                     {
    //                         replacements: {
    //                             HistoryTableID: item.history_config_id,
    //                             fromDate: newStartDate,
    //                             toDate: newEndDate,
    //                             isMBTU,
    //                         },
    //                         type: db.sequelize.QueryTypes.SELECT,
    //                     }
    //                 );

    //                 let minAllValues = 0, maxAllValues = 0;
    //                 if (minMaxData.length > 0) {
    //                     minAllValues = minMaxData[0].minValue || 0;
    //                     maxAllValues = minMaxData[0].maxValue || 0;
    //                 }

    //                 const consumedUnits = maxAllValues - minAllValues;

    //                 return spResult.map(row => ({
    //                     ...row,
    //                     meter_name: item.name,
    //                     table_name: item.TABLE_NAME,
    //                     tonFactor,
    //                     maxAllValues,
    //                     minAllValues,
    //                     consumedUnits,
    //                     startDate: newStartDate,
    //                     endDate: newEndDate,
    //                     isMBTU,
    //                     meter_id: item.id,
    //                 }));

    //             } catch (error) {
    //                 console.error('Error calling stored procedure:', error);
    //                 return [];
    //             }
    //         })
    //     );
    //     // Flatten & filter out undefined/null values
    //     return chartData.flat().filter(Boolean);
    // }


}

