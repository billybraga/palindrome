var EDGES = 9;

class Point {
    constructor(private _x: number, private _y: number) { }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    offset(offset: Point) {
        return new Point(this.x + offset.x, this.y + offset.y);
    }

    toString() {
        return "[" + this.x + ", " + this.y + "]";
    }
}

class Vector extends Point {

    divide(quotient: number) {
        return new Vector(this.x / quotient, this.y / quotient);
    }

    multiply(factor: number) {
        return new Vector(this.x * factor, this.y * factor);
    }

}

class Line {
    constructor(private _start: Point, private _end: Point, private _thickness: number = 1) { }

    get start() {
        return this._start;
    }

    get end() {
        return this._end;
    }

    get thickness() {
        return this._thickness;
    }

    get length() {
        return Math.sqrt(
            Math.pow(this.end.x - this.start.x, 2) 
            + Math.pow(this.end.y - this.start.y, 2));
    }

    toVector() {
        return new Vector(this.end.x - this.start.x, this.end.y - this.start.y);
    }

    offset(offset: Point) {
        return new Line(this.start.offset(offset), this.end.offset(offset));
    }

    getPointAlongLine(distance: number) {
        return this
            .toVector()
            .divide(this.length)
            .multiply(distance)
            .offset(this.start);
    }

    toString() {
        return this.start.toString() + ", " + this.end.toString();
    }
}

interface IRenderer {
    writeLine(line: Line);
    clear();
}

class CanvasRenderer implements IRenderer {
    private context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement = null) {
        if (canvas == null) {
            canvas = document.getElementsByTagName("canvas")[0];
        }

        this.context = canvas.getContext("2d");
    }

    clear() {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    }

    writeLine(line: Line) {
        this.context.beginPath();
        this.context.lineWidth = line.thickness;
        this.context.moveTo(line.start.x, line.start.y);
        this.context.lineTo(line.end.x, line.end.y);
        this.context.stroke();
    }
}

interface Math {
    csc(x: number): number;
}

Math['csc'] = x => 1 / Math.sin(x);

class Palindrome {
    private LINE_COUNT = 25;
    private edgeLength: number;
    private shift: number;
    private rotationRad: number;

    constructor(
        private width: number,
        private edges: number,
        private renderer: IRenderer = new CanvasRenderer()) {
        this.edgeLength = width / Math.csc(Math.PI / edges);
        this.shift = this.width / this.LINE_COUNT;
        this.rotationRad = 2 * Math.PI / this.edges;
    }

    render() {
        this.renderer.clear();
        return this
            .getLines()
            .map(l => {
                return this.renderer.writeLine(l);
            });
    }

    getLines() {
        var lines = new Array<Line>();

        // add baselines
        {
            var currentPoint = new Point(this.width * 0.5, 0);
            for (var i = 0.5; i <= this.edges; i++) {
                var zeroRotationPoint = new Point(this.edgeLength, 0);
                var nextPoint = new Point(
                    zeroRotationPoint.x * Math.cos(-this.rotationRad * i)
                    + zeroRotationPoint.y * Math.sin(-this.rotationRad * i),
                    - zeroRotationPoint.x * Math.sin(-this.rotationRad * i)
                    + zeroRotationPoint.y * Math.cos(-this.rotationRad * i))
                    .offset(currentPoint);

                lines.push(
                    new Line(
                        currentPoint,
                        nextPoint
                    ));

                currentPoint = nextPoint;
            }
        }

        for (var i = this.edges; ; i++) {
            var start = lines[i - 1].end;
            var targetBaseLine = lines[i - this.edges + 1];
            var _end = targetBaseLine.getPointAlongLine(this.shift);
            var targetBaseLineToTargetPoint = new Line(
                targetBaseLine.start,
                _end);

            if (i > 100000 || targetBaseLineToTargetPoint.length < 1 || targetBaseLineToTargetPoint.length > targetBaseLine.length) {
                break;
            }

            var newLine = new Line(start, _end);
            lines.push(newLine);
        }

        return lines;
    }
}


class ViewModel {
    private _edges = ko.observable(EDGES.toString());

    get edges() {
        return parseInt(this._edges());
    }

    get edgesObservable() {
        return this._edges;
    }

    set edges(value: number) {
        this._edges(value.toString());
    }
}

ko.bindingHandlers['palindrome'] = {
    update: function (elem: HTMLCanvasElement, valueAccessor: () => ViewModel) {
        var viewModel = valueAccessor();
        var pal = new Palindrome(elem.clientWidth, viewModel.edges, new CanvasRenderer(elem));
        pal.render();
    }
}

ko.applyBindings(new ViewModel());