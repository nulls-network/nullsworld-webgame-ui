import moment from 'moment'

export function cutEthAddress(address, bit = 6) {
  return address ? address.slice(0, bit) + '...' + address.slice(address.length - bit, address.length) : address
}

export function calcNullsImage(nullsId) {
  const s = (nullsId & 7)
  if (s === 0) return 1
  if (s === 6) return 2
  if (s === 7) return 3
  return s
}

export function calcArenaImage(arenaId) {
  return 1 + (arenaId & 7) || 0
}

export function calcColor(id) {
  const items = ['rare-blue', 'rare-purple', 'rare-red', 'rare-orange']
  return items[(id & 3) || 0]
}

export function accountExplorer(address) {
  return `https://testnet.hecoinfo.com/address/${address}`
}

export function txExplorer(txHash) {
  return `https://testnet.hecoinfo.com/tx/${txHash}`
}

export function formatDate(date, options = {
  fmt: 'YY-MM-DD HH:mm', local: true, fromNow: false
}) {
  if (options?.fromNow) return moment(date).fromNow()
  const fmt = options?.fmt || 'YY-MM-DD HH:mm'
  const local = options?.local || true
  const d = local ? moment(date) : moment(date).utc()
  return d.format(fmt)
}

export function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function formatNumber(num, digits = 3) {
  return num ? num.toFixed(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ',').replace('.000', '') : '0'
}

export function scaleRatio(img, { mw = null, mh = null }) {
  return Math.max(mw / img.width, mh / img.height)
}

export function decimalMutipler(decimal) {
  return decimal ? 10 ** decimal : 1
}

export function addDecimal(originAmount, decimal) {
  return originAmount * decimalMutipler(decimal)
}

export function removeDecimal(originAmount, decimal) {
  return originAmount / decimalMutipler(decimal)
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

export { moment }