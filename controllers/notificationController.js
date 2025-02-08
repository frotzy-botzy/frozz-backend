const Notification = require('../models/Notification');

const sendNotification = async (user, sender, type, preset = null) => {
    let message = '';

    if (type === 'follow') {
        message = `${sender.username} mulai mengikuti kamu.`;
    } else if (type === 'like') {
        message = `${sender.username} menyukai preset kamu.`;
    } else if (type === 'comment') {
        message = `${sender.username} mengomentari preset kamu.`;
    }

    const notification = new Notification({
        user,
        sender,
        type,
        preset,
        message
    });

    await notification.save();
};

module.exports = { sendNotification };
