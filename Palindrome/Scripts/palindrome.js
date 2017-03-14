var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var EDGES = 9;
var Point = (function () {
    function Point(_x, _y) {
        this._x = _x;
        this._y = _y;
    }
    Object.defineProperty(Point.prototype, "x", {
        get: function () {
            return this._x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Point.prototype, "y", {
        get: function () {
            return this._y;
        },
        enumerable: true,
        configurable: true
    });
    Point.prototype.offset = function (offset) {
        return new Point(this.x + offset.x, this.y + offset.y);
    };
    Point.prototype.toString = function () {
        return "[" + this.x + ", " + this.y + "]";
    };
    return Point;
}());
var Vector = (function (_super) {
    __extends(Vector, _super);
    function Vector() {
        _super.apply(this, arguments);
    }
    Vector.prototype.divide = function (quotient) {
        return new Vector(this.x / quotient, this.y / quotient);
    };
    Vector.prototype.multiply = function (factor) {
        return new Vector(this.x * factor, this.y * factor);
    };
    return Vector;
}(Point));
var Line = (function () {
    function Line(_start, _end, _thickness) {
        if (_thickness === void 0) { _thickness = 1; }
        this._start = _start;
        this._end = _end;
        this._thickness = _thickness;
    }
    Object.defineProperty(Line.prototype, "start", {
        get: function () {
            return this._start;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "end", {
        get: function () {
            return this._end;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "thickness", {
        get: function () {
            return this._thickness;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "length", {
        get: function () {
            return Math.sqrt(Math.pow(this.end.x - this.start.x, 2)
                + Math.pow(this.end.y - this.start.y, 2));
        },
        enumerable: true,
        configurable: true
    });
    Line.prototype.toVector = function () {
        return new Vector(this.end.x - this.start.x, this.end.y - this.start.y);
    };
    Line.prototype.offset = function (offset) {
        return new Line(this.start.offset(offset), this.end.offset(offset));
    };
    Line.prototype.getPointAlongLine = function (distance) {
        return this
            .toVector()
            .divide(this.length)
            .multiply(distance)
            .offset(this.start);
    };
    Line.prototype.toString = function () {
        return this.start.toString() + ", " + this.end.toString();
    };
    return Line;
}());
var CanvasRenderer = (function () {
    function CanvasRenderer(canvas) {
        if (canvas === void 0) { canvas = null; }
        if (canvas == null) {
            canvas = document.getElementsByTagName("canvas")[0];
        }
        this.context = canvas.getContext("2d");
    }
    CanvasRenderer.prototype.clear = function () {
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    };
    CanvasRenderer.prototype.writeLine = function (line) {
        this.context.beginPath();
        this.context.lineWidth = line.thickness;
        this.context.moveTo(line.start.x, line.start.y);
        this.context.lineTo(line.end.x, line.end.y);
        this.context.stroke();
    };
    return CanvasRenderer;
}());
Math['csc'] = function (x) { return 1 / Math.sin(x); };
var Palindrome = (function () {
    function Palindrome(width, edges, renderer) {
        if (renderer === void 0) { renderer = new CanvasRenderer(); }
        this.width = width;
        this.edges = edges;
        this.renderer = renderer;
        this.LINE_COUNT = 25;
        this.edgeLength = width / Math.csc(Math.PI / edges);
        this.shift = this.width / this.LINE_COUNT;
        this.rotationRad = 2 * Math.PI / this.edges;
    }
    Palindrome.prototype.render = function () {
        var _this = this;
        this.renderer.clear();
        return this
            .getLines()
            .map(function (l) {
            return _this.renderer.writeLine(l);
        });
    };
    Palindrome.prototype.getLines = function () {
        var lines = new Array();
        // add baselines
        {
            var currentPoint = new Point(this.width * 0.5, 0);
            for (var i = 0.5; i <= this.edges; i++) {
                var zeroRotationPoint = new Point(this.edgeLength, 0);
                var nextPoint = new Point(zeroRotationPoint.x * Math.cos(-this.rotationRad * i)
                    + zeroRotationPoint.y * Math.sin(-this.rotationRad * i), -zeroRotationPoint.x * Math.sin(-this.rotationRad * i)
                    + zeroRotationPoint.y * Math.cos(-this.rotationRad * i))
                    .offset(currentPoint);
                lines.push(new Line(currentPoint, nextPoint));
                currentPoint = nextPoint;
            }
        }
        for (var i = this.edges;; i++) {
            var start = lines[i - 1].end;
            var targetBaseLine = lines[i - this.edges + 1];
            var _end = targetBaseLine.getPointAlongLine(this.shift);
            var targetBaseLineToTargetPoint = new Line(targetBaseLine.start, _end);
            if (i > 100000 || targetBaseLineToTargetPoint.length < 1 || targetBaseLineToTargetPoint.length > targetBaseLine.length) {
                break;
            }
            var newLine = new Line(start, _end);
            lines.push(newLine);
        }
        return lines;
    };
    return Palindrome;
}());
var ViewModel = (function () {
    function ViewModel() {
        this._edges = ko.observable(EDGES.toString());
    }
    Object.defineProperty(ViewModel.prototype, "edges", {
        get: function () {
            return parseInt(this._edges());
        },
        set: function (value) {
            this._edges(value.toString());
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewModel.prototype, "edgesObservable", {
        get: function () {
            return this._edges;
        },
        enumerable: true,
        configurable: true
    });
    return ViewModel;
}());
ko.bindingHandlers['palindrome'] = {
    update: function (elem, valueAccessor) {
        var viewModel = valueAccessor();
        var pal = new Palindrome(elem.clientWidth, viewModel.edges, new CanvasRenderer(elem));
        pal.render();
    }
};
ko.applyBindings(new ViewModel());
//# sourceMappingURL=palindrome.js.map