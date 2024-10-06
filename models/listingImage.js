module.exports = (sequelize, DataTypes) => {
    const ListingImage = sequelize.define('ListingImage', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      listing_id: { type: DataTypes.INTEGER, references: { model: 'Listings', key: 'id' } },
      image_url: { type: DataTypes.STRING, allowNull: false },
      order_index: { type: DataTypes.INTEGER, defaultValue: 1 }, // Order of images
    });
    return ListingImage;
  };
  