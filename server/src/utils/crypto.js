const crypto = require('crypto');
const config = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY = Buffer.from(config.CREDENTIAL_ENCRYPTION_KEY, 'utf-8');

/**
 * Encrypt a text string or JSON object using AES-256-GCM
 */
function encrypt(textOrObject) {
  if (!textOrObject) return null;
  const text = typeof textOrObject === 'object' ? JSON.stringify(textOrObject) : String(textOrObject);
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    content: encrypted,
  };
}

/**
 * Decrypt an AES-256-GCM encrypted payload
 */
function decrypt(encryptedData) {
  if (!encryptedData || !encryptedData.content || !encryptedData.iv || !encryptedData.tag) {
    return null;
  }
  
  try {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt,
};
