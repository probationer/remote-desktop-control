import tkinter
import tkinter.messagebox
import struct
import socket
import websocket
import numpy as np
from PIL import Image, ImageTk
import threading
import re
from cv2 import cv2
import time
import sys
import platform

root = tkinter.Tk()

# picture period
IDLE = 0.05

# zoon in size
scale = 1

# Original transmission screen size
fixw, fixh = 0, 0

# zoom flag
wscale = False

# screen display canvas
showcan = None

# socket buffer size
bufsize = 10240

# threads
th = None

# socket
soc = None

# socks5
socks5 = None

# platforms
PLAT = b''
if sys.platform == "win32":
    PLAT = b'win'
elif sys.platform == "darwin":
    PLAT = b'osx'
elif platform.system() == "Linux":
    PLAT = b'x11'

# initialize socket
'''
def SetSocket():
    global soc, host_en

    def byipv4(ip, port):
        return struct.pack(">BBBBBBBBH", 5, 1, 0, 1, ip[0], ip[1], ip[2], ip[3], port)

    def byhost(host, port):
        d = struct.pack(">BBBB", 5, 1, 0, 3)
        blen = len(host)
        d += struct.pack(">B", blen)
        d += host.encode()
        d += struct.pack(">H", port)
        return d

    host = host_en.get()
    if host is None:
        tkinter.messagebox.showinfo('hint', 'Host Setting Error')
        return
    hs = host.split(":")
    if len(hs) != 2:
        tkinter.messagebox.showinfo('hint', 'Host Setting Error')
        return
    if socks5 is not None:
        ss = socks5.split(":")
        if len(ss) != 2:
            tkinter.messagebox.showinfo('hint', 'The proxy setting are wrong')
            return
        soc = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        soc.connect((ss[0], int(ss[1])))
        soc.send(struct.pack(">BB", 5, 0))
        recv = soc.recv(2)
        if recv[1] != 0:
            tkinter.messagebox.showinfo('hint', 'The agent responded with an error!')
            return
        if re.match(r'^\d+?\.\d+?\.\d+?\.\d+?:\d+$', host) is None:
            # host Domain name access
            hand = byhost(hs[0], int(hs[1]))
            soc.send(hand)
        else:
            # host ip access
            ip = [int(i) for i in hs[0].split(".")]
            port = int(hs[1])
            hand = byipv4(ip, port)
            soc.send(hand)
        # Proxy response
        rcv = b''
        while len(rcv) != 10:
            rcv += soc.recv(10-len(rcv))
        if rcv[1] != 0:
            tkinter.messagebox.showinfo('hint', 'The agent responded with an error!')
            return
    else:
        soc = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        soc.connect((hs[0], int(hs[1])))
'''

def SetScale(x):
    global scale, wscale
    scale = float(x) / 100
    wscale = True


def ShowProxy():
    # show proxy settings
    global root

    def set_s5_addr():
        global socks5
        socks5 = s5_en.get()
        if socks5 == "":
            socks5 = None
        pr.destroy()
    pr = tkinter.Toplevel(root)
    s5v = tkinter.StringVar()
    s5_lab = tkinter.Label(pr, text="Socks5 Host:")
    s5_en = tkinter.Entry(pr, show=None, font=('Arial', 14), textvariable=s5v)
    s5_btn = tkinter.Button(pr, text="OK", command=set_s5_addr)
    s5_lab.grid(row=0, column=0, padx=10, pady=10, ipadx=0, ipady=0)
    s5_en.grid(row=0, column=1, padx=10, pady=10, ipadx=40, ipady=0)
    s5_btn.grid(row=1, column=0, padx=10, pady=10, ipadx=30, ipady=0)
    s5v.set("127.0.0.1:88")


def ShowScreen():
    global showcan, root, soc, th, wscale
    if showcan is None:
        wscale = True
        showcan = tkinter.Toplevel(root)
        th = threading.Thread(target=run)
        th.start()
    else:
        soc.close()
        showcan.destroy()


val = tkinter.StringVar()
host_lab = tkinter.Label(root, text="Host:")
host_en = tkinter.Entry(root, show=None, font=('Arial', 14), textvariable=val)
sca_lab = tkinter.Label(root, text="Scale:")
sca = tkinter.Scale(root, from_=10, to=100, orient=tkinter.HORIZONTAL, length=100,
                    showvalue=100, resolution=0.1, tickinterval=50, command=SetScale)
proxy_btn = tkinter.Button(root, text="Proxy", command=ShowProxy)
show_btn = tkinter.Button(root, text="Show", command=ShowScreen)

host_lab.grid(row=0, column=0, padx=10, pady=10, ipadx=0, ipady=0)
host_en.grid(row=0, column=1, padx=0, pady=0, ipadx=40, ipady=0)
sca_lab.grid(row=1, column=0, padx=10, pady=10, ipadx=0, ipady=0)
sca.grid(row=1, column=1, padx=0, pady=0, ipadx=100, ipady=0)
proxy_btn.grid(row=2, column=0, padx=0, pady=10, ipadx=30, ipady=0)
show_btn.grid(row=2, column=1, padx=0, pady=10, ipadx=30, ipady=0)
sca.set(100)
val.set('127.0.0.1:80')

last_send = time.time()


def BindEvents(canvas):
    global soc, scale
    '''
    handle events
    '''
    def EventDo(data):
        soc.send(str(data))
        
    # left mouse button
    def LeftDown(e):
        return EventDo(struct.pack('>BBHH', 1, 100, int(e.x/scale), int(e.y/scale)))

    def LeftUp(e):
        return EventDo(struct.pack('>BBHH', 1, 117, int(e.x/scale), int(e.y/scale)))
    canvas.bind(sequence="<1>", func=LeftDown)
    canvas.bind(sequence="<ButtonRelease-1>", func=LeftUp)

    # right click
    def RightDown(e):
        return EventDo(struct.pack('>BBHH', 3, 100, int(e.x/scale), int(e.y/scale)))

    def RightUp(e):
        return EventDo(struct.pack('>BBHH', 3, 117, int(e.x/scale), int(e.y/scale)))
    canvas.bind(sequence="<3>", func=RightDown)
    canvas.bind(sequence="<ButtonRelease-3>", func=RightUp)

    # mouse wheel
    if PLAT == b'win' or PLAT == 'osx':
        # windows/mac
        def Wheel(e):
            if e.delta < 0:
                return EventDo(struct.pack('>BBHH', 2, 0, int(e.x/scale), int(e.y/scale)))
            else:
                return EventDo(struct.pack('>BBHH', 2, 1, int(e.x/scale), int(e.y/scale)))
        canvas.bind(sequence="<MouseWheel>", func=Wheel)
    elif PLAT == b'x11':
        def WheelDown(e):
            return EventDo(struct.pack('>BBHH', 2, 0, int(e.x/scale), int(e.y/scale)))
        def WheelUp(e):
            return EventDo(struct.pack('>BBHH', 2, 1, int(e.x/scale), int(e.y/scale)))
        canvas.bind(sequence="<Button-4>", func=WheelUp)
        canvas.bind(sequence="<Button-5>", func=WheelDown)

    # mouse swipe
    # send once every
    def Move(e):
        global last_send
        cu = time.time()
        if cu - last_send > IDLE:
            last_send = cu
            sx, sy = int(e.x/scale), int(e.y/scale)
            return EventDo(struct.pack('>BBHH', 4, 0, sx, sy))
    canvas.bind(sequence="<Motion>", func=Move)

    # keyboard
    def KeyDown(e):
        return EventDo(struct.pack('>BBHH', e.keycode, 100, int(e.x/scale), int(e.y/scale)))

    def KeyUp(e):
        return EventDo(struct.pack('>BBHH', e.keycode, 117, int(e.x/scale), int(e.y/scale)))
    canvas.bind(sequence="<KeyPress>", func=KeyDown)
    canvas.bind(sequence="<KeyRelease>", func=KeyUp)

def SetSocket():
    
    websocket.enableTrace(True)

    soc = websocket.WebSocket()
    soc.connect("wss://e9opf21h1c.execute-api.ap-south-1.amazonaws.com/production")
    # print(soc.recv())

def run():
    global wscale, fixh, fixw, soc, showcan
    SetSocket()
    # Send platform information
    soc.send(PLAT)
    lenb = soc.recv() #soc.recv(5)
    imtype, le = struct.unpack(">BI", lenb)
    imb = b''
    while le > bufsize:
        t = soc.recv() #soc.recv(bufsize)
        imb += t
        le -= len(t)
    while le > 0: 
        t = soc.recv() # soc.recv(le)
        imb += t
        le -= len(t)
    data = np.frombuffer(imb, dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    h, w, _ = img.shape
    fixh, fixw = h, w
    imsh = cv2.cvtColor(img, cv2.COLOR_RGB2RGBA)
    imi = Image.fromarray(imsh)
    imgTK = ImageTk.PhotoImage(image=imi)
    cv = tkinter.Canvas(showcan, width=w, height=h, bg="white")
    cv.focus_set()
    BindEvents(cv)
    cv.pack()
    cv.create_image(0, 0, anchor=tkinter.NW, image=imgTK)
    h = int(h * scale)
    w = int(w * scale)
    while True:
        if wscale:
            h = int(fixh * scale)
            w = int(fixw * scale)
            cv.config(width=w, height=h)
            wscale = False
        try:
            lenb = soc.recv() #soc.recv(5)
            imtype, le = struct.unpack(">BI", lenb)
            imb = b''
            while le > bufsize:
                t = soc.recv() #soc.recv(bufsize)
                imb += t
                le -= len(t)
            while le > 0:
                t = soc.recv() # soc.recv(le)
                imb += t
                le -= len(t)
            data = np.frombuffer(imb, dtype=np.uint8)
            ims = cv2.imdecode(data, cv2.IMREAD_COLOR)
            if imtype == 1:
                # full biography
                img = ims
            else:
                # differential transmission
                img = img ^ ims
            imt = cv2.resize(img, (w, h))
            imsh = cv2.cvtColor(imt, cv2.COLOR_RGB2RGBA)
            imi = Image.fromarray(imsh)
            imgTK.paste(imi)
        except:
            showcan = None
            ShowScreen()
            return


root.mainloop()
