<template>
  <section tyle="margin-top: 24px">
    <p>
       <Link  
        href="/zh-CN" 
        data-vike="false"
       >
        进入中文站点 →
       </Link>
    </p>
    
    <p>
       <Link  href="/en-US" data-vike="false">
        Enter English site →
       </Link>
    </p>
  </section>
</template>

<script lang="ts" setup>
import { Link } from 'vike-vue-content/components/link'
</script>