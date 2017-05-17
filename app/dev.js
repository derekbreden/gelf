#!/usr/bin/env node

const child_process = require('child_process')
const fs = require('fs')
const port = process.env.PORT || 3000
const app_port = process.env.APP_PORT || 3002

let ps = false;
const create_new_ps = () => {
  if (ps) ps.kill('SIGKILL')
  let env = Object.create( process.env )
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
let last_result = ''
const check_ls = () => {
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


const http = require('http')
let server = http.createServer((req, res) => {
  res.end(`
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
    <style>
      * { box-sizing: border-box;}
      *:focus { outline: 0;}
      body { padding: 0; margin: 0;
        overflow: hidden;}
      iframe { width: 100%; height: 50%; border: 0;}
        
      editor, console, editor > htmlarea { padding: 10px;
        font-family: Courier New; font-size: 12px; font-weight: 700;
        color: #00326c; }
      editor, console { position: absolute;
        background: #f0f9ff;
        border-top: 1px solid #7ab3f5;
        bottom: 0px; left: 0px;
        width: 65%; height: 50%;
        display: flex;}
      editor { border-right: 1px solid #7ab3f5;}
      console { left: auto; right: 0px;
        width: 35%; }
      editor > *{ flex: 1;}
      editor > htmlarea { resize: none;
        white-space: pre;
        color: #005;
        background: #f9ffff;
        border-left: 1px solid #7ab3f5;
        margin-top: -10px; margin-right: -10px; margin-bottom: -10px;}
      editor > htmlarea > s1 { color: #006eee;}
      editor > htmlarea > s2 { color: #004fab;}
      editor > htmlarea > s3 { color: #666;}
      editor > tree { flex: .5;}
      @media screen and (max-width: 480px) {
        editor, console { position: relative;}
        iframe, editor, console { height: auto; width: auto;}
        editor { border-right: 0; }
        body { display: flex; flex-direction: column;
          align-content: center;
          height: 200%;
          overflow: scroll;}
        body > * { flex: 1; }
      }
    </style>
    </head>
    <body>
    <iframe></iframe>
    <editor>
      <tree>gelf /<br>&nbsp; baz.py</tree>
      <htmlarea contenteditable="true">class <s1>Foo</s1>
  def <s1>bar</s1>():
    <s3># just passing by</s3>
    <s2>pass</s2></htmlarea></editor>
    <console>$ &#9608;</console>
    <script> var h = window.location.hostname;
    document.querySelector('iframe').src='http://'+h+':${app_port}'</script>
    </body>
`)
})
server.listen(port, () => {})
console.log(`Dev server listening on port ${port} iframing app server on port ${app_port}`)