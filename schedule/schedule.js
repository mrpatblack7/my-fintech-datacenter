var schedule = require('node-schedule');
const lxrStockIndexTask = require('../service/lxrIndexService')
const qmStockIndexTask = require('../service/qiemanIndexService')
const stockDailyTask = require('../service/stockDailyDataService')
const stockWeeklyTask = require('../service/stockHisDataWeeklyService')
const yearMinPriceService = require('../service/process/yearMinPriceService')
const log = require('../util/logUtil')
const logUtil = log.logUtil

/**理性人指数数据自动处理任务 */
schedule.scheduleJob('43 21-23 * * *', lxrStockIndexTask.lauchLxrIndexTask().then((val) => {
    logUtil.info({ val }, 'lauchLxrIndexTask success')
}).catch((err) => {
    logUtil.error(err)
}))

//抓取且慢的数据
schedule.scheduleJob('31 20-23 * * *', qmStockIndexTask.lauchQiemanIndexTask().then((val) => {
    logUtil.info({ val }, 'lauchQiemanIndexTask success')
}).catch((err) => {
    logUtil.error(err)
}))


//每日允许抓取股票历史价格数据
schedule.scheduleJob('13 17,20 * * *', stockDailyTask.launchStockDailyDataTask().then((val) => {
    logUtil.info({ val }, 'launchStockDailyDataTask success')
}).catch((err) => {
    logUtil.error(err)
}))

//每周六凌晨1点跑一次按周的任务
// schedule.scheduleJob({ hour: 1, minute: 1, dayOfWeek: 6 }, stockWeeklyTask.launchStockHisDataWeekTask().then((val) => {
//     logUtil.info({ val }, 'launchStockHisDataWeekTask success')
// }).catch((err) => {
//     logUtil.error(err)
// }))

//每日允许抓取股票历史价格数据
schedule.scheduleJob('11 2,23 * * *', yearMinPriceService.launchStockDailyDataTask().then((val) => {
    logUtil.info({ val }, 'yearMinPriceService success')
}).catch((err) => {
    logUtil.error(err)
}))