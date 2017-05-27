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


const http = require('http') // #374a60 #f9ffff #f0f9ff #cbe9fc #a7ddff #374a60 #5d88ba #e3f0f9
let server = http.createServer((req, res) => {
  res.end(`
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1"></meta>
    <style>
      * { box-sizing: border-box;}
      *:focus { outline: 0;}
      body { padding: 0; margin: 0;
        overflow: hidden;}
      iframe, gelf { width: 100%; height: 50%; border: 0; display: block;}
      gelf { display: flex; flex-direction: column;}
      gelf > top { height: 32px;
        background: rgba(0, 0, 0, 0.85);}
      gelf > bottom { height: calc(100% - 32px);
        display: flex;}
      bottom > * { padding: 10px;
        font-family: Monaco, Courier New; font-size: 10px;
        color: #FFF;
        background: rgba(0, 0, 0, 0.75); }
      tree { width: 300px;}
      editor { width: calc(100% - 300px - 400px);}
      console { width: 400px;}
      tree, editor, console { overflow-y: scroll;
        position: relative; }
      *::-webkit-scrollbar {
        background: rgba(0, 0, 0, 0.25); 
        width: 8px;}
      *::-webkit-scrollbar-thumb {
        background: #000;
        border-radius: 4px; }
      editor { 
        white-space: pre;
        resize: none;}
      editor > s1 { color: #34bbc8;}
      editor > s2 { color: #34bc26;}
      editor > s3 { color: #cccccc;}
      console > * { position: absolute;}
      console > before { z-index: 0;}
      console > htmlarea { z-index: 1;
        width: calc(100% - 20px); height: calc(100% - 20px); }
      console > htmlarea, console > htmlarea > * { word-break: break-all;}
      console > htmlarea > s4 {}
      console > after { z-index: 2;}
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
    <gelf>
      <top>
      </top>
      <bottom>
        <tree>gelf /<br>&nbsp; baz.py</tree>
        <editor contenteditable="true">class <s1>Foo</s1>
    def <s1>bar</s1>():
      <s3># just passing by</s3>
      <s2>pass</s2></editor>
        <console><before>$  <s4>&#9608;</s4></before><htmlarea contenteditable="true"></htmlarea><after></after></console>
      </bottom>
    </gelf>
    <script>
    /* IFRAME */
    var h = window.location.hostname;
    document.querySelector('iframe').src='http://'+h+':${app_port}'
    
    /* 3RD PARTY */
    function placeCaretAtEnd(el) {
      el.focus()
      if (typeof window.getSelection != "undefined"
      && typeof document.createRange != "undefined") {
        var range = document.createRange()
        range.selectNodeContents(el)
        range.collapse(false)
        var sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
      } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange()
        textRange.moveToElementText(el)
        textRange.collapse(false)
        textRange.select()
      }
    }
    
    /* CONSOLE */
    var blinkCursor = 0
    var content = '   '
    var $c = document.querySelector('console htmlarea')
    $c.addEventListener('keypress', function(e){
      content=$c.innerHTML
    })
    $c.addEventListener('keydown', function(e){
      content=$c.innerHTML
      placeCaretAtEnd($c)
      console.warn(e.keyCode)
      if ([38,37,8].indexOf(e.keyCode) !== -1) {
        e.preventDefault() }})
    $c.addEventListener('focus', function(e){
      $c.innerHTML=content
      blinkCursor = setInterval(function(){
        /* toggle class for cursor blink */},1000) })
    $c.addEventListener('blur', function(){
      clearInterval(blinkCursor) })
    </script>
    </body>
`)
})
server.listen(port, () => {})
console.log(`Dev server listening on port ${port} iframing app server on port ${app_port}`)