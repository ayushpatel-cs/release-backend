module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      phone_number: DataTypes.STRING,
      phone_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      password_hash: { type: DataTypes.STRING, allowNull: false },
      verification_level: { type: DataTypes.ENUM('Non', 'Student', 'Government') },
      date_joined: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      profile_picture_url: DataTypes.STRING,
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      role: { type: DataTypes.STRING, defaultValue: 'user' },
      deleted_at: DataTypes.DATE,
    });
    return User;
  };
  