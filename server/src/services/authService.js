const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

class AuthService {
  async register({ name, email, password, role }) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const err = new Error('A user with this email already exists');
      err.statusCode = 400;
      throw err;
    }

    const count = await User.countDocuments();
    // First user is automatically admin, others operator by default
    const userRole = count === 0 ? 'admin' : (role || 'operator');

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: userRole,
      lastLogin: new Date(),
    });

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async login({ email, password }) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    await User.findByIdAndUpdate(user._id || user.id, { lastLogin: new Date() });

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: new Date(),
      },
    };
  }

  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user._id || user.id,
        email: user.email,
        role: user.role,
      },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
}

module.exports = new AuthService();
