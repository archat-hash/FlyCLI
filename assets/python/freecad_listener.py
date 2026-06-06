import sys
import json
import socket
import threading
import traceback
import FreeCAD
import FreeCADGui

# Import PySide2 for thread-safe GUI execution
from PySide2 import QtCore

class ScriptExecutor(QtCore.QObject):
    execute_signal = QtCore.Signal(object)
    
    def __init__(self):
        super().__init__()
        self.execute_signal.connect(self._run_script, QtCore.Qt.QueuedConnection)
        
    def _run_script(self, func):
        func()
        
    def run_in_gui(self, func):
        self.execute_signal.emit(func)

# This executor must be instantiated in the main thread (during module import)
executor = ScriptExecutor()

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
        
        import queue
        res_queue = queue.Queue()

        def execute_in_gui():
            try:
                env = {"FreeCAD": FreeCAD, "FreeCADGui": FreeCADGui, "App": FreeCAD, "Gui": FreeCADGui}
                exec(code, env)
                if FreeCAD.ActiveDocument:
                    FreeCAD.ActiveDocument.recompute()
                res_queue.put({"status": "SUCCESS", "data": {}})
            except Exception as e:
                err_msg = traceback.format_exc()
                res_queue.put({"status": "ERROR", "error": {"type": type(e).__name__, "message": str(e), "traceback": err_msg}})
        
        executor.run_in_gui(execute_in_gui)
        
        try:
            res = res_queue.get(timeout=15)
            if res["status"] == "SUCCESS":
                send_response(conn, {"id": req_id, "status": "SUCCESS", "data": res["data"]})
            else:
                send_response(conn, {"id": req_id, "status": "ERROR", "error": res["error"]})
        except queue.Empty:
            send_response(conn, {"id": req_id, "status": "ERROR", "error": {"message": "Execution timed out in GUI thread"}})

    elif action == 'GET_STATE':
        import queue
        res_queue = queue.Queue()

        def get_state_in_gui():
            try:
                doc = FreeCAD.ActiveDocument
                if not doc:
                    res_queue.put({"status": "SUCCESS", "data": {"objects": []}})
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
                res_queue.put({"status": "SUCCESS", "data": {"objects": objs}})
            except Exception as e:
                err_msg = traceback.format_exc()
                res_queue.put({"status": "ERROR", "error": {"type": type(e).__name__, "message": str(e), "traceback": err_msg}})

        executor.run_in_gui(get_state_in_gui)

        try:
            res = res_queue.get(timeout=5)
            if res["status"] == "SUCCESS":
                send_response(conn, {"id": req_id, "status": "SUCCESS", "data": res["data"]})
            else:
                send_response(conn, {"id": req_id, "status": "ERROR", "error": res["error"]})
        except queue.Empty:
            send_response(conn, {"id": req_id, "status": "ERROR", "error": {"message": "Get state timed out in GUI thread"}})
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
