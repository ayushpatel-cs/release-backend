module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    name: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    email: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone_number: DataTypes.STRING,
    password_hash: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    verified_status: { 
      type: DataTypes.ENUM('unverified', 'email_verified', 'phone_verified', 'fully_verified'),
      defaultValue: 'unverified'
    },
    profile_image_url: DataTypes.STRING,
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    languages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: true
    },
    occupation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    education: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pets_preference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    profile_image_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
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

  User.associate = function(models) {
    User.hasMany(models.Property, { foreignKey: 'user_id', as: 'properties' });
    User.hasMany(models.Bid, { foreignKey: 'bidder_id', as: 'bids' });
    User.hasMany(models.Review, { foreignKey: 'reviewer_id', as: 'givenReviews' });
    User.hasMany(models.Review, { foreignKey: 'reviewed_id', as: 'receivedReviews' });
  };

  return User;
};
  