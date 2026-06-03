<template>
  <canvas ref="canvas" :width="width" :height="height"></canvas>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  labels: { type: Array, required: true },
  colors: { type: Array, default: () => ['#76B729', '#AFCB08', '#379E32', '#72BF44'] },
  width: { type: Number, default: 200 },
  height: { type: Number, default: 200 }
})

const canvas = ref(null)
let ctx = null

const draw = () => {
  if (!canvas.value) return
  ctx = canvas.value.getContext('2d')
  const w = props.width, h = props.height
  ctx.clearRect(0, 0, w, h)
  const total = props.data.reduce((a, b) => a + b, 0)
  if (total === 0) return
  let startAngle = -Math.PI / 2
  const centerX = w / 2, centerY = h / 2, radius = Math.min(w, h) / 2 * 0.8
  for (let i = 0; i < props.data.length; i++) {
    const angle = (props.data[i] / total) * 2 * Math.PI
    ctx.beginPath()
    ctx.fillStyle = props.colors[i % props.colors.length]
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle)
    ctx.fill()
    startAngle += angle
  }
  // внутренний круг
  ctx.beginPath()
  ctx.fillStyle = 'var(--bg-surface)'
  ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI)
  ctx.fill()
}

onMounted(() => draw())
watch(() => [props.data, props.labels], draw)
</script>