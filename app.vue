<template>
  <div class="w-full space-y-2 p-4 bg-brand-primary-500">
    <input class="w-full border border-gray-200 p-1" type="text" v-model="sourceFolder" />
    <input class="w-full border border-gray-200 p-1" type="text" v-model="outputFolder" />
    <button class="border border-gray-200 p-1" @click="onProcess">Run</button>
  </div>
</template>

<script setup>
const sourceFolder = ref('/Users/andy/Downloads/variables')
const outputFolder = ref('/Users/andy/Work/Clients/GlobalPress/Projects/Figma CSS Generator/assets/css/built')

const onProcess = async () => {
  const source = sourceFolder.value;
  const output = outputFolder.value;

  // usefetch to call the API http://localhost:3333/api/figma/build
  const { data, pending, error, refresh } = await useFetch('/api/figma/build', {
    method: 'POST',
    body: JSON.stringify({ source, output }),
    headers: {
      'Content-Type': 'application/json'
    }
})

  console.log(data);
  
}
</script>

<style lang="scss" scoped></style>
