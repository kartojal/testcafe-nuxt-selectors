<template>
  <ul :id="id">
    <list-item :id="getId(1)"></list-item>
    <list-item :id="getId(2)"></list-item>
    <list-item :id="getId(3)"></list-item>
  </ul>
</template>

<script>
import ListItem from '~/components/ListItem.vue'

export default {
  name: 'list',
  props: ['id'],
  mounted() {
    console.log(this.$options.name)
  },
  computed: {
    reversedId: function() {
      return this.id.split('').reverse().join('')
    }
  },
  methods: {
    getId: function(postfix) {
      return this.id + '-item' + postfix
    }
  },
  components: {
    ListItem
  }
}
</script>