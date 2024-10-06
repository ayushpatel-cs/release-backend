module.exports = (sequelize, DataTypes) => {
    const Listing = sequelize.define('Listing', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, references: { model: 'Users', key: 'id' } },
      title: { type: DataTypes.STRING, allowNull: false },
      description: DataTypes.TEXT,
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      address: { type: DataTypes.STRING, allowNull: false },
      city: { type: DataTypes.STRING, allowNull: false },
      state: { type: DataTypes.STRING, allowNull: false },
      zip_code: { type: DataTypes.STRING, allowNull: false },
      latitude: DataTypes.DECIMAL(9, 6),
      longitude: DataTypes.DECIMAL(9, 6),
      available_from: { type: DataTypes.DATE, allowNull: false },
      available_to: { type: DataTypes.DATE, allowNull: false },
      date_posted: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      status: { type: DataTypes.STRING, defaultValue: 'active' },
      category: DataTypes.STRING,
      deleted_at: DataTypes.DATE,
    });
    return Listing;
  };
  