console.log('functions.js init')

var fu = {
  strsplit: (string, char) => {
    var index = string.indexOf(char)
    if (index < 0) {
      return {
        token: string,
        msg: ''
      }
    } else {
      return {
        token: string.substr(0, index),
        msg: string.substr(index + 1)
      }
    }
  },
  getFirstKeyElement: obj => {
    for (var i in obj) {
      return obj[i]
    }
  },
  strkey: (array, element) => {
    var k = Object.keys(array)
    var i = 0
    var string = ''
    while (i < k.length) {
      string += array[k[i]][element]
      if (i++ < k.length - 1) {
        string += ', '
      }
    }
    return `[${string}]`
  },
  randKey: array => {
    var r
    do {
      r = Math.random()
    } while (array[r]);
    return r
  },
  getSign: n => {
    return n > 0 ? 1 : n < 0 ? -1 : 0
  },

  forEach: (a, f) => {
    for (var i in a) {
      f(a[i])
    }
  },
  isEqual: v => {
    for (var i = 1; i < arguments.length; ++i) {
      if (v == arguments[i]) {
        return true
      }
    }
    return false
  },
  swap: (v, a, b) => {
    var t = v[a]
    v[a] = v[b]
    v[b] = t
  }
}

try {
  module.exports = fu
} catch (e) {}
