<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="root-fade" mode="out-in" appear>
      <component :is="Component" :key="route.matched[0]?.path ?? route.path" />
    </Transition>
  </RouterView>
</template>
