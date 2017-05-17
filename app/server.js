#!/usr/bin/env node

const crypto = require('crypto')
const http = require('http')
const fs = require('fs')
const port = process.env.PORT || 3000

// --------------------------------------------------------------
// Async util
//        and
//        promise like thing
// --------------------------------------------------------------
// Usage:
//        and((cb) => {
//          console.log('hello')
//          setTimeout(cb, 500)
//        }).and(() => {
//          console.log('world')
//        })
//
const and = (fn_1) => {
  let self = {}
  fn_1(() => {
    if (self.fn_2)
      self.fn_2(self.all_finished)
    else
      self.fn_1_finished = true})
  self.and = (fn_2) => {
    return and((all_finished) => {
      if (fn_2) {
        if (self.fn_1_finished) {
          fn_2(all_finished)}
        else {
          self.all_finished = all_finished
          self.fn_2 = fn_2}}
      else {
        if (all_finished)
          all_finished()}})}
  return self}


// --------------------------------------------------------------
// Async util
//        all
//        parallel async cb
// --------------------------------------------------------------
// Usage:
//        all([(cb) => {
//          console.log('he')
//          setTimeout(cb, 100)
//        },(cb) => {
//          console.log('llo')
//          setTimeout(cb, 500)
//        }], () => {
//          console.log('world')
//        })
//
const all = (arr, cb) => {
  let to_finish = arr.length
  let check_if_done = () => {
    to_finish--
    if(to_finish == 0)
      cb()
  }
  arr.forEach((cb) => {
    cb(check_if_done)
  })
}



// --------------------------------------------------------------
// Async util
//        stream_to_cb
//        buffers a response and calls back
// --------------------------------------------------------------
// Usage:
//        stream_to_cb(req, (body) => { success(body) })
//
const stream_to_cb = (stream, cb) => {
  let body = []
  stream.on('data', (chunk) => {
    body.push(chunk)
  }).on('error', (chunk) => {
    body.push(chunk)
  }).on('end', () => {
    body = Buffer.concat(body).toString()
    cb(body)
  })
}



// --------------------------------------------------------------
// Logging
// --------------------------------------------------------------
// Usage:
//        log('A thing')
//        error('Bad thing')
//        success('Good thing')
//
console._log = console.log
console.log = (msg, color) => {
  if (!color) color = '0;31m'
  if (typeof color == 'function') color = color()
  if (typeof msg != 'string') msg = dump(msg)
  let dt =(new Date()+'').substr(4,20)
  console._log('\033[0;36m' + dt + '  \033[0m\033[' + color + '' + msg + '\033[0m\033[0m')
}
const log_factory = (color) => { return (msg) => { console.log(msg, color) } }
let log_alternator = 0
const _log = log_factory(() => {return log_alternator ? '0;37m' : '1;38m'})
const log = (x, y) => {
  y ? (log_alternator ? log_alternator-- : log_alternator++) : ''
  x ? _log(x) : ''
}
const error = log_factory('1;31m')
const success = log_factory('1;32m')
const alert = log_factory('1;35m')
const warn = log_factory('1;33m')
const date_len = (new Date()+'[]   ').length
const indent = (what_for, tabs, y) => {
  let l = what_for.length
  return what_for + spaces(Math.abs(tabs - l), y || ' ')
}
const spaces = (x, y) => { return new Array(x).join(y || ' ') }
const dump = (obj) => {
  try{ return JSON.stringify(obj, true, '  ').replace(/\n/g, '\n' + spaces(date_len)) }catch(e){}
  return to_log = Object.keys(obj)
                    .filter((k) => { return !!(obj[k]) })
                    .map((k) => {
                      let v = obj[k]
                      if (typeof v != 'function') try{ v = JSON.stringify(v, true, '  ') }catch(e){}
                      v = v.toString().replace(/\n/g, '\n' + spaces(date_len + 20))
                      return indent(k + ':', 20) + v
                    }).join('\n' + spaces(date_len))
}
process.on('uncaughtException', (err) => { error(err) })



// --------------------------------------------------------------
// Routes
// --------------------------------------------------------------
// Usage:
//        } else if (req.method == 'GET' && req.url == '/hello') {
//          res.end('world')
//          success(sigify('responded'))
//
let server = http.createServer((req, res) => {
  let hash = crypto.createHash('md5').update(Math.random()+'').digest('hex').substr(0,4)
  let sigify = (x) => {
    return indent(x, 10) + indent(req.method, 10) + indent(req.url, 60)
  }
  rlog = (msg, i, j) => { log(hash + spaces(i || 22) + msg, j) }
  rlog(sigify('start'), 4, 1)
  if (req.method == 'POST') {
    stream_to_cb(req, (body) => {
      rlog(indent('body ', 14) + body)
      res.end(body)
      rlog(sigify('stop'), 4)
    })
  } else if (req.method == 'GET' && req.url == '/healthcheck') {
    res.end('Ok')
    rlog(sigify('stop'), 4)
  } else if (req.method == 'GET' && req.url == '/css') {
    let fs_req = fs.createReadStream(`${__dirname}/atlaskit.css`)
    fs_req.pipe(res)
    rlog(sigify('stop'), 4)
  } else {
    res.end(`<!doctype html><html>
  <head>
    <link href="/css" type="text/css" rel="stylesheet"></link>
    <title>Gelf</title>
  </head>
  <body>
  <ak-grid>
  <ak-grid-column size="8">
    <h1>Main heading</h1>
    <p>foo.</p>
  </ak-grid-column>
  <ak-grid-column size="4">
    <h2>Sidebar</h2>
    <p>nope!</p>
  </ak-grid-column>
  <svg focusable="false"><use xlink:href="#ak-icon-addon" /></svg>
  <ak-grid-column>
    <h2>Content below which takes up remaining space</h2>
    <p>
      not latin
    </p>
  </ak-grid-column>
</ak-grid>
  </body>
</html>`)
    rlog(sigify('stop'), 4)
  }

})
server.listen(port, (err) => {
  if (err) error(err)
  log(`Server started on port ${port}`)
  server.emit('listen')
}).on('error', (err) => {
  error(err)
})
log('Server starting')


// --------------------------------------------------------------
// Test Helpers
// --------------------------------------------------------------
// Usage:
//        assert_path_body('/healthcheck', 'Ok')
//
let test_i = 1
let passed = 0
let failed = 0
const assert = (truthy, y, z) => {
  let x = indent(test_i+' ', 10, '.')
  y = indent(' '+y+' ', 50, '.')
  if (truthy) {
    success('✔ ' + x + indent(' PASSED ', 20, '.') + y)
    passed++
  } else {
    error('✘ ' + x + indent(' FAILED ', 20, '.') + y)
    z.forEach((z_msg) => {error(z_msg)})
    failed++
  }
  test_i++
}
const prepare_assert_path_cb = (path, cb, method, data) => {
  let req = http.request({
    port: port,
    method: method || 'GET',
    path: path,
    headers: {'User-agent': 'gelf test'}
  }, (res) => {
    stream_to_cb(res, cb)
  })
  req.on('error', cb)
  if (data) req.write(data)
  req.end()
}
const assert_path_body = (path, body_to_assert, cb, method, data) => {
  prepare_assert_path_cb(path, (body) => {
    assert(
      body == body_to_assert, path,
      ['Expected: ' + body_to_assert, 'Got: ' + body]
    )
    if (cb) cb(body)
  }, method, data)
}


// --------------------------------------------------------------
// Tests
// --------------------------------------------------------------
// Usage:
//        }).and((cb) => {
//          assert_path_body('/healthcheck', 'Ok', cb)
//
and((cb) => {
  server.on('listen', cb)
}).and((cb) => {
  log('Tests started')
  assert_path_body('/healthcheck', 'Ok', cb)
}).and((cb) => {
  assert_path_body('/xss', 'Okey', cb, 'POST', 'Okey')
}).and((cb) => {
  server.on('close', () => {
    assert_path_body('/server-down', `Error: connect ECONNREFUSED 127.0.0.1:${port}`, cb)
  })
  server.close()
}).and((cb) => {
  server.listen(port, () => {
    assert_path_body('/healthcheck', 'Ok', cb)
  })
// SKIP need to make less noisy
// }).and((cb) => {
//   all(new Array(20).join('.').split('.').map(() => {
//      return (inner_cb) => {
//        assert_path_body('/healthcheck', 'Ok', inner_cb)
//      }
//    }), cb)
}).and((cb) => {
  good_or_bad = (x, y) => { return failed ? error(y || x) : success(x) }
  success(spaces(80, '.'))
  good_or_bad(spaces(13) + 'PASSED', spaces(13) + 'FAILED')
  success(spaces(23) + indent('passed', 14) + passed + '/' + (test_i - 1))
  good_or_bad(spaces(23) + indent('failed', 14) + failed)
  success(spaces(80, '.'))
  log('Tests finished', 1)
})
