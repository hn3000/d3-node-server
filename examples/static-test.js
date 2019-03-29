
let c = require('canvas');
let d3 = require('d3');
let fs = require('fs');

let canvas = new c.Canvas(1200, 800);
let context = canvas.getContext('2d');

const rnd = d3.randomUniform(10, 30);
const values = d3.range(0, 5)
                  .map(rnd);

const sum = d3.sum(values);
console.log(sum);
const colors = [
  '#579',
  '#597',
  '#759',
  '#795',
  '#975',
  '#957'
];

const data = values.map((v,i) => ({
  n: `name ${i}`,
  v: v / sum * 100,
  c: colors[i % colors.length]
}));

console.log(data);
let makePie = d3.pie().value(x => x.v).padAngle(0.01);
const pie = makePie(data);
let drawArc = d3.arc()
            .innerRadius(220)
            .outerRadius(300)
            .cornerRadius(0)
            .context(context);
let drawLine = d3.line().context(context);

console.log(pie);

context.translate(400, 400);
pie.forEach(x => {
  context.beginPath();
  drawArc(x);
  context.fillStyle = x.data.c;
  context.fill();
  context.strokeStyle = '#fff';
  context.stroke();
});

context.beginPath();
drawLine([[-20,0],[20,0]]);
drawLine([[0,-20],[0,20]]);
context.strokeStyle = '#000';
context.lineWith = 3;
context.stroke();

context.resetTransform();
context.translate(800, 0);
context.fillStyle = '#ddd';
context.fillRect(0,0,400,800);
context.font = '13px Helvetica,"sans-serif"';
context.fillStyle = '#000';

const text = JSON.stringify(data, null, 2);
context.fillText(text, 10, 20, 380);

let pngStream = canvas.createPNGStream();

let out = fs.createWriteStream('image.png');

pngStream.pipe(out);



