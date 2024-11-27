let cron = require('node-cron');
const { initSchedule } = require('../services/schedulepost');
const { initPostEngagement } = require('../services/postEngagement');
cron.schedule('*/6 * * * * *', () => {
    // initSchedule()
});
cron.schedule('*/6 * * * * *', () => {
    // initPostEngagement()
});