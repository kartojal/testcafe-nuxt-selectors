<template>
  <li :id="id">
    <p>{{ id }}</p>
  </li>
</template>

<script>
export default {
  name: 'list-item',
  props: ['id']
}
</script>