

exports.handler = async (event, context) => {
    console.log(' Message : ', JSON.stringify(event));
    return {
        statusCode: 200,
    };
}