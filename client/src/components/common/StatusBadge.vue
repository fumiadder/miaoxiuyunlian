<template>
  <el-tag :type="tagType" size="small">
    {{ label }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FaultStatus } from '../../types/fault'
import { FAULT_STATUS_MAP, FAULT_STATUS_COLOR_MAP } from '../../types/fault'

const props = defineProps<{
  status: FaultStatus
}>()

const tagType = computed(() => FAULT_STATUS_COLOR_MAP[props.status] as any)
const label = computed(() => FAULT_STATUS_MAP[props.status])
</script>
