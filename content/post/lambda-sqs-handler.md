+++
date = "2016-09-11T15:00:41+03:00"
draft = false
title = "Handling SQS queue with AWS Lambda"
description = "Basic example how to setup Simple Queue Service consumer based on AWS Lambda"
tags = [ "SQS", "Lambda", "Serverless", "Apex" ]
thumbnail = "images/sqs/aws-sqs-logo.png"
+++

Batch workers are one of the common patterns to separate more heavyweight data processing background jobs from the main application. That's all great, but to do this you usually need to create a separate server/instance/container job for this and do the maintenance. This could be easily changed by using serverless architecture, provided by Azure, Google, Amazon etc.

In this blog post, we are using specifically Amazon's technology Lambda and SQS. Beside the Simple Queue Service there are also other similar purpose services:

  - [Amazon Kinesis Streams](https://aws.amazon.com/kinesis/streams/) - similar to Kafka, high throughput(consumer shard), more near-realtime oriented.

  - [Simple Notification Service](https://aws.amazon.com/sns/) - push notification service, mostly for fanout messages, email, SMS, HTTP, Lambda etc.

Whenever possible use SNS, because it is easier to use with Lambda, as it allows direct function execution without separate polling mechanism. The downside is that when the message is consumed/received there is no built-in guarantee mechanism. SQS, on the other hand, has a guarantee and also Dead Letter Queue mechanism when the job is consumed you could remove it from the queue. Or after four failure process retries, the job is moved to Dead Letter Queue so you could later investigate the caused problem.

Consuming SQS messages with Lambda is more complicated as it won't get triggered as the message lands to queue. Instead, there is a need to have separate polling mechanism, which means the Lambda has to be running whole the process. That's against the Lambda philosophy, run the function only when needed. Still, it might be cheaper to run Lambdas then using separate servers with the operational cost. This could be the alternative you are looking for, so let's dive in.

Deploying and managing the Lambdas is quite difficult and messy job, to make this easier we use tool [Apex](http://apex.run/). Compared to other CLI solutions it's lightweight and does provide the minimum set of features to manage your Lambdas. It's written in GO, so no library dependency hell. Show me the code, already!

The queue consumer flow is split into separate module ~110LOC:

{{< highlight javascript >}}
"use strict";

const R        = require("ramda");
const AWS      = require("aws-sdk");
const PromiseB = require("bluebird");

const cop = PromiseB.coroutine;

const defaultOptions = {
    queueURL:            "https://sqs.us-east-1.amazonaws.com/get-from-AWS",
    lambdaName:          "your-lambda-function-name",
    region:              "us-east-1",
    maxNumberOfMessages: 10,
    visibilityTimeout:   10,
    waitTimeSeconds:     20,
};

const defaultExecuteFn = message => {
    return new PromiseB((resolve, reject) => {
        console.log("NOOP execute function, executed ", message);
        return resolve(message);
    });
};

const formatMessages = R.map(m => ({
    Id:            R.prop("MessageId", m),
    ReceiptHandle: R.prop("ReceiptHandle", m),
}));


function Queue (options, executeFn) {
    this.executeFn = executeFn || defaultExecuteFn;
    this.options   = R.merge(defaultOptions, options);
    console.log("End values", this.options, options);

    const sqsParams = {
        apiVersion: "2012-11-05",
        region:     this.options.region,
    };
    this.SQS = new AWS.SQS(sqsParams);

    const lambdaParams = {
        apiVersion: "2015-03-31",
        region:     this.options.region,
    };
    this.lambda = new AWS.Lambda(lambdaParams);
};

Queue.prototype.poll = cop(function* () {
    console.log("Started polling");
    const queueResult = yield this.getMessages();

    const messages = R.pathOr([], ["Messages"], queueResult);
    console.log("Received messages ", messages);

    // Execute function
    const promises = messages.map(this.executeFn);

    // Filter out the fulfilled promises
    const messageValues = yield PromiseB.all(promises.map(p => p.reflect()))
        .filter(inspect => inspect.isFulfilled())
        .map(inspect => inspect.value());

    // Remove from queue only fulfilled messages
    if (messageValues.length > 0) {
        console.log("Remove messages");
        yield this.removeFromQueue(messageValues);
    }

    // NB! No yield here also notice the InvocationType: "Event"
    return this.recursiveCall();
});

Queue.prototype.getMessages = function () {
    const params = {
        QueueUrl:            this.options.queueURL,
        MaxNumberOfMessages: this.options.maxNumberOfMessages,
        VisibilityTimeout:   this.options.visibilityTimeout,
        WaitTimeSeconds:     this.options.waitTimeSeconds,
    };

    return this.SQS.receiveMessage(params)
        .promise();
};

Queue.prototype.removeFromQueue = function (messages) {
    const params = {
        // Format the messages as only ID and receipt are needed
        QueueUrl: this.options.queueURL,
        Entries: formatMessages(messages),
    };

    return this.SQS.deleteMessageBatch(params)
        .promise();
};

Queue.prototype.recursiveCall = function () {
    const params = {
        FunctionName: this.options.lambdaName,
        InvocationType: "Event",
    };

    return this.lambda
        .invoke(params)
        .promise();
};

module.exports = Queue;
{{< /highlight >}}

The most interesting part is the `poll` function, here is the high-level view of the flow:


  - Wait until messages are received from a queue, the maximum is 10 (defined by SQS API).
  - Format the results, the job message is text based so you have to do the parsing part if you want to use JSON for example.
  - Execute the jobs using the message as input, make sure the processing part is as small as possible.
  - When all the jobs have been executed, filter out the jobs that succeeded and remove these from the queue.
  - Lastly invoke the same Lambda function, to start the whole flow again.

The Lambda function's code is quite small, mostly contains the settings and queue handling function.

{{< highlight javascript >}}
const PromiseB = require("bluebird");
const SQSQueue = require("./sqs-queue");

const options = {
    queueURL:   process.env.QUEUE_URL,
    lambdaName: process.env.LAMBDA_FUNCTION_NAME,
    regions:    process.env.AWS_REGION,
};

// Here is the function you need replace with whatever job you would execute
const executeFn = message => {
    return new PromiseB((resolve, reject) => {
        console.log("My exec ", message);
        return resolve(message);
    });
};

// Create a queue instance
const queue = new SQSQueue(options, executeFn);

exports.handle = function (e, ctx, cb) {
    return queue.poll()
        .then(() => ctx.succeed({ done: true }))
        .catch(err => {
            console.error(err);
            ctx.fail(err);
        });
}
{{< /highlight >}}

That's all amazing, but how do you stop the job if it's recursively calling the Lambda function again? Good question, currently there isn't such mechanism implemented. One possible solution would be to use special SQS message with a payload that could be identified and then stop next function call. Currently, you have to delete the Lambda function and redeploy when needed which isn't hard with Apex `apex deploy sqs-queue-handler` and `apex delete sqs-queue-handler`.

How much does it cost? It's hard to calculate the exact cost, but let's do the calculation based on assumptions [AWS Lambda Pricing Calculator](https://s3.amazonaws.com/lambda-tools/pricing-calculator.html).

  - The 128MB Lambda function is used in this example, using more memory means the cost is higher.

  - Estimated execution time is 20 Seconds.

  - Execution time is a full month, as the Lambda needs to poll the server all time. 31 Days * 24 Hours * 60 Minutes * 60 Seconds = 2678400 Seconds

  - So the Lambda is executed 133920 times.


The total cost for Lambda would be $5.61/month + SQS polling operations. The other things you might consider is to add Cloudwatch alerts when the Lambda executions have stopped it means there's something wrong in execution flow. If there are new messages created faster than consumed, consider adding multiple Lambdas to consume the same queue.
