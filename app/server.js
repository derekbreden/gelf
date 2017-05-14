require('crypto')
require('http')
var crypto = require('crypto')
var http = require('http')
var fs = require('fs')

// --------------------------------------------------------------
// Async util
//        and
//        promise like thing
// --------------------------------------------------------------
// Usage:
//        and(function(cb){
//          console.log('hello')
//          setTimeout(cb, 500)
//        }).and(function(){
//          console.log('world')
//        })
//
var and = function(fn_1){
  var self = {}
  fn_1(function(){
    if (self.fn_2)
      self.fn_2(self.all_finished)
    else
      self.fn_1_finished = true})
  self.and = function(fn_2){
    return and(function(all_finished){
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
//        all([function(cb){
//          console.log('he')
//          setTimeout(cb, 100)
//        },function(cb){
//          console.log('llo')
//          setTimeout(cb, 500)
//        }], function(){
//          console.log('world')
//        })
//
var all = function(arr, cb){
  var to_finish = arr.length
  var check_if_done = function(){
    to_finish--
    if(to_finish == 0)
      cb()
  }
  arr.forEach(function(cb){
    cb(check_if_done)
  })
}



// --------------------------------------------------------------
// Async util
//        stream_to_cb
//        buffers a response and calls back
// --------------------------------------------------------------
// Usage:
//        stream_to_cb(req, function(body){ success(body) })
//
var stream_to_cb = function(stream, cb) {
  var body = []
  stream.on('data', function(chunk) {
    body.push(chunk)
  }).on('error', function(chunk) {
    body.push(chunk)
  }).on('end', function() {
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
console.log = function(msg, color){
  if (!color) color = '0;31m'
  if (typeof color == 'function') color = color()
  if (typeof msg != 'string') msg = dump(msg)
  var dt =(new Date()+'').substr(4,20)
  console._log('\033[0;36m' + dt + '  \033[0m\033[' + color + '' + msg + '\033[0m')
}
var log_factory = function(color){ return function(msg){ console.log(msg, color) } }
var log_alternator = 0
var _log = log_factory(function(){return log_alternator ? '0;37m' : '1;38m'})
var log = function(x, y){
  y ? (log_alternator ? log_alternator-- : log_alternator++) : ''
  x ? _log(x) : ''
}
var error = log_factory('1;31m')
var success = log_factory('1;32m')
var alert = log_factory('1;35m')
var warn = log_factory('1;33m')
var date_len = (new Date()+'[]   ').length
var indent = function(what_for, tabs, y){
  var l = what_for.length
  return what_for + spaces(Math.abs(tabs - l), y || ' ')
}
var spaces = function(x, y){ return new Array(x).join(y || ' ') }
var dump = function(obj){
  try{ return JSON.stringify(obj, true, '  ').replace(/\n/g, '\n' + spaces(date_len)) }catch(e){}
  return to_log = Object.keys(obj)
                    .filter(function(k){ return !!(obj[k]) })
                    .map(function(k){
                      var v = obj[k]
                      if (typeof v != 'function') try{ v = JSON.stringify(v, true, '  ') }catch(e){}
                      v = v.toString().replace(/\n/g, '\n' + spaces(date_len + 20))
                      return indent(k + ':', 20) + v
                    }).join('\n' + spaces(date_len))
}
// process.on('uncaughtException', function(err) { error(err) })



// --------------------------------------------------------------
// Routes
// --------------------------------------------------------------
// Usage:
//        } else if (req.method == 'GET' && req.url == '/hello') {
//          res.end('world')
//          success(sigify('responded'))
//
var port = process.env.PORT || 3000
var server = http.createServer(function(req, res){
  var hash = crypto.createHash('md5').update(Math.random()+'').digest('hex').substr(0,4)
  var sigify = function(x){
    return indent(x, 10) + indent(req.method, 10) + indent(req.url, 60)
  }
  rlog = function(msg, i, j){ log(hash + spaces(i || 22) + msg, j) }
  rlog(sigify('start'), 4, 1)
  if (req.method == 'POST') {
    stream_to_cb(req, function(body){
      rlog(indent('body ', 14) + body)
      res.end(body)
      rlog(sigify('stop'), 4)
    })
  } else if (req.method == 'GET' && req.url == '/healthcheck') {
    res.end('Ok')
    rlog(sigify('stop'), 4)
  // } else if (req.method == 'GET' && req.url == '/js') {
  //   var my_dir = `${__dirname}/../atlaskit-starter/build/static/js`
  //   fs.readdir(my_dir, {}, function(e, versions){
  //     fs.readFile(`${my_dir}/${versions[0]}`, {}, function(e, content){
  //       content = content.toString().substr(0,content.length - `/*# sourceMappingURL=${versions[1]}*/`.length)
  //       res.end(content)
  //     })
  //   })
  // } else if (req.method == 'GET' && req.url == '/css') {
  //   var my_dir = `${__dirname}/../atlaskit-starter/build/static/css`
  //   fs.readdir(my_dir, {}, function(e, versions){
  //     fs.readFile(`${my_dir}/${versions[0]}`, {}, function(e, content){
  //       content = content.toString().substr(0,content.length - `/*# sourceMappingURL=${versions[1]}*/`.length)
  //       res.end(content)
  //     })
  //   })
  } else {
    res.end(`<!doctype html><html>
  <head>
    <link href="/css" type="text/css" rel="stylesheet"></link>
    <title>Gelf</title>
  </head>
  <body>
    <div id="app-root"></div>
    <script src="/js"></script>
  </body>
</html>`)
    rlog(sigify('stop'), 4)
  }

})
server.listen(port, function(err){
  if (err) error(err)
  log('Server started')
  server.emit('listen')
}).on('error', function(err){
  error('capture')
})
log('Server starting')


// --------------------------------------------------------------
// Test Helpers
// --------------------------------------------------------------
// Usage:
//        assert_path_body('/healthcheck', 'Ok')
//
var test_i = 1
var passed = 0
var failed = 0
var assert = function(truthy, y, z){
  var x = indent(test_i+' ', 10, '.')
  y = indent(' '+y+' ', 50, '.')
  if (truthy) {
    success('✔ ' + x + indent(' PASSED ', 20, '.') + y)
    passed++
  } else {
    error('✘ ' + x + indent(' FAILED ', 20, '.') + y)
    z.forEach(function(z_msg){error(z_msg)})
    failed++
  }
  test_i++
}
var prepare_assert_path_cb = function(path, cb, method, data){
  var req = http.request({
    port: port,
    method: method || 'GET',
    path: path,
    headers: {'User-agent': 'gelf test'}
  }, function(res){
    stream_to_cb(res, cb)
  })
  req.on('error', cb)
  if (data) req.write(data)
  req.end()
}
var assert_path_body = function(path, body_to_assert, cb, method, data){
  prepare_assert_path_cb(path, function(body){
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
//        }).and(function(cb){
//          assert_path_body('/healthcheck', 'Ok', cb)
//
and(function(cb){
  server.on('listen', cb)
}).and(function(cb){
  log('Tests started')
  assert_path_body('/healthcheck', 'Ok', cb)
}).and(function(cb){
  assert_path_body('/xss', 'Okey', cb, 'POST', 'Okey')
}).and(function(cb){
  server.on('close', function(){
    assert_path_body('/server-down', 'Error: connect ECONNREFUSED 127.0.0.1:3000', cb)
  })
  server.close()
}).and(function(cb){
  server.listen(port, function(){
    assert_path_body('/healthcheck', 'Ok', cb)
  })
// SKIP need to make less noisy
// }).and(function(cb){
//   all(new Array(20).join('.').split('.').map(function(){
//      return function(inner_cb){
//        assert_path_body('/healthcheck', 'Ok', inner_cb)
//      }
//    }), cb)
}).and(function(cb){
  good_or_bad = function(x, y){ return failed ? error(y || x) : success(x) }
  success(spaces(80, '.'))
  good_or_bad(spaces(13) + 'PASSED', spaces(13) + 'FAILED')
  success(spaces(23) + indent('passed', 14) + passed + '/' + (test_i - 1))
  good_or_bad(spaces(23) + indent('failed', 14) + failed)
  success(spaces(80, '.'))
  log('Tests finished', 1)
})
