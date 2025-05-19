require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('_middleware/error-handler');
const config = require('config.json');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// allow cors requests from any origin and with credentials
app.use(cors(config.cors));

// api routes
app.use('/api/accounts', require('./accounts/accounts.controller'));
app.use('/api/employees', require('./employees/employee.controller'));
app.use('/api/departments', require('./departments/department.controller'));
app.use('/api/requests', require('./requests/request.controller'));
app.use('/api/workflows', require('./workflows/workflow.controller'));

// swagger docs route
app.use('/api-docs', require('_helpers/swagger'));

// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => console.log('Server listening on port ' + port));