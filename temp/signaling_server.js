
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: "ap-south-1" });
const dynamo = new AWS.DynamoDB({ apiVersion: '2012-08-10', region: "ap-south-1" });

exports.handler = async (event) => {
    console.log('Event: ', JSON.stringify(event));
    const connection_id = event.requestContext.connectionId;

    const postData = JSON.parse(event.body);
    
    const action = postData.action || ''
    
    if (action == '$connect') {
        console.log("Connecting ... ");
        return await add_connection(connection_id, postData);
    } else if (action == '$sendMessage') {
        console.log('sending message ... ')
        const type = postData.type;
        switch (type) {
            case 'establish_connection': 
                return await add_connection(connection_id, postData);
            case 'send_message':
                return await send_message(connection_id, postData, event)

        }
        const presenter_data = await query_dynamo(`101#presenter`)
        const presenter_conn_id = presenter_data.connection_id.S;
        console.log('presenter_conn_id', presenter_conn_id)
    }

    return true;
};

const add_connection = async (conn_id, input_obj) => {

    const identifer = input_obj.identifer
    const params = {
        TableName: "simplechat_connections",
        Item: {
            "pk": identifer,
            [input_obj.user_type]: conn_id,
        }
    };
    
    try {
        await documentClient.put(params).promise();
    } catch (err) {
      return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
    }
    
    return  { statusCode: 200, body: 'connected' };
}

const send_message = async (connectionId, postData, event) => {
        
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    try {
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: event.body }).promise();
        return { statusCode : 200, body: 'message sent'}
      } catch (e) {
        if (e.statusCode == 410) {
          console.log(`Found stale connection, deleting ${connectionId}`);
        } else {
          throw e;
        } 
        return {statusCode: 400, body: 'message fail to sent'}
      }
}

const update_dynamo = async (field, value) => {
    
    const params = {
            TableName: "simplechat_connections",
            Key: {
                connectionId: {
                    S: '101'
                }
            },
            ExpressionAttributeNames: {
                "#F": field
            },
            ExpressionAttributeValues: {
                ":v": {
                    S: value
                }
            },
            UpdateExpression: "set #F = :v",
            ReturnValues: "ALL_NEW",
    };
    console.log('Params : ', params)
    try {
        const data = await dynamo.updateItem(params).promise()
        console.log('Data : ', data)
    } catch (err) {
        console.log("Error", err);
    }


}

const query_dynamo = async (pk_value) => {
    const params = {
      ExpressionAttributeValues: {
       ":v1": {
         S: pk_value
        }
      }, 
      KeyConditionExpression: "connectionId = :v1", 
    //   ProjectionExpression: "SongTitle", 
      TableName: "simplechat_connections"
     };
     console.log({pk_value})
     const response =await dynamo.query(params).promise();
     console.log(response.Items)
    return response.Items[0];
}