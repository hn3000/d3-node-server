let c = require("canvas");
let d3 = require("d3");
let express = require("express");
let path = require('path');

function run(argv) {
  console.log("starting express");
  let app = express();

  app.use(express.json());

  app.get("/", function(req, res) {
    res.sendFile("index.html", { root: path.resolve(__dirname, '../assets') });
  });
  app.get("/help-me/", function(req, res) {
    res.sendFile("form.html", { root: path.resolve(__dirname, '../assets') });
  });
  app.post("/pie/:format/", function(req, res) {
    switch (req.params.format) {
      case "png":
        renderPng(renderPie, req, res);
        break;
      default:
        res.sendStatus(404);
        console.log("not found: ", req.path, req.params);
    }
  });

  let { HOST = "::0", PORT = 3456 } = process.env;
  let r = app.listen(+PORT, HOST);

  r.once("listening", function() {
    const a = r.address();
    console.log("address: ", a);
    let port = a.port;
    let host = a.address;
    if (a.family == "IPv6")
      console.log(
        `listening, try http://localhost:${port}/ or http://${host}:${port}/`
      );
  });
}

/** @param res: express.Request */
function renderPng(painter, req, res) {
  console.log(req.path, req.params, req.body);
  let { width = 1920, height = 1080, background } = req.body.chart;
  let canvas = new c.Canvas(width, height);
  if (null != background) {
    let context = canvas.getContext("2d");
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }

  painter(req, canvas);

  let png = canvas.createPNGStream();
  res.type("png");
  png.pipe(
    res,
    { end: true }
  );
}

function renderPie(req, canvas) {
  const context = canvas.getContext("2d");
  const vh = canvas.height;
  const vw = canvas.width;
  const vMin = Math.min(vh, vw);
  const vMax = Math.max(vh, vw);

  const defaultColors = ["#579", "#597", "#759", "#795", "#975", "#957"];

  const { colors=defaultColors } = req.body.chart;
  const meta = req.body.meta;
  const value = meta.value ? x => x[meta.value] : x => x["value"];
  const label = meta.label ? x => x[meta.label] : x => x["value"];
  const legend = meta.legend ? x => x[meta.legend] : x => x["legend"];
  const color = meta.color ? x => x[meta.color] : x => x["color"];

  const data = req.body.data.map((v, i) => ({
    vl: label(v) || `Label ${i}`,
    l: legend(v) || `Legend ${i}`,
    v: value(v),
    c: color(v) || colors[i % colors.length]
  }));

  const {
    innerRadius = vMin / 4,
    outerRadius = vMin / 3,
    cornerRadius = 0,
    stroke = "#fff",
    lineWidth = 0,
    showCenter = false,
    showLabels = true,
    showLabelDebug = false,
    padAngle = 0,
  } = req.body.chart;
  let makePie = d3
    .pie()
    .value(x => x.v)
    .padAngle(padAngle);
  const pie = makePie(data);
  let drawArc = d3
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(cornerRadius)
    .context(context);
  let drawLine = d3.line().context(context);

  console.log(pie);

  context.translate(vMin / 2, vMin / 2);
  pie.forEach(x => {
    context.beginPath();
    drawArc(x);
    context.fillStyle = x.data.c;
    context.fill();

    if (lineWidth > 0) {
      context.lineWidth = lineWidth;
      context.strokeStyle = stroke;
      context.stroke();
    }

    if (showLabels) {
      context.beginPath();

      let centroid = drawArc.centroid(x);
      let len = Math.sqrt(centroid.reduce((r, x) => r + x * x, 0));
      let labelPos = centroid.map(t => (t / len) * outerRadius * 1.1);
      if (showLabelDebug) {
        context.moveTo(...centroid);
        context.lineTo(...labelPos);
        context.strokeStyle = "#444";
        context.lineWith = 5;
        context.stroke();
      }

      labelPos = centroid.map(t => (t / len) * outerRadius * 1.2);
      context.font = vMin * 0.05 + "px sans-serif";
      let labelTxt = x.data.vl || `${x.value.toFixed(1)}`;

      context.save();
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(labelTxt, ...labelPos);
      context.restore();
      /*
       */
    }
  });

  if (showCenter) {
    context.beginPath();
    drawLine([[-20, 0], [20, 0]]);
    drawLine([[0, -20], [0, 20]]);
    context.strokeStyle = "#000";
    context.lineWith = 3;
    context.stroke();
  }

  if (vw - vMin > 100) {
    context.resetTransform();
    context.translate(vMin, 0);
    context.fillStyle = "#ddd";
    context.fillRect(0, 0, vw - vMin, vh);
    context.font = '13px Helvetica,"sans-serif"';
    context.fillStyle = "#000";

    const text = JSON.stringify(data, null, 2);
    context.fillText(text, 10, 20, vw - vMin - 20);
  }
}

function renderTimeline(req, canvas) {
  const context = canvas.getContext("2d");
  const vh = canvas.height;
  const vw = canvas.width;
  const vMin = Math.min(vh, vw);
  const vMax = Math.max(vh, vw);

  const meta = req.body.meta;
  const getTimestamp = meta.timestamp ? x => x[meta.timestamp] : x => x["date"];
  const getVvalue = meta.value ? x => x[meta.value] : x => x["value"];

  const data = req.body.data;

  const line = d3.line().curve(d3.curveCatmullRom).context(context);

  const { minTime, maxTime } = data.reduce((r,x) => {
    const t = getTimestamp(x);
    r.minTime = Math.min(t);
    r.maxTime = Math.max(t);
    return r;
  }, { minTime: Number.MAX_VALUE, maxTime: Number.MIN_VALUE} );
 
  const scale = dw.scaleTime(minTime, maxTime);
  const axis = d3.axisLeft(scale);

  axis()
}

run(process.argv);
