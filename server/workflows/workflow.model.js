const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Workflow = sequelize.define('Workflow', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        workflowId: {
            type: DataTypes.STRING,
            unique: true
        },
        employeeId: { 
            type: DataTypes.INTEGER, 
            allowNull: false 
        },
        type: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        status: { 
            type: DataTypes.STRING, 
            allowNull: false, 
            defaultValue: 'Pending' 
        },
        details: { 
            type: DataTypes.JSON, 
            allowNull: true 
        },
        message: {
            type: DataTypes.STRING,
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        timestamps: true
    });
    
    Workflow.associate = (models) => {
        Workflow.belongsTo(models.Employee, { foreignKey: 'employeeId', as: 'employee' });
    };
    
    return Workflow;
}; 