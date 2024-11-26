let cron = require('node-cron');
const { initSchedule } = require('../services/schedulepost');

let task =cron.schedule('*/6 * * * * *', () => {
    initSchedule()
});
task.start()