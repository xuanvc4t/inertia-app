<script setup>
defineProps({
    appName: String,
});
</script>

<template>
    <div class="min-h-screen bg-gray-100 flex items-center justify-center">
        <div class="text-center">
            <h1 class="text-4xl font-bold text-gray-800 mb-4">
                {{ appName ?? 'Laravel' }}
            </h1>
            <p class="text-gray-500 text-lg">
                InertiaJS + Vue 3 + Tailwind CSS
            </p>
        </div>
    </div>
</template>
