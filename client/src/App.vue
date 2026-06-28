<template>
  <AppLayout v-if="!isLoginOrPublic">
    <router-view />
  </AppLayout>
  <router-view v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'

const route = useRoute()

const isLoginOrPublic = computed(() => {
  return !!(route.meta?.noLayout || route.meta?.public)
})
</script>
