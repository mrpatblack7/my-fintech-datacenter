const sleepUtil = require('../util/sleep')
const moment = require('moment');
const bunyan = require('bunyan');
const log = bunyan.createLogger({ name: 'TXStock' })
const getData = require('./getData')
const mongdbUtils = require('../util/mongdbUtils')

/**
 * 一次性抓取特定个股640个交易日
 */
module.exports = {
    async launchStockHisDataTask(code) {
        console.log('start HisStock job')

        let start = moment()
        let count = await mongdbUtils.queryCollectionCount('stock', 'hisprice', { 'code': code })
        if (count > 0) {
            log.info(`${code} is fetched ${count}`)
            return
        }
        let hisData = await this.queryHisStockInfo(code)
        if (!hisData) {
            log.error(`${code} launchStockHisDataTask error`)
            return
        }
        let stockArr = await this.parseHisDataToJsonArr(hisData, code)
        let saveRes = await this.saveStockHisPrice(stockArr)

        let end = moment()
        log.info({
            'stockCode': code,
            'duration': end.diff(start) / 1000
        })

        //延时随机数字
        let delay = Math.floor(Math.random() * 30) * 1000
        sleepUtil.sleep(delay < 10000 ? 10000 : delay)

        return { status: 200, message: 'OK' }
    },
    async queryHisStockInfo(code) {
        let data = null
        try {
            let queryCode = ''
            if (code.indexOf('6') == 0 || code == '000300') {
                queryCode = `sh${code}`
            } else {
                queryCode = `sz${code}`
            }
            data = await getData.queryTTStockHisApi(queryCode, 640)
            if (data.status == '200') {
                let retData = data.data
                if (retData.code !== 0) {
                    console.log(retData.msg)
                    return null
                }
                retData = retData['data']
                let _temp = retData[queryCode]
                if (code == '000300') {
                    return _temp['day']
                }
                return _temp['qfqday']
            }
        } catch (err) {
            log.error(err)
            return null
        }
        return null
    },
    parseHisDataToJsonArr(data, code) {
        let stockArr = []

        //'date', 'open', 'high', 'close', 'low', 'volume', 
        // 'chg', '%chg', 'ma5', 'ma10', 'ma20', 
        // 'vma5', 'vma10', 'vma20'
        data.forEach(element => {
            let stockInfo = {}
            let date = element[0]
            date = date.replace(/-/g, '')
            stockInfo['_id'] = `${code}-${date}`
            stockInfo['code'] = code
            stockInfo['date'] = Number(date)
            stockInfo['open'] = Number(element[1])
            stockInfo['high'] = Number(element[2])
            stockInfo['close'] = Number(element[3])
            stockInfo['low'] = Number(element[4])
            stockInfo['amount'] = Number(element[5])
            stockArr.push(stockInfo)
        })
        return stockArr
    },
    async saveStockHisPrice(stockArr) {
        let saveRes = ''
        try {
            saveRes = await mongdbUtils.insertMany('stock', 'hisprice', stockArr)
        } catch (err) {
            //console.log(err)
        }
        return saveRes
    }


}