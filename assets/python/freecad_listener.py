import sys
import json
import socket
import threading
import traceback
import FreeCAD
import FreeCADGui

# This script is meant to be injected into FreeCAD via `FreeCAD.exe freecad_listener.py`
# It sets up a local TCP server that listens for JSON commands from FlyCLI.

HOST = '127.0.0.1'
PORT = 9099
for arg in sys.argv[1:]:
    try:
        PORT = int(arg)
        break
    except ValueError:
        pass

def handle_client(conn):
    buffer = ""
    while True:
        try:
            data = conn.recv(4096)
            if not data:
                break
            buffer += data.decode('utf-8')
            
            while '\n' in buffer:
                line, buffer = buffer.split('\n', 1)
                line = line.strip()
                if not line:
                    continue
                
                try:
                    request = json.loads(line)
                    process_request(request, conn)
                except json.JSONDecodeError:
                    send_response(conn, {"status": "ERROR", "error": {"message": "Invalid JSON"}})
        except Exception as e:
            FreeCAD.Console.PrintError(f"IPC Error: {e}\n")
            break
    conn.close()

def process_request(request, conn):
    req_id = request.get('id', 'unknown')
    action = request.get('action')
    
    if action == 'EXECUTE_SCRIPT':
        code = request.get('payload', {}).get('code', '')
        # Execute the code in the main thread using GUI update or directly if thread-safe
        # For FreeCAD, modifying document is generally safe if GUI is locked, but best done carefully.
        def execute_in_gui():
            try:
                # We provide a global environment
                env = {"FreeCAD": FreeCAD, "FreeCADGui": FreeCADGui, "App": FreeCAD, "Gui": FreeCADGui}
                exec(code, env)
                FreeCAD.ActiveDocument.recompute()
                send_response(conn, {"id": req_id, "status": "SUCCESS", "data": {}})
            except Exception as e:
                err_msg = traceback.format_exc()
                send_response(conn, {"id": req_id, "status": "ERROR", "error": {"type": type(e).__name__, "message": str(e), "traceback": err_msg}})
        
        # FreeCADGui.updateGui() or similar might be needed depending on OS,
        # but for simple macro execution, calling it directly might work in a background thread if FreeCAD allows it.
        # Ideally, we should post an event to the main GUI thread.
        # For this MVP, we try direct execution.
        execute_in_gui()

    elif action == 'GET_STATE':
        doc = FreeCAD.ActiveDocument
        if not doc:
            send_response(conn, {"id": req_id, "status": "SUCCESS", "data": {"objects": []}})
            return
        
        objs = []
        for obj in doc.Objects:
            props = {}
            for prop in obj.PropertiesList:
                try:
                    props[prop] = str(getattr(obj, prop))
                except:
                    pass
            objs.append({"name": obj.Name, "type": obj.TypeId, "properties": props})
            
        send_response(conn, {"id": req_id, "status": "SUCCESS", "data": {"objects": objs}})
    else:
        send_response(conn, {"id": req_id, "status": "ERROR", "error": {"message": f"Unknown action: {action}"}})

def send_response(conn, response):
    try:
        msg = json.dumps(response) + "\n"
        conn.sendall(msg.encode('utf-8'))
    except Exception as e:
        FreeCAD.Console.PrintError(f"Failed to send response: {e}\n")

def start_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((HOST, PORT))
    server.listen(1)
    FreeCAD.Console.PrintMessage(f"FlyCLI IPC Listener started on {HOST}:{PORT}\n")
    
    while True:
        conn, addr = server.accept()
        FreeCAD.Console.PrintMessage(f"Connected to FlyCLI: {addr}\n")
        client_thread = threading.Thread(target=handle_client, args=(conn,))
        client_thread.daemon = True
        client_thread.start()

# Start the server in a background thread so we don't block the FreeCAD GUI
server_thread = threading.Thread(target=start_server)
server_thread.daemon = True
server_thread.start()
