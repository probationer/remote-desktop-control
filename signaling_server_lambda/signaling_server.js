
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10', region: "ap-south-1" });
const dynamo = new AWS.DynamoDB({ apiVersion: '2012-08-10', region: "ap-south-1" });
const OTHER_USER = {
    sender: 'receiver',
    receiver: 'sender'
}

exports.handler = async (event, context) => {
    console.log('Event: ', JSON.stringify(event));
    const connection_id = event.requestContext.connectionId;
    const action = event.requestContext.routeKey || '';

    if (action == '$connect') {
        console.log('Connecting ... ');
        return await add_connection(connection_id, event.body);
    } else if (action == '$default') {
        console.log('Sending Message ... ');
        const body = JSON.parse(event.body);
        const type = body.type;
        switch (type) {
            case 'establish_connection':
                return await add_connection(connection_id, body);
            case 'send_message':
            case 'mouse_movement':
            case 'mouse_click':
                const other_connection_id = await query_dynamo(body.identifer, body.user_type);
                console.log('other_connection_id: ', other_connection_id)
                return await send_message(other_connection_id, body, event)
            default:
                return false;
        }
    }

    return { statusCode: 502 };
};

const add_connection = async (conn_id, input_obj) => {
    const { identifer, type, user_type } = input_obj;
    try {
        await update_dynamo(identifer, user_type, conn_id)
        // await documentClient.put(params).promise();
    } catch (err) {
        return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
    }
    return { statusCode: 200, body: 'connected' };
}

const send_message = async (connectionId, body, event) => {

    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });

    try {
        await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: event.body }).promise();
        return { statusCode: 200, body: 'message sent' }
    } catch (e) {
        if (e.statusCode == 410) {
            console.log(`Found stale connection, deleting ${connectionId}`);
        } else {
            throw e;
        }
        return { statusCode: 400, body: 'message fail to sent' }
    }
}

const update_dynamo = async (pk, field, value) => {

    const params = {
        TableName: "simplechat_connections",
        Key: {
            pk: {
                S: pk
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
        console.log('Data: ', data)
    } catch (err) {
        console.log('Error: ', err);
    }
}

const query_dynamo = async (pk_value, user_type = null) => {
    const params = {
        ExpressionAttributeValues: {
            ":v1": {
                S: pk_value
            }
        },
        KeyConditionExpression: "pk = :v1",
        TableName: "simplechat_connections"
    };
    console.log({ pk_value })
    const response = await dynamo.query(params).promise();
    console.log(response.Items, 'user_type : ', OTHER_USER[user_type])
    return response.Items[0][OTHER_USER[user_type]].S;
}