const { DataTypes } = require('sequelize');

module.exports = model;

function model(sequelize) {
    const attributes = {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        email: { 
            type: DataTypes.STRING, 
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        passwordHash: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        title: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        firstName: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        lastName: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        acceptTerms: { 
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        role: { 
            type: DataTypes.STRING, 
            allowNull: false,
            defaultValue: 'User'
        },
        verificationToken: { 
            type: DataTypes.STRING 
        },
        verified: { 
            type: DataTypes.DATE 
        },
        resetToken: { 
            type: DataTypes.STRING 
        },
        resetTokenExpires: { 
            type: DataTypes.DATE 
        },
        passwordReset: { 
            type: DataTypes.DATE 
        },
        created: { 
            type: DataTypes.DATE, 
            allowNull: false, 
            defaultValue: DataTypes.NOW 
        },
        updated: { 
            type: DataTypes.DATE 
        },
        status: {
            type: DataTypes.ENUM('Active', 'Inactive'),
            allowNull: false,
            defaultValue: 'Inactive'
        },
        isVerified: {
            type: DataTypes.VIRTUAL,
            get() { 
                return !!(this.verified || this.passwordReset); 
            }
        }
    };

    const options = {
        // disable default timestamp fields (createdAt and updatedAt)
        timestamps: false,
        defaultScope: {
            // exclude password hash by default
            attributes: { exclude: ['passwordHash'] }
        },
        scopes: {
            // include hash with this scope
            withHash: { attributes: {} }
        }
    };

    return sequelize.define('account', attributes, options);
}