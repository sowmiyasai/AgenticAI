#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const DEMO_CREDENTIALS = {
  name: 'Demo Operator',
  email: 'operator@agentflow.io',
  password: 'password123',
  role: 'operator',
};

async function seedDemoUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agentflow';
    
    console.log('🌱 Seeding demo user...');
    console.log(`📍 Database: ${mongoUri}`);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to database');

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: DEMO_CREDENTIALS.email.toLowerCase() });
    
    if (existingUser) {
      console.log(`ℹ️  Demo user already exists: ${DEMO_CREDENTIALS.email}`);
      console.log('📝 Credentials:');
      console.log(`   Email: ${DEMO_CREDENTIALS.email}`);
      console.log(`   Password: ${DEMO_CREDENTIALS.password}`);
      console.log(`   Role: ${existingUser.role}`);
    } else {
      // Create demo user
      const demoUser = await User.create(DEMO_CREDENTIALS);
      console.log('✨ Demo user created successfully!');
      console.log('📝 Credentials:');
      console.log(`   Email: ${DEMO_CREDENTIALS.email}`);
      console.log(`   Password: ${DEMO_CREDENTIALS.password}`);
      console.log(`   Role: ${demoUser.role}`);
      console.log(`   ID: ${demoUser._id}`);
    }

    console.log('\n🎯 You can now log in with these credentials on the login page.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo user:', error.message);
    process.exit(1);
  }
}

// Run seeder
seedDemoUser();
