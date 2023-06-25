import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import dotenv from "dotenv";
import { Tweet } from "./types/twitter";

import {
  DynamoDB,
  ScanCommand,
  ScanInput,
  ScanOutput,
} from "@aws-sdk/client-dynamodb";
import { Key } from "aws-sdk/clients/dynamodb";

dotenv.config();

// const { SQS } = AWS;

const dynamoDb = new DynamoDB({ region: "us-east-2" });
//onst sqs = new SQS();

// retrieve table definition.
export const dynamodbDescribeTable = async (tableName: string) => {
  try {
    const table = await dynamoDb.describeTable({
      TableName: tableName,
    });
    console.log("Table retrieved", table);
    return table;
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error("dynamodbDescribeTable error object unknown type");
  }
};

export const dynamodbScanTable = async function* (
  tablename: string,
  limit: number = 25,
  lastEvalKey?: Key
) {
  while (true) {
    const input = {
      TableName: tablename,
      Limit: limit,
    };

    try {
      const result = new ScanCommand(input);
      const response = await dynamoDb.send(result);

      let lastEvaluatedKey = response.LastEvaluatedKey;

      if (lastEvaluatedKey) {
        const nextScan: ScanInput = {
          ...input,
          ExclusiveStartKey: lastEvaluatedKey,
        };

        nextScan.ExclusiveStartKey = (result as ScanOutput).LastEvaluatedKey;
      }

      if (!response.Count) {
        return;
      }
      response.Items = response.Items?.map((item) => unmarshall(item));
      yield response;
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }
      throw new Error("dynamodbScanTable unexpected error");
    }
  }
};

export const getAllScannedResults = async <T>(
  tablename: string,
  limit: number = 25
) => {
  try {
    await dynamodbDescribeTable(tablename);

    const scanTable = await dynamodbScanTable(tablename, limit);

    const results: T[] = [];

    let isDone = false;
    while (!isDone) {
      const iterator = await scanTable.next();

      if (!iterator) {
        throw new Error("No iterator returned");
      }

      if (iterator.done || !iterator.value.LastEvaluatedKey) {
        isDone = true;
      }

      if (iterator.value) {
        iterator.value.Items!.forEach((result: any) => results.push(result));
      }
    }
    return results;
  } catch (e) {
    if (e instanceof Error) {
      throw e;
    }
    throw new Error("getAllScannedResults unexpected error");
  }
};

export const dynamodbUpdateTweet = async (
  tablename: string,
  tweet: Tweet,
  twitterId: string
) => {
  try {
    const input = {
      TableName: tablename,
      Key: marshall({ twitterId: twitterId }),
      UpdateExpression:
        "set #tweets = list_append(if_not_exists(#tweets, :empty_list), :tweet), #updated = :updated",
      ExpressionAttributeNames: {
        "#tweets": "tweets",
        "#updated": "updated",
      },
      ExpressionAttributeValues: marshall({
        ":tweet": [tweet],
        ":updated": Date.now(),
        ":empty_list": [],
      }),
    };

    const result = await dynamoDb.updateItem(input);
    console.log("Tweet update to record", result);
    return result;
  } catch (e) {
    if (e instanceof Error) {
      return e;
    }
    throw new Error("dynamodbUpdateTweet failed to updated");
  }
};

// export const sqsSendMessage = async (queueUrl: string, body: string) => {
//   try {
//     const params = (AWS.SQS.SendMessageRequest = {
//       MessageBody: body,
//       QueueUrl: queueUrl,
//     });

//     const result = await sqs.sendMessage(params).promise();
//     console.log("Send Message!", result);
//     return result;
//   } catch (e) {
//     if (e instanceof Error) {
//       return e;
//     }
//     throw new Error("sqsSendMessage failed to send message");
//   }
// };
