import moment from 'moment'
import { BigNumber, BigNumberish } from 'ethers'

export function cutEthAddress(address, bit = 6) {
  return address
    ? address.slice(0, bit) +
    '...' +
    address.slice(address.length - bit, address.length)
    : address
}

export function calcApproveAmount(decimal) {
  return BigNumber.from(10).pow((decimal || 6) + 18)
}

export function calcNullsImage(nullsId) {
  return (nullsId & 15) + 1
}

export function calcArenaImage(arenaId) {
  return 1 + (arenaId & 7) || 0
}

export function calcColor(id) {
  const items = ['rare-blue', 'rare-purple', 'rare-red', 'rare-orange']
  return items[id & 3 || 0]
}

export function accountExplorer(address) {
  return `https://testnet.hecoinfo.com/address/${address}`
}

export function txExplorer(txHash) {
  return `https://testnet.hecoinfo.com/tx/${txHash}`
}

export function formatDate(
  date,
  options = {
    fmt: 'YY-MM-DD HH:mm',
    local: true,
    fromNow: false
  }
) {
  if (options?.fromNow) return moment(date).fromNow()
  const fmt = options?.fmt || 'YY-MM-DD HH:mm'
  const local = options?.local || true
  const d = local ? moment(date) : moment(date).utc()
  return d.format(fmt)
}

export function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** 
 * @param {BigNumber} num
 **/
export function formatNumber(num, digits = 3) {
  if (num?._isBigNumber) num = num.toNumber()
  return num
    ? num
      .toFixed(digits)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      .replace('.000', '')
    : '0'
}

export function scaleRatio(img, { mw = null, mh = null }) {
  return Math.max(mw / img.width, mh / img.height)
}

/** 
 * @param {BigNumberish} decimal
 **/
export function decimalMutipler(decimal) {
  if (decimal === undefined || decimal === null) throw new Error('[decimalMutipler]: decimal is undefined')
  if (!decimal?._isBigNumber) decimal = BigNumber.from(decimal)
  return BigNumber.from(10).pow(decimal)
}

/** 
 * @param {BigNumberish} originAmount
 * @param {BigNumberish} decimal
 **/
export function addDecimal(originAmount, decimal) {
  if (originAmount === undefined || originAmount === null) originAmount = 0
  if (!originAmount?._isBigNumber) originAmount = BigNumber.from(originAmount)
  return originAmount.mul(decimalMutipler(decimal))
}

/** 
 * @param {BigNumberish} originAmount
 * @param {BigNumberish} decimal
 **/
export function removeDecimal(originAmount, decimal) {
  if (originAmount === undefined || originAmount === null) originAmount = 0
  if (!originAmount?._isBigNumber) originAmount = BigNumber.from(originAmount)
  return originAmount.div(decimalMutipler(decimal))
}

export function randint(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function randChoiceNum(obj, num) {
  const newObj = [...obj]
  const result = []
  for (var i = 0; i < num; i++) {
    var ran = Math.floor(Math.random() * (newObj.length - i))
    result.push(newObj[ran])
    newObj[ran] = newObj[newObj.length - i - 1]
  }
  return result
}

export const getStore = (name) => {
  if (!name) return
  let result = window.localStorage.getItem(name)
  try {
    result = JSON.parse(result)
  } catch (err) { }
  if (result === null || result === undefined || result === '') {
    result = ''
  }
  return result
}


export const removeStore = (name) => {
  if (!name) return
  window.localStorage.removeItem(name)
}

export const setStore = (name, content) => {
  if (!name) return
  if (typeof content !== 'string') {
    content = JSON.stringify(content)
  }
  window.localStorage.setItem(name, content)
}

export const GetLang = function () {
  let sysLang = navigator.language.toLowerCase()
  let langs = ['en-us', 'zh-cn']
  !langs.includes(sysLang) && (sysLang = 'en-us')
  return getStore('lang') || sysLang || 'en-us'
}

export const parseUrlQuery = function () {
  var result = {}
  var url = window.location.href
  var query = url.split('?')[1]
  if (query) {
    var queryArr = query.split('&')
    queryArr.forEach(function (item) {
      var key = item.split('=')[0]
      result[key] = item.split('=')[1]
    })
  }
  return result
}

export { moment }
