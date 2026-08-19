const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'global_platform_settings',
    unique: true
  },
  supportPhone: {
    type: String,
    default: '+91 95173 68420'
  },
  whatsappPhone: {
    type: String,
    default: '919517368420'
  },
  supportEmail: {
    type: String,
    default: 'admin@royalrentcars.com'
  },
  whatsappMsg: {
    type: String,
    default: 'Hello Royal Drive! I want to inquire about car rental.'
  }
}, { timestamps: true });

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
