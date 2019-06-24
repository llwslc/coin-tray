<template>
  <div class="settings">
    <Details/>
    <Search/>
  </div>
</template>

<script>
// @ is an alias to /src
import Details from '@/components/Details.vue';
import Search from '@/components/Search.vue';

export default {
  name: 'settings',
  components: {
    Details,
    Search
  }
};
</script>
