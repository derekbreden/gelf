#!/usr/bin/env node

var child_process = require('child_process')
var fs = require('fs')
var port = process.env.PORT || 3000
var app_port = process.env.APP_PORT || 3002

var ps = false;
var create_new_ps = () => {
  if (ps) ps.kill('SIGKILL')
  var env = Object.create( process.env )
  env['PORT'] = `${app_port}`
  ps = child_process.spawn(`${__dirname}/server.js`, {env: env})
  ps.stdout.on('data', (data) => {
    data=data.toString().substr(0,data.length-3)
    console.log(`${data}`);
  })
  ps.stderr.on('data', (data) => {
    data=data.toString().substr(0,data.length-3)
    console.log(`ERROR: ${data}`)
  })
  ps.on('close', (code) => {
    if (code) console.log(`EXITED: ${code}`)
  })
}
var last_result = ''
var check_ls = () => {
  child_process.exec(`ls -al ${__dirname}`, (error, stdout, stderr) => {
    if (last_result !== stdout) {
      create_new_ps()
      last_result = stdout
    }
    setTimeout(function(){
      check_ls()
    }, 200)
  })
}
check_ls()


var http = require('http')
var server = http.createServer((req, res) => {
  res.end(`
    <style>
      * { box-sizing: border-box; }
      body { padding: 0;}
      iframe { width: 100%; height: 100%;
        border: 0;}
        
      editor, console, editor > htmlarea { padding: 10px;
        font-family: Courier New; font-size: 12px; font-weight: 700;}
      editor, console { position: absolute;
        opacity: .85;
        background: #FFF9F9;
        border: 10px #faa; border-style: outset;
        bottom: 20px; left: 20px;
        width: calc(65% - 30px);
        height: calc(50% - 20px);
        display: flex;}
      console { left: auto; right: 20px;
        width: calc(35% - 30px);}
      editor > *{ flex: 1;}
      editor > htmlarea { resize: none;
        white-space: pre;
        color: #500;
        background: #FFF;
        border-left: 1px solid #faa;
        margin-top: -10px; margin-right: -10px; margin-bottom: -10px;}
      editor > htmlarea > s1 { color: #900;}
      editor > htmlarea > s2 { color: #b33;}
      editor > htmlarea > s3 { color: #666;}
      editor > tree { flex: .5;}
    </style>
    <iframe></iframe>
    <editor><tree>gelf /<br>&nbsp; baz.py</tree><htmlarea>class <s1>Foo</s1>
  def <s1>bar</s1>():
    <s3># just passing by</s3>
    <s2>pass</s2></htmlarea></editor>
    <console>$ &#9608;</console>
    <script> var h = window.location.hostname;
    document.querySelector('iframe').src='http://'+h+':${app_port}'</script>
`)
})
server.listen(port, () => {})
console.log(`Dev server listening on port ${port} iframing app server on port ${app_port}`)