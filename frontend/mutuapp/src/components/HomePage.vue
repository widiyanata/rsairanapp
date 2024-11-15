<script setup>
defineProps({
  title: {
    type: String,
    required: true,
    default: 'Homepage content',
  },
})
</script>

<template>
  <h1 class="title">{{ title }}</h1>
</template>
