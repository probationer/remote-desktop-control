
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB({ apiVersion: '2012-08-10', region: "ap-south-1" });

const updateItem = async () => {
    // Set the parameters.
    const params = {
        TableName: "simplechat_connections",
        Key: {
            connectionId: {
                S: "101"
            }
        },
        ExpressionAttributeNames: {
            "#PR": "controller"
        },
        ExpressionAttributeValues: {
            ":p": {
                S: "222111"
            }
        },
        UpdateExpression: "set #PR = :p",
        ReturnValues: "ALL_NEW",
    };
    try {
        documentClient.updateItem(params, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data);           // successful response
        })
        // return data;
    } catch (err) {
        console.log("Error", err);
    }
};

updateItem()