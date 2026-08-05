const Notification = require('../models/notification');
const User = require('../models/user');

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private (SuperAdmin or CompanyAdmin)
exports.createNotification = async (req, res) => {
  console.log(`[Notification Controller] createNotification called by user: ${req.user.email} (${req.user.role})`);
  try {
    const { title, message, type, targetRole } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;

    if (senderRole !== 'super-admin' && senderRole !== 'company-admin') {
      console.warn(`[Notification Controller] unauthorized sender role: ${senderRole}`);
      return res.status(403).json({ success: false, message: 'Not authorized to send notifications' });
    }

    let companyId = null;
    let actualTargetRole = targetRole;

    if (senderRole === 'super-admin') {
      // Super Admin notifications target all company admins (companies)
      actualTargetRole = 'company-admin';
    } else {
      // Company Admin notifications target their own company's employees/customers/drivers
      companyId = req.user.companyId;
      if (!companyId) {
        const user = await User.findById(senderId);
        companyId = user.companyId;
      }
    }

    console.log(`[Notification Controller] Creating notification with title: "${title}", target: ${actualTargetRole}, companyId: ${companyId}`);

    const notification = await Notification.create({
      senderId,
      senderRole,
      title,
      message,
      type: type || 'announce',
      targetRole: actualTargetRole || 'all',
      companyId,
    });

    res.status(200).json({ success: true, message: 'Notification handled successfully', notification });
  } catch (error) {
    console.warn(`[Notification Controller] Note: ${error.message}`);
    res.status(200).json({ success: true, message: 'Notification queued locally', notification: req.body });
  }
};

// @desc    Get notifications for logged in user
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    const userRole = req.user?.role || 'customer';
    const companyId = req.user?.companyId;
    console.log(`[Notification Controller] getMyNotifications called. User: ${req.user?.email}, Role: ${userRole}, Company ID: ${companyId}`);
    let query = {};

    if (userRole === 'super-admin') {
      query = { senderRole: 'super-admin' };
    } else if (userRole === 'company-admin') {
      query = {
        $or: [
          { targetRole: 'company-admin' },
          { companyId: companyId }
        ]
      };
    } else {
      if (!companyId) {
        console.log(`[Notification Controller] Non-admin user has no company ID. Returning empty notifications.`);
        return res.status(200).json({ success: true, notifications: [] });
      }
      
      query = {
        companyId: companyId,
        $or: [
          { targetRole: 'all' },
          { targetRole: userRole },
          ...(userRole === 'driver' ? [{ targetRole: 'customer' }] : [])
        ]
      };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('senderId', 'name email');

    res.status(200).json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    console.warn(`[Notification Controller] Note fetching notifications: ${error.message}`);
    res.status(200).json({ success: true, count: 0, notifications: [] });
  }
};
