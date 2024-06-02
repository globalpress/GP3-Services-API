import tailwindcss from "tailwindcss";
import tailwindConfig from '@/tailwind.config.js'
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';


const withConfigPlugin = (config = {}) => {
    return postcss([tailwindcss(config)]);
  };

async function generateCss(cssInput) {
    tailwindConfig.content = [];
    tailwindConfig.safelist = [ "lg:bg-brand-primary-950", "md:bg-brand-primary-500", "bg-white", "lg:text-brand-primary-300" ];
    console.log(tailwindConfig);
    const postCssConfig = [withConfigPlugin(tailwindConfig), autoprefixer];
    const { css } = await postcss(postCssConfig).process(cssInput, {
        from: undefined,
      });
    return css;
}

export default defineEventHandler(async (event) => {
    const css = await generateCss(`@tailwind utilities;body { color: red; }`);
    // console.log('css', css);
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
        },
        body: {
            css
        }
    }
});