const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Request = sequelize.define('Request', {
        requestId: { type: DataTypes.STRING, unique: true },
        type: { type: DataTypes.STRING, allowNull: false },
        status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Pending' },
        employeeId: { type: DataTypes.INTEGER, allowNull: false },
        details: { type: DataTypes.JSON, allowNull: true }
    }, {
        timestamps: false
    });
    return Request;
}; 