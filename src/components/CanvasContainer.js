import React, {Component} from 'react';
import _ from 'lodash';
import NormalDistribution from 'normal-distribution';
import './css/CanvasContainer.scss'

class CanvasContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            pixels: []
        }
    }

    getRandomNumber = (size) => {
        return Math.floor(Math.random() * (size));
    };

    canvas = () => {
        return document.querySelector(`#canvas${this.props.id}`);
    };

    ctx = () => {
        return this.canvas().getContext("2d");
    };

    drawLine = (x1, y1, x2, y2, color = "gray") => {
        const ctx = this.ctx();
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineJoin = "miter";
        ctx.lineWidth = 1;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };

    drawCell = (row, column, color = "blue") => {
        const ctx = this.ctx();
        const pixel = this.props.pixel;
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineJoin = "miter";
        ctx.lineWidth = 1;

        let x = row * pixel;
        let y = column * pixel;
        ctx.rect(x, y, pixel, pixel);
        ctx.fill();
    };

    drawGrid = (x = 0, y = 0, size, pixel) => {
        const p = size / pixel;
        const xStep = size / p;
        const yStep = size / p;

        for (let i = 0; i <= size; i += xStep) {
            this.drawLine(x + i, y, x + i, y + size);
        }

        for (let j = 0; j <= size; j += yStep) {
            this.drawLine(x, j + y, x + size, j + y);
        }
    };

    drawNoise = (x1, y1, x2, y2, noiseSize, intensity, color = 'white') => {
        const ctx = this.ctx();
        const noise = [];
        ctx.fillStyle = color;
        for (let i = x1; i < x2; i += noiseSize) {
            for (let j = y1; j < y2; j += noiseSize) {
                if (intensity > Math.random()) {
                    ctx.fillRect(i, j, noiseSize, noiseSize);
                    noise.push({i, j, noiseSize, color})
                }
            }
        }
        return noise;
    };

    drawNoiseWithProbability = (x1, y1, x2, y2, noiseSize, intensity, shouldDrawFunction, color = 'white') => {
        const ctx = this.ctx();
        const noise = [];
        ctx.fillStyle = color;

        let count = 0;
        while (count < intensity * (x2 * y2 / (noiseSize * noiseSize))) {
            for (let i = x1; i < x2; i += noiseSize) {
                for (let j = y1; j < y2; j += noiseSize) {
                    if (shouldDrawFunction(i, j, noiseSize)) {
                        ctx.fillRect(i, j, noiseSize, noiseSize);
                        noise.push({i, j, noiseSize, color});
                        count++;
                    }
                }
            }
        }
        return noise;
    };

    reDrawNoise = (noise) => {
        const ctx = this.ctx();
        noise.forEach(el => {
            ctx.fillStyle = el.color;
            ctx.fillRect(el.i, el.j, el.noiseSize, el.noiseSize);
        });
    };

    makeFractal = (size, onlyLines) => {
        const scaleDown = (size) => size * (Math.sqrt(2) / 2);
        const fillColor = (color, opacity) => `rgba(${color.join(',')},${opacity})`;
        const negative = (num) => -1 * num;
        const toRadians = (degrees) => degrees * (Math.PI / 180);
        const randomDir = () => Math.floor(Math.random() * 2) ? 'right' : 'left';
        const bubblegum = [255, 91, 157];
        const seafoam = [210, 255, 242];
        const ctx = this.ctx();

        const generateFractal = (size, topDirection, bottomDirection) => {
            if (size <= 4) return;

            // save the current canvas context
            ctx.save();

            // draw the root
            ctx.fillStyle = (size <= 25) ? fillColor(bubblegum, 1) : fillColor(seafoam, .7);
            if (onlyLines) {
                this.drawLine(negative(size / 2), negative(size / 2), size, size);
            } else {
                ctx.fillRect(negative(size / 2), negative(size / 2), size, size);
            }

            // constants for the branches:
            const radians = toRadians(45);
            const branchSize = scaleDown(size);

            // rotate around top branch
            if (topDirection === 'right') {
                ctx.translate((size / 2), negative(size));
                ctx.rotate(radians);
            } else {
                ctx.translate(negative(size / 2), negative(size));
                ctx.rotate(negative(radians));
            }

            // draw top branch
            generateFractal(
                branchSize,
                randomDir(),
                randomDir()
            );

            ctx.restore();

            // rotate around bottom branch
            if (bottomDirection === 'right') {
                ctx.translate((size / 2), size);
                ctx.rotate(negative(radians));
            } else {
                ctx.translate(negative(size / 2), size);
                ctx.rotate(radians);
            }

            // draw bottom branch
            generateFractal(
                branchSize,
                randomDir(),
                randomDir()
            );
        };

        generateFractal(size * (3 / 4), randomDir(), randomDir());
    };

    generateObject = (x, y, size, color = 'blue') => {
        const ctx = this.ctx();
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + 5, y);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x + size * 0.75, y + size * 0.25);
        ctx.moveTo(x + size, y);
        ctx.lineTo(x + size * 0.75, y - size * 0.25);
        ctx.stroke();
    };

    findObject = (x1, y1, x2, y2) => {
        const imageData = this.ctx().getImageData(x1, y1, x2 - x1, y2 - y1);
        const result = imageData.data.findIndex((el, index) => (index + 1) % 3 === 0 && el === 255) / 4;
        return {x: Math.round((result + 1) % (x2 - x1)), y: Math.round(result / (y2 - y1))}
    };

    handleClick = (e) => {
        if (!this.props.clickEnabled) return;
        const {pixel} = this.props;
        let x = e.nativeEvent.offsetX;
        let y = e.nativeEvent.offsetY;

        let i = Math.floor(x / pixel);
        let j = Math.floor(y / pixel);

        const newPixel = {i, j};
        if (!this.state.pixels.some(pixel => _.isEqual(pixel, newPixel))) {
            this.setState({pixels: [...this.state.pixels, newPixel]});
        }
    };

    componentDidMount() {
        const {size} = this.props;
        const canvas = this.canvas();
        canvas.height = size;
        canvas.width = size;

        // this.lab01();
        // this.lab02();
        // this.lab03();
        // this.lab04();
        // this.lab05();
        // this.lab06();
        // this.lab07();
        this.lab08();

    }

    lab01 = () => {
        const {size, pixel} = this.props;

        const startX = 100;
        const startY = 100;
        const apertureSize = size / 2;

        this.generateObject(125, 190, 20);
        this.drawGrid(startX, startY, apertureSize, pixel);

        let coords = this.findObject(startX, startY, apertureSize + startX, apertureSize + startY);
        console.log("Relative to aperture", coords);
        console.log("Relative to canvas", {x: coords.x + 100, y: coords.y + 100});
        console.log("Position on aperture layout", {i: Math.floor(coords.x / pixel), j: Math.floor(coords.y / pixel)});
    };

    lab02 = () => {
        const object = [{i: 1, j: 3},
            {i: 2, j: 3},
            {i: 3, j: 3},
            {i: 8, j: 3},
            {i: 6, j: 3},
            {i: 7, j: 3},
            {i: 5, j: 3},
            {i: 4, j: 3},
            {i: 1, j: 4},
            {i: 8, j: 4},
            {i: 3, j: 4},
            {i: 6, j: 4},
            {i: 4, j: 2},
            {i: 5, j: 2},
            {i: 3, j: 5},
            {i: 4, j: 5},
            {i: 5, j: 5},
            {i: 6, j: 5},
            {i: 6, j: 6},
            {i: 5, j: 6},
            {i: 4, j: 6},
            {i: 3, j: 6},
            {i: 4, j: 7},
            {i: 5, j: 7}];
        for (const pixel of object) {
            this.drawCell(pixel.i, pixel.j);
        }

        const {size} = this.props;
        this.drawNoise(0, 0, size, size, 10, 0.3);
        this.drawNoise(0, 0, size, size, 60, 0.15);
        this.drawNoise(0, 0, size, size, 10, 0.3, 'blue');
        this.drawNoise(0, 0, size, size, 60, 0.15, 'blue');
    };

    lab03 = () => {
        const {size} = this.props;
        const ctx = this.ctx();
        const r1 = 50;
        const r2 = 100;

        const arr = [];
        for (let i = 0; i < 100; i++) {
            let x1 = this.getRandomNumber(size);
            let y1 = this.getRandomNumber(size);
            let x2 = (x1 - r1 - r2) + this.getRandomNumber((r2 + r1) * 2);
            let y2 = (y1 - r1 - r2) + this.getRandomNumber((r2 + r1) * 2);

            let d = Math.sqrt(sq(x2 - x1) + sq(y2 - y1));

            let s;
            if (d < Math.abs(r1 - r2)) {
                s = sq(r1) * Math.PI;
            } else if (Math.abs(r1 + r2) < d) {
                s = 0;
            } else {
                let f1 = 2 * Math.acos((sq(r1) - sq(r2) + sq(d)) / (2 * r1 * d));
                let f2 = 2 * Math.acos((sq(r2) - sq(r1) + sq(d)) / (2 * r2 * d));
                let s1 = (sq(r1) * (f1 - Math.sin(f1))) / 2;
                let s2 = (sq(r2) * (f2 - Math.sin(f2))) / 2;
                s = s1 + s2
            }
            let percentage = s / (Math.PI * sq(r1));
            arr.push({distanceBetweenCenters: d, hiddenArea: s, percentage});
            drawCircle(x2, y2, r2, 'green');
            drawCircle(x1, y1, r1, 'red');
        }
        console.log(arr);
        console.log(arr.map(v => v.percentage));

        function drawCircle(x, y, r, color) {
            ctx.strokeStyle = 'white';
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
        }

        function sq(num) {
            return Math.pow(num, 2);
        }
    };

    lab04 = () => {
        const object = [{i: 1, j: 3},
            {i: 2, j: 3},
            {i: 3, j: 3},
            {i: 8, j: 3},
            {i: 6, j: 3},
            {i: 7, j: 3},
            {i: 5, j: 3},
            {i: 4, j: 3},
            {i: 1, j: 4},
            {i: 8, j: 4},
            {i: 3, j: 4},
            {i: 6, j: 4},
            {i: 4, j: 2},
            {i: 5, j: 2},
            {i: 3, j: 5},
            {i: 4, j: 5},
            {i: 5, j: 5},
            {i: 6, j: 5},
            {i: 6, j: 6},
            {i: 5, j: 6},
            {i: 4, j: 6},
            {i: 3, j: 6},
            {i: 4, j: 7},
            {i: 5, j: 7}];
        for (const pixel of object) {
            this.drawCell(pixel.i, pixel.j);
        }
        const {size} = this.props;
        this.drawNoise(0, 0, size, size, 10, 0.1, 'white');
        this.drawNoise(0, 0, size, size, 10, 0.3, 'white');
        this.drawNoise(0, 0, size, size, 10, 0.5, 'white');
        this.drawNoise(0, 0, size, size, 10, 0.7, 'white');
    };

    lab05 = () => {
        const object = [{i: 1, j: 3},
            {i: 2, j: 3},
            {i: 3, j: 3},
            {i: 8, j: 3},
            {i: 6, j: 3},
            {i: 7, j: 3},
            {i: 5, j: 3},
            {i: 4, j: 3},
            {i: 1, j: 4},
            {i: 8, j: 4},
            {i: 3, j: 4},
            {i: 6, j: 4},
            {i: 4, j: 2},
            {i: 5, j: 2},
            {i: 3, j: 5},
            {i: 4, j: 5},
            {i: 5, j: 5},
            {i: 6, j: 5},
            {i: 6, j: 6},
            {i: 5, j: 6},
            {i: 4, j: 6},
            {i: 3, j: 6},
            {i: 4, j: 7},
            {i: 5, j: 7}];
        for (const pixel of object) {
            this.drawCell(pixel.i, pixel.j);
        }

        const normDist = new NormalDistribution(250, 85);
        const {size} = this.props;
        const probabilityGen = (start, end) => normDist.probabilityBetween(start, end);
        const shouldDrawFunction = (x, y, size) => {
            let random = Math.random();
            return probabilityGen(x, x + size) > random || probabilityGen(y, y + size) > random;
        };
        this.drawNoiseWithProbability(0, 0, size, size, 10, 0.1, shouldDrawFunction, 'white');
        this.drawNoiseWithProbability(0, 0, size, size, 10, 0.3, shouldDrawFunction, 'white');
        this.drawNoiseWithProbability(0, 0, size, size, 10, 0.5, shouldDrawFunction, 'white');
        this.drawNoiseWithProbability(0, 0, size, size, 10, 0.7, shouldDrawFunction, 'white');
    };

    lab06 = () => {
        const object = [{i: 1, j: 3},
            {i: 2, j: 3},
            {i: 3, j: 3},
            {i: 8, j: 3},
            {i: 6, j: 3},
            {i: 7, j: 3},
            {i: 5, j: 3},
            {i: 4, j: 3},
            {i: 1, j: 4},
            {i: 8, j: 4},
            {i: 3, j: 4},
            {i: 6, j: 4},
            {i: 4, j: 2},
            {i: 5, j: 2},
            {i: 3, j: 5},
            {i: 4, j: 5},
            {i: 5, j: 5},
            {i: 6, j: 5},
            {i: 6, j: 6},
            {i: 5, j: 6},
            {i: 4, j: 6},
            {i: 3, j: 6},
            {i: 4, j: 7},
            {i: 5, j: 7}];
        for (const pixel of object) {
            this.drawCell(pixel.i, pixel.j);
        }

        const lambda = 0.015; // empirical for range 0...500
        const {size} = this.props;
        const probabilityGen = (start, end) => Math.exp(-lambda * Math.abs((end + start) / 2));
        const shouldDrawFunction = (x, y, size) => {
            let random = Math.random();
            return probabilityGen(x, x + size) > random && probabilityGen(y, y + size) > random;
        };

        this.drawNoiseWithProbability(0, 0, size, size, 10, 0.1, shouldDrawFunction, 'white');
        this.drawNoiseWithProbability(0, 0, size, size, 10, 0.3, shouldDrawFunction, 'white');
        this.drawNoiseWithProbability(0, 0, size, size, 10, 0.5, shouldDrawFunction, 'white');
        this.drawNoiseWithProbability(0, 0, size, size, 10, 0.7, shouldDrawFunction, 'white');
    };

    lab07 = () => {
        const ctx = this.ctx();
        const {size} = this.props;

        ctx.translate(size / 2, size / 2);
        this.makeFractal(size * 0.7, true);
    };

    lab08 = () => {
        const ctx = this.ctx();
        const {size} = this.props;
        const numberOfAreasPerRow = 3;
        const intensity = 0.5;
        const onlyLines = false;


        for (let i = 1; i <= numberOfAreasPerRow; i++) {
            for (let j = 1; j <= numberOfAreasPerRow; j++) {
                ctx.save();
                ctx.translate(size / (numberOfAreasPerRow + 1) * i, size / (numberOfAreasPerRow + 1) * j);
                this.makeFractal(size / (numberOfAreasPerRow * numberOfAreasPerRow * Math.sqrt(1 / intensity)), onlyLines);
                ctx.restore();
            }
        }
    };

    render() {
        const {id} = this.props;
        return (
            <div className="canvasContainer" onClick={this.handleClick}>
                <canvas id={"canvas" + id}/>
            </div>
        );
    }
}

export default CanvasContainer;