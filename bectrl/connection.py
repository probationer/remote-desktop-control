import websocket

# ws = websocket.WebSocket()
# ws.connect("wss://e9opf21h1c.execute-api.ap-south-1.amazonaws.com/production", timeout=5)


# def on_message(wsapp, message):
#     print(message)

# wsapp = websocket.WebSocketApp("ws://e9opf21h1c.execute-api.ap-south-1.amazonaws.com/production",
#   header={"CustomHeader1":"123", "NewHeader2":"Test"}, on_message=on_message)
# # wsapp.run_forever()
# wsapp.send()

# websocket.enableTrace(True)

ws = websocket.WebSocket()
ws.connect("wss://e9opf21h1c.execute-api.ap-south-1.amazonaws.com/production")
ws.send("Hello, Server")
# ws.send("Line 2")
# ws.send("Line 3")
# print("Recived message: ", ws.recv())












# ws.close(websocket.STATUS_PROTOCOL_ERROR)

# print(ws)
# setx AWS_ACCESS_KEY_ID AKIAVPODTNOP4EYCMV65
# setx AWS_SECRET_ACCESS_KEY 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
# setx AWS_DEFAULT_REGION ap-south-1



# def on_message(wsapp, message):
#     print(message)

# wsapp = websocket.WebSocketApp("wss://testnet-explorer.binance.org/ws/block",
#   header={"CustomHeader1":"123", "NewHeader2":"Test"}, on_message=on_message)
# wsapp.run_forever()