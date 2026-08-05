const ChatMessage = require('../models/chatMessage');
const User = require('../models/user');

// @desc    Send a chat message
// @route   POST /api/chat
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, receiverRole, companyId, message } = req.body;
    const senderId = req.user._id;
    const senderRole = req.user.role;
    const senderName = req.user.name || req.user.email;

    console.log(`[Chat Controller] sendMessage from ${senderName} (${senderRole}): "${message}" to role ${receiverRole}`);

    const chatMsg = await ChatMessage.create({
      senderId,
      senderRole,
      senderName,
      receiverId: receiverId || null,
      receiverRole,
      companyId: companyId || req.user.companyId || null,
      message,
    });

    res.status(201).json({ success: true, message: 'Message sent successfully', chatMessage: chatMsg });
  } catch (error) {
    console.error(`[Chat Controller] Error sending message: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chat messages for logged in user
// @route   GET /api/chat
// @access  Private
exports.getChatMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    let query = {};

    if (userRole === 'super-admin') {
      // Super admin can see all messages or messages involving super-admin
      query = {
        $or: [
          { senderRole: 'super-admin' },
          { receiverRole: 'super-admin' }
        ]
      };
    } else if (userRole === 'company-admin') {
      // Company admin sees messages involving their company, or directly involving them
      query = {
        $or: [
          { companyId: companyId },
          { senderId: userId },
          { receiverId: userId }
        ]
      };
    } else {
      // Staff, drivers, and customers see messages involving them, or messages sent to their role within their company
      query = {
        $or: [
          { senderId: userId },
          { receiverId: userId },
          {
            companyId: companyId,
            $or: [
              { receiverRole: userRole },
              { receiverRole: 'all' }
            ]
          }
        ]
      };
    }

    console.log(`[Chat Controller] Fetching messages with query:`, JSON.stringify(query));
    
    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 }); // Chronological order

    // Mark messages sent by others to us as 'read'
    const otherSentMessages = messages.filter(
      msg => String(msg.senderId) !== String(userId) && msg.status !== 'read'
    );
    if (otherSentMessages.length > 0) {
      const msgIdsToUpdate = otherSentMessages.map(m => m._id);
      await ChatMessage.updateMany(
        { _id: { $in: msgIdsToUpdate } },
        { $set: { status: 'read' } }
      );
      // Update in-memory objects for immediate response consistency
      messages.forEach(msg => {
        if (msgIdsToUpdate.some(id => String(id) === String(msg._id))) {
          msg.status = 'read';
        }
      });
    }

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    console.error(`[Chat Controller] Error fetching messages: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};
