require('dotenv').config()
var cors = require('cors')
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var rolesRouter = require('./routes/roles');
var billingRouter = require('./routes/billings');
var permissionRouter = require('./routes/permissions');
var buildingRoutes = require("./routes/Buildings");
var floorRouter = require('./routes/floors');
var meterRouter = require('./routes/meters');
var unitAdjusmentRouter = require('./routes/unitAdjustments');
var customerRouter = require('./routes/customers');
var historyConfig = require('./routes/history_configs');
var dashboard = require('./routes/dashboard');
var chartRouter = require('./routes/charts');
var spaceRouter = require('./routes/spaces');
var activityLogRouter = require('./routes/activity_logs');

const app = express();
app.use(cors())
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/spaces', spaceRouter);
app.use('/api/charts', chartRouter);
app.use('/api/permissions', permissionRouter);
app.use('/api/floors', floorRouter);
app.use('/api/meters', meterRouter);
app.use('/api/history-config', historyConfig);
app.use('/api/customers', customerRouter);
app.use('/api/dashboard', dashboard);
app.use('/api/unitAdjustments', unitAdjusmentRouter);
app.use('/api/billings', billingRouter);
app.use('/api/logs', activityLogRouter);
app.use("/api/buildings", buildingRoutes)
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});
// error handler
// app.use(function (err, req, res, next) {
//     // set locals, only providing error in development
//     res.locals.message = err.message;
//     res.locals.error = req.app.get('env') === 'development' ? err : {};

//     // render the error page
//     res.status(err.status || 500);
//     res.render('error');
// });

app.listen(process.env.PORT, () => console.log(`Server listening on port ${process.env.PORT}!`))
// module.exports = app;

