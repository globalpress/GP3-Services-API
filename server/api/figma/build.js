import fs from "fs";

import {
  updateAliasValues,
  formatToJsonCss,
  generateTailwindConfig,
  tokenVarsToCSSVars,
  jsonToCss,
  generateScssImportFile,
} from "~/server/helpers/figma";

const data = {
  componentTokens: [],
  variableTokens: [],
  jsonCss: {},
  tailwindConfig: {},
  cssVars: ``,
};

const saveFile = (file, data, format = "json") => {
  data = format === "json" ? JSON.stringify(data, null, 2) : data;
  fs.writeFileSync(`${file}`, data, "utf-8");
};

function convertInputToOutput(input) {
  const output = {};

  for (const [key, values] of Object.entries(input)) {
    output[key] = [];
    for (const [subKey, subValues] of Object.entries(values)) {
      if (typeof subValues === 'object' && subValues !== null) {
        for (const [subSubKey, value] of Object.entries(subValues)) {
          output[key].push({
            name: `${subKey}-${subSubKey}`,
            value: `${subKey}-${subSubKey}`,
          });
        }
      } else {
        output[key].push({
          name: `${subValues} (${subKey})`,
          value: subKey,
        });
      }
    }
  }

  return output;
}


export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { source, output } = body;
  let figmaData = JSON.parse(
    fs.readFileSync(
      `${source}/variables.json`,
      "utf-8"
    )
  );

  const tokens = updateAliasValues(figmaData);

  tokens.collections.forEach((collection) => {
    if (collection.name.startsWith("$")) {
      data.variableTokens.push(collection);
    } else {
      data.componentTokens.push(collection);
    }
  });

  data.jsonCss = formatToJsonCss(data.componentTokens);

  data.tailwindConfig = generateTailwindConfig(data.variableTokens);

  data.cssVars = tokenVarsToCSSVars(data.variableTokens);

  Object.entries(data.jsonCss).forEach(([key, value]) => {
    const css = jsonToCss(value);
    saveFile(`${output}/css/${key}.scss`, css, "scss");
  });

  data.storyBlokData = convertInputToOutput(data.tailwindConfig);

  Object.entries(data.storyBlokData).forEach(([key, value]) => {
    console.log(key);
    // const css = jsonToCss(value);
    saveFile(`${output}/storyblok/${key}.json`, value, "json");
  });

  saveFile(
    `${output}/css/_tokens.scss`,
    generateScssImportFile(data.jsonCss),
    "scss"
  );

  saveFile(
    `${output}/tailwind-extend.json`,
    generateTailwindConfig(data.variableTokens),
    "json"
  );

  saveFile(
    `${output}/css/_variables.css`,
    tokenVarsToCSSVars(data.variableTokens),
    "css"
  );
  
  saveFile(
    `${output}/data.json`,
    data,
    "json"
  );



  return { status: 200, body: { message: "Files generated", data } };
});
