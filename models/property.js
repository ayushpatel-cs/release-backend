module.exports = (sequelize, DataTypes) => {
  const Property = sequelize.define('Property', {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    user_id: { 
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    title: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    description: DataTypes.TEXT,
    address: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      validate: {
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      validate: {
        min: -180,
        max: 180
      }
    },
    start_date: { 
      type: DataTypes.DATE, 
      allowNull: false 
    },
    end_date: { 
      type: DataTypes.DATE, 
      allowNull: false 
    },
    min_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'ended', 'rented'),
      defaultValue: 'active'
    },
    auction_end_date: DataTypes.DATE,
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    deleted_at: DataTypes.DATE
  }, {
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });

  Property.associate = function(models) {
    Property.belongsTo(models.User, { foreignKey: 'user_id', as: 'owner' });
    Property.hasMany(models.PropertyImage, { foreignKey: 'property_id', as: 'images' });
    Property.hasMany(models.Bid, { foreignKey: 'property_id', as: 'bids' });
    Property.hasMany(models.Review, { foreignKey: 'property_id', as: 'reviews' });
  };

  return Property;
}; 