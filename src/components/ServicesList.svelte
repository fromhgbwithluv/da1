<script lang="ts">
  import { SERVICES } from '../data/services';
  import ServiceCard from './ServiceCard.svelte';
</script>

<div>
  <!-- Responsive Grid: 3 columns on desktop, 2 on tablet, 1 on mobile -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each SERVICES as service (service.id)}
      <ServiceCard {service} />
    {/each}
  </div>
</div>

