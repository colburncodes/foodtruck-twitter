import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import AWS from "aws-sdk";
import dotenv from "dotenv";
import { Tweet } from "./types/twitter";

dotenv.config();

//AWS.config.update({ region: process.env.AWS_REGION });

AWS.config.update({ region: "us-east-2" });

const { DynamoDB } = AWS;

const dynamoDb = new DynamoDB();

// retrieve table definition.
export const dynamodbDescribeTable = async (tableName: string) => {
  try {
    const table = await dynamoDb
      .describeTable({
        TableName: tableName,
      })
      .promise();
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
  lastEvaluatedKey?: AWS.DynamoDB.Key
) {
  while (true) {
    const params: AWS.DynamoDB.ScanInput = {
      TableName: tablename,
      Limit: limit,
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    try {
      const result = await dynamoDb.scan(params).promise();
      if (!result.Count) {
        return;
      }

      lastEvaluatedKey = (result as AWS.DynamoDB.ScanOutput).LastEvaluatedKey;
      result.Items = result.Items?.map((item) => unmarshall(item));
      yield result;
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
    const params: AWS.DynamoDB.UpdateItemInput = {
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
    const result = await dynamoDb.updateItem(params).promise();
    console.log("Tweet add to record");
    return result;
  } catch (e) {
    if (e instanceof Error) {
      return e;
    }
    throw new Error("dynamodbUpdateTweet failed to updated");
  }
};
