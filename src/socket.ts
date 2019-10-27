import { EventClass } from "./eventclass";
import * as WebSocket from "ws";

type SocketDataObject =
{
    command: string,
    data: any
};

export class Socket extends EventClass
{
    private socket : WebSocket;

    constructor(socket : WebSocket)
    {
        super(
            "data"
        );

        this.socket = socket;

        socket.on("message", (dataString : string) =>
        {
            let data = <SocketDataObject>JSON.parse(dataString);
            this.emitEvent("data", data.command, data.data, this);
        });
    }

    public write(command : string, data? : any)
    {
        let toSend =
        {
            command: command,
            data: data
        };

        this.socket.send(JSON.stringify(toSend));
    }

    public writeArrayBuffer(arrayBuffer: ArrayBuffer) {
        this.socket.send(arrayBuffer);
    }
}