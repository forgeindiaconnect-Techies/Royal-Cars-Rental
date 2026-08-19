const PlatformSettings = require('../models/PlatformSettings');

const DEFAULT_SETTINGS = {
  supportPhone: '+91 95173 68420',
  whatsappPhone: '919517368420',
  supportEmail: 'admin@royalrentcars.com',
  whatsappMsg: 'Hello Royal Drive! I want to inquire about car rental.'
};

// @desc    Get public platform settings (phone, whatsapp, email)
// @route   GET /api/settings/public
// @access  Public
exports.getPublicSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne({ key: 'global_platform_settings' });
    if (!settings) {
      settings = await PlatformSettings.create({
        key: 'global_platform_settings',
        ...DEFAULT_SETTINGS
      });
    }
    return res.status(200).json({
      success: true,
      settings: {
        supportPhone: settings.supportPhone || DEFAULT_SETTINGS.supportPhone,
        whatsappPhone: settings.whatsappPhone || DEFAULT_SETTINGS.whatsappPhone,
        supportEmail: settings.supportEmail || DEFAULT_SETTINGS.supportEmail,
        whatsappMsg: settings.whatsappMsg || DEFAULT_SETTINGS.whatsappMsg
      }
    });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return res.status(200).json({
      success: true,
      settings: DEFAULT_SETTINGS
    });
  }
};

// @desc    Update platform settings (Super Admin)
// @route   POST /api/settings
// @access  Super Admin
exports.updateSettings = async (req, res) => {
  try {
    const { supportPhone, whatsappPhone, supportEmail, whatsappMsg } = req.body;

    let settings = await PlatformSettings.findOne({ key: 'global_platform_settings' });
    if (!settings) {
      settings = new PlatformSettings({ key: 'global_platform_settings' });
    }

    if (supportPhone !== undefined) settings.supportPhone = supportPhone.trim();
    if (whatsappPhone !== undefined) settings.whatsappPhone = whatsappPhone.trim();
    if (supportEmail !== undefined) settings.supportEmail = supportEmail.trim();
    if (whatsappMsg !== undefined) settings.whatsappMsg = whatsappMsg.trim();

    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Platform settings updated successfully in database',
      settings: {
        supportPhone: settings.supportPhone,
        whatsappPhone: settings.whatsappPhone,
        supportEmail: settings.supportEmail,
        whatsappMsg: settings.whatsappMsg
      }
    });
  } catch (error) {
    console.error('Error updating platform settings:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update platform settings'
    });
  }
};
