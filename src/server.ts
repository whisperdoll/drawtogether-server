import * as net from 'net';
import { Socket } from './socket';
import * as WebSocket from 'ws';
import { Canvas } from './canvas';
import { Point } from './point';
import * as fs from 'fs';

const port = 5080;
const canvas = new Canvas({
    canvasElement: document.getElementById("canvas") as HTMLCanvasElement,
    size: new Point(1920, 1080),
    opaque: true
});
canvas.context.lineJoin = 'round';
canvas.context.lineCap = 'round';

canvas.fill("white");

try {
    fs.mkdirSync('boards');
} catch (e) {
}

const wss = new WebSocket.Server({
    port
});

wss.on('connection', (ws) =>
{
    let socket = new Socket(ws);
    socket.on('data', handleData);
    socket.write('hi');
});

console.log('listening on port ' + port.toString());

const sockets : Socket[] = [];

interface DotData {
    pos: number[];
    size: number;
    color: string;
}

interface LineData {
    from: number[];
    to: number[];
    size: number;
    color: string;
}

interface EraseData {
    from: number[];
    to: number[];
    size: number;
}

function broadcast(command: string, data: any, exclude?: Socket) {
    sockets.forEach((socket) => {
        if (socket !== exclude) {
            socket.write(command, data);
        }
    });
}

function saveCanvas(buffer?: ArrayBuffer) {
    if (buffer) {
        fs.writeFile('boards/' + Date.now().toString() + '.png', new Buffer(buffer), () => {

        });
    } else {
        canvas.createBlob((blob) => {
            const reader = new FileReader();

            reader.onload = () => {
                saveCanvas(reader.result as ArrayBuffer);
            };

            reader.readAsArrayBuffer(blob);
        });
    }
}

function handleData(command : string, _data : any, socket : Socket) : void
{
    // console.log(command, data);
    switch (command) {
        case 'join':
            sockets.push(socket);
            socket.write('join', {
                size: canvas.size.toArray()
            });
            canvas.createBlob((blob) => {
                const reader = new FileReader();

                reader.onload = () => {
                    socket.writeArrayBuffer(reader.result as ArrayBuffer);
                    saveCanvas(reader.result as ArrayBuffer);
                };

                reader.readAsArrayBuffer(blob);
            });
            break;
        case 'line': {
            const data = _data as LineData;
            canvas.drawLine(Point.fromArray(data.from), Point.fromArray(data.to), data.color, data.size);
            broadcast(command, data);
            break;
        }
        case 'dot': {
            const data = _data as DotData;
            canvas.fillCircleInSquare(Point.fromArray(data.pos).minus(new Point(data.size / 2)), data.size, data.color);
            broadcast(command, data);
            break;
        }
        case 'erase': {
            const data = _data as EraseData;
            canvas.drawLine(Point.fromArray(data.from), Point.fromArray(data.to), 'white', data.size);
            broadcast(command, data);
            break;
        }
        case 'clear': {
            saveCanvas();
            canvas.fill('white');
            broadcast(command, _data);
        }
    }
}