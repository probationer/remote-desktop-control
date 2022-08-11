import struct
import socket
import websocket
from PIL import ImageGrab
from cv2 import cv2
import numpy as np
import threading
import time
import pyautogui as ag
import mouse
from _keyboard import getKeycodeMapping
import json

# picture period
IDLE = 0.05

# Mouse wheel sensitivity
SCROLL_NUM = 5

bufsize = 1024

# print(ws.recv())


# Compression ratio 1-100 The smaller the value, 
# the higher the compression ratio and the more serious 
# the loss of image quality.
IMQUALITY = 50

lock = threading.Lock()

# if sys.platform == "win32":
# elif platform.system() == "Linux":
#     from ._keyboard_x11 import keycodeMapping
# elif sys.platform == "darwin":
#     from ._keyboard_osx import keycodeMapping


def ctrl(conn):
    '''
    Read control commands and restore operations locally
    '''
    print(conn.recv())
    keycodeMapping = {}
    def Op(key, op, ox, oy):
        # print(key, op, ox, oy)
        if key == 4:
            # mouse movement
            mouse.move(ox, oy)
        elif key == 1:
            if op == 100:
                # left button pressed
                ag.mouseDown(button=ag.LEFT)
            elif op == 117:
                # left button up
                ag.mouseUp(button=ag.LEFT)
        elif key == 2:
            # wheel event
            if op == 0:
                # up
                ag.scroll(-SCROLL_NUM)
            else:
                # down
                ag.scroll(SCROLL_NUM)
        elif key == 3:
            # right click
            if op == 100:
                # right click
                ag.mouseDown(button=ag.RIGHT)
            elif op == 117:
                # right click up
                ag.mouseUp(button=ag.RIGHT)
        else:
            k = keycodeMapping.get(key)
            if k is not None:
                if op == 100:
                    ag.keyDown(k)
                elif op == 117:
                    ag.keyUp(k)
    try:
        plat = b''
        while True:
            plat += conn.recv() #conn.recv(3-len(plat))
            if len(plat) == 3:
                break
        print("Plat:", plat.decode())
        keycodeMapping = getKeycodeMapping(plat)
        base_len = 6
        while True:
            cmd = b''
            rest = base_len - 0
            while rest > 0:
                cmd += conn.recv() #conn.recv(rest)
                rest -= len(cmd)
            key = cmd[0]
            op = cmd[1]
            x = struct.unpack('>H', cmd[2:4])[0]
            y = struct.unpack('>H', cmd[4:6])[0]
            Op(key, op, x, y)
    except:
        return


def ctrl_mouse(conn):
    # mouse movement
    event = json.loads(conn.recv())
    coordinates = event.get('coordinates', '' )
    ox = coordinates.get('x')
    oy = coordinates.get('y')
    mouse.move(ox, oy, absolute=False, duration=0.1)

# compressed np image
img = None
# encoded image
imbyt = None


def handle(conn):
    global img, imbyt
    lock.acquire()
    if imbyt is None:
        imorg = np.asarray(ImageGrab.grab())
        _, imbyt = cv2.imencode(
            ".jpg", imorg, [cv2.IMWRITE_JPEG_QUALITY, IMQUALITY])
        imnp = np.asarray(imbyt, np.uint8)
        img = cv2.imdecode(imnp, cv2.IMREAD_COLOR)
    lock.release()
    lenb = struct.pack(">BI", 1, len(imbyt))
    print('lenb', lenb)
    print("lenb unicode:", lenb.decode('unicode_escape'))
    # print("lenb unicode decode:", lenb.decode('unicode_escape').encode('unicode_escape'))
    conn.send(lenb.decode('unicode_escape'))
    conn.send(imbyt)
    print(conn.recv())
    while True:
        # fix for linux
        time.sleep(IDLE)
        gb = ImageGrab.grab()
        imgnpn = np.asarray(gb)
        _, timbyt = cv2.imencode(
            ".jpg", imgnpn, [cv2.IMWRITE_JPEG_QUALITY, IMQUALITY])
        imnp = np.asarray(timbyt, np.uint8)
        imgnew = cv2.imdecode(imnp, cv2.IMREAD_COLOR)
        # Calculate image difference
        imgs = imgnew ^ img
        if (imgs != 0).any():
            # image quality change
            pass
        else:
            continue
        imbyt = timbyt
        img = imgnew
        # lossless compression
        _, imb = cv2.imencode(".png", imgs)
        l1 = len(imbyt)  # original image size
        l2 = len(imb)  # difference image size
        if l1 > l2:
            # transmit differentiated images
            lenb = struct.pack(">BI", 0, l2)
            conn.send(lenb.decode('unicode_escape'))
            conn.send(imb.decode('unicode_escape'))
        else:
            # Pass the original encoded image
            lenb = struct.pack(">BI", 1, l1)
            conn.send(lenb.decode('unicode_escape'))
            conn.send(imbyt.decode('unicode_escape'))

websocket.enableTrace(True)
ws = websocket.WebSocket()
ws.connect("wss://e9opf21h1c.execute-api.ap-south-1.amazonaws.com/production")
ws.send(json.dumps({"action": "$connect", "client_type": "presenter"}))
print(ws.recv())

while True:
    try: 
        # threading.Thread(target=handle, args=(ws,)).start()
        # print(ws.recv())
        threading.Thread(target=ctrl_mouse, args=(ws,)).start()
    except Exception as er:
        print('ER : ', er)

