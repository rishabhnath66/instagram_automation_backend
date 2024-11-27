let cron = require('node-cron');
const { initSchedule } = require('../services/schedulepost');
const { initPostEngagement } = require('../services/postEngagement');
let task =cron.schedule('*/6 * * * * *', () => {
    initSchedule()
});
let task1 =cron.schedule('*/6 * * * * *', () => {
    initPostEngagement()
});
task.start()