/**
 * 抓取住建委每日成交量
 */
const redisUtil = require('../util/redisUtil')
const config = require('../config/config')
const puppeteer = require('puppeteer');
const HTMLParser = require('fast-html-parser');
const moment = require('moment')
const mongdbUtils = require('../util/mongdbUtils')

module.exports = {
    async lauchHouseDailyDealTask() {
        console.log('start house deal job')
        let content = await this.queryHouseDealData()
        this.parseHouseHtmlDom(content)
        console.log('end house deal job')
        return { status: 200, message: 'OK' }
    },

    async queryHouseDealData() {
        let content = null
        try {
            const browser = await puppeteer.launch({ args: ['--no-sandbox'], timeout: 300000 })
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_0) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11')
            await page.goto(config.house.url)
            content = await page.content()
            await browser.close()
        } catch (err) {
            console.log(err)
            return content
        }
        return content
    },



    async parseHouseHtmlDom(content) {
        try {
            const root = HTMLParser.parse(content)
            const table = root.querySelectorAll('table')
            const targetTable = table[6]
            const tds = targetTable.querySelectorAll('td')
            const target = tds[3]
            const targetText = target.structuredText
            const arr = targetText.split('\n')
            let date = arr[0]
            let pos = date.indexOf('存', 0)
            date = date.substring(0, pos)
            date = parseInt(moment(date, "YYYY/M/D").format('YYYYMMDD'))
            let obj = {
                '_id': date,
                'houseNum': parseInt(arr[6]),
                'houseSquare': parseFloat(arr[8]),
                'onlineNum': parseInt(arr[2]),
                'onlineSquare': parseFloat(arr[4]),
                'date': date
            }
            await mongdbUtils.updateOne('stock', 'house', { '_id': obj['_id'] }, obj)
            console.log(obj)
        } catch (err) {
            console.log(err)
            return content
        }

    }

}