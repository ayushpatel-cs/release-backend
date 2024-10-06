module.exports = (sequelize, DataTypes) => {
    const Lease = sequelize.define('Lease', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      listing_id: { type: DataTypes.INTEGER, references: { model: 'Listings', key: 'id' } },
      lessor_id: { type: DataTypes.INTEGER, references: { model: 'Users', key: 'id' } },
      lessee_id: { type: DataTypes.INTEGER, references: { model: 'Users', key: 'id' } },
      lease_url: { type: DataTypes.STRING, allowNull: false },
      date_created: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      signature_status: { type: DataTypes.STRING, defaultValue: 'unsigned' },
      deleted_at: DataTypes.DATE,
    });
    return Lease;
  };
  