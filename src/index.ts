import {
  dynamodbDescribeTable,
  // dynamodbScanTable,
  // dynamodbUpdateTweet,
  // getAllScannedResults,
  // sqsSendMessage,
} from "./aws";
import { Vendor } from "./types/vendor";

import dotenv from "dotenv";

dotenv.config();

const init = async () => {
  const res = await dynamodbDescribeTable("vendors");
  console.log(res);

  // const scan = dynamodbScanTable("vendors", 5);
  // console.log((await scan.next()).value);

  // const vendors = await getAllScannedResults<Vendor>(
  //   process.env.AWS_VENDORS_TABLE_NAME ?? ""
  // );
  // console.log("Vendors ", vendors);

  // const tweet = await dynamodbUpdateTweet(
  //   process.env.AWS_VENDORS_TABLE_NAME ?? "",
  //   {
  //     id: "tweet1",
  //     userId: "DCTacoTruck",
  //     name: "DC Taco Truck",
  //     text: "Test tweet",
  //     date: "06/02/23",
  //     geo: {
  //       id: "geo1",
  //       name: "Geo location 1",
  //       place_type: "place 1",
  //       full_name: "place 1",
  //       country: "USA",
  //       country_code: "USA",
  //       coordinates: {
  //         lat: 34.01283,
  //         long: 41.1818,
  //       },
  //     },
  //   },
  //   "DCTacoTruck"
  // );

  // console.log(tweet);

  // await sqsSendMessage(
  //   "https://sqs.us-east-2.amazonaws.com/414357402052/testqueue",
  //   "testmessage"
  // );
};

init();
