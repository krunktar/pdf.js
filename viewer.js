/* -*- Mode: Java; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- /
/* vim: set shiftwidth=4 tabstop=8 autoindent cindent expandtab: */

"use strict";

var pdfDocument, canvas, pageScale, pageDisplay, pageNum, numPages, pageTimeout;
function load(userInput) {
    canvas = document.getElementById("canvas");
    canvas.mozOpaque = true;
    pageNum = ("page" in queryParams()) ? parseInt(queryParams().page) : 1;
    pageScale = ("scale" in queryParams()) ? parseInt(queryParams().scale) : 1.5;
    var fileName = userInput;
    if (!userInput) {
      fileName = queryParams().file || "compressed.tracemonkey-pldi-09.pdf";
    }
    open(fileName);
}

function queryParams() {
    var qs = window.location.search.substring(1);
    var kvs = qs.split("&");
    var params = { };
    for (var i = 0; i < kvs.length; ++i) {
        var kv = kvs[i].split("=");
        params[unescape(kv[0])] = unescape(kv[1]);
    }
    return params;
}

function open(url) {
    document.title = url;
    var req = new XMLHttpRequest();
    req.open("GET", url);
    req.mozResponseType = req.responseType = "arraybuffer";
    req.expected = (document.URL.indexOf("file:") == 0) ? 0 : 200;
    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == req.expected) {
        var data = req.mozResponseArrayBuffer || req.mozResponse ||
                   req.responseArrayBuffer || req.response;
        pdfDocument = new PDFDoc(new Stream(data));
        numPages = pdfDocument.numPages;
        document.getElementById("numPages").innerHTML = numPages.toString();
        goToPage(pageNum);
      }
    };
    req.send(null);
}

function gotoPage(num) {
    if (0 <= num && num <= numPages)
        pageNum = num;
    displayPage(pageNum);
}

function displayPage(num) {
    window.clearTimeout(pageTimeout);

    document.getElementById("pageNumber").value = num;

    var t0 = Date.now();

    var page = pdfDocument.getPage(pageNum = num);
    canvas.width = parseInt(canvas.getAttribute("defaultwidth")) * pageScale;
    canvas.height = parseInt(canvas.getAttribute("defaultheight")) * pageScale;

    // scale canvas by 2
    canvas.width = 2 * page.mediaBox[2];
    canvas.hieght = 2 * page.mediaBox[3];

    var t1 = Date.now();
    var ctx = canvas.getContext("2d");
    ctx.save();
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    var gfx = new CanvasGraphics(ctx);

    // page.compile will collect all fonts for us, once we have loaded them
    // we can trigger the actual page rendering with page.display
    var fonts = [];
    page.compile(gfx, fonts);
    var t2 = Date.now();

    function loadFont() {
      if (!FontLoader.bind(fonts)) {
        pageTimeout = window.setTimeout(loadFont, 10);
        return;
      }

      var t3 = Date.now();

      page.display(gfx);

      var t4 = Date.now();

      var infoDisplay = document.getElementById("info");
      infoDisplay.innerHTML = "Time to load/compile/fonts/render: "+ (t1 - t0) + "/" + (t2 - t1) + "/" + (t3 - t2) + "/" + (t4 - t3) + " ms";
    };
    loadFont();
}

function nextPage() {
    if (pageNum < pdfDocument.numPages)
      displayPage(++pageNum);
}

function prevPage() {
    if (pageNum > 1)
      displayPage(--pageNum);
}

function goToPage(num) {
  if (0 <= num && num <= numPages)
    displayPage(pageNum = num);
}

