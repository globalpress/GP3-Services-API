const UNIT = "px";

const prepareName = (variable) => {
  let n = variable.name.includes("/")
    ? variable.name.split("/").join("-")
    : variable.name;
  
    if (n.includes("․")) n = n.replace("․", ".");

  return n;
};

const lookupVariable = (
  input,
  modeName,
  variableReferenceCollection,
  variableValueName,
  variable
) => {
  // look in the collection for variableReferenceCollection
  const dataCollection = input.collections.find(
    (collection) => collection.name === variableReferenceCollection
  );
  // console.log(dataCollection);
  // look for matching mode
  let dataMode = dataCollection.modes.find((mode) => mode.name === modeName);
  // if data mode, look for matching variable
  if (!dataMode) dataMode = dataCollection.modes[0];
  if (dataMode) {
    const dataVariable = dataMode.variables.find(
      (variable) => variable.name === variableValueName
    );
    const isObject = typeof dataVariable.value === "object";

    if (isObject) {
      return lookupVariable(
        input,
        modeName,
        dataVariable.value.collection,
        dataVariable.value.name,
        variable
      );
    }
    const dataName = prepareName(dataVariable);
    const last = variable.name.split("/").pop();
    let tailwindClass = `${last}-${prepareName(dataVariable)}`;
    if (variableValueName === "DEFAULT") tailwindClass = last;
    return { name: dataName, value: dataVariable.value, tailwindClass };
  }
};

export const updateAliasValues = (input) => {
  input.collections.map((collection) => {
    collection.modes.map((mode) => {
      mode.variables.map((variable) => {
        if (variable.isAlias) {
          const modeName = mode.name;
          const variableReferenceCollection = variable.value.collection;
          const variableValueName = variable.value.name;
          let data = lookupVariable(
            input,
            modeName,
            variableReferenceCollection,
            variableValueName,
            variable
          );
          variable.data = data;
        } else {
          // not an object so it is not a tailwind class for sure
          let tailwindClass = "";
          if (variable.value === "-") {
            const last = variable.name.split("/").pop();
            tailwindClass = last;
          } else {
            if (!collection.name.startsWith("$")) {
              let last = variable.name.split("/").pop();

              // console.log(variable.type);

              tailwindClass = `${last}-${variable.value}`;

              if (variable.type === "string")
                tailwindClass = `${last}-${variable.value}`;
              if (variable.type === "color")
                tailwindClass = `${last}-[${variable.value}]`;

              if (variable.type === "number") {
                const isArbitrary = variable.name.includes("[") && variable.name.includes("]") && !variable.name.includes("=");
                const hasUnit = variable.name.includes("(") && variable.name.includes(")");
                const unit = hasUnit ? variable.name.split("(").pop().split(")")[0] : UNIT;
                if(hasUnit) {
                  // remove ( and ) from name
                  variable.name = variable.name.replace(`-(${unit})`, "");
                  // remove unit from last
                  last = variable.name.split("/").pop();
                }
                if(isArbitrary) {
                  // remove [ and ] from name
                  variable.name = variable.name.replace("[", "").replace("]", "");
                  last = variable.name.split("/").pop();
                  tailwindClass = `${last}-[${variable.value}${unit}]`;
                }
              }

              if(variable.type === "string") {
                const isArbitrary = variable.name.includes("[") && variable.name.includes("]") && !variable.name.includes("=");

                if(variable.type === "string" && isArbitrary) {
                  // remove [ and ] from name
                  variable.name = variable.name.replace("[", "").replace("]", "");
                  last = variable.name.split("/").pop();
                  tailwindClass = `${last}-[${variable.value}]`;
                }
              }
            }
          }

          const dataName = prepareName(variable);
          variable.data = {
            name: dataName,
            value: variable.value,
            tailwindClass,
          };
        }
        return variable;
      });
    });
  });
  return input;
};

/**
 * Converts JSON object to CSS classes using tailwind css
 * @param {Object} jsonCss - The JSON object representing the CSS styles.
 * @returns {string} - The generated CSS classes.
 */
export const jsonToCss = (jsonCss) => {
  class Css {
    /**
     * Converts JSON object to CSS classes.
     * @param {Object} json - The JSON object representing the CSS styles.
     * @returns {string} - The generated CSS classes.
     */
    static of(json) {
      const selectors = Object.keys(json);
      return selectors
        .map((selector) => {
          // console.log('selector', selector);
          const buildClasses = (definition, isDark) => {
            const names = Object.keys(definition);
            // console.log(names);
            let result = names.map((name) => {
              
              let variable = definition[name];

              if (variable === "-") return `${name}`;
              if (variable === "DEFAULT") return `${name}`;

              // console.log(name);
  
              if (
                variable.includes("text_color") ||
                variable.includes("text_size") ||
                variable.includes("border_color") ||
                variable.includes("border_width")
              ) {
                variable = variable.replace("text_color", "text");
                variable = variable.replace("text_size", "text");
                variable = variable.replace("border_color", "border");
                variable = variable.replace("border_width", "border");
              }
  
              let finalClass = `${variable}`;
              finalClass = isDark ? `dark:${variable}` : finalClass;
  
              // due to the nature of how tailwind classes work sometimes the result is rounded-rounded but we want rounded
              // so we split the string by - and remove duplicates
              const words = finalClass.split("-");
              const uniqueWords = [...new Set(words)];
              finalClass = uniqueWords.join("-");
  
              return finalClass;
            });
            return result;
          }
          const isDark = selector.endsWith("-dark");
          let classes = buildClasses(json[selector], isDark);

          selector = selector.replace("-dark", "");
          // remove commas from result
          classes = classes.join(" ");

          // if selector does not have _ add a dot . for class
          if (!selector.includes("_")) {
            selector = `.${selector}`;
          } else {
            selector = selector.replace("_", "");
          }

          const comment = isDark ? "/* Dark mode classes */" : "";

          return `${comment}\n${selector} {\n\t@apply ${classes}\n}`;
        })
        .join("\t");
    }
  }

  return Css.of(jsonCss);
};

/**
 * Generates an SCSS import file based on the provided CSS as JSON object.
 *
 * @param {Object} cssAsJson - The CSS as JSON object.
 * @returns {string} The generated import file as a string.
 */
export const generateScssImportFile = (cssAsJson) => {
  // generate import file
  let importFile = "";
  Object.keys(cssAsJson).forEach((key) => {
    importFile += `@import './${key}';\n`;
  });
  return importFile;
};

export const formatToJsonCss = (input) => {
  const result = {};
  input.forEach((component) => {
    const { mode, name } = component;
    if (!result[name]) result[name] = {};
    result[component.name] = component.modes[0].variables.reduce(
      (acc, variable) => {
        const path = variable.name.split("/");
        const last = path.pop();
        const className = path.join("-");
        if (!acc[className]) acc[className] = {};
        acc[className][last] = variable.data.tailwindClass;
        return acc;
      },
      {}
    );
    if (component.modes.length > 1) {
      component.modes.slice(1).forEach((mode, index) => {
        let { name: modeName, variables } = mode;

        variables.forEach((variable) => {
          const { name, value } = variable;
          const path = name.split("/");
          const last = path.pop();
          const className = path.join("-");

          const hasDarkMode =
            variable.data.tailwindClass !== result[component.name][className][last];
          if (hasDarkMode) {
            modeName = modeName.toLowerCase();
            if (!result[component.name][className])
              result[component.name][className] = {};
            // console.log(className);
            if(!result[component.name][`${className}-${modeName}`]) result[component.name][`${className}-${modeName}`] = {}
            result[component.name][`${className}-${modeName}`][last] =
              variable.data.tailwindClass;
            
          }
        });
      });
    }
  });

  return result;
};

/**
 * Converts a flat object into a nested object based on the keys.
 * @param {Object} input - The flat object to be converted.
 * @returns {Object} - The nested object.
 */
const snakeCaseKeysToDeepNested = (input) => {
  const output = {};
  for (const key in input) {
    const keyParts = key.split("_");
    if (keyParts.length === 1) {
      output[key] = input[key];
    } else {
      let current = output;
      for (let i = 0; i < keyParts.length - 1; i++) {
        const part = keyParts[i];
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      current[keyParts[keyParts.length - 1]] = input[key];
    }
  }
  return output;
};

/**
 * Generates a Tailwind CSS configuration object based on the input.
 * @param {Array} input - The input array containing figma tokens.
 * @returns {Object} - The generated Tailwind CSS configuration object.
 */
export const generateTailwindConfig = (input) => {
  // input = lookupVariablesAndReplace(input);

  const deepReplace = (input) => {
    const output = [];
    input.forEach((item) => {
      const modes = item.modes.map((mode) => {
        const variables = mode.variables.map((variable) => {
          const name = variable.name.replace(/\//g, "_");
          return { ...variable, name };
        });
        return { ...mode, variables };
      });
      output.push({ ...item, modes });
    });
    return output;
  };

  input = deepReplace(input);

  //   const lineHeightVariables = input.find((item) => item.name === "$lineHeight")
  //     .modes[0].variables;

  const getValue = (value, name, unit = null, collectionName = null) => {
    if (typeof value !== "number" || unit === null) return value;
    if (unit === "px") value = `${value}${unit}`;
    if (unit === "rem") value = `${value / 16}${unit}`;
    // if (collectionName === "fontSize") {
    //   let lineHeight = lineHeightVariables.find(
    //     (lineHeight) => lineHeight.name === name
    //   )?.value;
    //   if (!lineHeight) lineHeight = value;
    //   value = [value, { lineHeight: getValue(lineHeight, unit) }];
    // }
    return value;
  };

  const output = {};
  input.forEach((collection) => {
    const { modes, name } = collection;
    const collectionName = name.replace("$", "");
    output[collectionName] = {};
    const mode = modes[0];
    mode.variables.forEach((variable) => {
      const { name } = variable;
      let unit = null;
      if (collectionName !== "opacity") unit = "px";
      output[collectionName][name] = getValue(
        variable.value,
        variable.name,
        unit,
        collectionName
      );
    });
    output[collectionName] = snakeCaseKeysToDeepNested(output[collectionName]);
  });
  return output;
};

export const tokenVarsToCSSVars = (tokenVars) => {
  const values = {};

  for (const item of tokenVars) {
    const key = item.name.slice(1); // remove the $ character
    values[key] = [];

    for (const mode of item.modes) {
      for (const variable of mode.variables) {
        if (typeof variable.data.value === "number" && key !== "opacity")
          variable.data.value += "px";
        if (key === "opacity") {
          // for all values except 100, divide by 100
          if (variable.data.value !== 100) variable.data.value /= 100;
        }
        // if variableValue is an object variableValue = variableValue.value
        if (variable.name.includes(key))
          variable.name = variable.name.replace(`${key}/`, "");
        const name = `${key}-${variable.name.replace(/\//g, "-")}`;

        let modeName =
          mode.name === "Default" ? "" : mode.name.toLowerCase() + "-";

        values[key].push(`--${modeName}${name}: ${variable.data.value}`);
      }
    }
  }
  // flatten values
  let cssVariables = `:root {\n`;
  for (const key in values) {
    cssVariables += `/* ${key} */\n`;
    values[key].forEach((value) => {
      cssVariables += `${value};\n`;
    });
  }
  cssVariables += `}\n`;

  return cssVariables;
};
