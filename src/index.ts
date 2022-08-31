import * as cheerio from "cheerio";
import { logger } from "./logger";
import {
  createMaster,
  createProvinceList,
  getDate,
  getFuels,
  saveTimeSeries,
} from "./utils";

const originalFetch = require("cross-fetch");
const fetch = require("fetch-retry")(originalFetch);

const main = async () => {
  const doc = await fetch("https://mypertamina.id/fuels-harga", {
    retries: 7,
    retryDelay: 500,
  }).then((resp) => resp.text());
  logger.infp("Success fetch data from mypertamina.id");

  const $ = cheerio.load(doc);

  const date = getDate($);
  logger.info("Success extract date");
  const fuels = getFuels($);
  logger.info("Success extract fuels data");
  createProvinceList(fuels);

  const data = { date, data: fuels };

  saveTimeSeries(data, date);
  logger.info("Success save time series data");
  createMaster();
  logger.info("Success create master data");
};

main();
